// ─────────────────────────────────────────────────────────────────────────────
// Retire evidence the candidate has confirmed is out of date.
//
// This is the ONLY path that retires a fact, and it runs only after an explicit
// confirmation in the trainer chat. /api/trainer/extract proposes; this applies.
// Nothing is deleted and no content is rewritten — a retired row keeps its text and
// points at the row that replaced it, so the profile's history stays reconstructible.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { computeAndPersistCoverage } from '@/lib/coverage-service';
import { COVERAGE_NODES, type CoverageNodeKey, type NodeState } from '@/lib/coverage-nodes';

export const dynamic = 'force-dynamic';

interface RequestBody {
  supersedingId: string;   // the new fact
  supersededIds: string[]; // the facts it replaces
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseAuthClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supersedingId = body.supersedingId?.trim();
  // A row can never retire itself — that would strand the profile with no live version.
  const supersededIds = [...new Set(body.supersededIds ?? [])]
    .filter(id => typeof id === 'string' && id.trim() && id !== supersedingId);

  if (!supersedingId || supersededIds.length === 0) {
    return NextResponse.json(
      { error: 'supersedingId and a non-empty supersededIds are required' },
      { status: 400 }
    );
  }

  const dataClient = createServerSupabaseClient();

  // The superseding row must exist, belong to THIS candidate, and still be live.
  // Service role bypasses RLS, so ownership is enforced here or nowhere.
  const { data: superseding, error: readErr } = await dataClient
    .from('evidence_items')
    .select('id')
    .eq('id', supersedingId)
    .eq('candidate_id', user.id)
    .is('superseded_at', null)
    .maybeSingle();

  if (readErr) {
    console.error('[trainer/supersede] read failed:', readErr.message);
    return NextResponse.json(
      { error: 'Could not verify the replacing item. Run the supersession migration if this persists.' },
      { status: 500 }
    );
  }
  if (!superseding) {
    return NextResponse.json({ error: 'Replacing item not found' }, { status: 404 });
  }

  // candidate_id in the filter is what stops one candidate retiring another's facts.
  const { data: updated, error: updateErr } = await dataClient
    .from('evidence_items')
    .update({
      superseded_at: new Date().toISOString(),
      superseded_by: supersedingId,
    })
    .in('id', supersededIds)
    .eq('candidate_id', user.id)
    .is('superseded_at', null)
    .select('id');

  if (updateErr) {
    console.error('[trainer/supersede] update failed:', updateErr.message);
    return NextResponse.json({ error: 'Could not retire those items' }, { status: 500 });
  }

  // Retiring evidence can take a node back DOWN — that is the point. Recompute from
  // the live set so the ring never shows coverage the agent no longer has.
  let coverage: {
    nodeStates: Record<CoverageNodeKey, NodeState>;
    readiness: number;
    publishLevel: string;
  } | null = null;
  try {
    const result = await computeAndPersistCoverage(user.id, dataClient);
    coverage = {
      nodeStates: Object.fromEntries(
        COVERAGE_NODES.map(n => [n.key, result.nodes[n.key].state])
      ) as Record<CoverageNodeKey, NodeState>,
      readiness:    result.readiness,
      publishLevel: result.publishLevel,
    };
  } catch (err) {
    console.error('[trainer/supersede] coverage recompute failed (non-fatal):', err);
  }

  return NextResponse.json({ retired: updated?.length ?? 0, coverage });
}
