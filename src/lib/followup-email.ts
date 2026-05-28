import { Resend } from 'resend';
import { generateReport } from '@/lib/report';
import type { ReportData } from '@/lib/report';

const PABLO_EMAIL = 'pabloagisburgos@gmail.com';
const FROM_ADDRESS = 'InterviewMind <noreply@interviewmind.one>';
const BASE_URL = 'https://interviewmind.one';

type Lang = 'en' | 'es' | 'it' | 'pt';
const VALID_LANGS: Lang[] = ['en', 'es', 'it', 'pt'];

function getResendClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  return new Resend(key);
}

// ── Labels (mirrors InteractiveReport) ───────────────────────────────────────

const SECTION_LABELS: Record<string, Record<Lang, string>> = {
  executiveSummary:    { en: 'Executive Summary',            es: 'Resumen ejecutivo',                 it: 'Sommario esecutivo',                  pt: 'Sumário executivo' },
  coreExperience:      { en: 'Core Experience',              es: 'Experiencia clave',                 it: 'Esperienza chiave',                   pt: 'Experiência principal' },
  conversationInsights:{ en: 'Conversation Insights',        es: 'Insights de la conversación',       it: 'Insights della conversazione',        pt: 'Insights da conversa' },
  recruiterTakeaways:  { en: 'Recruiter Takeaways',          es: 'Puntos clave',                      it: 'Punti chiave',                        pt: 'Pontos-chave' },
  transcript:          { en: 'Conversation Transcript',      es: 'Transcripción de la conversación',  it: 'Trascrizione della conversazione',    pt: 'Transcrição da conversa' },
};

const ACTION_LABELS: Record<string, Record<Lang, string>> = {
  bookCall:   { en: 'Book a call',           es: 'Agenda una llamada',   it: 'Prenota una chiamata',  pt: 'Agendar uma chamada' },
  downloadCv: { en: 'Download CV',           es: 'Descargar CV',         it: 'Scarica CV',            pt: 'Descarregar CV' },
  linkedin:   { en: 'View LinkedIn',         es: 'Ver LinkedIn',         it: 'Vedi LinkedIn',         pt: 'Ver LinkedIn' },
  referPablo: { en: 'Refer Pablo to someone',es: 'Recomendar a Pablo',   it: 'Consiglia Pablo',       pt: 'Recomendar Pablo' },
};

const REPORT_BADGE: Record<Lang, string> = {
  en: 'Insights Report', es: 'Informe de insights', it: 'Report insights', pt: 'Relatório de insights',
};

const GREETING: Record<Lang, string> = { en: 'Hi', es: 'Hola', it: 'Ciao', pt: 'Olá' };

const OPEN_IN_BROWSER: Record<Lang, string> = {
  en: 'Having trouble viewing this email? Open in browser →',
  es: '¿Problemas para ver este email? Ábrelo en el navegador →',
  it: 'Problemi a visualizzare questa email? Aprila nel browser →',
  pt: 'Problemas a ver este email? Abrir no navegador →',
};

const FOOTER_TEXT: Record<Lang, string> = {
  en: 'Thanks again for your time and consideration!',
  es: '¡Muchas gracias por tu tiempo y consideración!',
  it: 'Grazie ancora per il tuo tempo e la tua considerazione!',
  pt: 'Obrigado pelo seu tempo e consideração!',
};

const REFER_SUBJECT: Record<Lang, string> = {
  en: 'Meet Pablo Agis Burgos — Hospitality Tech & SaaS Professional',
  es: 'Te presento a Pablo Agis Burgos — Hospitality Tech & SaaS',
  it: 'Ti presento Pablo Agis Burgos — Hospitality Tech & SaaS',
  pt: 'Apresento-te Pablo Agis Burgos — Hospitality Tech & SaaS',
};

function getReferBody(lang: Lang, insightsUrl: string): string {
  const bodies: Record<Lang, string> = {
    en: `Hi,\n\nI wanted to share something a little different with you.\n\nInstead of relying on a static CV, Pablo Agis built an interactive AI profile that lets you explore his professional background through conversation — shaped around his real experience, client work, projects and transition into hospitality tech.\n\nIt's a thoughtful way to get a sense of how he communicates, thinks and approaches problems — much closer to a real conversation than a traditional CV ever could.\n\nYou can explore it here:\nhttps://interviewmind.one\n\nAnd if useful, here are the insights from my own conversation:\n${insightsUrl}\n\nBest,\n\n`,
    es: `Hola,\n\nQuería compartir algo un poco diferente contigo.\n\nEn lugar de un CV estático, Pablo Agis ha creado un perfil interactivo con IA que permite explorar su trayectoria profesional a través de una conversación — basada en su experiencia real, proyectos y evolución hacia la tecnología hotelera.\n\nEs una forma muy natural de ver cómo comunica, cómo piensa y cómo afronta los problemas — mucho más cercana a una conversación real de lo que podría serlo un CV tradicional.\n\nPuedes explorarlo aquí:\nhttps://interviewmind.one\n\nY si te resulta útil, aquí tienes los insights de mi propia conversación:\n${insightsUrl}\n\nUn saludo,\n\n`,
    it: `Ciao,\n\nVolevo condividere con te qualcosa di un po' diverso.\n\nInvece di affidarsi a un CV statico, Pablo Agis ha creato un profilo interattivo con AI che permette di esplorare il suo percorso professionale attraverso una conversazione — costruita attorno alla sua esperienza reale, ai progetti e alla sua transizione nel settore dell'hospitality tech.\n\nÈ un modo molto naturale per capire come comunica, come ragiona e come affronta i problemi — molto più vicino a una vera conversazione di quanto potrebbe mai essere un CV tradizionale.\n\nPuoi esplorarlo qui:\nhttps://interviewmind.one\n\nE se ti è utile, ecco gli insights della mia conversazione:\n${insightsUrl}\n\nA presto,\n\n`,
    pt: `Olá,\n\nQueria partilhar contigo algo um pouco diferente.\n\nEm vez de um CV estático, o Pablo Agis criou um perfil interativo com IA que permite explorar o seu percurso profissional através de uma conversa — baseada na sua experiência real, projetos e transição para o hospitality tech.\n\nÉ uma forma muito natural de perceber como comunica, como pensa e como aborda os problemas — muito mais próxima de uma conversa real do que um CV tradicional alguma vez poderia ser.\n\nPodes explorá-lo aqui:\nhttps://interviewmind.one\n\nE se for útil, aqui estão os insights da minha própria conversa:\n${insightsUrl}\n\nCom os melhores cumprimentos,\n\n`,
  };
  return bodies[lang];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type RawMessage = { role: string; content: string };

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sectionHeader(num: number, label: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
      <tr>
        <td width="30" valign="middle">
          <div style="width:22px; height:22px; border-radius:50%; background:#4060d0; text-align:center; line-height:22px; display:inline-block;">
            <span style="font-size:9px; font-weight:800; color:#ffffff; font-family:Arial,sans-serif; line-height:22px;">${String(num).padStart(2, '0')}</span>
          </div>
        </td>
        <td valign="middle">
          <span style="font-size:10px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; color:#0f172a; font-family:Arial,sans-serif;">${label}</span>
        </td>
      </tr>
    </table>`;
}

function divider(): string {
  return `<div style="height:0.5px; background:#e2e8f0; margin:0 0 16px;"></div>`;
}

// ── Email HTML (mirrors InteractiveReport layout) ─────────────────────────────

function generateEmailHTML(
  report: ReportData,
  recruiterName: string | null,
  messages: RawMessage[],
  previewUrl?: string,
  _jobTitle?: string | null,
  _companyName?: string | null,
  exitNotify?: boolean,
  insightsUrl?: string,
): string {
  const lang: Lang = VALID_LANGS.includes(report.language as Lang) ? report.language as Lang : 'en';
  const greetingName = recruiterName?.trim() || '';
  const greeting = greetingName ? `${GREETING[lang]} ${greetingName},` : `${GREETING[lang]},`;
  const referHref = `mailto:?subject=${encodeURIComponent(REFER_SUBJECT[lang])}&body=${encodeURIComponent(getReferBody(lang, insightsUrl ?? BASE_URL))}`;

  // ── Section 1: Executive Summary
  const chipsHTML = (report.executiveSummary.chips ?? []).map(chip =>
    `<span style="display:inline-block; background:rgba(64,96,208,0.08); border:0.5px solid rgba(64,96,208,0.22); border-radius:999px; padding:3px 11px; font-size:11px; font-weight:600; color:#4060d0; margin:2px 4px 2px 0; font-family:Arial,sans-serif;">${esc(chip)}</span>`
  ).join('');

  const execPointsHTML = (report.executiveSummary.points ?? []).map(pt =>
    `<tr><td style="padding:3px 0; font-size:13px; color:#475569; line-height:1.65; font-family:Arial,sans-serif;" valign="top">
      <span style="color:#4060d0; font-weight:700; margin-right:8px; font-family:Arial,sans-serif;">·</span>${esc(pt)}
    </td></tr>`
  ).join('');

  // ── Section 2: Core Experience
  const coreItemsHTML = report.coreExperience.items.map((item, i) => `
    ${i > 0 ? `<tr><td style="padding:8px 0;"><div style="height:0.5px; background:#e2e8f0;"></div></td></tr>` : ''}
    <tr><td style="padding-bottom:3px;">
      <span style="font-size:11px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; color:#4060d0; font-family:Arial,sans-serif;">${esc(item.label)}</span>
    </td></tr>
    <tr><td>
      <span style="font-size:13px; color:#475569; line-height:1.65; font-family:Arial,sans-serif;">${esc(item.detail)}</span>
    </td></tr>`
  ).join('');

  // ── Section 3: Conversation Insights
  const insightItemsHTML = report.conversationInsights.items.map(item =>
    `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px; background:#f5f7ff; border:0.5px solid #c8d4f5; border-left:2.5px solid #4060d0; border-radius:10px;">
      <tr><td style="padding:10px 14px;">
        <div style="font-size:10px; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; color:#4060d0; margin-bottom:4px; font-family:Arial,sans-serif;">${esc(item.title)}</div>
        <div style="font-size:13px; color:#475569; line-height:1.65; font-family:Arial,sans-serif;">${esc(item.body)}</div>
      </td></tr>
    </table>`
  ).join('');

  // ── Section 4: Recruiter Takeaways
  const takeawayItemsHTML = report.recruiterTakeaways.items.map(item =>
    `<tr><td style="padding:4px 0; font-size:13px; color:#475569; line-height:1.65; font-family:Arial,sans-serif;" valign="top">
      <span style="color:#4060d0; font-weight:700; margin-right:8px; font-family:Arial,sans-serif;">&#8594;</span>${esc(item)}
    </td></tr>`
  ).join('');

  // ── Section 5: Transcript
  const recruiterLabel = recruiterName?.trim() || 'Recruiter';
  const transcriptHTML = messages.map((msg, i) => {
    const isPablo = msg.role === 'assistant';
    const labelColor = isPablo ? '#4060d0' : '#94a3b8';
    return `
    ${i > 0 ? `<tr><td style="padding:8px 0;"><div style="height:0.5px; background:#e2e8f0;"></div></td></tr>` : ''}
    <tr><td style="padding-bottom:4px;">
      <span style="font-size:9px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${labelColor}; font-family:Arial,sans-serif;">${isPablo ? 'Pablo' : recruiterLabel}</span>
    </td></tr>
    <tr><td>
      <span style="font-size:13px; color:#475569; line-height:1.7; font-family:Arial,sans-serif;">${esc(msg.content)}</span>
    </td></tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pablo Agis Burgos — ${REPORT_BADGE[lang]}</title>
</head>
<body style="margin:0; padding:0; background-color:#f0f2f8; font-family:Arial,Helvetica,sans-serif;">

  ${exitNotify ? `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7; border-bottom:2px solid #f59e0b;">
    <tr><td style="padding:10px 20px; font-size:12px; color:#92400e; font-family:Arial,Helvetica,sans-serif; text-align:center; letter-spacing:0.02em;">
      &#9888;&#65039; &nbsp;<strong>Sesi&#243;n abandonada</strong> &#8212; el recruiter cerr&#243; la pesta&#241;a sin ver los insights
    </td></tr>
  </table>` : ''}

  ${previewUrl ? `
  <p style="text-align:center; padding:14px 0 0; margin:0;">
    <a href="${previewUrl}" style="font-size:11px; color:#94a3b8; text-decoration:none; letter-spacing:0.04em; font-family:Arial,sans-serif;">${OPEN_IN_BROWSER[lang]}</a>
  </p>` : ''}

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 16px 52px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

        <!-- ── HEADER CARD ─────────────────────────────────────────────────── -->
        <tr><td style="padding-bottom:10px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff; border:0.5px solid #dde2f2; border-radius:20px; overflow:hidden;">
            <tr><td style="padding:28px 24px 22px; text-align:center;">

              <!-- Report badge -->
              <div style="display:inline-block; background:rgba(64,96,208,0.10); border:0.5px solid rgba(64,96,208,0.28); border-radius:999px; padding:4px 14px; font-size:9px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#4060d0; margin-bottom:18px; font-family:Arial,sans-serif;">&#10022; ${REPORT_BADGE[lang]}</div>

              <!-- Avatar -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 14px;">
                <tr><td width="62" height="62" bgcolor="#e2e8f0" style="border-radius:50%; font-size:0; line-height:0; overflow:hidden; border:2px solid rgba(64,96,208,0.4);">
                  <img src="${BASE_URL}/assets/pablo-avatar.jpg" alt="Pablo Agis Burgos" width="62" height="62" style="width:62px; height:62px; border-radius:50%; display:block; object-fit:cover; object-position:center 15%;" />
                </td></tr>
              </table>

              <!-- Name -->
              <div style="font-size:17px; font-weight:700; letter-spacing:-0.01em; color:#4060d0; margin-bottom:4px; font-family:Arial,sans-serif;">Pablo Agis Burgos</div>
              <div style="font-size:11px; color:#94a3b8; margin-bottom:20px; font-family:Arial,sans-serif;">SaaS · Hospitality Tech</div>

              <!-- Divider -->
              <div style="height:0.5px; background:#e2e8f0; margin-bottom:18px;"></div>

              <!-- Greeting + Intro -->
              <p style="margin:0 0 12px; font-size:15px; font-weight:600; color:#0f172a; font-family:Arial,sans-serif; text-align:left;">${greeting}</p>
              <p style="margin:0 0 8px; font-size:13.5px; color:#475569; line-height:1.75; text-align:left; font-family:Arial,sans-serif;">${esc(report.intro)}</p>
              <p style="margin:0; font-size:12px; color:#94a3b8; font-style:italic; text-align:left; font-family:Arial,sans-serif;">&#8212; Pablo</p>

            </td></tr>
          </table>
        </td></tr>

        <!-- ── ACTION GRID (2×2) ───────────────────────────────────────────── -->
        <tr><td style="padding-bottom:18px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="padding-right:4px; padding-bottom:8px; vertical-align:top;">
                <a href="https://calendly.com/pabloagisburgos" style="display:block; background:#f5f7ff; border:0.5px solid #c8d4f5; border-radius:12px; padding:16px 12px; text-align:center; text-decoration:none;">
                  <div style="font-size:22px; line-height:1; margin-bottom:8px;">&#128197;</div>
                  <span style="display:block; font-size:11.5px; font-weight:600; color:#0f172a; font-family:Arial,sans-serif;">${ACTION_LABELS.bookCall[lang]}</span>
                </a>
              </td>
              <td width="50%" style="padding-left:4px; padding-bottom:8px; vertical-align:top;">
                <a href="${BASE_URL}/assets/Pablo_Agis_Burgos_CV.pdf" style="display:block; background:#f5f7ff; border:0.5px solid #c8d4f5; border-radius:12px; padding:16px 12px; text-align:center; text-decoration:none;">
                  <div style="font-size:22px; line-height:1; margin-bottom:8px;">&#11015;&#65039;</div>
                  <span style="display:block; font-size:11.5px; font-weight:600; color:#0f172a; font-family:Arial,sans-serif;">${ACTION_LABELS.downloadCv[lang]}</span>
                </a>
              </td>
            </tr>
            <tr>
              <td width="50%" style="padding-right:4px; vertical-align:top;">
                <a href="https://www.linkedin.com/in/pablo-agis-burgos" style="display:block; background:#f5f7ff; border:0.5px solid #c8d4f5; border-radius:12px; padding:16px 12px; text-align:center; text-decoration:none;">
                  <div style="font-size:22px; line-height:1; margin-bottom:8px;">&#128188;</div>
                  <span style="display:block; font-size:11.5px; font-weight:600; color:#0f172a; font-family:Arial,sans-serif;">${ACTION_LABELS.linkedin[lang]}</span>
                </a>
              </td>
              <td width="50%" style="padding-left:4px; vertical-align:top;">
                <a href="${referHref}" style="display:block; background:#f5f7ff; border:0.5px solid #c8d4f5; border-radius:12px; padding:16px 12px; text-align:center; text-decoration:none;">
                  <div style="font-size:22px; line-height:1; margin-bottom:8px;">&#8599;&#65039;</div>
                  <span style="display:block; font-size:11.5px; font-weight:600; color:#0f172a; font-family:Arial,sans-serif;">${ACTION_LABELS.referPablo[lang]}</span>
                </a>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- ── SECTION 1: Executive Summary ──────────────────────────────── -->
        <tr><td style="padding-bottom:8px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff; border:0.5px solid #dde2f2; border-radius:14px; overflow:hidden;">
            <tr><td style="padding:16px 18px 20px;">
              ${sectionHeader(1, SECTION_LABELS.executiveSummary[lang])}
              ${divider()}
              <p style="margin:0 0 12px; font-size:14px; font-weight:500; color:#0f172a; line-height:1.6; font-family:Arial,sans-serif;">${esc(report.executiveSummary.headline)}</p>
              ${chipsHTML ? `<div style="margin-bottom:12px;">${chipsHTML}</div>` : ''}
              ${execPointsHTML ? `<table width="100%" cellpadding="0" cellspacing="0">${execPointsHTML}</table>` : ''}
            </td></tr>
          </table>
        </td></tr>

        <!-- ── SECTION 2: Core Experience ────────────────────────────────── -->
        <tr><td style="padding-bottom:8px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff; border:0.5px solid #dde2f2; border-radius:14px; overflow:hidden;">
            <tr><td style="padding:16px 18px 20px;">
              ${sectionHeader(2, SECTION_LABELS.coreExperience[lang])}
              ${divider()}
              <table width="100%" cellpadding="0" cellspacing="0">${coreItemsHTML}</table>
            </td></tr>
          </table>
        </td></tr>

        <!-- ── SECTION 3: Conversation Insights ──────────────────────────── -->
        <tr><td style="padding-bottom:8px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff; border:0.5px solid #dde2f2; border-radius:14px; overflow:hidden;">
            <tr><td style="padding:16px 18px 20px;">
              ${sectionHeader(3, SECTION_LABELS.conversationInsights[lang])}
              ${divider()}
              ${insightItemsHTML}
            </td></tr>
          </table>
        </td></tr>

        <!-- ── SECTION 4: Recruiter Takeaways ────────────────────────────── -->
        <tr><td style="padding-bottom:8px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff; border:0.5px solid #dde2f2; border-radius:14px; overflow:hidden;">
            <tr><td style="padding:16px 18px 20px;">
              ${sectionHeader(4, SECTION_LABELS.recruiterTakeaways[lang])}
              ${divider()}
              <table width="100%" cellpadding="0" cellspacing="0">${takeawayItemsHTML}</table>
            </td></tr>
          </table>
        </td></tr>

        ${messages.length > 0 ? `
        <!-- ── SECTION 5: Transcript ──────────────────────────────────────── -->
        <tr><td style="padding-bottom:8px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff; border:0.5px solid #dde2f2; border-radius:14px; overflow:hidden;">
            <tr><td style="padding:16px 18px 20px;">
              ${sectionHeader(5, SECTION_LABELS.transcript[lang])}
              ${divider()}
              <table width="100%" cellpadding="0" cellspacing="0">${transcriptHTML}</table>
            </td></tr>
          </table>
        </td></tr>` : ''}

        <!-- ── FOOTER ─────────────────────────────────────────────────────── -->
        <tr><td style="padding-top:8px; text-align:center;">
          <p style="margin:0 0 6px; font-size:13px; color:#94a3b8; font-family:Arial,sans-serif;">${FOOTER_TEXT[lang]}</p>
          <a href="${BASE_URL}" style="font-size:12px; color:#4060d0; font-family:Arial,sans-serif; text-decoration:none;">interviewmind.one</a>
        </td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

// ── Public interface ──────────────────────────────────────────────────────────

export interface SendFollowUpEmailParams {
  to: string;
  transcript: string;
  messages: RawMessage[];
  recruiterName?: string | null;
  jobTitle?: string | null;
  companyName?: string | null;
  exitNotify?: boolean;
  sessionId?: string | null;
  bcc?: string[];
  recruiterEmail?: string | null;
}

export async function sendFollowUpEmail({
  to,
  messages,
  recruiterName,
  jobTitle,
  companyName,
  exitNotify,
  sessionId,
  bcc,
}: SendFollowUpEmailParams): Promise<{ emailId: string | null | undefined; html: string }> {
  const report = await generateReport({
    messages,
    recruiterName: recruiterName ?? null,
    company: companyName ?? null,
  });

  const previewUrl = sessionId ? `${BASE_URL}/email-preview?id=${sessionId}` : undefined;
  const insightsUrl = sessionId ? `${BASE_URL}/interview/${sessionId}` : BASE_URL;
  const html = generateEmailHTML(report, recruiterName ?? null, messages, previewUrl, jobTitle, companyName, exitNotify, insightsUrl);

  const resend = getResendClient();
  const lang: Lang = VALID_LANGS.includes(report.language as Lang) ? report.language as Lang : 'en';
  const subject = [jobTitle, companyName].filter(Boolean).length > 0
    ? `Pablo Agis Burgos · ${[jobTitle, companyName].filter(Boolean).join(' at ')}`
    : `Pablo Agis Burgos — ${REPORT_BADGE[lang]}`;

  const result = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [to],
    bcc: bcc ?? [PABLO_EMAIL],
    subject,
    html,
  });

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }

  console.log(`[followup-email] Sent to ${to}, id: ${result.data?.id}`);
  return { emailId: result.data?.id, html };
}
