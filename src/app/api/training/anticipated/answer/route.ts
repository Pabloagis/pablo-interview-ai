// POST /api/training/anticipated/answer
// The user's answer to a proposed gap. The AI ASSESSES quality only — it never
// rewrites or invents the answer. Only solid/verified answers persist (the schema
// forbids storing anything less). Vague answers get a follow-up probe, exactly like
// the evidence loop, and are NOT stored — a vague anticipated answer is worse than none.

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAnthropicClient } from '@/lib/anthropic';
import { CLAUDE_FALLBACK_MODEL } from '@/lib/constants';
import { ASSESS_PROMPT } from '@/lib/anticipated';

export const dynamic = 'force-dynamic';

const ASSESS_TIMEOUT_MS = 9_000;
const ASSESS_MAX_TOKENS = 300;

interface Body {
  topic: string;
  trigger_hint: string;
  answer: string;
}

export async function POST(request: NextRequest) {
  const auth = await createServerSupabaseAuthClient();
  const { data: { user }, error: authErr } = await auth.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const topic = body.topic?.trim();
  const trigger_hint = body.trigger_hint?.trim();
  const answer = body.answer?.trim();
  if (!topic || !trigger_hint || !answer) {
    return NextResponse.json({ error: 'topic, trigger_hint and answer are required' }, { status: 400 });
  }

  // ── Assess quality (Haiku) ──────────────────────────────────────────────────
  let quality = 'vague';
  let followUpQuestion: string | null = null;
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), ASSESS_TIMEOUT_MS);
  try {
    const resp = await getAnthropicClient().messages.create(
      { model: CLAUDE_FALLBACK_MODEL, max_tokens: ASSESS_MAX_TOKENS, system: ASSESS_PROMPT,
        messages: [{ role: 'user', content: `Question: ${topic}\nWhen asked: ${trigger_hint}\n\nCandidate's answer:\n"${answer}"` }] },
      { signal: abort.signal }
    );
    const raw = resp.content[0]?.type === 'text' ? resp.content[0].text : '';
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      const parsed = JSON.parse(m[0]) as { quality?: string; followUpQuestion?: string | null };
      if (['verified', 'solid', 'vague', 'missing_detail'].includes(parsed.quality ?? '')) quality = parsed.quality!;
      followUpQuestion = parsed.followUpQuestion?.trim() || null;
    }
  } catch (err) {
    console.error('[anticipated/answer] assess failed:', err);
    // On failure, do NOT persist — treat as needs-more (fail safe, never store unvetted).
    clearTimeout(timeout);
    return NextResponse.json({ stored: false, quality: 'vague', followUpQuestion: 'Could you add a specific detail — a date, a name, or a concrete outcome?' });
  } finally {
    clearTimeout(timeout);
  }

  // ── Persist only solid/verified. Store the user's VERBATIM answer. ──────────
  if (quality === 'verified' || quality === 'solid') {
    const db = createServerSupabaseClient();
    const { data, error } = await db.from('anticipated_questions')
      .insert({ candidate_id: user.id, topic, trigger_hint, answer, quality })
      .select('id, topic, quality')
      .single();
    if (error) {
      console.error('[anticipated/answer] insert failed:', error.message);
      return NextResponse.json({ error: 'Could not save' }, { status: 500 });
    }
    return NextResponse.json({ stored: true, quality, row: data });
  }

  // Vague / missing_detail → not stored; return the probe.
  return NextResponse.json({
    stored: false,
    quality,
    followUpQuestion: followUpQuestion ?? 'Could you make that more specific — a date, a named system, or a concrete outcome you can defend?',
  });
}
