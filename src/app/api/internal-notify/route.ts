import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { sendFollowUpEmail } from '@/lib/followup-email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

    const supabase = createServerSupabaseClient();
    const { data: session, error } = await supabase
      .from('sessions')
      .select('messages, recruiter_name, company, role, email')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      console.error('[internal-notify] Session not found:', error);
      return NextResponse.json({ error: 'session not found' }, { status: 404 });
    }

    const messages = (session.messages ?? []) as Array<{ role: string; content: string }>;
    const transcript = messages
      .map((m) => `${m.role === 'user' ? 'Recruiter' : 'Pablo'}: ${m.content}`)
      .join('\n\n');

    await sendFollowUpEmail({
      to: 'pabloagisburgos@gmail.com',
      transcript,
      messages,
      recruiterName: session.recruiter_name || null,
      jobTitle: session.role || null,
      companyName: session.company || null,
      recruiterEmail: session.email || null,
      bcc: [],
    });

    console.log(`[internal-notify] Notification sent for session ${sessionId}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[internal-notify] Error:', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
