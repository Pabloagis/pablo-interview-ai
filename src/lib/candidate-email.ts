import { Resend } from 'resend';
import type { ReportData } from '@/lib/report';
import { generateEmailHTML } from '@/lib/followup-email';
import { BASE_URL } from '@/lib/base-url';

// Candidate-facing report email: sent to the PROFILE OWNER after a recruiter
// interviewed their agent. Uses the same rich v2 template as the recruiter email
// (generateEmailHTML) so both recipients see the full report with transcript.

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

export function buildCandidateSubject(v: VisitorContext): string {
  if (v.name && v.company) return `${v.name} (${v.company}) interviewed your agent`;
  if (v.name) return `${v.name} interviewed your agent`;
  if (v.company) return `A visitor from ${v.company} interviewed your agent`;
  return 'An anonymous visitor interviewed your agent';
}

export async function sendCandidateReportEmail(params: {
  to: string;
  report: ReportData;
  visitor: VisitorContext;
  sessionId: string | null;
  messages: Array<{ role: string; content: string }>;
  candidateName: string | null;
  candidateSlug: string | null;
}): Promise<{ emailId: string | null | undefined }> {
  const { to, report, visitor, messages, candidateName, candidateSlug } = params;
  const resend = getResendClient();

  const profileUrl = candidateSlug ? `${BASE_URL}/${candidateSlug}` : BASE_URL;
  const recipientFirstName = candidateName?.split(' ')[0] ?? null;
  const html = generateEmailHTML(
    report, visitor.name, messages,
    undefined, visitor.role, visitor.company, false, candidateName, profileUrl,
    { hideActions: true, recipientName: recipientFirstName },
  );

  const devBcc = process.env.DEV_BCC_EMAIL;
  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [to],
    bcc: devBcc ? [devBcc] : [],
    subject: buildCandidateSubject(visitor),
    html,
  });

  if (result.error) throw new Error(`Resend error: ${result.error.message}`);
  return { emailId: result.data?.id };
}
