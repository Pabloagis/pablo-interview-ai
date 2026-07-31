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

// Conflict detection runs alongside extraction; it must never be the reason the
// candidate waits. Bounded rows keep the comparison prompt small and reliable.
const CONFLICT_TIMEOUT_MS    = 8_000;
const CONFLICT_MAX_TOKENS    = 400;
const CONFLICT_CANDIDATE_ROWS = 25;

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

// ── Conflict detection ───────────────────────────────────────────────────────
// A candidate's profile changes over time: they leave a job, change title, move,
// widen the roles they want, correct a number they got wrong. Without this pass the
// new fact is simply appended and the agent holds both versions as true.
//
// This pass only PROPOSES. Nothing is retired until the candidate confirms in the
// UI — the same rule as the gap flow: the AI proposes, the user decides.
const CONFLICT_PROMPT = `You compare a person's NEW statements against facts already stored about them, and decide which stored facts each new statement REPLACES.

A stored fact is replaced when the new statement makes it no longer true of them today:
- they left, changed or were promoted out of a role the stored fact puts them in
- a target, preference or plan the stored fact states has changed
- a number, date, name or scope in the stored fact is corrected
- the stored fact is a narrower version of something they have just widened

A stored fact is NOT replaced when the new statement:
- adds detail to it, or gives an example of it
- describes a different period, employer, project or topic
- is simply about something else

Rules:
- Default to returning nothing. Only flag a DIRECT contradiction between the two texts.
- Never flag a stored fact because it is old, thin, or worded differently.
- A new statement may replace several stored facts, or none.
- Use the exact stored ids given. Use the integer index for the new statement.
- Return ONLY valid JSON — no markdown, no explanation.

Output format:
{"replacements":[{"new":<index>,"replaces":["<stored id>"]}]}`;

export interface Supersession {
  supersedingId: string;
  supersedes: Array<{ id: string; content: string }>;
}

// Live facts on the nodes this answer touched, compared against the new claims.
// Every failure path returns [] — a missed proposal costs the candidate one manual
// correction; a thrown error would cost them the whole extraction.
async function detectConflicts(
  dataClient: ReturnType<typeof createServerSupabaseClient>,
  candidateId: string,
  claims: Array<{ nodeKey: CoverageNodeKey; content: string }>
): Promise<Array<{ newIndex: number; replaces: Array<{ id: string; content: string }> }>> {
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), CONFLICT_TIMEOUT_MS);

  try {
    const nodeKeys = [...new Set(claims.map(c => c.nodeKey))];

    // Same node only. A career-goal correction cannot retire a work-history fact,
    // which keeps this pass narrow enough to stay reliable.
    const { data: existing, error } = await dataClient
      .from('evidence_items')
      .select('id, content')
      .eq('candidate_id', candidateId)
      .in('node_key', nodeKeys)
      .is('superseded_at', null)
      .order('created_at', { ascending: false })
      .limit(CONFLICT_CANDIDATE_ROWS);

    if (error) {
      // Pre-migration this is the missing-column rejection, not a real failure.
      console.warn('[trainer/extract] conflict scan unavailable:', error.message);
      return [];
    }
    if (!existing?.length) return [];

    const storedBlock = existing.map(r => `[${r.id}] ${r.content}`).join('\n');
    const newBlock = claims.map((c, i) => `${i}. ${c.content}`).join('\n');

    const anthropic = getAnthropicClient();
    const response = await anthropic.messages.create(
      {
        model:      CLAUDE_FALLBACK_MODEL,
        max_tokens: CONFLICT_MAX_TOKENS,
        system:     CONFLICT_PROMPT,
        messages:   [{
          role: 'user',
          content: `Stored facts:\n${storedBlock}\n\nNew statements:\n${newBlock}`,
        }],
      },
      { signal: abort.signal }
    );

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return [];

    const parsed = JSON.parse(match[0]) as {
      replacements?: Array<{ new: number; replaces: string[] }>;
    };

    const contentById = new Map(existing.map(r => [r.id as string, r.content as string]));

    return (parsed.replacements ?? [])
      .map(r => ({
        newIndex: r.new,
        // Drop hallucinated ids: only rows we actually read back are proposable.
        replaces: (r.replaces ?? [])
          .filter(id => contentById.has(id))
          .map(id => ({ id, content: contentById.get(id)! })),
      }))
      .filter(r =>
        Number.isInteger(r.newIndex) &&
        r.newIndex >= 0 &&
        r.newIndex < claims.length &&
        r.replaces.length > 0
      );
  } catch (err) {
    console.warn(
      '[trainer/extract] conflict detection failed (non-fatal):',
      err instanceof Error ? err.message : err
    );
    return [];
  } finally {
    clearTimeout(timeout);
  }
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

    // Conflict detection runs CONCURRENTLY with the insert below. It only needs the
    // claim texts, which we already have, so it costs no extra wall-clock time in
    // the trainer chat — the candidate is waiting on this response.
    const conflictPromise = detectConflicts(dataClient, user.id, validated);

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

    // ── Attach replacement proposals to the new items ───────────────────
    // Skipped entirely when the insert failed: the ids above are throwaway UUIDs
    // that exist nowhere, so offering to retire real rows against them would be a
    // confirmation the server could not honour.
    let supersessions: Supersession[] = [];
    if (persisted) {
      const byIndex = await conflictPromise;
      supersessions = byIndex
        .map(c => ({
          supersedingId: evidence[c.newIndex]?.id,
          supersedes:    c.replaces,
        }))
        .filter((s): s is Supersession => !!s.supersedingId && s.supersedes.length > 0);
    }

    return NextResponse.json({ evidence, persisted, coverage, supersessions });
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
