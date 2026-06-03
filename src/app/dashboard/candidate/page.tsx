import { redirect } from 'next/navigation';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Candidate Dashboard — InterviewMind',
};

export default async function CandidateDashboardPage() {
  const supabase = await createServerSupabaseAuthClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  // Wrong role — send to correct dashboard
  if (profile?.role === 'recruiter') {
    redirect('/dashboard/recruiter');
  }

  const name = profile?.full_name ?? user.email ?? 'there';

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0d0f14] px-4">
      <div className="w-full max-w-lg">
        <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#4060d0]/20 border border-[#4060d0]/30 mb-5">
            <span className="text-[#6080f0] text-xl">👤</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome, {name}.
          </h1>
          <p className="text-[rgba(255,255,255,0.5)] text-sm">
            Your candidate profile is being set up.
          </p>
        </div>
      </div>
    </main>
  );
}
