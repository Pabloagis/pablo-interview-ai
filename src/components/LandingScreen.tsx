'use client';

import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
import { usePlatformT } from '@/context/platform-i18n';

// Minimal product landing. Shared by /platform now; root will switch to it later as a
// one-line change (root currently redirects to Pablo's agent, per live outreach).
export default function LandingScreen() {
  const t = usePlatformT();

  return (
    <main className="min-h-screen flex flex-col bg-[#0d0f14] px-4">
      {/* Top bar — the language dropdown is reachable before signing up, not only after */}
      <div className="w-full max-w-4xl mx-auto pt-5 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.28)] uppercase tracking-widest">
          InterviewMind
        </span>
        <LanguageSwitcher showLabel />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md text-center py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-3">InterviewMind</h1>
            <p className="text-[rgba(255,255,255,0.6)] text-base leading-relaxed">
              {t.land_tagline}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/register/candidate"
              className="w-full py-3 px-6 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] text-white font-medium text-sm transition-colors duration-150"
            >
              <span className="block">{t.land_candidate}</span>
              <span className="block text-[11px] font-normal text-[rgba(255,255,255,0.65)] mt-0.5">
                {t.land_candidate_sub}
              </span>
            </Link>
            <Link
              href="/register/recruiter"
              className="w-full py-3 px-6 rounded-xl bg-[rgba(255,255,255,0.07)] hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.10)] text-white font-medium text-sm transition-colors duration-150"
            >
              <span className="block">{t.land_recruiter}</span>
              <span className="block text-[11px] font-normal text-[rgba(255,255,255,0.5)] mt-0.5">
                {t.land_recruiter_sub}
              </span>
            </Link>
          </div>

          <p className="mt-6 text-sm text-[rgba(255,255,255,0.38)]">
            {t.land_have_account}{' '}
            <Link href="/login" className="text-[#4060d0] hover:text-[#6080f0] transition-colors">
              {t.land_signin}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
