'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage, Lang, LANG_FLAGS } from '@/context/LanguageContext';
import Tooltip from './Tooltip';

const LANG_ORDER: Lang[] = ['en', 'es', 'it', 'pt'];

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <Tooltip text={t.changeLanguage} position="bottom" disabled={open}>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Select language"
          className="flex items-center gap-1 px-1 py-1 rounded-lg transition-colors"
          style={{ color: open ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.38)' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
          <span className="text-sm leading-none">{LANG_FLAGS[lang]}</span>
          <svg
            className={`w-2.5 h-2.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </Tooltip>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 rounded-xl py-1 z-50 min-w-[44px]"
          style={{
            background: '#1c2135',
            border: '0.5px solid rgba(255,255,255,0.12)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.48)',
          }}
        >
          {LANG_ORDER.map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); setOpen(false); }}
              aria-label={l}
              className="flex items-center justify-center w-full px-3 py-2 text-base leading-none transition-colors"
              style={{ background: lang === l ? 'rgba(64,96,208,0.22)' : undefined }}
              onMouseEnter={(e) => { if (lang !== l) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}
              onMouseLeave={(e) => { if (lang !== l) (e.currentTarget as HTMLElement).style.background = ''; }}
            >
              {LANG_FLAGS[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
