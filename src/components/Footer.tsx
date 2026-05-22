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

  const links = (
    <div className="flex items-center justify-center gap-4 text-[12px] font-medium text-blue-500">
      <button
        onClick={() => setPrivacyOpen(true)}
        className="hover:text-blue-700 transition-colors"
      >
        {t.footerPrivacy}
      </button>
      <span className="text-gray-300">·</span>
      <a
        href="https://www.linkedin.com/in/pablo-agis-burgos"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-blue-700 transition-colors"
      >
        LinkedIn
      </a>
      <span className="text-gray-300">·</span>
      <a
        href="mailto:pabloagisburgos@gmail.com"
        className="hover:text-blue-700 transition-colors"
      >
        {t.footerContact}
      </a>
    </div>
  );

  if (variant === 'compact') {
    return (
      <>
        <div className="shrink-0 border-t border-gray-100 py-2.5 px-4 text-center">
          <div className="flex items-center justify-center gap-3 text-[10px] text-gray-300">
            <span className="font-medium text-gray-400">InterviewMind</span>
            <span className="text-gray-200">·</span>
            <button onClick={() => setPrivacyOpen(true)} className="hover:text-gray-500 transition-colors">{t.footerPrivacy}</button>
            <span className="text-gray-200">·</span>
            <a href="https://www.linkedin.com/in/pablo-agis-burgos" target="_blank" rel="noopener noreferrer" className="hover:text-gray-500 transition-colors">LinkedIn</a>
            <span className="text-gray-200">·</span>
            <a href="mailto:pabloagisburgos@gmail.com" className="hover:text-gray-500 transition-colors">{t.footerContact}</a>
          </div>
        </div>
        {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <footer className="w-full max-w-[440px] sm:max-w-[640px] lg:max-w-[760px] mx-auto text-center px-4 pt-8 pb-10">
        {/* Top rule */}
        <div className="w-8 h-px bg-gray-200 mx-auto mb-5" />

        {/* Brand */}
        <p className="text-[13px] font-semibold text-gray-500 tracking-tight mb-px">
          InterviewMind
        </p>
        <p className="text-[11.5px] text-gray-400 mb-px">
          Built and owned by Pablo Agis Burgos
        </p>
        <p className="text-[11.5px] text-gray-400 mb-1.5">
          Barcelona, Spain
        </p>
        <p className="text-[11px] text-gray-500 mb-3">
          {t.footerPrivateNote}
        </p>

        {/* Links */}
        {links}
      </footer>
      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
    </>
  );
}
