import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const PABLO_EMAIL = 'pabloagisburgos@gmail.com';
const BASE_URL = 'https://interviewmind.one';
const FROM_ADDRESS = 'InterviewMind <noreply@interviewmind.one>';

function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY not set');
  return new Resend(key);
}

function buildExitEmailHTML(params: {
  name: string;
  company: string | null;
  role: string | null;
  email: string | null;
  questions: string[];
  sessionId: string;
}): string {
  const { name, company, role, email, questions, sessionId } = params;
  const from = [role, company].filter(Boolean).join(' at ') || 'unknown company';
  const replySubject = encodeURIComponent(
    `Re: ${[role, company].filter(Boolean).join(' at ') || 'our conversation'}`
  );
  const mailto = email ? `mailto:${email}?subject=${replySubject}` : null;

  const questionsHTML = questions
    .map((q, i) => {
      const safe = q.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<tr>
        <td style="padding:8px 0; border-bottom:1px solid #f1f5f9; vertical-align:top;">
          <span style="font-size:12px; color:#94a3b8; font-family:Arial,sans-serif; margin-right:8px;">${i + 1}.</span>
          <span style="font-size:14px; color:#374151; font-family:Arial,sans-serif; line-height:1.6;">${safe}</span>
        </td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<body style="margin:0; padding:32px 16px; background:#f8fafc; font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table style="max-width:560px; width:100%; background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; padding:28px;" cellpadding="0" cellspacing="0">
        <tr><td>

          <p style="font-size:22px; font-weight:700; color:#0f172a; margin:0 0 4px; font-family:Arial,sans-serif;">⚠️ Recruiter left without finishing</p>
          <p style="font-size:14px; color:#64748b; margin:0 0 24px; font-family:Arial,sans-serif;">${name} · ${from}</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc; border-radius:8px; padding:14px 16px; margin-bottom:24px;">
            ${email ? `<tr><td style="font-size:13px; color:#475569; padding:3px 0; font-family:Arial,sans-serif;"><strong>Email:</strong> ${email}</td></tr>` : ''}
            ${role ? `<tr><td style="font-size:13px; color:#475569; padding:3px 0; font-family:Arial,sans-serif;"><strong>Role:</strong> ${role}</td></tr>` : ''}
            ${company ? `<tr><td style="font-size:13px; color:#475569; padding:3px 0; font-family:Arial,sans-serif;"><strong>Company:</strong> ${company}</td></tr>` : ''}
            <tr><td style="font-size:13px; color:#475569; padding:3px 0; font-family:Arial,sans-serif;"><strong>Messages sent:</strong> ${questions.length}</td></tr>
          </table>

          <p style="font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#94a3b8; margin:0 0 10px; font-family:Arial,sans-serif;">Their questions</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            ${questionsHTML}
          </table>

          ${mailto ? `<a href="${mailto}" style="display:block; background:#0f172a; color:#ffffff; text-decoration:none; border-radius:8px; padding:14px 20px; text-align:center; font-size:14px; font-weight:600; font-family:Arial,sans-serif;">Reply to ${name}</a>` : ''}

          <p style="font-size:12px; color:#cbd5e1; margin-top:20px; text-align:center; font-family:Arial,sans-serif;">
            <a href="${BASE_URL}/email-preview?id=${sessionId}" style="color:#94a3b8; text-decoration:none;">View full conversation preview</a>
          </p>

        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

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
    const questions = messages.filter((m) => m.role === 'user').map((m) => m.content);

    if (questions.length < 3) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const name = session.recruiter_name || 'Unknown';
    const count = questions.length;
    const subject = `⚠️ ${name}${session.company ? ` from ${session.company}` : ''} left without finishing — ${count} message${count !== 1 ? 's' : ''}`;

    const html = buildExitEmailHTML({
      name,
      company: session.company || null,
      role: session.role || null,
      email: session.email || null,
      questions,
      sessionId,
    });

    const resend = getResendClient();
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [PABLO_EMAIL],
      subject,
      html,
    });

    if (result.error) throw new Error(result.error.message);

    await supabase
      .from('sessions')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', sessionId);

    console.log(`[exit-notify] Sent for session ${sessionId}, emailId: ${result.data?.id}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[exit-notify] Error:', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
