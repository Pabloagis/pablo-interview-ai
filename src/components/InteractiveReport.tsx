'use client';

import { useState, useEffect } from 'react';
import type { ReportData } from '@/lib/report';

type Lang = 'en' | 'es' | 'it' | 'pt';

const VALID_LANGS: Lang[] = ['en', 'es', 'it', 'pt'];

const SECTION_LABELS: Record<string, Record<Lang, string>> = {
  executiveSummary: {
    en: 'Executive Summary', es: 'Resumen ejecutivo',
    it: 'Sommario esecutivo', pt: 'Sumário executivo',
  },
  coreExperience: {
    en: 'Core Experience', es: 'Experiencia clave',
    it: 'Esperienza chiave', pt: 'Experiência principal',
  },
  conversationInsights: {
    en: 'Conversation Insights', es: 'Insights de la conversación',
    it: 'Insights della conversazione', pt: 'Insights da conversa',
  },
  recruiterTakeaways: {
    en: 'Recruiter Takeaways', es: 'Puntos clave',
    it: 'Punti chiave', pt: 'Pontos-chave',
  },
  transcript: {
    en: 'Conversation Transcript', es: 'Transcripción de la conversación',
    it: 'Trascrizione della conversazione', pt: 'Transcrição da conversa',
  },
};

const ACTION_LABELS: Record<string, Record<Lang, string>> = {
  bookCall:   { en: 'Book a call',              es: 'Agenda una llamada',      it: 'Prenota una chiamata',      pt: 'Agendar uma chamada' },
  downloadCv: { en: 'Download CV',               es: 'Descargar CV',            it: 'Scarica CV',                pt: 'Descarregar CV' },
  linkedin:   { en: 'View LinkedIn',             es: 'Ver LinkedIn',            it: 'Vedi LinkedIn',             pt: 'Ver LinkedIn' },
  referPablo: { en: 'Refer Pablo to someone',    es: 'Recomendar a Pablo',      it: 'Consiglia Pablo',           pt: 'Recomendar Pablo' },
};

const REPORT_BADGE: Record<Lang, string> = {
  en: 'Insights Report', es: 'Informe de insights',
  it: 'Report insights', pt: 'Relatório de insights',
};

const BASE_URL = 'https://interviewmind.one';

interface Props {
  report: ReportData;
  recruiterName: string | null;
  company: string | null;
  messages?: Array<{ role: string; content: string }>;
}

// ── Icons (currentColor so callers can tint them) ─────────────────────────────

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
      <rect x="2" y="9" width="4" height="12" rx="0.5" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function ReferIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round"
      style={{
        flexShrink: 0,
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 220ms ease',
      }}
    >
      <path d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// Section accent colours (index-matched)
const SECTION_ACCENTS = [
  'var(--accent-primary)',
  'rgba(96,48,180,0.9)',
  'rgba(64,120,220,0.85)',
  'rgba(130,70,200,0.85)',
  'rgba(80,100,160,0.8)',
];

// ── Main component ────────────────────────────────────────────────────────────

export default function InteractiveReport({ report, recruiterName, messages = [] }: Props) {
  const lang: Lang = VALID_LANGS.includes(report.language as Lang)
    ? (report.language as Lang)
    : 'en';

  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['executiveSummary'])
  );
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const stagger = (i: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(28px)',
    transition: [
      `opacity 620ms cubic-bezier(0.16,1,0.3,1) ${i * 75}ms`,
      `transform 620ms cubic-bezier(0.16,1,0.3,1) ${i * 75}ms`,
    ].join(', '),
  });

  const toggle = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const getReferHref = () => {
    const url = typeof window !== 'undefined' ? window.location.href : BASE_URL;
    const subjects: Record<Lang, string> = {
      en: 'Meet Pablo Agis Burgos — Hospitality Tech & SaaS Professional',
      es: 'Te presento a Pablo Agis Burgos — Hospitality Tech & SaaS',
      it: 'Ti presento Pablo Agis Burgos — Hospitality Tech & SaaS',
      pt: 'Apresento-te Pablo Agis Burgos — Hospitality Tech & SaaS',
    };
    const bodies: Record<Lang, string> = {
      en: `Hi,\n\nI wanted to introduce you to Pablo Agis Burgos — a hospitality technology professional I'd genuinely recommend.\n\nPablo brings 6+ years of hotel operations (Soho House London, Accor) combined with SaaS implementation experience at HubOS. He's strong on Opera, Salesforce, and channel management ecosystems, and he approaches every problem with real operational depth.\n\nHe's currently open to roles in SaaS implementation, customer success, or hospitality tech.\n\nYou can talk to him directly via his AI interview simulator:\nhttps://interviewmind.one\n\nOr read the insights from my own conversation:\n${url}\n\nLinkedIn: linkedin.com/in/pablo-agis-burgos\nEmail: pabloagisburgos@gmail.com`,
      es: `Hola,\n\nQuería presentarte a Pablo Agis Burgos — un profesional de hospitality tech que te recomiendo con total confianza.\n\nPablo combina más de 6 años de operaciones hoteleras (Soho House Londres, Accor) con experiencia en implementación SaaS en HubOS. Domina Opera, Salesforce y ecosistemas de channel management, y aporta una visión operacional real a cada proyecto.\n\nEstá buscando oportunidades en implementación SaaS, customer success o tecnología hotelera.\n\nPuedes hablar con él directamente a través de su simulador de entrevista con IA:\nhttps://interviewmind.one\n\nO ver los insights de mi propia conversación:\n${url}\n\nLinkedIn: linkedin.com/in/pablo-agis-burgos\nEmail: pabloagisburgos@gmail.com`,
      it: `Ciao,\n\nVolevo presentarti Pablo Agis Burgos — un professionista dell'hospitality tech che ti consiglio con entusiasmo.\n\nPablo unisce 6+ anni di operazioni alberghiere (Soho House Londra, Accor) a esperienza nell'implementazione SaaS presso HubOS. Conosce Opera, Salesforce e gli ecosistemi di channel management, e affronta ogni sfida con una prospettiva operativa concreta.\n\nSta cercando opportunità nel SaaS implementation, customer success o hospitality tech.\n\nPuoi parlare direttamente con lui tramite il suo simulatore di colloquio AI:\nhttps://interviewmind.one\n\nOppure leggi gli insights della mia conversazione:\n${url}\n\nLinkedIn: linkedin.com/in/pablo-agis-burgos\nEmail: pabloagisburgos@gmail.com`,
      pt: `Olá,\n\nQueria apresentar-te o Pablo Agis Burgos — um profissional de hospitality tech que recomendo com toda a confiança.\n\nO Pablo combina 6+ anos de operações hoteleiras (Soho House Londres, Accor) com experiência em implementação SaaS na HubOS. Domina Opera, Salesforce e ecossistemas de channel management, e aborda cada desafio com uma perspetiva operacional sólida.\n\nEstá à procura de oportunidades em SaaS implementation, customer success ou hospitality tech.\n\nPodes falar com ele diretamente através do seu simulador de entrevista com IA:\nhttps://interviewmind.one\n\nOu ver os insights da minha conversa:\n${url}\n\nLinkedIn: linkedin.com/in/pablo-agis-burgos\nEmail: pabloagisburgos@gmail.com`,
    };
    return `mailto:?subject=${encodeURIComponent(subjects[lang])}&body=${encodeURIComponent(bodies[lang])}`;
  };

  const sections = [
    'executiveSummary',
    'coreExperience',
    'conversationInsights',
    'recruiterTakeaways',
    'transcript',
  ] as const;

  const renderSectionContent = (key: typeof sections[number]) => {
    switch (key) {
      case 'executiveSummary': {
        const { headline, chips, points } = report.executiveSummary;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.6 }}>
              {headline}
            </p>
            {chips?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {chips.map((chip, i) => (
                  <span key={i} style={{
                    padding: '3px 11px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                    background: 'rgba(58,85,192,0.08)',
                    border: '0.5px solid rgba(58,85,192,0.22)',
                    color: 'var(--accent-primary)',
                  }}>{chip}</span>
                ))}
              </div>
            )}
            {points?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {points.map((pt, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 1 }}>·</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{pt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      case 'coreExperience': {
        const { items } = report.coreExperience;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {items.map(({ label, detail }, i) => (
              <div key={i}>
                {i > 0 && <div style={{ height: '0.5px', background: 'var(--glass-border)', margin: '12px 0' }} />}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                    textTransform: 'uppercase', color: 'var(--accent-primary)',
                  }}>{label}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{detail}</span>
                </div>
              </div>
            ))}
          </div>
        );
      }
      case 'conversationInsights': {
        const { items } = report.conversationInsights;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(({ title, body }, i) => (
              <div key={i} style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--glass-1)',
                border: '0.5px solid var(--glass-border)',
                borderLeft: '2.5px solid var(--accent-primary)',
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                  textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 4,
                }}>{title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{body}</div>
              </div>
            ))}
          </div>
        );
      }
      case 'recruiterTakeaways': {
        const { items } = report.recruiterTakeaways;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{
                  color: 'var(--accent-primary)', fontWeight: 700, fontSize: 12,
                  flexShrink: 0, marginTop: 2,
                }}>→</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{item}</span>
              </div>
            ))}
          </div>
        );
      }
      case 'transcript': {
        const speakerLabel = recruiterName || 'Recruiter';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {messages.map((msg, i) => {
              const isPablo = msg.role === 'assistant';
              return (
                <div key={i}>
                  {i > 0 && <div style={{ height: '0.5px', background: 'var(--glass-border)', margin: '12px 0' }} />}
                  <div>
                    <span style={{
                      display: 'inline-block',
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase', marginBottom: 5,
                      color: isPablo ? 'var(--accent-primary)' : 'var(--text-muted)',
                    }}>
                      {isPablo ? 'Pablo' : speakerLabel}
                    </span>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      {msg.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
    }
  };

  return (
    <>
      <style>{`
        @keyframes irGlow { 0%,100%{opacity:0.4} 50%{opacity:0.75} }
      `}</style>

      <div style={{ maxWidth: 660, margin: '0 auto', padding: '24px 16px 52px' }}>

        {/* ── Report header card ─────────────────────────────────────────────── */}
        <div
          style={{
            ...stagger(0),
            padding: '28px 24px 22px',
            marginBottom: 12,
            background: 'var(--bg-elevated)',
            border: '0.5px solid var(--glass-border-hi)',
            borderRadius: 20,
            position: 'relative',
            overflow: 'hidden',
            textAlign: 'center',
          }}
        >
          {/* Ambient glow */}
          <div style={{
            position: 'absolute', top: -50, left: '50%',
            transform: 'translateX(-50%)',
            width: 300, height: 200,
            background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
            pointerEvents: 'none',
            animation: 'irGlow 3s ease-in-out infinite',
          }} />

          <div style={{ position: 'relative' }}>
            {/* Report badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 14px', borderRadius: 999,
              background: 'rgba(58,85,192,0.10)',
              border: '0.5px solid rgba(58,85,192,0.28)',
              fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--accent-primary)',
              marginBottom: 18,
            }}>
              <svg width="7" height="7" viewBox="0 0 8 8" fill="var(--accent-primary)">
                <path d="M4 0l.97 2.93H8L5.52 4.74l.97 2.93L4 5.96l-2.49 1.71.97-2.93L0 2.93h3.03z"/>
              </svg>
              {REPORT_BADGE[lang]}
            </div>

            {/* Avatar with ring */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <div style={{ position: 'relative', width: 96, height: 96 }}>
                <div className="absolute inset-0 rounded-full" style={{
                  background: 'conic-gradient(from 0deg, rgba(60,90,200,0.7), rgba(100,60,180,0.5), rgba(40,130,160,0.55), rgba(60,90,200,0.7))',
                  animation: 'ring-spin 3.5s linear infinite',
                  padding: 2,
                }}>
                  <div className="w-full h-full rounded-full" style={{ background: 'var(--bg-elevated)' }} />
                </div>
                <div className="absolute rounded-full overflow-hidden" style={{ inset: 3 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/pablo-avatar.jpg"
                    alt="Pablo Agis Burgos"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            </div>

            {/* Name + subtitle */}
            <h2 className="gradient-text" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
              Pablo Agis Burgos
            </h2>
            <div style={{ fontSize: 12, color: 'var(--splash-status)', letterSpacing: '0.04em', marginBottom: 20 }}>
              SaaS · Hospitality Tech · 5 idiomas
            </div>

            {/* Divider */}
            <div style={{ height: '0.5px', background: 'var(--glass-border)', marginBottom: 18 }} />

            {/* Intro quote */}
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.75, textAlign: 'left' }}>
              {report.intro}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', textAlign: 'left', marginTop: 10 }}>
              — Pablo
            </p>
          </div>
        </div>

        {/* ── Action cards — uniform 2×2 grid ───────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          {([
            { key: 'bookCall',   href: 'https://calendly.com/pabloagisburgos', target: '_blank', Icon: CalendarIcon,  i: 1 },
            { key: 'downloadCv', href: `${BASE_URL}/assets/Pablo_Agis_Burgos_CV.pdf`, download: true, Icon: DownloadIcon,  i: 2 },
            { key: 'linkedin',   href: 'https://www.linkedin.com/in/pablo-agis-burgos', target: '_blank', Icon: LinkedInIcon,  i: 3 },
            { key: 'referPablo', href: getReferHref(), Icon: ReferIcon, i: 4 },
          ] as Array<{ key: string; href: string; target?: string; download?: boolean; Icon: () => React.JSX.Element; i: number }>).map(({ key, href, target, download, Icon, i }) => (
            <a
              key={key}
              href={href}
              target={target}
              rel={target ? 'noopener noreferrer' : undefined}
              download={download}
              style={{
                ...stagger(i),
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: '16px 12px', borderRadius: 14, textDecoration: 'none',
                background: 'var(--glass-1)', border: '0.5px solid var(--glass-border)',
                color: 'var(--accent-primary)',
              }}
            >
              <Icon />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center' }}>
                {ACTION_LABELS[key][lang]}
              </span>
            </a>
          ))}
        </div>

        {/* ── Collapsible report sections ────────────────────────────────────── */}
        {sections.map((key, i) => {
          const isOpen = openSections.has(key);
          const accent = SECTION_ACCENTS[i];
          return (
            <div
              key={key}
              style={{
                ...stagger(i + 5),
                marginBottom: 8,
                borderRadius: 14,
                overflow: 'hidden',
                background: 'var(--glass-1)',
                border: `0.5px solid ${isOpen ? 'var(--glass-border-hi)' : 'var(--glass-border)'}`,
                transition: 'border-color 200ms ease',
              }}
            >
              <button
                onClick={() => toggle(key)}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 18px',
                  background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isOpen ? accent : 'var(--glass-border)',
                  transition: 'background 220ms ease',
                }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: isOpen ? '#ffffff' : 'var(--text-muted)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                <span style={{
                  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: isOpen ? 'var(--text-primary)' : 'var(--text-muted)',
                  flex: 1,
                  transition: 'color 200ms ease',
                }}>
                  {SECTION_LABELS[key]?.[lang] ?? key}
                </span>

                <div style={{ color: isOpen ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                  <ChevronIcon open={isOpen} />
                </div>
              </button>

              <div style={{
                maxHeight: isOpen ? 1400 : 0,
                overflow: 'hidden',
                opacity: isOpen ? 1 : 0,
                transition: 'max-height 380ms cubic-bezier(0.16,1,0.3,1), opacity 220ms ease',
              }}>
                <div style={{ height: '0.5px', background: 'var(--glass-border)', margin: '0 18px' }} />
                <div style={{ padding: '16px 18px 20px' }}>
                  {renderSectionContent(key)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </>
  );
}
