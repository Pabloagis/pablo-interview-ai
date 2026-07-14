// Candidate publish endpoint.
// POST: verifies readiness >= 30 server-side, sets published_at on profiles.
// GET:  returns current {publishedAt, publishLevel} for the authenticated candidate.

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { createServerSupabaseClient } from '@/lib/supabase';
import {
  COVERAGE_NODES,
  computeReadiness,
  derivePublishLevel,
  stateToScore,
  PUBLISH_THRESHOLDS,
  type CoverageNodeKey,
  type NodeState,
} from '@/lib/coverage-nodes';

export const dynamic = 'force-dynamic';

// Recompute readiness from the coverage_nodes table (server-side, not from client).
async function getReadinessFromDB(candidateId: string): Promise<{
  readiness: number;
  states: Record<CoverageNodeKey, NodeState>;
}> {
  const supabase = createServerSupabaseClient();
  const { data: rows } = await supabase
    .from('coverage_nodes')
    .select('node_key, state')
    .eq('candidate_id', candidateId);

  const states: Record<CoverageNodeKey, NodeState> = Object.fromEntries(
    COVERAGE_NODES.map(n => [n.key, 'dark' as NodeState])
  ) as Record<CoverageNodeKey, NodeState>;

  for (const row of rows ?? []) {
    const key = row.node_key as CoverageNodeKey;
    if (key in states) states[key] = row.state as NodeState;
  }

  return { readiness: computeReadiness(states), states };
}

// ── GET — return current publish state ───────────────────────────────────────

export async function GET() {
  const supabase = await createServerSupabaseAuthClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, published_at')
    .eq('id', user.id)
    .single();

  if (error || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  if (profile.role !== 'candidate') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { readiness } = await getReadinessFromDB(user.id);
  const publishLevel  = derivePublishLevel(readiness);

  return NextResponse.json({
    publishedAt:   profile.published_at ?? null,
    publishLevel,
    readiness,
    isPublishable: readiness >= PUBLISH_THRESHOLDS.basic,
  });
}

// ── POST — publish (or re-publish) the agent ─────────────────────────────────

export async function POST(_request: NextRequest) {
  const supabase = await createServerSupabaseAuthClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'candidate') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Server-side readiness check — client cannot fake this
  const { readiness, states } = await getReadinessFromDB(user.id);

  if (readiness < PUBLISH_THRESHOLDS.basic) {
    return NextResponse.json(
      {
        error: `Readiness ${readiness}/100 is below the Basic threshold of ${PUBLISH_THRESHOLDS.basic}.`,
        readiness,
        required: PUBLISH_THRESHOLDS.basic,
      },
      { status: 422 }
    );
  }

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ published_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateErr) {
    console.error('[candidate/publish] update error:', updateErr);
    return NextResponse.json({ error: 'Failed to publish' }, { status: 500 });
  }

  const publishLevel = derivePublishLevel(readiness);
  const darkNodeKeys = COVERAGE_NODES
    .filter(n => states[n.key] === 'dark')
    .map(n => n.key);

  return NextResponse.json({
    publishedAt:  new Date().toISOString(),
    publishLevel,
    readiness,
    darkNodeKeys, // returned so the UI can show the refusal list immediately
  });
}
