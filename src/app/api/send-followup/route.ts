import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { sendFollowUpEmail } from '@/lib/followup-email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('id, recruiter_name, company, role, email, consent_to_email, messages, email_sent_at, email_msg_count')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      console.error('[send-followup] Session not found:', fetchError);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (!session.consent_to_email) {
      return NextResponse.json(
        { error: 'Recruiter has not consented to receive emails' },
        { status: 403 }
      );
    }

    if (!session.email) {
      return NextResponse.json({ error: 'No email address on session' }, { status: 400 });
    }

    const messages = session.messages as Array<{ role: string; content: string }> | null;
    const currentMsgCount = (messages ?? []).filter(m => m.role === 'user').length;

    // Skip if already sent and no new user messages since last send
    if (session.email_sent_at) {
      const prevCount = (session as { email_msg_count?: number }).email_msg_count ?? 0;
      if (currentMsgCount <= prevCount) {
        console.log(`[send-followup] Skipped — no new content (${currentMsgCount} msgs, last sent at ${prevCount})`);
        return NextResponse.json({ success: true, skipped: true });
      }
    }

    const transcript =
      messages && messages.length > 0
        ? messages
            .map((m) => `${m.role === 'user' ? 'Recruiter' : 'Pablo'}: ${m.content}`)
            .join('\n\n')
        : '';

    if (!transcript) {
      return NextResponse.json({ error: 'No conversation to summarize' }, { status: 400 });
    }

    console.log(`[send-followup] Sending to ${session.email} for session ${sessionId}`);

    const { emailId, html } = await sendFollowUpEmail({
      to: session.email,
      transcript,
      messages: messages ?? [],
      recruiterName: session.recruiter_name || null,
      jobTitle: session.role || null,
      companyName: session.company || null,
      sessionId,
    });

    await supabase
      .from('sessions')
      .update({ email_sent_at: new Date().toISOString(), email_html: html, email_msg_count: currentMsgCount })
      .eq('id', sessionId);

    console.log(`[send-followup] Done. emailId: ${emailId}`);
    return NextResponse.json({ success: true, emailId });
  } catch (error) {
    console.error('[send-followup] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send follow-up email. Please try again.' },
      { status: 500 }
    );
  }
}
