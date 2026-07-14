import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAnthropicClient } from '@/lib/anthropic';
import {
  COVERAGE_NODES,
  type CoverageNodeKey,
  type NodeState,
  type EvidenceQuality,
} from '@/lib/coverage-nodes';
import { computeAndPersistCoverage } from '@/lib/coverage-service';
import { CLAUDE_FALLBACK_MODEL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

// Haiku has a 60s timeout; extraction is quick — 8s is plenty.
const EXTRACT_TIMEOUT_MS = 8_000;
const EXTRACT_MAX_TOKENS = 600;

interface RequestBody {
  candidateMessage: string;
  previousMessage?: string; // the question that preceded this answer
}

// Node reference list for the extraction prompt
const NODE_REF = COVERAGE_NODES.map(
  n => `- ${n.key}: ${n.description}`
).join('\n');

const EXTRACTION_PROMPT = `You extract evidence from a candidate's interview answer.

Available node keys (use EXACTLY these values):
${NODE_REF}

Rules:
- Extract ONLY what the candidate explicitly stated — do not infer, improve, or fabricate.
- A single answer may produce 0–3 evidence items. Empty is fine if there is nothing extractable.
- Limit content to ≤20 words. Quote or paraphrase closely — never rewrite to sound better.
- Quality tiers:
  • "verified"       — specific dates, named systems/companies, measurable outcomes the candidate can defend
  • "solid"          — concrete and specific but not all independently verifiable
  • "vague"          — general claim with no supporting specifics
  • "missing_detail" — topic raised but candidate clearly cannot substantiate it
- For "vague" and "missing_detail" items, write a followUpQuestion: one direct, specific probe for the missing detail.
- Never upgrade quality to make the candidate look better. If it is vague, rate it vague.
- Return ONLY valid JSON — no markdown, no explanation, no wrapper text.

Output format:
{"evidence":[{"nodeKey":"<key>","content":"<extracted claim>","quality":"<tier>","followUpQuestion":"<question or null>"}]}`;

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

  const { candidateMessage, previousMessage } = body;
  if (!candidateMessage?.trim()) {
    return NextResponse.json({ evidence: [] });
  }

  const contextBlock = previousMessage?.trim()
    ? `Question asked: "${previousMessage.trim()}"\n\n`
    : '';
  const userBlock = `${contextBlock}Candidate's answer:\n"${candidateMessage.trim()}"`;

  const abort  = new AbortController();
  const timeout = setTimeout(() => abort.abort(), EXTRACT_TIMEOUT_MS);

  try {
    const anthropic = getAnthropicClient();
    const response  = await anthropic.messages.create(
      {
        model:      CLAUDE_FALLBACK_MODEL,
        max_tokens: EXTRACT_MAX_TOKENS,
        system:     EXTRACTION_PROMPT,
        messages:   [{ role: 'user', content: userBlock }],
      },
      { signal: abort.signal }
    );

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';

    // Robustly extract JSON — Haiku sometimes wraps output in markdown fences
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[trainer/extract] no JSON in response:', raw.slice(0, 200));
      return NextResponse.json({ evidence: [] });
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      evidence?: Array<{
        nodeKey: CoverageNodeKey;
        content: string;
        quality: EvidenceQuality;
        followUpQuestion: string | null;
      }>;
    };

    const VALID_KEYS = new Set<string>(COVERAGE_NODES.map(n => n.key));
    const VALID_QUALITIES = new Set<string>(['verified', 'solid', 'vague', 'missing_detail']);

    // Sanitise — reject items with invalid keys or quality tiers
    const validated = (parsed.evidence ?? []).filter(item =>
      VALID_KEYS.has(item.nodeKey) &&
      VALID_QUALITIES.has(item.quality) &&
      item.content?.trim()
    );

    // Nothing extractable — return early, no DB writes.
    if (validated.length === 0) {
      return NextResponse.json({ evidence: [], persisted: true });
    }

    // ── Persist each item into evidence_items (append-only) ─────────────
    // Service-role client: RLS bypassed, candidate_id scoped explicitly.
    const dataClient = createServerSupabaseClient();
    const insertRows = validated.map(item => ({
      candidate_id:    user.id,
      node_key:        item.nodeKey,
      content:         item.content.trim(),
      quality:         item.quality,
      source:          'trainer_conversation',
      source_question: previousMessage?.trim() ?? null,
    }));

    const { data: inserted, error: insertErr } = await dataClient
      .from('evidence_items')
      .insert(insertRows)
      .select('id, node_key, content, quality');

    // followUpQuestion is transient (a probe) — not stored. Re-attach by index.
    let persisted = true;
    let evidence: Array<{
      id: string;
      nodeKey: CoverageNodeKey;
      content: string;
      quality: EvidenceQuality;
      followUpQuestion: string | null;
    }>;

    if (insertErr || !inserted) {
      // Insert failed — still return cards so the UI renders, but flag not-saved.
      console.error('[trainer/extract] evidence insert failed (non-fatal):', insertErr?.message);
      persisted = false;
      evidence = validated.map(item => ({
        id:               crypto.randomUUID(),
        nodeKey:          item.nodeKey,
        content:          item.content.trim(),
        quality:          item.quality,
        followUpQuestion: item.followUpQuestion ?? null,
      }));
    } else {
      evidence = inserted.map((row, i) => ({
        id:               row.id as string,
        nodeKey:          row.node_key as CoverageNodeKey,
        content:          row.content as string,
        quality:          row.quality as EvidenceQuality,
        // zip by index — .insert().select() preserves insertion order
        followUpQuestion: validated[i]?.followUpQuestion ?? null,
      }));
    }

    // ── Recompute + persist coverage server-side (single source of truth) ──
    // Reflects DB reality: if the insert above failed, those items are absent
    // and the node states honestly do not move.
    let coverage: {
      nodeStates: Record<CoverageNodeKey, NodeState>;
      readiness: number;
      publishLevel: string;
    } | null = null;
    try {
      const result = await computeAndPersistCoverage(user.id, dataClient);
      const nodeStates = Object.fromEntries(
        COVERAGE_NODES.map(n => [n.key, result.nodes[n.key].state])
      ) as Record<CoverageNodeKey, NodeState>;
      coverage = { nodeStates, readiness: result.readiness, publishLevel: result.publishLevel };
    } catch (err) {
      console.error('[trainer/extract] coverage recompute failed (non-fatal):', err);
    }

    return NextResponse.json({ evidence, persisted, coverage });
  } catch (err) {
    if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'))) {
      console.warn('[trainer/extract] timed out');
      return NextResponse.json({ evidence: [] });
    }
    console.error('[trainer/extract] error:', err);
    return NextResponse.json({ evidence: [] }); // non-fatal — cards just don't appear
  } finally {
    clearTimeout(timeout);
  }
}
