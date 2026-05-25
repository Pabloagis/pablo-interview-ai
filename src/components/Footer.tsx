'use client';

import { useState } from 'react';
import PrivacyModal from './PrivacyModal';
import { useLanguage } from '@/context/LanguageContext';

interface FooterProps {
  variant?: 'full' | 'compact';
}

export default function Footer({ variant = 'full' }: FooterProps) {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const { t } = useLanguage();

  if (variant === 'compact') {
    return (
      <>
        <div
          className="shrink-0 py-2 px-4 text-center"
          style={{ borderTop: '0.5px solid var(--footer-compact-border)', background: 'var(--footer-compact-bg)' }}
        >
          <div className="flex items-center justify-center gap-3" style={{ fontSize: 10, color: 'var(--footer-compact-text)' }}>
            <span style={{ fontWeight: 500, color: 'var(--footer-compact-brand)' }}>InterviewMind</span>
            <span style={{ color: 'var(--footer-sep)' }}>·</span>
            <button
              onClick={() => setPrivacyOpen(true)}
              className="transition-colors hover:text-white"
            >
              {t.footerPrivacy}
            </button>
            <span style={{ color: 'var(--footer-sep)' }}>·</span>
            <a
              href="https://www.linkedin.com/in/pablo-agis-burgos"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              LinkedIn
            </a>
            <span style={{ color: 'var(--footer-sep)' }}>·</span>
            <a href="mailto:pabloagisburgos@gmail.com" className="transition-colors hover:text-white">
              {t.footerContact}
            </a>
          </div>
        </div>
        {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <footer className="w-full max-w-[440px] sm:max-w-[640px] lg:max-w-[760px] mx-auto text-center px-4 pt-8 pb-10">
        <div className="w-8 h-px mx-auto mb-5" style={{ background: 'var(--glass-border)' }} />

        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--wordmark-color)', letterSpacing: '-0.01em', marginBottom: 2 }}>
          InterviewMind
        </p>
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 2 }}>
          Built and owned by Pablo Agis Burgos
        </p>
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 6 }}>
          Barcelona, Spain
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
          {t.footerPrivateNote}
        </p>

        <div className="flex items-center justify-center gap-4" style={{ fontSize: 12, fontWeight: 500, color: 'var(--accent-primary)', opacity: 0.8 }}>
          <button onClick={() => setPrivacyOpen(true)} className="transition-colors hover:opacity-100">
            {t.footerPrivacy}
          </button>
          <span style={{ color: 'var(--glass-border)' }}>·</span>
          <a
            href="https://www.linkedin.com/in/pablo-agis-burgos"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:opacity-100"
          >
            LinkedIn
          </a>
          <span style={{ color: 'var(--glass-border)' }}>·</span>
          <a href="mailto:pabloagisburgos@gmail.com" className="transition-colors hover:opacity-100">
            {t.footerContact}
          </a>
        </div>

        <p style={{ fontSize: 13, fontStyle: 'italic', fontWeight: 500, color: 'var(--text-secondary)', marginTop: 20, lineHeight: 1.65 }}>
          {t.visionClosing}
        </p>
      </footer>
      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
    </>
  );
}
