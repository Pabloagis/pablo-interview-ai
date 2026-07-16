// Candidate resolver: known candidates have a hand-authored ground-truth file;
// unknown candidates get a generic battery templated from their CV roles.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CandidateGroundTruth } from '../types';
import { buildGenericBattery } from '../templates';
import { pablo } from './pablo';

const REGISTRY: Record<string, CandidateGroundTruth> = {
  [pablo.id]: pablo,
};

export async function resolveCandidate(id: string, db: SupabaseClient): Promise<CandidateGroundTruth> {
  if (REGISTRY[id]) return REGISTRY[id];

  // Unknown candidate → build a generic battery from their actual CV roles.
  const { data } = await db.from('candidate_profiles').select('cv_data').eq('candidate_id', id).single();
  const cv = (data?.cv_data ?? null) as { full_name?: string; work_history?: Array<{ company: string }> } | null;
  if (!cv) {
    throw new Error(`No cv_data for candidate ${id} — cannot build a battery. Seed the candidate first.`);
  }
  const roles = (cv.work_history ?? []).map(j => ({ company: j.company }));
  return { id, label: cv.full_name ?? id, battery: buildGenericBattery(roles) };
}
