import { redirect } from 'next/navigation';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import TrainerClient from './TrainerClient';
import {
  COVERAGE_NODES,
  computeReadiness,
  derivePublishLevel,
  type CoverageNodeKey,
  type NodeState,
} from '@/lib/coverage-nodes';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Trainer — InterviewMind',
};

export default async function TrainerPage() {
  const supabase = await createServerSupabaseAuthClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, published_at')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'recruiter') redirect('/dashboard/recruiter');

  const name        = profile?.full_name ?? 'Candidate';
  const publishedAt = (profile?.published_at as string | null | undefined) ?? null;

  // Load pre-computed coverage nodes — fall back to all-dark if table is empty
  const { data: coverageRows } = await supabase
    .from('coverage_nodes')
    .select('node_key, state')
    .eq('candidate_id', user.id);

  const allDark = Object.fromEntries(
    COVERAGE_NODES.map(n => [n.key, 'dark' as NodeState])
  ) as Record<CoverageNodeKey, NodeState>;

  const initialNodeStates: Record<CoverageNodeKey, NodeState> = { ...allDark };
  for (const row of coverageRows ?? []) {
    const key = row.node_key as CoverageNodeKey;
    if (key in initialNodeStates) {
      initialNodeStates[key] = row.state as NodeState;
    }
  }

  const initialReadiness    = computeReadiness(initialNodeStates);
  const initialPublishLevel = derivePublishLevel(initialReadiness);

  return (
    <TrainerClient
      candidateName={name}
      initialNodeStates={initialNodeStates}
      initialReadiness={initialReadiness}
      initialPublishLevel={initialPublishLevel}
      initialPublishedAt={publishedAt}
    />
  );
}
