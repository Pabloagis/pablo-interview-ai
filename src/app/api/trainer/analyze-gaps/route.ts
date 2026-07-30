// Haiku pass: identifies which nodes triggered refusals or weak answers
// in a completed agent-test conversation.
// Returns gaps so the UI can surface them with direct training links.

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { getAnthropicClient } from '@/lib/anthropic';
import { COVERAGE_NODES, type CoverageNodeKey } from '@/lib/coverage-nodes';
import { CLAUDE_FALLBACK_MODEL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const ANALYZE_MAX_TOKENS = 800;
const ANALYZE_TIMEOUT_MS = 10_000;

export interface Gap {
  nodeKey: CoverageNodeKey;
  type: 'refusal' | 'weak';
  excerpt: string;
}

interface RequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// Build the refusal phrase reference list for the prompt
const REFUSAL_REF = COVERAGE_NODES
  .map(n => `- ${n.key}: "${n.darkRefusal}"`)
  .join('\n');

const NODE_REF = COVERAGE_NODES
  .map(n => `- ${n.key}: ${n.label}`)
  .join('\n');

const ANALYSIS_PROMPT = `You identify gaps in a mock interview where a candidate's AI agent failed to answer a recruiter's questions.

Known refusal phrases (the agent says these verbatim when a topic has no data):
${REFUSAL_REF}

Available node keys:
${NODE_REF}

Rules:
- Analyse ONLY assistant (agent) messages, not user (recruiter) messages.
- type = "refusal" if the agent's message matches or closely paraphrases a known refusal phrase above.
- type = "weak" if the agent hedged heavily, was vague, or gave a qualified non-answer without specific data.
- Do NOT flag strong, specific, confident answers.
- Do NOT flag the agent acknowledging uncertainty about something genuinely uncertain (e.g. a future aspiration).
- Extract an excerpt from the agent's message: verbatim, max 15 words.
- One gap per node key maximum. If a node appears multiple times, report it once as the worse type (refusal > weak).
- Return an empty gaps array if no gaps found.

Return ONLY valid JSON — no markdown, no explanation:
{"gaps":[{"nodeKey":"<key>","type":"refusal|weak","excerpt":"<agent phrase, max 15 words>"}]}`;

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
    return NextResponse.json({ gaps: [] });
  }

  const { messages = [] } = body;
  const agentTurns = messages.filter(m => m.role === 'assistant');
  if (agentTurns.length === 0) {
    return NextResponse.json({ gaps: [] });
  }

  // Format the conversation for Haiku
  const conversationText = messages
    .map(m => `${m.role === 'user' ? 'RECRUITER' : 'AGENT'}: ${m.content}`)
    .join('\n\n');

  const abort   = new AbortController();
  const timeout = setTimeout(() => abort.abort(), ANALYZE_TIMEOUT_MS);

  try {
    const anthropic = getAnthropicClient();
    const response  = await anthropic.messages.create(
      {
        model:      CLAUDE_FALLBACK_MODEL,
        max_tokens: ANALYZE_MAX_TOKENS,
        system:     ANALYSIS_PROMPT,
        messages:   [{ role: 'user', content: `Conversation to analyse:\n\n${conversationText}` }],
      },
      { signal: abort.signal }
    );

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[analyze-gaps] no JSON in Haiku response');
      return NextResponse.json({ gaps: [] });
    }

    const parsed = JSON.parse(jsonMatch[0]) as { gaps?: Gap[] };
    const VALID_KEYS = new Set<string>(COVERAGE_NODES.map(n => n.key));
    const VALID_TYPES = new Set<string>(['refusal', 'weak']);

    // Sanitise and deduplicate by nodeKey (refusal wins over weak)
    const seen = new Map<string, Gap>();
    for (const g of (parsed.gaps ?? [])) {
      if (!VALID_KEYS.has(g.nodeKey) || !VALID_TYPES.has(g.type) || !g.excerpt?.trim()) continue;
      const existing = seen.get(g.nodeKey);
      if (!existing || (g.type === 'refusal' && existing.type === 'weak')) {
        seen.set(g.nodeKey, g);
      }
    }

    return NextResponse.json({ gaps: Array.from(seen.values()) });

  } catch (err) {
    if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'))) {
      console.warn('[analyze-gaps] timed out');
    } else {
      console.error('[analyze-gaps] error:', err);
    }
    return NextResponse.json({ gaps: [] }); // non-fatal
  } finally {
    clearTimeout(timeout);
  }
}
