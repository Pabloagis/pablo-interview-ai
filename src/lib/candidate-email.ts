import { Resend } from 'resend';
import type { ReportData } from '@/lib/report';
import { generateEmailHTML } from '@/lib/followup-email';
import { BASE_URL } from '@/lib/base-url';

// Candidate-facing report email: sent to the PROFILE OWNER after a recruiter
// interviewed their agent. Uses the same rich v2 template as the recruiter email
// (generateEmailHTML) so both recipients see the full report with transcript.

const FROM_ADDRESS = 'InterviewMind <noreply@interviewmind.one>';

type Lang = 'en' | 'es' | 'it' | 'pt';
const VALID_LANGS: Lang[] = ['en', 'es', 'it', 'pt'];
function safeLang(lang: string | undefined): Lang {
  return VALID_LANGS.includes(lang as Lang) ? lang as Lang : 'en';
}

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

const CANDIDATE_SUBJECT: Record<Lang, (v: VisitorContext) => string> = {
  en: (v) => v.name && v.company ? `${v.name} (${v.company}) interviewed your agent`
           : v.name ? `${v.name} interviewed your agent`
           : v.company ? `A visitor from ${v.company} interviewed your agent`
           : 'An anonymous visitor interviewed your agent',
  es: (v) => v.name && v.company ? `${v.name} (${v.company}) entrevistó a tu agente`
           : v.name ? `${v.name} entrevistó a tu agente`
           : v.company ? `Un visitante de ${v.company} entrevistó a tu agente`
           : 'Un visitante anónimo entrevistó a tu agente',
  it: (v) => v.name && v.company ? `${v.name} (${v.company}) ha intervistato il tuo agente`
           : v.name ? `${v.name} ha intervistato il tuo agente`
           : v.company ? `Un visitatore di ${v.company} ha intervistato il tuo agente`
           : 'Un visitatore anonimo ha intervistato il tuo agente',
  pt: (v) => v.name && v.company ? `${v.name} (${v.company}) entrevistou o teu agente`
           : v.name ? `${v.name} entrevistou o teu agente`
           : v.company ? `Um visitante de ${v.company} entrevistou o teu agente`
           : 'Um visitante anónimo entrevistou o teu agente',
};

export function buildCandidateSubject(v: VisitorContext, lang: string = 'en'): string {
  return CANDIDATE_SUBJECT[safeLang(lang)](v);
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
    subject: buildCandidateSubject(visitor, report.language),
    html,
  });

  if (result.error) throw new Error(`Resend error: ${result.error.message}`);
  return { emailId: result.data?.id };
}
