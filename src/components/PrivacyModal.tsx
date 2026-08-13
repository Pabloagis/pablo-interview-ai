'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  onClose: () => void;
}

const SERVICES = [
  'Anthropic (Claude)',
  'OpenAI (Embeddings)',
  'Supabase',
  'Vercel',
  'Google Analytics + GTM',
  'Gmail (SMTP)',
];

export default function PrivacyModal({ onClose }: Props) {
  const { t } = useLanguage();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop — no blur */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.85)' }} />

      {/* Sheet */}
      <div
        className="relative bg-[var(--surface)] border border-[var(--border-visible)] w-full sm:max-w-lg sm:rounded-[var(--radius-lg)] rounded-t-[var(--radius-lg)] max-h-[92vh] flex flex-col animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--border)] shrink-0">
          <div>
            <h2 className="text-[16px] font-medium text-[var(--text-display)]">{t.privacyTitle}</h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-disabled)] mt-0.5">
              {t.privacyLastUpdated}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center border border-[var(--border-visible)] rounded-[var(--radius-sm)] font-mono text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-[180ms]"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-5 space-y-6 text-[14px] text-[var(--text-primary)] leading-relaxed">

          <p className="text-[var(--text-secondary)]">{t.privacyIntro}</p>

          <Section title={t.privacyCollectTitle}>
            <ul className="space-y-1.5 mt-2">
              {t.privacyCollectItems.map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[var(--interactive)] mt-0.5 shrink-0">–</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[var(--text-secondary)] text-[13px]">{t.privacyCollectNote}</p>
          </Section>

          <Section title={t.privacyUsedTitle}>
            <ul className="space-y-1.5 mt-2">
              {t.privacyUsedItems.map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[var(--interactive)] mt-0.5 shrink-0">–</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] text-[var(--text-secondary)]">{t.privacyUsedNote}</p>
          </Section>

          <Section title={t.privacyServicesTitle}>
            <p className="mt-2 mb-3 text-[var(--text-secondary)]">{t.privacyServicesIntro}</p>
            <div className="space-y-0">
              {SERVICES.map((name, i) => (
                <div key={name} className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
                  <span className="font-medium text-[var(--text-primary)] text-[13px]">{name}</span>
                  <span className="text-[var(--text-secondary)] text-[12px]">{t.privacyServiceRoles[i]}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-[var(--text-secondary)]">
              {t.privacyServicesNote}
              <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer"
                className="text-[var(--interactive)] hover:text-[var(--text-primary)] transition-colors duration-[180ms]">
                {t.privacyGaOptout}
              </a>.
            </p>
          </Section>

          <Section title={t.privacyStorageTitle}>
            <p className="mt-2 text-[var(--text-secondary)]">{t.privacyStorageP1}</p>
            <p className="mt-2 text-[var(--text-secondary)]">
              {t.privacyStorageP2Pre}{' '}
              <a href="mailto:pabloagisburgos@gmail.com"
                className="text-[var(--interactive)] hover:text-[var(--text-primary)] transition-colors duration-[180ms]">
                pabloagisburgos@gmail.com
              </a>{' '}
              {t.privacyStorageP2Post}
            </p>
          </Section>

          <Section title={t.privacyRightsTitle}>
            <p className="mt-2 mb-3 text-[var(--text-secondary)]">{t.privacyRightsIntro}</p>
            <p className="mb-3 text-[var(--text-secondary)]">{t.privacyRightsHaveRight}</p>
            <ul className="space-y-1.5">
              {t.privacyRightsItems.map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[var(--interactive)] mt-0.5 shrink-0">–</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12px] text-[var(--text-secondary)]">
              {t.privacyRightsNote}{' '}
              <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer"
                className="text-[var(--interactive)] hover:text-[var(--text-primary)] transition-colors duration-[180ms]">
                AEPD
              </a>.
            </p>
          </Section>

          <Section title={t.privacyContactTitle}>
            <p className="mt-2 text-[var(--text-secondary)]">
              {t.privacyContactP}{' '}
              <a href="mailto:pabloagisburgos@gmail.com"
                className="text-[var(--interactive)] hover:text-[var(--text-primary)] transition-colors duration-[180ms] font-medium">
                pabloagisburgos@gmail.com
              </a>
            </p>
          </Section>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full border border-[var(--border-visible)] font-mono text-[13px] uppercase tracking-[0.06em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors duration-[180ms]"
          >
            {t.privacyClose}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-secondary)] mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}
