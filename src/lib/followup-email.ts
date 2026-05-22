import { Resend } from 'resend';
import { getAnthropicClient } from '@/lib/anthropic';
import { CLAUDE_FALLBACK_MODEL } from '@/lib/constants';

const PABLO_EMAIL = 'pabloagisburgos@gmail.com';
const FROM_ADDRESS = 'InterviewMind <noreply@interviewmind.one>';
const BASE_URL = 'https://interviewmind.one';

function getResendClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  return new Resend(key);
}

// Static UI labels per language — extend as needed
const UI: Record<string, Record<string, string>> = {
  en: {
    greeting: 'Hi',
    greetingFallback: 'there',
    executiveSummary: 'Executive summary',
    coreExperience: 'Core experience',
    conversationInsights: 'Conversation insights',
    communicationStyle: 'Communication style',
    topicsDiscussed: 'Topics discussed',
    recruiterTakeaways: 'Recruiter takeaways',
    strongMatch: 'Strong match indicators',
    growthAreas: 'Areas to explore further',
    scheduleSub: 'Book via Calendly · Google Meet',
    linkedinLabel: 'View my LinkedIn',
    linkedinSub: 'Connect with me',
    cvLabel: 'Download my CV',
    cvSub: 'Pablo_Agis_Burgos_CV.pdf',
    bodySummary: 'Below is a summary of what we discussed, along with my CV and professional links.',
    bodySignoff: "I'd love to stay in touch!",
    footerText: 'Thanks again for your time and consideration!',
    transcriptTitle: 'Conversation transcript',
    recommendLabel: 'Recommend to a friend',
    recommendSub: 'Share InterviewMind with a colleague',
    recommendSubject: 'Check out InterviewMind',
    recommendBody: 'Hi,\n\nI thought you\'d find this interesting — InterviewMind lets you have a real conversation with AI-represented candidates before scheduling a call.\n\nCheck it out: https://interviewmind.one',
  },
  es: {
    greeting: 'Hola',
    greetingFallback: '',
    executiveSummary: 'Resumen ejecutivo',
    coreExperience: 'Experiencia clave',
    conversationInsights: 'Insights de la conversación',
    communicationStyle: 'Estilo de comunicación',
    topicsDiscussed: 'Temas tratados',
    recruiterTakeaways: 'Valoración del recruiter',
    strongMatch: 'Puntos fuertes de encaje',
    growthAreas: 'Áreas a explorar',
    scheduleSub: 'Reservar en Calendly · Google Meet',
    linkedinLabel: 'Ver mi LinkedIn',
    linkedinSub: 'Conectemos',
    cvLabel: 'Descargar mi CV',
    cvSub: 'Pablo_Agis_Burgos_CV.pdf',
    bodySummary: 'A continuación encontrarás un resumen de nuestra conversación, junto con mi CV y mis datos de contacto.',
    bodySignoff: '¡Me encantaría mantener el contacto!',
    footerText: '¡Muchas gracias por tu tiempo y consideración!',
    transcriptTitle: 'Transcripción de la conversación',
    recommendLabel: 'Recomendar a un amigo',
    recommendSub: 'Comparte InterviewMind con un colega',
    recommendSubject: 'Echa un vistazo a InterviewMind',
    recommendBody: 'Hola,\n\nCreo que esto te puede interesar — InterviewMind permite conversar con candidatos representados por IA antes de agendar una entrevista.\n\nPruébalo: https://interviewmind.one',
  },
};

function getUI(lang: string): Record<string, string> {
  return UI[lang] ?? UI['en'];
}

interface ConversationAnalysis {
  language: string;
  opening_line: string;
  core_experience_chips: string[];
  communication_style: string[];
  topics_discussed: string[];
  strong_match_indicators: string[];
  growth_areas: string[];
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
You are generating a follow-up email on behalf of Pablo Agis Burgos after a recruiter interview.

Pablo's background:
- Hospitality operations background (Soho House London, Axel Hotel Barcelona, Accor)
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

IMPORTANT RULES:
1. Detect the language of the conversation and write ALL text fields in that exact language.
2. Write everything in first person (I / my / me). Never refer to "Pablo" in third person.
3. The "growth_areas" field must be written as positive, forward-looking opportunities — not as red flags or weaknesses. Frame them as areas where there is room to grow or questions worth exploring together. Tone: constructive and optimistic.

Return ONLY a valid JSON object with this exact structure. No markdown, no preamble, just raw JSON:

{
  "language": "ISO 639-1 code of the conversation language, e.g. 'en' or 'es'",
  "opening_line": "Warm, specific 1-sentence intro in first person referencing the actual role/company. Max 25 words. Do NOT include the recruiter's name — the greeting above already uses it.",
  "core_experience_chips": [
    "Exactly 4 short phrases (3–5 words max) covering key experience topics from the conversation."
  ],
  "communication_style": [
    "3 adjective phrases describing how I came across in THIS conversation. E.g. 'Structured and methodical'"
  ],
  "topics_discussed": [
    "3–4 specific topics from the actual conversation. Concrete, not generic."
  ],
  "strong_match_indicators": [
    "2–4 strengths in first person (I bring / I have / My experience...). Grounded in the conversation."
  ],
  "growth_areas": [
    "1–2 forward-looking, constructive phrases. Frame as growth potential or areas to explore together — never as weaknesses or concerns."
  ],
  "executive_summary": "2–3 sentences in first person summarising my seniority signal, communication quality, and fit for the role.",
  "suggested_subject_line": "Email subject line specific to role and company. Max 10 words.",
  "next_step_cta": "Short action phrase for the primary CTA button. Keep it open-ended — no specific timeframes like 'next week'. E.g. 'Let's connect' or 'Schedule a call'."
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
    language: 'en',
    opening_line: `Thanks for exploring my professional background through InterviewMind${companyName ? ` regarding the opportunity at ${companyName}` : ''}.`,
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
      'I bring high-touch client experience across international markets',
      'I have hands-on SaaS implementation and onboarding exposure',
      'I communicate professionally in 5 languages',
    ],
    growth_areas: [
      'Expanding into quota-carrying sales roles',
      'Deepening technical architecture knowledge',
    ],
    executive_summary:
      'I bring senior hospitality operations experience with a recent pivot into SaaS implementation. My communication style is structured and client-oriented, with strong commercial awareness. I am best suited for Customer Success or Implementation roles with an enterprise hospitality focus.',
    suggested_subject_line: jobTitle
      ? `Pablo Agis Burgos · ${jobTitle} follow-up`
      : 'Pablo Agis Burgos · InterviewMind follow-up',
    next_step_cta: 'Schedule a conversation',
  };
}

type RawMessage = { role: string; content: string };

function formatTranscriptHTML(messages: RawMessage[], recruiterName?: string | null): string {
  const recruiterLabel = recruiterName?.trim() || 'Recruiter';
  return messages
    .map((msg) => {
      const isPablo = msg.role === 'assistant';
      const label = isPablo ? 'Pablo' : recruiterLabel;
      const labelColor = isPablo ? '#2563eb' : '#64748b';
      const content = msg.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `
        <tr>
          <td style="padding:10px 0 4px;">
            <span style="font-size:11px; font-weight:bold; color:${labelColor}; text-transform:uppercase; letter-spacing:0.07em; font-family:Arial,sans-serif;">${label}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 2px; border-bottom:1px solid #f1f5f9;">
            <span style="font-size:14px; color:#374151; line-height:1.65; font-family:Arial,sans-serif;">${content}</span>
          </td>
        </tr>`;
    })
    .join('');
}

function generateEmailHTML(
  analysis: ConversationAnalysis,
  recruiterName?: string | null,
  messages?: RawMessage[] | null,
  previewUrl?: string,
  recruiterEmail?: string | null,
  jobTitle?: string | null,
  companyName?: string | null
): string {
  const {
    language,
    opening_line,
    core_experience_chips,
    communication_style,
    topics_discussed,
    strong_match_indicators,
    growth_areas,
    executive_summary,
    next_step_cta,
  } = analysis;

  const ui = getUI(language);

  const greetingName = recruiterName?.trim()
    ? recruiterName.trim()
    : ui['greetingFallback'];
  const greeting = greetingName
    ? `${ui['greeting']} ${greetingName},`
    : `${ui['greeting']},`;

  const chipsHTML = core_experience_chips
    .map(
      (chip) =>
        `<span style="display:inline-block; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:6px; padding:6px 12px; font-size:13px; color:#475569; margin:3px 4px 3px 0; white-space:nowrap;">${chip}</span>`
    )
    .join('');

  const commStyleHTML = communication_style
    .map(
      (item) =>
        `<li style="margin-bottom:6px; font-size:14px; color:#64748b;">· ${item}</li>`
    )
    .join('');

  const topicsHTML = topics_discussed
    .map(
      (item) =>
        `<li style="margin-bottom:6px; font-size:14px; color:#64748b;">· ${item}</li>`
    )
    .join('');

  const strengthsHTML = strong_match_indicators
    .map(
      (item) => `
      <tr>
        <td style="padding:5px 0; font-size:14px; color:#166534; vertical-align:top;">
          <span style="margin-right:6px;">✓</span>${item}
        </td>
      </tr>`
    )
    .join('');

  const growthHTML = growth_areas
    .map(
      (item) => `
      <tr>
        <td style="padding:5px 0; font-size:14px; color:#1d4ed8; vertical-align:top;">
          <span style="margin-right:6px;">→</span>${item}
        </td>
      </tr>`
    )
    .join('');


  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pablo Agis Burgos — InterviewMind</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: Arial, Helvetica, sans-serif;">

  ${previewUrl ? `<p style="text-align:center; margin-bottom:12px;">
    <a href="${previewUrl}" style="font-size:11px; color:#94a3b8; text-decoration:none; letter-spacing:0.04em;">
      Having trouble viewing this email? Open in browser →
    </a>
  </p>` : ''}

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0;">

          <!-- HEADER -->
          <tr>
            <td background="${BASE_URL}/assets/header-bg.jpg"
                style="background-image:url('${BASE_URL}/assets/header-bg.jpg'); background-size:cover; background-position:center top; background-color:#0f172a;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:rgba(10,18,35,0.12); padding:32px 24px 24px; text-align:center;">
                    ${previewUrl ? `<a href="${previewUrl}" style="display:block; text-decoration:none;">` : ''}
                    <p style="margin:0 0 20px; font-size:12px; letter-spacing:0.15em; color:rgba(255,255,255,0.72); font-family:Arial,sans-serif; text-transform:uppercase;">InterviewMind</p>
                    <img src="${BASE_URL}/assets/pablo-avatar.jpg" alt="Pablo Agis Burgos" width="72" height="72" style="width:72px; height:72px; border-radius:50%; border:3px solid rgba(255,255,255,0.85); margin:0 auto 16px; display:block; object-fit:cover; object-position:top center;" />
                    <h1 style="margin:0; font-size:22px; font-weight:600; color:#ffffff; font-family:Arial,sans-serif; letter-spacing:-0.01em; text-shadow:0 1px 4px rgba(0,0,0,0.5);">Pablo Agis Burgos</h1>
                    ${previewUrl ? `<p style="font-size:11px; color:rgba(255,255,255,0.6); margin-top:12px;">↗ Click to open interactive version</p></a>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:28px 24px;">

              <p style="margin:0 0 16px; font-size:21px; font-weight:700; color:#0f172a; font-family:Arial,sans-serif;">${greeting}</p>
              <div style="border-left:3px solid #dbeafe; padding-left:18px; margin-bottom:28px;">
                <p style="margin:0 0 10px; font-size:15px; line-height:1.75; color:#475569; font-family:Arial,sans-serif;">${opening_line}</p>
                <p style="margin:0 0 10px; font-size:15px; line-height:1.75; color:#475569; font-family:Arial,sans-serif;">${ui['bodySummary']}</p>
                <p style="margin:0 0 10px; font-size:15px; line-height:1.75; color:#475569; font-family:Arial,sans-serif;">${ui['bodySignoff']}</p>
                <p style="margin:0; font-size:15px; color:#475569; font-family:Arial,sans-serif;">— Pablo</p>
              </div>

              <!-- CTAs -->
              <table data-cta-table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">

                <!-- HERO: Book a call -->
                <tr>
                  <td style="padding-bottom:8px;">
                    <a href="https://calendly.com/pabloagisburgos" style="display:block; background:#f8fafc; border:1px solid #e2e8f0; text-decoration:none; border-radius:12px; padding:20px 20px;">
                      <table width="100%" cellpadding="0" cellspacing="0"><tr>
                        <td width="52" style="vertical-align:middle;">
                          <img src="${BASE_URL}/assets/icon-google-meet.svg" width="40" height="40" alt="" style="display:block; border-radius:8px;" />
                        </td>
                        <td style="vertical-align:middle; padding-left:12px;">
                          <span style="display:block; font-size:17px; font-weight:700; color:#0f172a; font-family:Arial,sans-serif; line-height:1.3;">${next_step_cta}</span>
                          <span style="display:block; font-size:12px; color:#94a3b8; font-family:Arial,sans-serif; margin-top:4px;">${ui['scheduleSub']}</span>
                        </td>
                        <td width="28" style="vertical-align:middle; text-align:right;">
                          <span style="font-size:22px; color:#cbd5e1; font-family:Arial,sans-serif;">&#8594;</span>
                        </td>
                      </tr></table>
                    </a>
                  </td>
                </tr>

                <!-- 2-COLUMN: LinkedIn + CV -->
                <tr>
                  <td style="padding-bottom:8px;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td width="50%" style="padding-right:4px; vertical-align:top;">
                        <a href="https://www.linkedin.com/in/pablo-agis-burgos" style="display:block; background:#f8fafc; border:1px solid #e2e8f0; text-decoration:none; border-radius:12px; padding:16px 10px; text-align:center;">
                          <img src="${BASE_URL}/assets/icon-linkedin.svg" width="32" height="32" alt="" style="display:block; margin:0 auto 8px; border-radius:6px;" />
                          <span style="display:block; font-size:13px; font-weight:600; color:#0f172a; font-family:Arial,sans-serif; line-height:1.3;">${ui['linkedinLabel']}</span>
                          <span style="display:block; font-size:11px; color:#94a3b8; font-family:Arial,sans-serif; margin-top:3px;">${ui['linkedinSub']}</span>
                        </a>
                      </td>
                      <td width="50%" style="padding-left:4px; vertical-align:top;">
                        <a href="${BASE_URL}/cv.pdf" style="display:block; background:#f8fafc; border:1px solid #e2e8f0; text-decoration:none; border-radius:12px; padding:16px 10px; text-align:center;">
                          <img src="${BASE_URL}/assets/icon-pdf.svg" width="32" height="32" alt="" style="display:block; margin:0 auto 8px; border-radius:6px;" />
                          <span style="display:block; font-size:13px; font-weight:600; color:#0f172a; font-family:Arial,sans-serif; line-height:1.3;">${ui['cvLabel']}</span>
                          <span style="display:block; font-size:11px; color:#94a3b8; font-family:Arial,sans-serif; margin-top:3px;">${ui['cvSub']}</span>
                        </a>
                      </td>
                    </tr></table>
                  </td>
                </tr>

                <!-- Reply to recruiter (Pablo's notification only) -->
                ${recruiterEmail ? (() => {
                  const subject = [jobTitle, companyName].filter(Boolean).join(' at ');
                  const mailto = `mailto:${recruiterEmail}?subject=${encodeURIComponent(subject ? `Re: ${subject}` : 'Re: InterviewMind conversation')}`;
                  return `<tr>
                  <td style="padding-bottom:8px;">
                    <a href="${mailto}" style="display:block; background:#f8fafc; border:1px solid #e2e8f0; text-decoration:none; border-radius:12px; padding:14px 18px;">
                      <table width="100%" cellpadding="0" cellspacing="0"><tr>
                        <td width="44" style="vertical-align:middle;">
                          <img src="${BASE_URL}/assets/icon-reply.svg" width="32" height="32" alt="" style="display:block; border-radius:6px;" />
                        </td>
                        <td style="vertical-align:middle; padding-left:10px;">
                          <span style="display:block; font-size:15px; font-weight:600; color:#0f172a; font-family:Arial,sans-serif; line-height:1.3;">Reply to recruiter</span>
                          <span style="display:block; font-size:12px; color:#94a3b8; font-family:Arial,sans-serif; margin-top:3px;">${recruiterEmail}</span>
                        </td>
                      </tr></table>
                    </a>
                  </td>
                </tr>`;
                })() : ''}

                <!-- Recommend to a friend -->
                <tr>
                  <td>
                    <a href="mailto:?subject=${encodeURIComponent(ui['recommendSubject'])}&body=${encodeURIComponent(ui['recommendBody'])}" style="display:block; background:#f8fafc; border:1px solid #e2e8f0; text-decoration:none; border-radius:12px; padding:14px 18px;">
                      <table width="100%" cellpadding="0" cellspacing="0"><tr>
                        <td width="44" style="vertical-align:middle;">
                          <img src="${BASE_URL}/assets/icon-recommend.svg" width="32" height="32" alt="" style="display:block; border-radius:6px;" />
                        </td>
                        <td style="vertical-align:middle; padding-left:10px;">
                          <span style="display:block; font-size:15px; font-weight:600; color:#0f172a; font-family:Arial,sans-serif; line-height:1.3;">${ui['recommendLabel']}</span>
                          <span style="display:block; font-size:12px; color:#94a3b8; font-family:Arial,sans-serif; margin-top:3px;">${ui['recommendSub']}</span>
                        </td>
                      </tr></table>
                    </a>
                  </td>
                </tr>

              </table>

              <!-- Section: Executive Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                <tr>
                  <td data-accordion-header style="background:#f8fafc; padding:12px 16px; border-bottom:1px solid #e2e8f0; cursor:pointer;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td><span style="font-size:13px; font-weight:700; color:#0f172a; font-family:Arial,sans-serif;">${ui['executiveSummary']}</span></td>
                      <td align="right"><span data-chevron style="font-size:18px; color:#94a3b8; font-family:Arial,sans-serif;">&#9660;</span></td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 18px; background:#ffffff;">
                    <p style="margin:0; font-size:14px; line-height:1.75; color:#475569; font-family:Arial,sans-serif;">${executive_summary}</p>
                  </td>
                </tr>
              </table>

              <!-- Section: Core Experience -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                <tr>
                  <td data-accordion-header style="background:#f8fafc; padding:12px 16px; border-bottom:1px solid #e2e8f0; cursor:pointer;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td><span style="font-size:13px; font-weight:700; color:#0f172a; font-family:Arial,sans-serif;">${ui['coreExperience']}</span></td>
                      <td align="right"><span data-chevron style="font-size:18px; color:#94a3b8; font-family:Arial,sans-serif;">&#9660;</span></td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 16px; background:#ffffff;">
                    <div style="line-height:1.8;">${chipsHTML}</div>
                  </td>
                </tr>
              </table>

              <!-- Section: Conversation Insights -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                <tr>
                  <td data-accordion-header style="background:#f8fafc; padding:12px 16px; border-bottom:1px solid #e2e8f0; cursor:pointer;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td><span style="font-size:13px; font-weight:700; color:#0f172a; font-family:Arial,sans-serif;">${ui['conversationInsights']}</span></td>
                      <td align="right"><span data-chevron style="font-size:18px; color:#94a3b8; font-family:Arial,sans-serif;">&#9660;</span></td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="background:#ffffff;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td width="50%" style="padding:14px 16px; vertical-align:top; border-right:1px solid #e2e8f0;">
                        <p style="margin:0 0 8px; font-size:11px; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:#94a3b8; font-family:Arial,sans-serif;">${ui['communicationStyle']}</p>
                        <ul style="margin:0; padding:0; list-style:none;">${commStyleHTML}</ul>
                      </td>
                      <td width="50%" style="padding:14px 16px; vertical-align:top;">
                        <p style="margin:0 0 8px; font-size:11px; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:#94a3b8; font-family:Arial,sans-serif;">${ui['topicsDiscussed']}</p>
                        <ul style="margin:0; padding:0; list-style:none;">${topicsHTML}</ul>
                      </td>
                    </tr></table>
                  </td>
                </tr>
              </table>

              <!-- Section: Recruiter Takeaways -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                <tr>
                  <td data-accordion-header style="background:#f8fafc; padding:12px 16px; border-bottom:1px solid #e2e8f0; cursor:pointer;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td><span style="font-size:13px; font-weight:700; color:#0f172a; font-family:Arial,sans-serif;">${ui['recruiterTakeaways']}</span></td>
                      <td align="right"><span data-chevron style="font-size:18px; color:#94a3b8; font-family:Arial,sans-serif;">&#9660;</span></td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="background:#ffffff;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td width="50%" style="padding:14px 16px; vertical-align:top; border-right:1px solid #e2e8f0; background:#f0fdf4;">
                        <p style="margin:0 0 8px; font-size:11px; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:#166534; font-family:Arial,sans-serif;">${ui['strongMatch']}</p>
                        <table cellpadding="0" cellspacing="0">${strengthsHTML}</table>
                      </td>
                      <td width="50%" style="padding:14px 16px; vertical-align:top; background:#eff6ff;">
                        <p style="margin:0 0 8px; font-size:11px; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:#1d4ed8; font-family:Arial,sans-serif;">${ui['growthAreas']}</p>
                        <table cellpadding="0" cellspacing="0">${growthHTML}</table>
                      </td>
                    </tr></table>
                  </td>
                </tr>
              </table>

              ${messages && messages.length > 0 ? `
              <!-- Section: Full Transcript -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                <tr>
                  <td data-accordion-header style="background:#f8fafc; padding:12px 16px; border-bottom:1px solid #e2e8f0; cursor:pointer;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td><span style="font-size:13px; font-weight:700; color:#0f172a; font-family:Arial,sans-serif;">${ui['transcriptTitle']}</span></td>
                      <td align="right"><span data-chevron style="font-size:18px; color:#94a3b8; font-family:Arial,sans-serif;">&#9660;</span></td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 18px; background:#ffffff;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${formatTranscriptHTML(messages, recruiterName)}
                    </table>
                  </td>
                </tr>
              </table>` : ''}

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc; border-top:1px solid #e2e8f0; padding:24px; text-align:center;">
              <p style="margin:0 0 8px; font-size:15px; font-weight:700; color:#0f172a; font-family:Arial,sans-serif;">${ui['footerText']}</p>
              <a href="${BASE_URL}" style="font-size:13px; color:#3b82f6; font-family:Arial,sans-serif; text-decoration:none;">interviewmind.one</a>
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
  messages: RawMessage[];
  recruiterName?: string | null;
  jobTitle?: string | null;
  companyName?: string | null;
  sessionId?: string | null;
  bcc?: string[];
  recruiterEmail?: string | null;
}

export async function sendFollowUpEmail({
  to,
  transcript,
  messages,
  recruiterName,
  jobTitle,
  companyName,
  sessionId,
  bcc,
  recruiterEmail,
}: SendFollowUpEmailParams): Promise<{ emailId: string | null | undefined; html: string }> {
  const analysis = await analyzeConversation(transcript, jobTitle, companyName);
  const previewUrl = sessionId ? `${BASE_URL}/email-preview?id=${sessionId}` : undefined;
  const html = generateEmailHTML(analysis, recruiterName, messages, previewUrl, recruiterEmail, jobTitle, companyName);
  const resend = getResendClient();

  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [to],
    bcc: bcc ?? [PABLO_EMAIL],
    subject: (() => {
      const parts = [jobTitle, companyName].filter(Boolean);
      if (parts.length > 0) return `Pablo Agis Burgos · ${parts.join(' at ')}`;
      return analysis.suggested_subject_line;
    })(),
    html,
  });

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }

  console.log(`[followup-email] Sent to ${to}, id: ${result.data?.id}`);
  return { emailId: result.data?.id, html };
}
