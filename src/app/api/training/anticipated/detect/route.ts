// GET /api/training/anticipated/detect
// Scans the candidate's CV + stories for gaps a recruiter will probe and returns
// PROPOSED QUESTIONS ONLY. It never authors an answer.
//   - Structural gaps (short tenure, employment gap, departure reason) are computed
//     deterministically from CV dates — no model involved, so nothing can be invented.
//   - A Haiku pass adds pivot/transition questions. It is forbidden from drafting
//     answers; the response schema has no answer field and is validated/stripped.

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAnthropicClient } from '@/lib/anthropic';
import { CLAUDE_FALLBACK_MODEL } from '@/lib/constants';
import {
  computeStructuralGaps,
  dropAlreadyAnswered,
  dedupeGaps,
  sortGaps,
  pivotPrompt,
  type ProposedGap,
  type WorkHistoryEntry,
} from '@/lib/anticipated';

export const dynamic = 'force-dynamic';

const DETECT_TIMEOUT_MS = 10_000;
const DETECT_MAX_TOKENS = 700;

export async function GET(request: NextRequest) {
  // The trainer chat now speaks these questions out loud, so the pivot pass has to
  // answer in the UI language. Structural gaps carry `params` and are localised
  // client-side, so they ignore this.
  const language = new URL(request.url).searchParams.get('language') ?? undefined;

  const auth = await createServerSupabaseAuthClient();
  const { data: { user }, error: authErr } = await auth.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServerSupabaseClient();
  const [cvRes, existingRes] = await Promise.all([
    db.from('candidate_profiles').select('cv_data').eq('candidate_id', user.id).single(),
    db.from('anticipated_questions').select('topic').eq('candidate_id', user.id),
  ]);

  const workHistory = ((cvRes.data?.cv_data as { work_history?: WorkHistoryEntry[] } | null)?.work_history) ?? [];
  const existingTopics = (existingRes.data ?? []).map(r => r.topic as string);

  // 1. Deterministic structural gaps (dates cannot lie).
  const structural = computeStructuralGaps(workHistory);

  // 2. Haiku pivot pass — questions only, then strictly sanitised.
  let pivotGaps: ProposedGap[] = [];
  let rawHaiku = '';
  if (workHistory.length >= 2) {
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), DETECT_TIMEOUT_MS);
    try {
      const wh = workHistory
        .map(j => `- ${j.role} at ${j.company} (${j.start_date}–${j.end_date})`)
        .join('\n');
      const resp = await getAnthropicClient().messages.create(
        { model: CLAUDE_FALLBACK_MODEL, max_tokens: DETECT_MAX_TOKENS, system: pivotPrompt(language),
          messages: [{ role: 'user', content: `Work history:\n${wh}` }] },
        { signal: abort.signal }
      );
      rawHaiku = resp.content[0]?.type === 'text' ? resp.content[0].text : '';
      const m = rawHaiku.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]) as { gaps?: Array<Record<string, unknown>> };
        pivotGaps = (parsed.gaps ?? [])
          .map(g => ({
            kind: 'pivot' as const,
            // A pivot is a fair question but never the one a recruiter opens with —
            // it sits below every structural gap and is never used for a reminder.
            priority: 3 as const,
            topic: String(g.topic ?? '').trim(),
            rationale: String(g.rationale ?? '').trim(),
            trigger_hint: String(g.trigger_hint ?? '').trim(),
            // NOTE: any 'answer'/'example'/'suggested' key the model emitted is simply
            // not read here — it cannot reach the client.
          }))
          .filter(g => g.topic && g.rationale && g.trigger_hint);
      }
    } catch (err) {
      console.error('[anticipated/detect] pivot pass failed (non-fatal):', err);
    } finally {
      clearTimeout(timeout);
    }
  }

  // Structural first so a mechanical gap always wins a collision with a Haiku one.
  const gaps = sortGaps(
    dedupeGaps(dropAlreadyAnswered([...structural, ...pivotGaps], existingTopics))
  );

  return NextResponse.json({ gaps, debugRawHaiku: rawHaiku });
}
