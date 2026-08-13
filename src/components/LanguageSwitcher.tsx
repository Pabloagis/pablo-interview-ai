'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage, Lang, LANG_FLAGS } from '@/context/LanguageContext';

const LANG_ORDER: Lang[] = ['en', 'es', 'it', 'pt'];

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
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
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Select language"
        className={[
          'flex items-center gap-1 px-1 py-1 rounded-[var(--radius-sm)]',
          'transition-colors duration-[180ms]',
          open ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
        ].join(' ')}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
        <svg
          className={`w-2.5 h-2.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 rounded-[var(--radius-sm)] py-1 z-50 min-w-[44px] bg-[var(--surface-raised)] border border-[var(--border-visible)]">
          {LANG_ORDER.map(l => (
            <button
              key={l}
              onClick={() => { setLang(l); setOpen(false); }}
              aria-label={l}
              className={[
                'flex items-center justify-center w-full px-3 py-2 text-base leading-none',
                'transition-colors duration-[180ms]',
                lang === l
                  ? 'bg-[var(--surface)] text-[var(--text-display)]'
                  : 'text-[var(--text-primary)] hover:bg-[var(--surface)]',
              ].join(' ')}
            >
              {LANG_FLAGS[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
