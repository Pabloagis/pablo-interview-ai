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
          style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', background: 'rgba(13,15,20,0.5)' }}
        >
          <div className="flex items-center justify-center gap-3" style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)' }}>
            <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.35)' }}>InterviewMind</span>
            <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
            <button
              onClick={() => setPrivacyOpen(true)}
              className="transition-colors hover:text-white"
            >
              {t.footerPrivacy}
            </button>
            <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
            <a
              href="https://www.linkedin.com/in/pablo-agis-burgos"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              LinkedIn
            </a>
            <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
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
        <div className="w-8 h-px mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.10)' }} />

        <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.38)', letterSpacing: '-0.01em', marginBottom: 2 }}>
          InterviewMind
        </p>
        <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.22)', marginBottom: 2 }}>
          Built and owned by Pablo Agis Burgos
        </p>
        <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.22)', marginBottom: 6 }}>
          Barcelona, Spain
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginBottom: 12 }}>
          {t.footerPrivateNote}
        </p>

        <div className="flex items-center justify-center gap-4" style={{ fontSize: 12, fontWeight: 500, color: 'rgba(100,130,220,0.8)' }}>
          <button onClick={() => setPrivacyOpen(true)} className="transition-colors hover:text-white">
            {t.footerPrivacy}
          </button>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
          <a
            href="https://www.linkedin.com/in/pablo-agis-burgos"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white"
          >
            LinkedIn
          </a>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
          <a href="mailto:pabloagisburgos@gmail.com" className="transition-colors hover:text-white">
            {t.footerContact}
          </a>
        </div>
      </footer>
      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
    </>
  );
}
