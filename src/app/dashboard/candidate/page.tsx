import { redirect } from 'next/navigation';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';

// The trainer chat is now the single home for building an agent (see the blend
// decision: "chat is home"). This URL used to render the 10-step onboarding wizard;
// it now redirects into the chat, which covers the same coverage nodes conversationally.
// The wizard components under ./journey and ./modules remain in the repo but are no
// longer reachable by candidates.
export default async function CandidateDashboardPage() {
  const supabase = await createServerSupabaseAuthClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'recruiter') redirect('/dashboard/recruiter');

  redirect('/dashboard/candidate/trainer');
}
