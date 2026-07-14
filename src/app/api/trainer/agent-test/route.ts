// Sandbox: candidate interviews their own agent using the EXACT runtime system prompt.
// Same model, same token limit, same prompt as the live recruiter-facing agent.
// Nothing is persisted — this is purely a mirror session.

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAnthropicClient } from '@/lib/anthropic';
import { buildCandidateSystemPrompt } from '@/lib/candidate-prompt';
import { CLAUDE_MODEL, CLAUDE_FALLBACK_MODEL, MAX_TOKENS, API_TIMEOUT_MS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  // Auth
  const authClient = await createServerSupabaseAuthClient();
  const { data: { user }, error: authErr } = await authClient.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let messages: AgentMessage[];
  try {
    const body = await request.json() as { messages: AgentMessage[] };
    messages = body.messages ?? [];
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages array required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Build the EXACT same system prompt the live agent uses.
  // Service-role client bypasses RLS — same as production.
  const dataClient = createServerSupabaseClient();
  let systemPrompt: string;
  try {
    systemPrompt = await buildCandidateSystemPrompt(user.id, dataClient);
  } catch (err) {
    console.error('[agent-test] buildCandidateSystemPrompt failed:', err);
    return new Response(JSON.stringify({ error: 'Could not load agent profile.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      const abort   = new AbortController();
      const timeout = setTimeout(() => abort.abort(), API_TIMEOUT_MS);

      try {
        const anthropic = getAnthropicClient();
        let fullText  = '';
        let tokensSent = false;

        const runStream = async (model: string) => {
          const s = anthropic.messages.stream(
            {
              model,
              max_tokens: MAX_TOKENS,
              system: systemPrompt,
              messages: messages as Anthropic.Messages.MessageParam[],
            },
            { signal: abort.signal }
          );
          for await (const event of s) {
            if (abort.signal.aborted) break;
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const text = event.delta.text;
              fullText  += text;
              tokensSent = true;
              // Strip the [SHOW_INSIGHTS_MODAL] trigger — it belongs to the recruiter UI, not the sandbox
              const visible = text.replace('[SHOW_INSIGHTS_MODAL]', '');
              if (visible) send({ type: 'content', text: visible });
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

        if (!abort.signal.aborted && fullText) send({ type: 'done' });

      } catch (err) {
        console.error('[agent-test] stream error:', err);
        if (err instanceof Anthropic.AuthenticationError) {
          send({ type: 'error', message: 'Configuration error.' });
        } else if (err instanceof Anthropic.RateLimitError) {
          send({ type: 'error', message: 'Claude is busy. Please try again.' });
        } else if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'))) {
          send({ type: 'error', message: 'Request timed out. Please try again.' });
        } else {
          send({ type: 'error', message: 'Something went wrong. Please try again.' });
        }
      } finally {
        clearTimeout(timeout);
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
