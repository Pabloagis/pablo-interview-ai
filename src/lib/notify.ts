import { Resend } from 'resend';

const PABLO_EMAIL = 'pabloagisburgos@gmail.com';
const FROM_ADDRESS = 'InterviewMind <noreply@interviewmind.one>';

// Fire-and-forget notification to Pablo when a recruiter sends their first
// real message. Called from /api/chat after the first user turn is saved.
// Errors are swallowed — a notification failure must never break the chat.
export function notifyNewSession(
  name: string | null,
  email: string | null,
  company: string | null,
  role: string | null,
): void {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const resend = new Resend(key);
  const label = name?.trim() || 'Someone';
  const from = [role, company].filter(Boolean).join(' at ');
  resend.emails.send({
    from: FROM_ADDRESS,
    to: [PABLO_EMAIL],
    subject: `👋 ${label}${from ? ` (${from})` : ''} just started chatting`,
    html: `<table style="font-family:Arial,sans-serif;font-size:15px;color:#475569;border-collapse:collapse;">
      <tr><td style="padding:4px 12px 4px 0;color:#94a3b8;font-size:13px;">Name</td><td style="color:#0f172a;font-weight:600;">${label}</td></tr>
      ${email ? `<tr><td style="padding:4px 12px 4px 0;color:#94a3b8;font-size:13px;">Email</td><td><a href="mailto:${email}" style="color:#2563eb;">${email}</a></td></tr>` : ''}
      ${company ? `<tr><td style="padding:4px 12px 4px 0;color:#94a3b8;font-size:13px;">Company</td><td style="color:#0f172a;">${company}</td></tr>` : ''}
      ${role ? `<tr><td style="padding:4px 12px 4px 0;color:#94a3b8;font-size:13px;">Role</td><td style="color:#0f172a;">${role}</td></tr>` : ''}
    </table>`,
  }).catch(() => {});
}
