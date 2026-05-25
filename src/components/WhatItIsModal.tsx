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
    setTimeout(onClose, 380);
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
        background: mounted ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        transition: 'background 400ms ease',
      }}
      onClick={close}
    >
      <div
        className="relative w-full max-w-[360px] my-auto"
        style={{
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.95)',
          opacity: mounted ? 1 : 0,
          transition: 'transform 430ms cubic-bezier(.25,1,.5,1), opacity 380ms ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={close}
          aria-label="Close"
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 2,
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--modal-close-bg, rgba(0,0,0,0.12))',
            border: 'none', color: 'var(--modal-close-text, rgba(0,0,0,0.5))',
            fontSize: 18, lineHeight: 1,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ×
        </button>

        {/* Card */}
        <div style={{
          background: 'var(--modal-bg)',
          border: '0.5px solid var(--modal-border)',
          borderRadius: 22,
          boxShadow: 'var(--modal-shadow)',
          overflow: 'hidden',
          padding: '28px 24px 24px',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="var(--accent-primary)" strokeWidth={1.8}
              strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0, opacity: 0.8 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--modal-title)', letterSpacing: '0.01em' }}>
              {t.whatItIsLabel}
            </span>
          </div>

          {/* Body */}
          <p style={{
            fontSize: 14,
            color: 'var(--modal-body)',
            lineHeight: 1.7,
            margin: 0,
          }}>
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}
