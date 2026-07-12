import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { sendFollowUpEmail } from '@/lib/followup-email';
import { isValidEmail } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, email: bodyEmail, consentToEmail: bodyConsent } = body as {
      sessionId?: string;
      email?: string;
      consentToEmail?: boolean;
    };

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // If email + consent provided in the request body, save them to the session first
    if (bodyEmail || bodyConsent !== undefined) {
      const updatePayload: Record<string, unknown> = {};
      if (bodyEmail && isValidEmail(bodyEmail)) updatePayload.email = bodyEmail;
      if (bodyConsent !== undefined) updatePayload.consent_to_email = bodyConsent;
      if (Object.keys(updatePayload).length > 0) {
        await supabase.from('sessions').update(updatePayload).eq('id', sessionId);
      }
    }

    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('id, recruiter_name, company, role, email, consent_to_email, messages, email_sent_at')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      console.error('[send-followup] Session not found:', fetchError);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Use body values as override if session hasn't been updated yet (race condition safety)
    const effectiveEmail = (bodyEmail && isValidEmail(bodyEmail)) ? bodyEmail : session.email;
    const effectiveConsent = bodyConsent ?? session.consent_to_email;

    if (!effectiveConsent) {
      return NextResponse.json(
        { error: 'Recruiter has not consented to receive emails' },
        { status: 403 }
      );
    }

    if (!effectiveEmail) {
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

    console.log(`[send-followup] Sending to ${effectiveEmail} for session ${sessionId}`);

    const { emailId, html } = await sendFollowUpEmail({
      to: effectiveEmail,
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
