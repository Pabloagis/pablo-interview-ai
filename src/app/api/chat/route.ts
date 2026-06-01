import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAnthropicClient } from '@/lib/anthropic';
import { CORE_SYSTEM_PROMPT, buildDynamicPrompt } from '@/lib/prompts';
import { retrieveKnowledge, detectTone, logRetrieval } from '@/lib/retrieval';
import {
  CLAUDE_MODEL,
  CLAUDE_FALLBACK_MODEL,
  MAX_TOKENS,
  API_TIMEOUT_MS,
  MEMORY_SEARCH_LIMIT,
  MEMORY_TIMEOUT_MS,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
  HISTORY_MAX_MESSAGES,
  MEMORY_MIN_HISTORY,
} from '@/lib/constants';
import { ChatRequest, AnthropicMessage, MemorySearchResult } from '@/lib/types';

export const dynamic = 'force-dynamic';


type SupabaseClient = ReturnType<typeof createServerSupabaseClient>;

function withMemoryTimeout<T>(promise: Promise<T>): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) =>
      setTimeout(() => {
        console.error(`[Memory] timeout after ${MEMORY_TIMEOUT_MS / 1000}s - continuing without`);
        resolve(null);
      }, MEMORY_TIMEOUT_MS)
    ),
  ]);
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  return new OpenAI({ apiKey });
}

// Non-blocking — errors here must never stop the chat
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding generation failed (non-critical):', error);
    return null;
  }
}

// Non-blocking — errors here must never stop the chat
async function searchMemory(
  supabase: SupabaseClient,
  sessionId: string,
  embedding: number[]
): Promise<MemorySearchResult[]> {
  try {
    const result = await withMemoryTimeout(
      Promise.resolve(supabase.rpc('search_memory', {
        p_session_id: sessionId,
        p_query_embedding: embedding,
        p_limit: MEMORY_SEARCH_LIMIT,
      }))
    );
    if (!result) return [];
    const { data, error } = result;
    if (error) {
      console.error('Memory search failed (non-critical):', error);
      return [];
    }
    return (data as MemorySearchResult[]) || [];
  } catch (error) {
    console.error('Memory search error (non-critical):', error);
    return [];
  }
}

// Non-blocking — fire and forget
function storeMemory(
  supabase: SupabaseClient,
  sessionId: string,
  content: string,
  type: 'user_message' | 'assistant_response',
  recruiterName?: string,
  company?: string,
  embedding?: number[] | null
): void {
  withMemoryTimeout(
    Promise.resolve(supabase
      .from('memory')
      .insert({
        session_id: sessionId,
        recruiter_name: recruiterName || null,
        company: company || null,
        content,
        type,
        embedding: embedding || null,
      }))
  ).then((result) => {
    if (result?.error) console.error('Memory store failed (non-critical):', result.error);
  });
}

export async function POST(request: NextRequest) {
  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { message, sessionId, context, autoIntro, autoCheckIn } = body;

  if (!message?.trim() || !sessionId) {
    return new Response(JSON.stringify({ error: 'message and sessionId are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), API_TIMEOUT_MS);

      try {
        const supabase = createServerSupabaseClient();

        // Load conversation history from session
        const { data: session, error: sessionError } = await supabase
          .from('sessions')
          .select('messages, recruiter_name, company, role, email')
          .eq('id', sessionId)
          .single();

        if (sessionError || !session) {
          send({ type: 'error', message: 'Session not found. Please refresh and try again.' });
          controller.close();
          return;
        }

        const rawHistory: AnthropicMessage[] = (session.messages || []) as AnthropicMessage[];
        // Cap history to avoid unbounded token growth; pgvector memory covers the gap for earlier turns
        const conversationHistory = rawHistory.slice(-HISTORY_MAX_MESSAGES);
        const userTurn = autoIntro
          ? `[SYSTEM TRIGGER — not from the recruiter] The recruiter opened the interview page but hasn't typed yet. Send a brief, warm greeting${context?.recruiterName ? ` addressing them as ${context.recruiterName}` : ''}. 1–2 sentences max. Natural and human — no bullet lists, no topic menus, just a genuine opening that makes them feel welcome to start.`
          : autoCheckIn
          ? `[SYSTEM TRIGGER — not from the recruiter] There has been no activity for a while. Gently check in — see if they're still there or wrapping up. Remind them in a natural, warm way that they can click the "End interview" button when they're done to close the session. 1–2 sentences only. Don't repeat anything already said. Keep it light and human.`
          : message.trim();
        const newUserMessage: AnthropicMessage = { role: 'user', content: userTurn };
        const messagesForClaude: AnthropicMessage[] = [...conversationHistory, newUserMessage];

        // Semantic memory search — non-blocking if embedding fails.
        // Skip injecting results into the prompt while history is short: the full conversation
        // is already being sent, so memory would just duplicate it. Once history gets truncated
        // (rawHistory.length >= MEMORY_MIN_HISTORY), memory bridges the gap for earlier turns.
        const embedding = await generateEmbedding(message);
        let relevantMemories: MemorySearchResult[] = [];
        if (embedding && rawHistory.length >= MEMORY_MIN_HISTORY) {
          relevantMemories = await searchMemory(supabase, sessionId, embedding);
        }

        // Retrieve relevant knowledge (stories + company context) based on message
        const retrieved = retrieveKnowledge({
          userMessage: message,
          recruiterCompany: context?.company,
          conversationHistory: messagesForClaude.map((m) => m.content),
        });
        logRetrieval(retrieved);

        // Auto-detect tone from conversation if not explicitly set
        const detectedTone = detectTone(messagesForClaude.map((m) => m.content));
        const enrichedContext = {
          ...context,
          tone: context?.tone || detectedTone,
        };

        // Two-block system: static core is cached by Anthropic (5-min TTL, 10% cost on cache hit),
        // dynamic block carries per-request context and is never cached.
        const systemBlocks: Anthropic.Messages.TextBlockParam[] = [
          { type: 'text', text: CORE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: buildDynamicPrompt(enrichedContext, relevantMemories, retrieved.formattedText) },
        ];
        const anthropic = getAnthropicClient();
        let fullResponse = '';
        let tokensSent = false;

        const runStream = async (model: string) => {
          const claudeStream = anthropic.messages.stream(
            { model, max_tokens: MAX_TOKENS, system: systemBlocks, messages: messagesForClaude },
            { signal: abortController.signal }
          );
          for await (const event of claudeStream) {
            if (abortController.signal.aborted) break;
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const text = event.delta.text;
              fullResponse += text;
              tokensSent = true;
              send({ type: 'content', text });
            }
          }
        };

        try {
          await runStream(CLAUDE_MODEL);
        } catch (streamError) {
          const isOverloaded =
            streamError instanceof Error && streamError.message.includes('overloaded_error');
          if (isOverloaded && !tokensSent) {
            fullResponse = '';
            await runStream(CLAUDE_FALLBACK_MODEL);
          } else {
            throw streamError;
          }
        }

        if (!abortController.signal.aborted && fullResponse) {
          // Strip the hidden UI trigger before saving — it must never appear in stored history
          // or be fed back to Claude as context in future turns.
          const savedResponse = fullResponse.replace('[SHOW_INSIGHTS_MODAL]', '').trim();

          // Persist the FULL history — rawHistory is the source of truth; conversationHistory
          // is only a slice used for Claude's context window, never for storage.
          // For auto-triggers: skip storing the hidden system prompt; only append the reply.
          const updatedMessages: AnthropicMessage[] = (autoIntro || autoCheckIn)
            ? [...rawHistory, { role: 'assistant', content: savedResponse }]
            : [...rawHistory, newUserMessage, { role: 'assistant', content: savedResponse }];

          const { error: updateError } = await supabase
            .from('sessions')
            .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
            .eq('id', sessionId);
          if (updateError) console.error('Session update failed (non-critical):', updateError);

          send({ type: 'done' });

          // Store both messages in memory with embeddings — fully non-blocking
          // Skip user memory for auto-triggers (no real user message to store)
          if (!autoIntro && !autoCheckIn) {
            storeMemory(
              supabase, sessionId, message, 'user_message',
              context.recruiterName, context.company, embedding
            );
          }

          generateEmbedding(fullResponse).then((responseEmbedding) => {
            storeMemory(
              supabase, sessionId, fullResponse, 'assistant_response',
              context.recruiterName, context.company, responseEmbedding
            );
          });

          // Log assistant message to message_events (fire-and-forget)
          supabase
            .from('message_events')
            .insert({
              session_id: sessionId,
              recruiter_name: session.recruiter_name,
              email: session.email,
              company: session.company,
              role: session.role,
              message_role: 'assistant',
              content: fullResponse,
            })
            .then(({ error }) => {
              if (error) console.error('message_events assistant insert failed (non-critical):', error);
            });
        }
      } catch (error) {
        console.error('Chat stream error:', error);

        if (error instanceof Anthropic.AuthenticationError) {
          send({ type: 'error', message: 'Configuration error. Please contact Pablo.' });
        } else if (
          error instanceof Anthropic.RateLimitError ||
          (error instanceof Error && error.message.includes('overloaded_error'))
        ) {
          send({ type: 'error', message: 'Claude is busy. Please try again in a moment.' });
        } else if (
          error instanceof Error &&
          (error.name === 'AbortError' || error.message.includes('aborted'))
        ) {
          send({ type: 'error', message: 'Taking longer than expected. Please try again.' });
        } else {
          send({ type: 'error', message: 'Something went wrong. Please try again.' });
        }
      } finally {
        clearTimeout(timeoutId);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
