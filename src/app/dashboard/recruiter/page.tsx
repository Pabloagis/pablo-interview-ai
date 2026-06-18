import { redirect } from 'next/navigation';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import RecruiterDashboard from './RecruiterDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recruiter Dashboard — InterviewMind',
};

export default async function RecruiterDashboardPage() {
  const supabase = await createServerSupabaseAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'candidate') redirect('/dashboard/candidate');

  const name = profile?.full_name ?? user.email ?? 'there';

  return <RecruiterDashboard recruiterName={name} />;
}
