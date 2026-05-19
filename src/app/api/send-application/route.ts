import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { sendApplicationEmail } from '@/lib/mailer';

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
      .select('id, recruiter_name, company, role, email, consent_to_email, messages')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      console.error('[send-application] Session not found:', fetchError);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (!session.consent_to_email) {
      console.log(`[send-application] Consent not given for session ${sessionId}`);
      return NextResponse.json(
        { error: 'Recruiter has not consented to receive emails' },
        { status: 403 }
      );
    }

    if (!session.email) {
      console.error(`[send-application] No email address on session ${sessionId}`);
      return NextResponse.json({ error: 'No email address on session' }, { status: 400 });
    }

    const messages = session.messages as Array<{ role: string; content: string }> | null;
    const transcript =
      messages && messages.length > 0
        ? messages
            .map((m) => (m.role === 'user' ? `You: ${m.content}` : `Pablo: ${m.content}`))
            .join('\n\n')
        : null;

    console.log(`[send-application] Sending to ${session.email} for session ${sessionId}`);

    await sendApplicationEmail({
      to: session.email,
      name: session.recruiter_name || 'there',
      company: session.company || '',
      role: session.role || '',
      transcript,
    });

    const { error: updateError } = await supabase
      .from('sessions')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (updateError) {
      console.error('[send-application] Failed to update email_sent_at:', updateError);
    }

    console.log(`[send-application] Email sent successfully for session ${sessionId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[send-application] Error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
