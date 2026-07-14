import { NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { REAL_INTERVIEW_QUESTIONS, RECRUITER_CHALLENGE_QUESTIONS, OBJECTION_QUESTIONS } from '@/lib/training-constants';
import {
  COVERAGE_NODES,
  computeReadiness,
  derivePublishLevel,
  type CoverageNodeKey,
  type NodeState,
  type PublishLevel,
} from '@/lib/coverage-nodes';

export const dynamic = 'force-dynamic';

// ── Local types ───────────────────────────────────────────────────────────────

interface CVData {
  current_role?: string | null;
  years_experience?: number | null;
  skills?: string[];
}

interface StoryRow {
  candidate_id: string;
  situation: string | null;
  task: string | null;
  action: string | null;
  result: string | null;
}

interface ResponseRow {
  candidate_id: string;
  module: string;
  question: string;
  answer_text: string | null;
  answer_audio_transcript: string | null;
}

export interface CandidateDirectoryItem {
  id: string;
  full_name: string;
  current_role: string;
  years_experience: number;
  career_goal: string;
  skills: string[];
  confidence_score: number;
  onboarding_complete: boolean;
  publish_level: PublishLevel;     // always derived live from coverage_nodes
  published_at: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseCareerGoal(raw: string | null): string {
  if (!raw) return '';
  try {
    const p = JSON.parse(raw) as { goals?: string[]; other?: string };
    return [p.goals?.join(', '), p.other?.trim()].filter(Boolean).join('. ');
  } catch {
    return raw;
  }
}

function computeScore(
  candidateId: string,
  storiesByCandidate: Map<string, StoryRow[]>,
  responsesByCandidate: Map<string, ResponseRow[]>
): number {
  // CV is guaranteed by the join filter — always 10
  let score = 10;

  const stories = storiesByCandidate.get(candidateId) ?? [];
  const completedStories = stories.filter(
    s => s.situation || s.task || s.action || s.result
  );
  score += Math.min(completedStories.length * 5, 45);

  const responses = responsesByCandidate.get(candidateId) ?? [];
  const hasAnswer = (q: string, mod: string) =>
    responses.some(
      r =>
        r.module === mod &&
        r.question === q &&
        (r.answer_text?.trim() || r.answer_audio_transcript?.trim())
    );

  const realCount = REAL_INTERVIEW_QUESTIONS.filter(q =>
    hasAnswer(q, 'real_interview')
  ).length;
  if (realCount > 0) {
    score += Math.round((realCount / REAL_INTERVIEW_QUESTIONS.length) * 15);
  }

  const challengeCount = RECRUITER_CHALLENGE_QUESTIONS.filter(q =>
    hasAnswer(q, 'recruiter_challenge')
  ).length;
  if (challengeCount > 0) {
    score += Math.round((challengeCount / RECRUITER_CHALLENGE_QUESTIONS.length) * 10);
  }

  const objectionCount = OBJECTION_QUESTIONS.filter(q =>
    hasAnswer(q, 'objection_handling')
  ).length;
  if (objectionCount > 0) {
    score += Math.round((objectionCount / OBJECTION_QUESTIONS.length) * 10);
  }

  return Math.min(score, 100);
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const authClient = await createServerSupabaseAuthClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'recruiter') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createServerSupabaseClient();

    // 5 queries in parallel — published candidates only
    const [profilesRes, cvRes, storiesRes, responsesRes, coverageRes] = await Promise.all([
      // Only candidates who have explicitly published their agent
      supabase
        .from('profiles')
        .select('id, full_name, career_goal, published_at')
        .eq('role', 'candidate')
        .not('published_at', 'is', null),
      supabase
        .from('candidate_profiles')
        .select('candidate_id, cv_data')
        .not('cv_data', 'is', null),
      supabase
        .from('candidate_stories')
        .select('candidate_id, situation, task, action, result'),
      supabase
        .from('candidate_responses')
        .select('candidate_id, module, question, answer_text, answer_audio_transcript'),
      // Coverage nodes for live publish-level computation
      supabase
        .from('coverage_nodes')
        .select('candidate_id, node_key, state'),
    ]);

    // Build lookup maps for O(1) per-candidate access
    const cvMap = new Map<string, CVData>(
      (cvRes.data ?? []).map(r => [r.candidate_id, r.cv_data as CVData])
    );

    const storiesMap = new Map<string, StoryRow[]>();
    for (const s of (storiesRes.data ?? []) as StoryRow[]) {
      const arr = storiesMap.get(s.candidate_id) ?? [];
      arr.push(s);
      storiesMap.set(s.candidate_id, arr);
    }

    const responsesMap = new Map<string, ResponseRow[]>();
    for (const r of (responsesRes.data ?? []) as ResponseRow[]) {
      const arr = responsesMap.get(r.candidate_id) ?? [];
      arr.push(r);
      responsesMap.set(r.candidate_id, arr);
    }

    // Coverage nodes → readiness per candidate
    const coverageMap = new Map<string, Array<{ node_key: string; state: string }>>();
    for (const row of (coverageRes.data ?? [])) {
      const arr = coverageMap.get(row.candidate_id) ?? [];
      arr.push(row);
      coverageMap.set(row.candidate_id, arr);
    }

    function computePublishLevel(candidateId: string): PublishLevel {
      const rows = coverageMap.get(candidateId) ?? [];
      const states: Record<CoverageNodeKey, NodeState> = Object.fromEntries(
        COVERAGE_NODES.map(n => [n.key, 'dark' as NodeState])
      ) as Record<CoverageNodeKey, NodeState>;
      for (const row of rows) {
        const key = row.node_key as CoverageNodeKey;
        if (key in states) states[key] = row.state as NodeState;
      }
      return derivePublishLevel(computeReadiness(states));
    }

    const candidates: CandidateDirectoryItem[] = (profilesRes.data ?? [])
      .map(p => {
        const cv    = cvMap.get(p.id);
        const score = computeScore(p.id, storiesMap, responsesMap);
        return {
          id:                  p.id,
          full_name:           p.full_name ?? 'Unknown',
          current_role:        cv?.current_role ?? '',
          years_experience:    cv?.years_experience ?? 0,
          career_goal:         parseCareerGoal(p.career_goal),
          skills:              (cv?.skills ?? []).slice(0, 5),
          confidence_score:    score,
          onboarding_complete: score >= 60,
          publish_level:       computePublishLevel(p.id),
          published_at:        p.published_at ?? null,
        };
      });

    return NextResponse.json({ candidates });
  } catch (err) {
    console.error('[recruiter/candidates GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
