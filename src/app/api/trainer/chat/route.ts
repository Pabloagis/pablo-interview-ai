import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { getAnthropicClient } from '@/lib/anthropic';
import { buildTrainerSystemPrompt } from '@/lib/trainer-prompt';
import {
  COVERAGE_NODES,
  type CoverageNodeKey,
  type NodeState,
  type OnboardingStage,
} from '@/lib/coverage-nodes';
import { CLAUDE_MODEL, CLAUDE_FALLBACK_MODEL, API_TIMEOUT_MS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

// Trainer uses shorter responses than the recruiter-facing agent
const TRAINER_MAX_TOKENS = 500;

interface TrainerMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: TrainerMessage[];
  nodeStates?: Record<CoverageNodeKey, NodeState>; // client sends current states
  // Same precedent as nodeStates: the client received this FROM /api/training/onboarding
  // (server-derived). It only shapes this candidate's own coaching, never agent facts.
  onboardingStage?: OnboardingStage;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseAuthClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages, nodeStates, onboardingStage } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages array required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch candidate profile for the system prompt
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, career_goal')
    .eq('id', user.id)
    .single();

  const candidateName = profile?.full_name ?? 'Candidate';
  const careerGoal    = profile?.career_goal ?? null;

  // Use client-supplied node states or fall back to all-dark
  const fallbackStates = Object.fromEntries(
    COVERAGE_NODES.map(n => [n.key, 'dark' as NodeState])
  ) as Record<CoverageNodeKey, NodeState>;
  const resolvedStates: Record<CoverageNodeKey, NodeState> = nodeStates ?? fallbackStates;

  const systemPrompt = buildTrainerSystemPrompt({
    candidateName,
    careerGoal,
    nodeStates: resolvedStates,
    onboardingStage,
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      const abort  = new AbortController();
      const timout = setTimeout(() => abort.abort(), API_TIMEOUT_MS);

      try {
        const anthropic = getAnthropicClient();
        let fullText = '';
        let tokensSent = false;

        const runStream = async (model: string) => {
          const s = anthropic.messages.stream(
            {
              model,
              max_tokens: TRAINER_MAX_TOKENS,
              system: systemPrompt,
              messages: messages as Anthropic.Messages.MessageParam[],
            },
            { signal: abort.signal }
          );
          for await (const event of s) {
            if (abort.signal.aborted) break;
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              fullText += event.delta.text;
              tokensSent = true;
              send({ type: 'content', text: event.delta.text });
            }
          }
        };

        try {
          await runStream(CLAUDE_MODEL);
        } catch (err) {
          const overloaded = err instanceof Error && err.message.includes('overloaded_error');
          if (overloaded && !tokensSent) {
            fullText = '';
            await runStream(CLAUDE_FALLBACK_MODEL);
          } else {
            throw err;
          }
        }

        if (!abort.signal.aborted && fullText) {
          send({ type: 'done' });
        }
      } catch (err) {
        console.error('[trainer/chat] stream error:', err);
        if (err instanceof Anthropic.AuthenticationError) {
          send({ type: 'error', message: 'Configuration error.' });
        } else if (err instanceof Anthropic.RateLimitError) {
          send({ type: 'error', message: 'Claude is busy. Please try again in a moment.' });
        } else if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'))) {
          send({ type: 'error', message: 'Taking longer than expected. Please try again.' });
        } else {
          send({ type: 'error', message: 'Something went wrong. Please try again.' });
        }
      } finally {
        clearTimeout(timout);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  });
}
