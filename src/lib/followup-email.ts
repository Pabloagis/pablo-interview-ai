import { Resend } from 'resend';
import { getAnthropicClient } from '@/lib/anthropic';
import { CLAUDE_FALLBACK_MODEL } from '@/lib/constants';

const PABLO_EMAIL = 'pabloagisburgos@gmail.com';
const FROM_ADDRESS = 'Pablo Agis Burgos <onboarding@resend.dev>';
const BASE_URL = 'https://pablo-interview.vercel.app';

function getResendClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  return new Resend(key);
}

interface ConversationAnalysis {
  opening_line: string;
  core_experience_chips: string[];
  communication_style: string[];
  topics_discussed: string[];
  strong_match_indicators: string[];
  potential_concerns: string[];
  executive_summary: string;
  suggested_subject_line: string;
  next_step_cta: string;
}

async function analyzeConversation(
  transcript: string,
  jobTitle?: string | null,
  companyName?: string | null
): Promise<ConversationAnalysis> {
  const prompt = `
You are analyzing a recruiter's conversation with Pablo Agis Burgos's AI interview assistant.

Pablo's background:
- 7+ years in luxury hospitality operations (Soho House London, Axel Hotel Barcelona, Accor)
- Software Implementation Specialist at HubOS (Early 2026, a few months)
- Core skills: B2B client relationships, onboarding, multilingual communication (EN/ES/GL/IT/PT)
- Positioning: Operationally credible hospitality-tech specialist moving into SaaS implementation and commercial roles

Job context:
- Role: ${jobTitle || 'Not specified'}
- Company: ${companyName || 'Not specified'}

Full conversation transcript:
---
${transcript}
---

Analyze this conversation and return ONLY a valid JSON object with this exact structure. No markdown, no preamble, just raw JSON:

{
  "opening_line": "A warm, specific 1-sentence intro referencing the actual role/company discussed. Start with 'Thanks for exploring' or similar. Max 25 words.",
  "core_experience_chips": [
    "Short phrase (3–5 words max) for each key experience topic actually discussed. Return exactly 4 chips."
  ],
  "communication_style": [
    "3 adjective phrases describing how Pablo communicated in THIS conversation specifically. E.g. 'Structured and methodical'"
  ],
  "topics_discussed": [
    "3–4 specific topics from the actual conversation. Be concrete, not generic."
  ],
  "strong_match_indicators": [
    "2–4 honest strengths relevant to the role discussed. Ground each in something said in the conversation."
  ],
  "potential_concerns": [
    "1–2 honest, professional concerns a recruiter might have based on this conversation and role. Be candid — this builds trust."
  ],
  "executive_summary": "2–3 sentences. What would a senior recruiter need to know after reading this email? Mention seniority signal, communication quality, and fit for the specific role. Factual and intelligent tone.",
  "suggested_subject_line": "Email subject line. Specific to role and company if known. Max 10 words.",
  "next_step_cta": "A short action phrase for the primary CTA button. E.g. 'Schedule a 30-minute call' — specific, not generic."
}
`;

  const response = await getAnthropicClient().messages.create({
    model: CLAUDE_FALLBACK_MODEL,
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = (response.content[0] as { type: string; text: string }).text.trim();
  const clean = raw.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(clean) as ConversationAnalysis;
  } catch (err) {
    console.error('[followup-email] Claude analysis parse error:', err);
    return getFallbackAnalysis(jobTitle, companyName);
  }
}

function getFallbackAnalysis(
  jobTitle?: string | null,
  companyName?: string | null
): ConversationAnalysis {
  return {
    opening_line: `Thanks for exploring Pablo's professional background through InterviewMind${companyName ? ` regarding the opportunity at ${companyName}` : ''}.`,
    core_experience_chips: [
      '7+ yrs hospitality ops',
      'SaaS onboarding & impl.',
      'B2B client relationships',
      'Multilingual · 5 languages',
    ],
    communication_style: ['Structured and methodical', 'Client-oriented framing', 'Systems thinker'],
    topics_discussed: [
      'Hospitality-to-tech transition',
      'Customer onboarding adoption',
      'Client communication approach',
      'Career progression narrative',
    ],
    strong_match_indicators: [
      'High-touch client experience across international markets',
      'Proven SaaS implementation and onboarding exposure',
      'Multilingual communication across 5 languages',
    ],
    potential_concerns: [
      'Limited quota-carrying sales experience',
      'Short SaaS tenure at HubOS',
    ],
    executive_summary:
      'Pablo brings senior hospitality operations experience with a recent pivot into SaaS implementation. His communication style is structured and client-oriented, with strong commercial awareness. Best fit for Customer Success or Implementation roles with an enterprise hospitality focus.',
    suggested_subject_line: jobTitle
      ? `Pablo Agis Burgos · ${jobTitle} follow-up`
      : 'Pablo Agis Burgos · InterviewMind follow-up',
    next_step_cta: 'Schedule a conversation',
  };
}

function generateEmailHTML(
  analysis: ConversationAnalysis,
  jobTitle?: string | null,
  companyName?: string | null
): string {
  const {
    opening_line,
    core_experience_chips,
    communication_style,
    topics_discussed,
    strong_match_indicators,
    potential_concerns,
    executive_summary,
    next_step_cta,
  } = analysis;

  const chipsHTML = core_experience_chips
    .map(
      (chip) => `
      <td style="padding: 4px;">
        <span style="display:inline-block; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:6px; padding:7px 12px; font-size:12px; color:#475569; white-space:nowrap;">
          ${chip}
        </span>
      </td>`
    )
    .join('');

  const commStyleHTML = communication_style
    .map(
      (item) =>
        `<li style="margin-bottom:5px; font-size:13px; color:#64748b;">· ${item}</li>`
    )
    .join('');

  const topicsHTML = topics_discussed
    .map(
      (item) =>
        `<li style="margin-bottom:5px; font-size:13px; color:#64748b;">· ${item}</li>`
    )
    .join('');

  const strengthsHTML = strong_match_indicators
    .map(
      (item) => `
      <tr>
        <td style="padding:4px 0; font-size:13px; color:#166534; vertical-align:top;">
          <span style="margin-right:6px;">✓</span>${item}
        </td>
      </tr>`
    )
    .join('');

  const concernsHTML = potential_concerns
    .map(
      (item) => `
      <tr>
        <td style="padding:4px 0; font-size:13px; color:#92400e; vertical-align:top;">
          <span style="margin-right:6px;">⚠</span>${item}
        </td>
      </tr>`
    )
    .join('');

  const contextLine =
    jobTitle && companyName
      ? `${jobTitle} · ${companyName}`
      : jobTitle || companyName || 'Exploratory conversation';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pablo Agis Burgos — InterviewMind Follow-Up</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: Georgia, 'Times New Roman', serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0;">

          <!-- HEADER -->
          <tr>
            <td style="background:#0f172a; padding:36px 40px 28px; text-align:center;">
              <p style="margin:0 0 20px; font-size:11px; letter-spacing:0.15em; color:#475569; font-family:Arial,sans-serif; text-transform:uppercase;">InterviewMind</p>
              <img src="${BASE_URL}/assets/pablo-avatar.jpg" alt="Pablo Agis Burgos" width="72" height="72" style="width:72px; height:72px; border-radius:50%; border:3px solid #3b82f6; margin:0 auto 16px; display:block; object-fit:cover;" />
              <h1 style="margin:0 0 6px; font-size:22px; font-weight:400; color:#f1f5f9; font-family:Georgia,serif; letter-spacing:-0.01em;">Pablo Agis Burgos</h1>
              <p style="margin:0 0 10px; font-size:13px; color:#64748b; font-family:Arial,sans-serif;">SaaS Implementation &amp; Customer Success Professional</p>
              <p style="margin:0; font-size:11px; color:#334155; background:#1e293b; display:inline-block; padding:4px 14px; border-radius:20px; font-family:Arial,sans-serif;">${contextLine}</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:32px 40px;">

              <p style="margin:0 0 16px; font-size:20px; font-weight:700; color:#0f172a; font-family:Arial,sans-serif;">Hi there,</p>
              <div style="border-left:3px solid #dbeafe; padding-left:18px; margin-bottom:28px;">
                <p style="margin:0 0 10px; font-size:14px; line-height:1.75; color:#475569; font-family:Arial,sans-serif;">${opening_line}</p>
                <p style="margin:0 0 10px; font-size:14px; line-height:1.75; color:#475569; font-family:Arial,sans-serif;">Below is a summary of what we discussed, along with my CV and professional links.</p>
                <p style="margin:0 0 10px; font-size:14px; line-height:1.75; color:#475569; font-family:Arial,sans-serif;">I'd love to stay in touch!</p>
                <p style="margin:0; font-size:14px; color:#475569; font-family:Arial,sans-serif;">— Pablo</p>
              </div>

              <!-- Executive Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 8px; font-size:10px; font-weight:bold; letter-spacing:0.1em; text-transform:uppercase; color:#94a3b8; font-family:Arial,sans-serif;">Executive summary</p>
                    <p style="margin:0; font-size:13px; line-height:1.75; color:#475569; font-family:Georgia,serif;">${executive_summary}</p>
                  </td>
                </tr>
              </table>

              <!-- Core Experience Chips -->
              <p style="margin:0 0 10px; font-size:10px; font-weight:bold; letter-spacing:0.1em; text-transform:uppercase; color:#94a3b8; font-family:Arial,sans-serif;">Core experience</p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>${chipsHTML}</tr>
              </table>

              <!-- Conversation Insights -->
              <p style="margin:0 0 12px; font-size:10px; font-weight:bold; letter-spacing:0.1em; text-transform:uppercase; color:#94a3b8; font-family:Arial,sans-serif;">Conversation insights</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                <tr>
                  <td width="50%" style="padding:14px 16px; vertical-align:top; border-right:1px solid #e2e8f0;">
                    <p style="margin:0 0 10px; font-size:10px; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:#94a3b8; font-family:Arial,sans-serif;">Communication style</p>
                    <ul style="margin:0; padding:0; list-style:none;">${commStyleHTML}</ul>
                  </td>
                  <td width="50%" style="padding:14px 16px; vertical-align:top;">
                    <p style="margin:0 0 10px; font-size:10px; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:#94a3b8; font-family:Arial,sans-serif;">Topics discussed</p>
                    <ul style="margin:0; padding:0; list-style:none;">${topicsHTML}</ul>
                  </td>
                </tr>
              </table>

              <!-- Recruiter Takeaways -->
              <p style="margin:0 0 12px; font-size:10px; font-weight:bold; letter-spacing:0.1em; text-transform:uppercase; color:#94a3b8; font-family:Arial,sans-serif;">Recruiter takeaways</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                <tr>
                  <td width="50%" style="padding:14px 16px; vertical-align:top; border-right:1px solid #e2e8f0; background:#f0fdf4;">
                    <p style="margin:0 0 10px; font-size:10px; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:#166534; font-family:Arial,sans-serif;">Strong match indicators</p>
                    <table cellpadding="0" cellspacing="0">${strengthsHTML}</table>
                  </td>
                  <td width="50%" style="padding:14px 16px; vertical-align:top; background:#fffbeb;">
                    <p style="margin:0 0 10px; font-size:10px; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:#92400e; font-family:Arial,sans-serif;">Potential concerns</p>
                    <table cellpadding="0" cellspacing="0">${concernsHTML}</table>
                  </td>
                </tr>
              </table>

              <!-- CTAs -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td width="34%" style="padding-right:8px; vertical-align:top;">
                    <a href="https://calendly.com/pabloagisburgos" style="display:block; background:#152847; text-decoration:none; border-radius:10px; padding:14px 12px;">
                      <span style="display:block; font-size:13px; font-weight:600; color:#f1f5f9; font-family:Arial,sans-serif; line-height:1.3;">${next_step_cta}</span>
                      <span style="display:block; font-size:11px; color:#64748b; font-family:Arial,sans-serif; margin-top:2px;">Book via Calendly · Google Meet</span>
                    </a>
                  </td>
                  <td width="33%" style="padding-right:8px; vertical-align:top;">
                    <a href="https://linkedin.com/in/pablo-agis-burgos" style="display:block; background:#ffffff; border:1px solid #e2e8f0; text-decoration:none; border-radius:10px; padding:14px 12px;">
                      <span style="display:block; font-size:13px; font-weight:600; color:#0f172a; font-family:Arial,sans-serif; line-height:1.3;">View my LinkedIn</span>
                      <span style="display:block; font-size:11px; color:#94a3b8; font-family:Arial,sans-serif; margin-top:2px;">Connect with me</span>
                    </a>
                  </td>
                  <td width="33%" style="vertical-align:top;">
                    <a href="${BASE_URL}/assets/Pablo_Agis_Burgos_CV.pdf" style="display:block; background:#ffffff; border:1px solid #e2e8f0; text-decoration:none; border-radius:10px; padding:14px 12px;">
                      <span style="display:block; font-size:13px; font-weight:600; color:#0f172a; font-family:Arial,sans-serif; line-height:1.3;">Download my CV</span>
                      <span style="display:block; font-size:11px; color:#94a3b8; font-family:Arial,sans-serif; margin-top:2px;">Pablo_Agis_Burgos_CV.pdf</span>
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc; border-top:1px solid #e2e8f0; padding:24px 40px; text-align:center;">
              <p style="margin:0 0 8px; font-size:14px; font-weight:700; color:#0f172a; font-family:Arial,sans-serif;">Thanks again for your time and consideration!</p>
              <a href="${BASE_URL}" style="font-size:12px; color:#3b82f6; font-family:Arial,sans-serif; text-decoration:none;">pablo-interview.vercel.app</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `;
}

export interface SendFollowUpEmailParams {
  to: string;
  transcript: string;
  jobTitle?: string | null;
  companyName?: string | null;
}

export async function sendFollowUpEmail({
  to,
  transcript,
  jobTitle,
  companyName,
}: SendFollowUpEmailParams): Promise<{ emailId: string | null | undefined }> {
  const analysis = await analyzeConversation(transcript, jobTitle, companyName);
  const html = generateEmailHTML(analysis, jobTitle, companyName);
  const resend = getResendClient();

  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [to],
    bcc: [PABLO_EMAIL],
    subject: analysis.suggested_subject_line,
    html,
  });

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }

  console.log(`[followup-email] Sent to ${to}, id: ${result.data?.id}`);
  return { emailId: result.data?.id };
}
