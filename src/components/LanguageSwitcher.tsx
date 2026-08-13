'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage, LANG_FLAGS, LANG_LABELS, LANG_ORDER } from '@/context/LanguageContext';

interface Props {
  showLabel?: boolean;
  align?: 'left' | 'right';
}

export default function LanguageSwitcher({ showLabel = false, align = 'right' }: Props) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={`${LANG_LABELS[lang]} — select language`}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          'flex items-center gap-1.5 px-2 py-1.5 rounded-[var(--radius-sm)] border transition-colors duration-[180ms]',
          open
            ? 'text-[var(--text-display)] border-[var(--border-visible)] bg-[var(--surface-raised)]'
            : 'text-[var(--text-secondary)] border-[var(--border)] bg-transparent hover:text-[var(--text-primary)] hover:border-[var(--border-visible)]',
        ].join(' ')}
      >
        <svg className="hidden sm:block w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
        <span className="text-sm leading-none">{LANG_FLAGS[lang]}</span>
        {showLabel && (
          <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-[0.06em] leading-none">{LANG_LABELS[lang]}</span>
        )}
        <svg
          className={`w-2.5 h-2.5 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Language"
          className={[
            'absolute top-full mt-1.5 z-50 min-w-[150px] rounded-[var(--radius-md)] py-1',
            'border border-[var(--border-visible)] bg-[var(--surface-raised)]',
            align === 'right' ? 'right-0' : 'left-0',
          ].join(' ')}
        >
          {LANG_ORDER.map(l => (
            <button
              key={l}
              role="option"
              aria-selected={lang === l}
              onClick={() => { setLang(l); setOpen(false); }}
              className={[
                'flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors duration-[180ms]',
                lang === l
                  ? 'bg-[var(--surface)] text-[var(--text-display)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              <span className="text-base leading-none">{LANG_FLAGS[l]}</span>
              <span className="flex-1 min-w-0 font-mono text-[11px] uppercase tracking-[0.06em] leading-none">{LANG_LABELS[l]}</span>
              {lang === l && (
                <svg className="w-3 h-3 shrink-0 text-[var(--interactive)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
