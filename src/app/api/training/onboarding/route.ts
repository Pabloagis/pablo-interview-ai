// GET /api/training/onboarding
// The single source of truth for "what does this candidate still need?".
//
// The trainer client calls this on mount AND after every inline onboarding write
// (CV upload, career goal). It must NEVER patch its stage optimistically — a write
// and a coverage recompute are separate paths (see the collision note in P15's audit),
// so the client re-reads derived state from here before advancing a stage.
//
// Reuses loadCoverageInput() from the P8 coverage service — no duplicated fetching.

import { NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { loadCoverageInput } from '@/lib/coverage-service';
import {
  COVERAGE_NODES,
  deriveNodeStates,
  deriveOnboardingStage,
  computeReadiness,
  derivePublishLevel,
  type CoverageNodeKey,
  type NodeState,
} from '@/lib/coverage-nodes';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await createServerSupabaseAuthClient();
  const { data: { user }, error: authErr } = await auth.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServerSupabaseClient();
  const input = await loadCoverageInput(user.id, db);

  const stage      = deriveOnboardingStage(input);
  const states     = deriveNodeStates(input);
  const readiness  = computeReadiness(states);

  const nodeStates = Object.fromEntries(
    COVERAGE_NODES.map(n => [n.key, states[n.key]])
  ) as Record<CoverageNodeKey, NodeState>;

  return NextResponse.json({
    stage,
    nodeStates,
    readiness,
    publishLevel: derivePublishLevel(readiness),
    // Surfaced so the UI can label controls accurately without a second round-trip.
    hasCv: !!input.cvData,
    storyCount: input.stories.filter(s => s.situation || s.task || s.action || s.result).length,
  });
}
