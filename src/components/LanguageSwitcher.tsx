'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage, LANG_FLAGS, LANG_LABELS, LANG_ORDER } from '@/context/LanguageContext';

interface Props {
  /** Show the language name next to the flag on the trigger. Off by default so the
   *  compact chat/trainer headers keep their footprint. */
  showLabel?: boolean;
  /** Which edge the dropdown aligns to. Right by default (the switcher usually sits
   *  in the top-right corner); use 'left' when it sits on the left of its row. */
  align?: 'left' | 'right';
}

// Styling is the platform's dark palette, not the day/night theme variables. Every
// live surface is dark (#0d0f14), and the day-mode `--lang-trigger` colour is near
// black — on those pages it rendered the control invisible for half the day.
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
          'flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-colors',
          open
            ? 'text-white border-white/[0.18] bg-white/[0.08]'
            : 'text-[rgba(255,255,255,0.55)] border-white/[0.10] bg-white/[0.04] hover:text-white hover:border-white/[0.18]',
        ].join(' ')}
      >
        {/* The globe steps aside on phones — the trainer's top bar has no room to spare */}
        <svg className="hidden sm:block w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
        {/* The current language, readable without opening the menu */}
        <span className="text-sm leading-none">{LANG_FLAGS[lang]}</span>
        {showLabel && (
          <span className="hidden sm:inline text-xs font-medium leading-none">{LANG_LABELS[lang]}</span>
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
            'absolute top-full mt-1.5 z-50 min-w-[150px] rounded-xl py-1',
            'border border-white/[0.12] bg-[#1c2135] shadow-[0_8px_32px_rgba(0,0,0,0.48)]',
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
                'flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors',
                lang === l
                  ? 'bg-[rgba(64,96,208,0.22)] text-white'
                  : 'text-[rgba(255,255,255,0.7)] hover:bg-white/[0.07] hover:text-white',
              ].join(' ')}
            >
              <span className="text-base leading-none">{LANG_FLAGS[l]}</span>
              <span className="flex-1 min-w-0 text-[13px] leading-none">{LANG_LABELS[l]}</span>
              {lang === l && (
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
