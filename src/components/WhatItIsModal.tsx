'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  body: string;
  onClose: () => void;
}

export default function WhatItIsModal({ body, onClose }: Props) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const close = useCallback(() => {
    setMounted(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-y-auto"
      style={{
        background: mounted ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0)',
        transition: 'background 300ms var(--ease-out)',
      }}
      onClick={close}
    >
      <div
        className="relative w-full max-w-[360px] my-auto"
        style={{
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          opacity: mounted ? 1 : 0,
          transition: 'transform 300ms var(--ease-out), opacity 250ms var(--ease-out)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 font-mono text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-[180ms] w-7 h-7 flex items-center justify-center border border-[var(--border-visible)] rounded-[var(--radius-sm)]"
        >
          ×
        </button>

        {/* Card */}
        <div className="bg-[var(--surface)] border border-[var(--border-visible)] rounded-[var(--radius-lg)] overflow-hidden p-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="var(--interactive)" strokeWidth={1.8}
              strokeLinecap="round" strokeLinejoin="round"
              className="flex-shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              {t.whatItIsLabel}
            </span>
          </div>

          {/* Body */}
          <p className="font-sans text-[15px] text-[var(--text-primary)] leading-relaxed">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}
