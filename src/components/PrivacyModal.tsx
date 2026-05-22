'use client';

import { useEffect } from 'react';

interface Props {
  onClose: () => void;
}

export default function PrivacyModal({ onClose }: Props) {
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
            <h2 className="text-[16px] font-bold text-gray-900">Privacy Policy</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Last updated: May 2026</p>
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
          <p className="text-gray-500">
            InterviewMind is an AI-powered professional profile built and operated by{' '}
            <strong className="text-gray-700 font-semibold">Pablo Agis Burgos</strong>, Barcelona, Spain.
            It lets recruiters explore Pablo's background through a live conversation.
            Here's exactly what happens with your data — no legalese.
          </p>

          <Section icon="📋" title="What we collect">
            <ul className="space-y-1.5 mt-2">
              {[
                'Your name, email, company, and role — entered in the intake form',
                'The full transcript of your conversation',
                'Session metadata: timestamps and session ID',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5 shrink-0">–</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-gray-400 text-[12.5px]">
              Company and role are optional. Email is required to start the session.
            </p>
          </Section>

          <Section icon="🎯" title="How it's used">
            <ul className="space-y-1.5 mt-2">
              {[
                'Personalise AI responses in real time based on your context',
                'Send Pablo an automated notification so he knows someone is chatting',
                'Send you a follow-up email with Pablo\'s CV if requested at the end',
                'Help Pablo prepare for live interviews and improve the experience over time',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5 shrink-0">–</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12.5px] font-medium text-gray-500">
              Your data is never sold or shared for commercial purposes.
            </p>
          </Section>

          <Section icon="🤖" title="AI & third-party services">
            <p className="mt-2 mb-3">
              To work, InterviewMind shares conversation data with these trusted providers:
            </p>
            <div className="space-y-2">
              {[
                { name: 'Anthropic (Claude)', role: 'Generates all AI responses' },
                { name: 'OpenAI (Embeddings)', role: 'Powers conversation memory' },
                { name: 'Supabase', role: 'Stores sessions and transcripts' },
                { name: 'Vercel', role: 'Hosts the platform' },
                { name: 'Google Analytics + GTM', role: 'Anonymous usage analytics' },
                { name: 'Gmail (SMTP)', role: 'Sends follow-up emails' },
              ].map(({ name, role }) => (
                <div key={name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="font-medium text-gray-700 text-[13px]">{name}</span>
                  <span className="text-gray-400 text-[12px]">{role}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-gray-400">
              Each service processes only what's needed to operate the platform. You can opt out of
              Google Analytics via the{' '}
              <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                browser add-on
              </a>.
            </p>
          </Section>

          <Section icon="🗄️" title="Data storage & retention">
            <p className="mt-2">
              Conversations are stored securely in Supabase. Data is retained until you request
              deletion — there's no automatic expiry.
            </p>
            <p className="mt-2">
              To delete your session data, email{' '}
              <a href="mailto:pabloagisburgos@gmail.com" className="text-blue-500 hover:underline">
                pabloagisburgos@gmail.com
              </a>{' '}
              with the address you used to start the session.
            </p>
          </Section>

          <Section icon="🇪🇺" title="Your rights (GDPR)">
            <p className="mt-2 mb-3">
              This platform operates from Spain and is subject to GDPR. Processing is based on{' '}
              <strong className="font-semibold text-gray-700">legitimate interest</strong>{' '}
              (Art. 6(1)(f)) — helping Pablo present his professional profile to recruiters.
            </p>
            <p className="mb-3">You have the right to:</p>
            <ul className="space-y-1.5">
              {[
                'Access the data stored from your session',
                'Correct inaccurate information',
                'Delete your conversation data',
                'Object to processing based on legitimate interest',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5 shrink-0">–</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12.5px] text-gray-400">
              You can also lodge a complaint with the Spanish data protection authority:{' '}
              <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                AEPD
              </a>.
            </p>
          </Section>

          <Section icon="✉️" title="Contact">
            <p className="mt-2">
              For any privacy-related questions, reach out directly:{' '}
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
            Got it
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
