import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { sendFollowUpEmail } from '@/lib/followup-email';

export const dynamic = 'force-dynamic';

const PABLO_EMAIL = 'pabloagisburgos@gmail.com';
const INACTIVITY_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_RUN = 20;

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const auth = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const cutoff = new Date(Date.now() - INACTIVITY_MS).toISOString();

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('id, recruiter_name, company, role, email, messages')
    .is('email_sent_at', null)
    .lt('updated_at', cutoff)
    .limit(MAX_PER_RUN);

  if (error) {
    console.error('[inactivity-check] Query failed:', error);
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }

  const eligible = (sessions ?? []).filter(s => {
    const msgs = (s.messages ?? []) as Array<{ role: string; content: string }>;
    return msgs.filter(m => m.role === 'user').length >= 1;
  });

  console.log(`[inactivity-check] ${eligible.length} sessions to notify`);

  let sent = 0;
  for (const session of eligible) {
    try {
      const messages = session.messages as Array<{ role: string; content: string }>;
      const transcript = messages
        .map(m => `${m.role === 'user' ? 'Recruiter' : 'Pablo'}: ${m.content}`)
        .join('\n\n');

      const { emailId } = await sendFollowUpEmail({
        to: PABLO_EMAIL,
        transcript,
        messages,
        recruiterName: session.recruiter_name || null,
        jobTitle: session.role || null,
        companyName: session.company || null,
        sessionId: session.id,
        recruiterEmail: session.email || null,
        exitNotify: true,
        bcc: [],
      });

      await supabase
        .from('sessions')
        .update({ email_sent_at: new Date().toISOString() })
        .eq('id', session.id);

      console.log(`[inactivity-check] Notified session ${session.id}, emailId: ${emailId}`);
      sent++;
    } catch (err) {
      console.error(`[inactivity-check] Failed for session ${session.id}:`, err);
    }
  }

  return NextResponse.json({ checked: eligible.length, sent });
}
