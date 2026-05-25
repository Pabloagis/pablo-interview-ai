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
      .select('id, recruiter_name, company, role, email, consent_to_email, messages, email_sent_at')
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

    // Skip if already sent — client-side localStorage guard handles the "no new messages"
    // case; this is the server-side safety net for any bypass (e.g. page refresh clearing state)
    if (session.email_sent_at) {
      console.log(`[send-followup] Skipped — already sent at ${session.email_sent_at}`);
      return NextResponse.json({ success: true, skipped: true });
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
      .update({ email_sent_at: new Date().toISOString(), email_html: html })
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
