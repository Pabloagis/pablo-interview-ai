// ─────────────────────────────────────────────────────────────────────────────
// Coverage service — the single server-side path for computing + persisting a
// candidate's coverage from BOTH the legacy journey tables and evidence_items.
//
// Used by:
//   - POST /api/trainer/extract      (recompute after each conversational turn)
//   - POST /api/training/coverage     (manual recompute)
//
// Both callers share this so a manual recompute can never wipe out conversational
// coverage, and the union logic lives in exactly one place.
//
// Takes a SERVICE-ROLE client (bypasses RLS). Callers must do their own auth
// check first and pass the authenticated user's id.
// ─────────────────────────────────────────────────────────────────────────────

import type { createServerSupabaseClient } from './supabase';
import {
  computeCoverage,
  COVERAGE_NODES,
  type CoverageInput,
  type CoverageResult,
  type EvidenceQuality,
} from './coverage-nodes';

type ServiceClient = ReturnType<typeof createServerSupabaseClient>;

// Load everything the coverage derivation needs — legacy journey tables PLUS
// the persisted evidence_items.
export async function loadCoverageInput(
  userId: string,
  supabase: ServiceClient
): Promise<CoverageInput> {
  const [
    profileRes,
    cvRes,
    storiesRes,
    responsesRes,
    contextRes,
    rawDataRes,
    evidenceRes,
  ] = await Promise.all([
    supabase.from('profiles').select('career_goal').eq('id', userId).single(),
    supabase.from('candidate_profiles').select('cv_data').eq('candidate_id', userId).single(),
    supabase.from('candidate_stories').select('id, story_type, situation, task, action, result').eq('candidate_id', userId),
    supabase.from('candidate_responses').select('id, module, question, answer_text, answer_audio_transcript').eq('candidate_id', userId),
    supabase.from('candidate_context').select('context').eq('candidate_id', userId).single(),
    supabase.from('candidate_raw_data').select('source_type').eq('candidate_id', userId),
    // Only LIVE evidence counts toward coverage. A retired fact must be able to
    // take its node back down — otherwise correcting the agent would leave a node
    // lit by something it no longer says.
    supabase
      .from('evidence_items')
      .select('node_key, quality')
      .eq('candidate_id', userId)
      .is('superseded_at', null),
  ]);

  // Graceful degradation: until the supersession migration is run, PostgREST
  // rejects the filter above and the WHOLE select fails — which would silently
  // zero out conversational coverage. Fall back to the pre-migration read.
  const evidenceRows = evidenceRes.error
    ? (await supabase
        .from('evidence_items')
        .select('node_key, quality')
        .eq('candidate_id', userId)).data ?? []
    : evidenceRes.data ?? [];

  if (evidenceRes.error) {
    console.warn(
      '[coverage-service] superseded_at unavailable — run migrations/2026-07-31-evidence-supersession.sql. Retired evidence still counts toward coverage:',
      evidenceRes.error.message
    );
  }

  return {
    profile: { career_goal: profileRes.data?.career_goal ?? null },
    cvData: (cvRes.data?.cv_data ?? null) as CoverageInput['cvData'],
    stories: (storiesRes.data ?? []) as CoverageInput['stories'],
    responses: (responsesRes.data ?? []) as CoverageInput['responses'],
    context: (contextRes.data?.context ?? null) as CoverageInput['context'],
    rawDataSourceTypes: (rawDataRes.data ?? []).map(r => r.source_type as string),
    evidenceItems: evidenceRows as Array<{ node_key: string; quality: EvidenceQuality }>,
  };
}

// Compute coverage from the union of sources and upsert all 12 nodes.
// Upsert failure is non-fatal — the computed result is still returned.
export async function computeAndPersistCoverage(
  userId: string,
  supabase: ServiceClient
): Promise<CoverageResult> {
  const input  = await loadCoverageInput(userId, supabase);
  const result = computeCoverage(input);

  const upsertRows = COVERAGE_NODES.map(node => ({
    candidate_id: userId,
    node_key:     node.key,
    state:        result.nodes[node.key].state,
    score:        result.nodes[node.key].score,
    evidence_ids: result.nodes[node.key].evidenceIds,
    updated_at:   new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('coverage_nodes')
    .upsert(upsertRows, { onConflict: 'candidate_id,node_key' });

  if (error) {
    console.error('[coverage-service] upsert error (non-fatal):', error.message);
  }

  return result;
}
