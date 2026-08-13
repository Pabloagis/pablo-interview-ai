'use client';

import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
import { usePlatformT } from '@/context/platform-i18n';
import { Button } from '@/components/ui';

export default function LandingScreen() {
  const t = usePlatformT();

  return (
    <main className="min-h-screen flex flex-col bg-[var(--black)] px-4">
      {/* Top bar */}
      <div className="w-full max-w-4xl mx-auto pt-5 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-disabled)]">
          InterviewMind
        </span>
        <LanguageSwitcher showLabel />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md text-center py-10">
          <div className="mb-8">
            <h1 className="font-mono text-[var(--display-md)] uppercase tracking-[0.04em] text-[var(--text-display)] mb-4 leading-none">
              InterviewMind
            </h1>
            <p className="text-[var(--body)] text-[var(--text-primary)] leading-relaxed">
              {t.land_tagline}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/login" className="block">
              <Button variant="primary" className="w-full">
                {t.login_signin}
              </Button>
            </Link>
          </div>

          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-disabled)]">
            {t.login_no_account}{' '}
            <Link href="/register/candidate" className="text-[var(--interactive)] hover:text-[var(--text-primary)] transition-colors duration-[180ms]">
              {t.land_candidate}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
