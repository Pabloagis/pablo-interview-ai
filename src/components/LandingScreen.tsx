import Link from 'next/link';
import { Button } from '@/components/ui';

// Minimal product landing. Shared by /platform; root redirects to Pablo's agent slug.
export default function LandingScreen() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        {/* Wordmark — tertiary identifier */}
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-secondary)] mb-8">
          InterviewMind
        </p>

        {/* Primary content */}
        <div className="mb-10">
          <p className="text-[var(--text-primary)] text-[16px] leading-relaxed">
            Build an AI agent that answers for you in interviews — trained only on your verified
            experience. Recruiters talk to it at your own link; you get a report on every conversation.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 items-center">
          <Link href="/register/candidate" className="w-full flex justify-center">
            <Button variant="primary" className="w-full">
              I&apos;m a candidate
            </Button>
          </Link>
          <Link href="/register/recruiter" className="w-full flex justify-center">
            <Button variant="secondary" className="w-full">
              I&apos;m a recruiter
            </Button>
          </Link>
        </div>

        {/* Sign-in */}
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-disabled)]">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--interactive)] hover:text-[var(--text-primary)] transition-colors duration-[180ms]">
            Sign in
          </Link>
        </p>

      </div>
    </main>
  );
}
