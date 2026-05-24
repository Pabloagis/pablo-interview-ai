import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { sendFollowUpEmail } from '@/lib/followup-email';

export const dynamic = 'force-dynamic';

const PABLO_EMAIL = 'pabloagisburgos@gmail.com';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

    const supabase = createServerSupabaseClient();
    const { data: session, error } = await supabase
      .from('sessions')
      .select('recruiter_name, company, role, email, messages, email_sent_at')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      console.error('[exit-notify] Session not found:', error);
      return NextResponse.json({ error: 'session not found' }, { status: 404 });
    }

    // Already sent (End Interview was clicked) — skip silently
    if (session.email_sent_at) {
      console.log(`[exit-notify] Skipped — email already sent for session ${sessionId}`);
      return NextResponse.json({ ok: true, skipped: true });
    }

    const messages = (session.messages ?? []) as Array<{ role: string; content: string }>;
    const userMessages = messages.filter((m) => m.role === 'user');

    if (userMessages.length < 1) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const transcript = messages
      .map((m) => `${m.role === 'user' ? 'Recruiter' : 'Pablo'}: ${m.content}`)
      .join('\n\n');

    console.log(`[exit-notify] Sending abandoned-session notification for ${sessionId} → ${PABLO_EMAIL}`);

    const { emailId, html: lastHtml } = await sendFollowUpEmail({
      to: PABLO_EMAIL,
      transcript,
      messages,
      recruiterName: session.recruiter_name || null,
      jobTitle: session.role || null,
      companyName: session.company || null,
      sessionId,
      recruiterEmail: session.email || null,
      exitNotify: true,
      bcc: [],
    });

    console.log(`[exit-notify] Sent to ${PABLO_EMAIL}, emailId: ${emailId}`);

    await supabase
      .from('sessions')
      .update({ email_sent_at: new Date().toISOString(), email_html: lastHtml })
      .eq('id', sessionId);

    console.log(`[exit-notify] Done.`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[exit-notify] Error:', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
