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

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-[16px] font-bold text-gray-900">{t.privacyTitle}</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{t.privacyLastUpdated}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-5 space-y-6 text-[13.5px] text-gray-600 leading-relaxed">

          {/* Intro */}
          <p className="text-gray-500">{t.privacyIntro}</p>

          <Section icon="📋" title={t.privacyCollectTitle}>
            <ul className="space-y-1.5 mt-2">
              {t.privacyCollectItems.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5 shrink-0">–</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-gray-400 text-[12.5px]">{t.privacyCollectNote}</p>
          </Section>

          <Section icon="🎯" title={t.privacyUsedTitle}>
            <ul className="space-y-1.5 mt-2">
              {t.privacyUsedItems.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5 shrink-0">–</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12.5px] font-medium text-gray-500">{t.privacyUsedNote}</p>
          </Section>

          <Section icon="🤖" title={t.privacyServicesTitle}>
            <p className="mt-2 mb-3">{t.privacyServicesIntro}</p>
            <div className="space-y-2">
              {SERVICES.map((name, i) => (
                <div key={name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="font-medium text-gray-700 text-[13px]">{name}</span>
                  <span className="text-gray-400 text-[12px]">{t.privacyServiceRoles[i]}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-gray-400">
              {t.privacyServicesNote}
              <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                {t.privacyGaOptout}
              </a>.
            </p>
          </Section>

          <Section icon="🗄️" title={t.privacyStorageTitle}>
            <p className="mt-2">{t.privacyStorageP1}</p>
            <p className="mt-2">
              {t.privacyStorageP2Pre}{' '}
              <a href="mailto:pabloagisburgos@gmail.com" className="text-blue-500 hover:underline">
                pabloagisburgos@gmail.com
              </a>{' '}
              {t.privacyStorageP2Post}
            </p>
          </Section>

          <Section icon="🇪🇺" title={t.privacyRightsTitle}>
            <p className="mt-2 mb-3">{t.privacyRightsIntro}</p>
            <p className="mb-3">{t.privacyRightsHaveRight}</p>
            <ul className="space-y-1.5">
              {t.privacyRightsItems.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5 shrink-0">–</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12.5px] text-gray-400">
              {t.privacyRightsNote}{' '}
              <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                AEPD
              </a>.
            </p>
          </Section>

          <Section icon="✉️" title={t.privacyContactTitle}>
            <p className="mt-2">
              {t.privacyContactP}{' '}
              <a href="mailto:pabloagisburgos@gmail.com" className="text-blue-500 hover:underline font-medium">
                pabloagisburgos@gmail.com
              </a>
            </p>
          </Section>

        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-[13.5px] font-semibold transition-colors"
          >
            {t.privacyClose}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[15px]">{icon}</span>
        <h3 className="text-[13.5px] font-bold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}
