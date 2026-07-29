import Link from 'next/link';

// Minimal product landing. Shared by /platform now; root will switch to it later as a
// one-line change (root currently redirects to Pablo's agent, per live outreach).
export default function LandingScreen() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0d0f14] px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-3">InterviewMind</h1>
          <p className="text-[rgba(255,255,255,0.6)] text-base leading-relaxed">
            Build an AI agent that answers for you in interviews — trained only on your verified
            experience. Recruiters talk to it at your own link; you get a report on every conversation.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/register/candidate"
            className="w-full py-3 px-6 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] text-white font-medium text-sm transition-colors duration-150"
          >
            I&apos;m a candidate
          </Link>
          <Link
            href="/register/recruiter"
            className="w-full py-3 px-6 rounded-xl bg-[rgba(255,255,255,0.07)] hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.10)] text-white font-medium text-sm transition-colors duration-150"
          >
            I&apos;m a recruiter
          </Link>
        </div>

        <p className="mt-6 text-sm text-[rgba(255,255,255,0.38)]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#4060d0] hover:text-[#6080f0] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
