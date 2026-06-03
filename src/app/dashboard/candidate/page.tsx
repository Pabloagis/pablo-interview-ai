import { redirect } from 'next/navigation';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import TrainingHub from './TrainingHub';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Training Hub — InterviewMind',
};

export default async function CandidateDashboardPage() {
  const supabase = await createServerSupabaseAuthClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'recruiter') redirect('/dashboard/recruiter');

  const name = profile?.full_name ?? 'there';
  const email = user.email ?? '';

  return <TrainingHub name={name} email={email} />;
}
