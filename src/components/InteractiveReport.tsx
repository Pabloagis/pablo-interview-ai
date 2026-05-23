'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ReportData } from '@/lib/report';
import Toast from './Toast';
import type { ToastMessage } from '@/lib/types';

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
};

const ACTION_LABELS: Record<string, Record<Lang, string>> = {
  bookCall:   { en: 'Book a call',      es: 'Agenda una llamada',    it: 'Prenota una chiamata',  pt: 'Agendar uma chamada' },
  downloadCv: { en: 'Download CV',       es: 'Descargar CV',          it: 'Scarica CV',            pt: 'Descarregar CV' },
  linkedin:   { en: 'View LinkedIn',     es: 'Ver LinkedIn',          it: 'Vedi LinkedIn',         pt: 'Ver LinkedIn' },
  referPablo: { en: 'Share report',      es: 'Compartir informe',     it: 'Condividi report',      pt: 'Partilhar relatório' },
};

const BASE_URL = 'https://interviewmind.one';

interface Props {
  report: ReportData;
  recruiterName: string | null;
  company: string | null;
}

// ── Icons ────────────────────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--accent-primary)">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
      <rect x="2" y="9" width="4" height="12" rx="0.5" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function ReferIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="23" y1="11" x2="17" y2="11" />
      <line x1="20" y1="8" x2="20" y2="14" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round"
      style={{
        color: 'var(--text-muted)',
        flexShrink: 0,
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 200ms ease',
      }}
    >
      <path d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function InteractiveReport({ report }: Props) {
  const lang: Lang = VALID_LANGS.includes(report.language as Lang)
    ? (report.language as Lang)
    : 'en';

  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['executiveSummary'])
  );
  const [visible, setVisible] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const stagger = (i: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(32px)',
    filter: visible ? 'blur(0px)' : 'blur(6px)',
    transition: [
      `opacity 700ms cubic-bezier(0.16,1,0.3,1) ${i * 80}ms`,
      `transform 700ms cubic-bezier(0.16,1,0.3,1) ${i * 80}ms`,
      `filter 700ms cubic-bezier(0.16,1,0.3,1) ${i * 80}ms`,
    ].join(', '),
  });

  // Stagger with persistent card rotation — combines translateY entrance + tilt
  const actionStagger = (i: number, cardIndex: number): React.CSSProperties => {
    const tilt = cardIndex % 2 === 0 ? 'rotate(-0.25deg)' : 'rotate(0.25deg)';
    return {
      opacity: visible ? 1 : 0,
      transform: visible ? tilt : `translateY(32px) ${tilt}`,
      filter: visible ? 'blur(0px)' : 'blur(6px)',
      transition: [
        `opacity 700ms cubic-bezier(0.16,1,0.3,1) ${i * 80}ms`,
        `transform 700ms cubic-bezier(0.16,1,0.3,1) ${i * 80}ms`,
        `filter 700ms cubic-bezier(0.16,1,0.3,1) ${i * 80}ms`,
      ].join(', '),
    };
  };

  const toggle = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleShareReport = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      addToast(lang === 'es' ? 'Enlace copiado' : lang === 'it' ? 'Link copiato' : lang === 'pt' ? 'Link copiado' : 'Link copied!', 'success');
    } catch {
      addToast('Could not copy link', 'error');
    }
  };

  const actionCards: Array<{
    key: string;
    Icon: () => React.JSX.Element;
    href?: string;
    download?: boolean;
    onClick?: () => void;
  }> = [
    {
      key: 'bookCall',
      Icon: CalendarIcon,
      href: 'https://calendly.com/pabloagisburgos',
    },
    {
      key: 'downloadCv',
      Icon: DownloadIcon,
      href: `${BASE_URL}/assets/Pablo_Agis_Burgos_CV.pdf`,
      download: true,
    },
    {
      key: 'linkedin',
      Icon: LinkedInIcon,
      href: 'https://www.linkedin.com/in/pablo-agis-burgos',
    },
    {
      key: 'referPablo',
      Icon: ReferIcon,
      onClick: handleShareReport,
    },
  ];

  const sections = [
    { key: 'executiveSummary',     content: report.executiveSummary },
    { key: 'coreExperience',       content: report.coreExperience },
    { key: 'conversationInsights', content: report.conversationInsights },
    { key: 'recruiterTakeaways',   content: report.recruiterTakeaways },
  ];

  return (
    <>
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px 48px' }}>

      {/* ── Intro card ──────────────────────────────────────────────────────── */}
      <div
        className="glass"
        style={{
          ...stagger(0),
          padding: '20px 24px',
          marginBottom: 16,
          borderLeft: '2px solid var(--accent-primary)',
        }}
      >
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 8 }}>
          {report.intro}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
          — Pablo
        </p>
      </div>

      {/* ── Action cards — 2-col bento grid ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {actionCards.map(({ key, Icon, href, download, onClick }, i) => {
          const sharedStyle: React.CSSProperties = {
            ...actionStagger(i + 1, i),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 12px',
            minHeight: 90,
          };
          const label = (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginTop: 8, textAlign: 'center' }}>
              {ACTION_LABELS[key][lang]}
            </span>
          );
          if (onClick) {
            return (
              <button key={key} onClick={onClick} className="glass" style={{ ...sharedStyle, border: 'none', cursor: 'pointer', width: '100%' }}>
                <Icon />
                {label}
              </button>
            );
          }
          return (
            <a
              key={key}
              href={href}
              target={download ? undefined : '_blank'}
              rel="noopener noreferrer"
              download={download ? true : undefined}
              className="glass"
              style={{ ...sharedStyle, textDecoration: 'none' }}
            >
              <Icon />
              {label}
            </a>
          );
        })}
      </div>

      {/* ── Collapsible sections ─────────────────────────────────────────────── */}
      {sections.map(({ key, content }, i) => {
        const isOpen = openSections.has(key);
        return (
          <div
            key={key}
            className="glass"
            style={{ ...stagger(i + 5), marginBottom: 8, overflow: 'hidden' }}
          >
            <button
              onClick={() => toggle(key)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}>
                {SECTION_LABELS[key]?.[lang] ?? key}
              </span>
              <ChevronIcon open={isOpen} />
            </button>

            <div style={{
              maxHeight: isOpen ? 1400 : 0,
              overflow: 'hidden',
              opacity: isOpen ? 1 : 0,
              transition: 'max-height 350ms cubic-bezier(0.16,1,0.3,1), opacity 200ms ease',
            }}>
              <div
                style={{
                  padding: '0 18px 18px',
                  fontSize: 13.5,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.75,
                }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        );
      })}
    </div>

    <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
