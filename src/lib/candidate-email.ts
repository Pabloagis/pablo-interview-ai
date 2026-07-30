import { Resend } from 'resend';
import type { ReportData } from '@/lib/report';

// Candidate-facing report email: sent to the PROFILE OWNER after a recruiter
// interviewed their agent. Distinct from followup-email.ts (recruiter-facing).
// Reuses the same generateReport (ReportData) — only the wrapper/audience differ.

const FROM_ADDRESS = 'InterviewMind <noreply@interviewmind.one>';

export interface VisitorContext {
  name: string | null;
  role: string | null;
  company: string | null;
}

function getResendClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  return new Resend(key);
}

// "Ana Ruiz (Cloudbeds) interviewed your agent" — degrades gracefully to
// "An anonymous visitor interviewed your agent" when nothing was captured.
export function buildCandidateSubject(v: VisitorContext): string {
  if (v.name && v.company) return `${v.name} (${v.company}) interviewed your agent`;
  if (v.name) return `${v.name} interviewed your agent`;
  if (v.company) return `A visitor from ${v.company} interviewed your agent`;
  return 'An anonymous visitor interviewed your agent';
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function whoLine(v: VisitorContext): string {
  const bits: string[] = [];
  if (v.name) bits.push(esc(v.name));
  if (v.role) bits.push(esc(v.role));
  if (v.company) bits.push(`at ${esc(v.company)}`);
  return bits.length ? bits.join(' · ') : 'An anonymous visitor';
}

function list(items: string[]): string {
  return items.map(i => `<li style="margin:4px 0;color:#334155;">${esc(i)}</li>`).join('');
}

// v2 linked "Read the full conversation" to /interview/<sessionId>. That route is
// gone and v3 has no candidate-facing transcript viewer, so the email stops at the
// summary and insights. The session id stays in the public signature for when one exists.
function buildCandidateHTML(report: ReportData, v: VisitorContext): string {
  const insights = report.conversationInsights.items
    .map(i => `<p style="margin:6px 0;"><strong style="color:#0f172a;">${esc(i.title)}:</strong> <span style="color:#334155;">${esc(i.body)}</span></p>`)
    .join('');

  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#334155;font-size:15px;line-height:1.5;">
    <p style="font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Your agent was interviewed</p>
    <h2 style="color:#0f172a;margin:4px 0 12px;">${whoLine(v)}</h2>
    <p>Someone just spoke with your AI agent. Here's what they explored and how it went.</p>

    <h3 style="color:#0f172a;margin:20px 0 6px;">Summary</h3>
    <p style="color:#334155;">${esc(report.executiveSummary.headline)}</p>

    ${insights ? `<h3 style="color:#0f172a;margin:20px 0 6px;">What they pushed on</h3>${insights}` : ''}

    ${report.recruiterTakeaways.items.length ? `<h3 style="color:#0f172a;margin:20px 0 6px;">Takeaways they'd keep</h3><ul style="padding-left:18px;margin:6px 0;">${list(report.recruiterTakeaways.items)}</ul>` : ''}

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="font-size:12px;color:#94a3b8;">You're receiving this because your published agent had a conversation.
    Manage notifications in your training hub.</p>
  </div>`;
}

export async function sendCandidateReportEmail(params: {
  to: string;
  report: ReportData;
  visitor: VisitorContext;
  sessionId: string | null;
}): Promise<{ emailId: string | null | undefined }> {
  const { to, report, visitor } = params;
  const resend = getResendClient();

  const devBcc = process.env.DEV_BCC_EMAIL;
  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [to],
    bcc: devBcc ? [devBcc] : [],
    subject: buildCandidateSubject(visitor),
    html: buildCandidateHTML(report, visitor),
  });

  if (result.error) throw new Error(`Resend error: ${result.error.message}`);
  return { emailId: result.data?.id };
}
