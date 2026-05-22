import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAnthropicClient } from '@/lib/anthropic';
import { buildSystemPrompt } from '@/lib/prompts';
import { retrieveKnowledge, detectTone, logRetrieval } from '@/lib/retrieval';
import {
  CLAUDE_MODEL,
  MAX_TOKENS,
  API_TIMEOUT_MS,
  MEMORY_SEARCH_LIMIT,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
} from '@/lib/constants';
import { ChatRequest, AnthropicMessage, MemorySearchResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

const MEMORY_TIMEOUT_MS = 5000;

type SupabaseClient = ReturnType<typeof createServerSupabaseClient>;

function withMemoryTimeout<T>(promise: Promise<T>): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) =>
      setTimeout(() => {
        console.error('[Memory] timeout after 5s - continuing without');
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

  const { message, sessionId, context } = body;

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

        const conversationHistory: AnthropicMessage[] = (session.messages || []) as AnthropicMessage[];
        const newUserMessage: AnthropicMessage = { role: 'user', content: message.trim() };
        const messagesForClaude: AnthropicMessage[] = [...conversationHistory, newUserMessage];

        // Semantic memory search — non-blocking if embedding fails
        const embedding = await generateEmbedding(message);
        let relevantMemories: MemorySearchResult[] = [];
        if (embedding) {
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

        const systemPrompt = buildSystemPrompt(enrichedContext, relevantMemories, retrieved.formattedText);
        const anthropic = getAnthropicClient();
        let fullResponse = '';

        // Stream from Claude with abort signal for timeout
        const claudeStream = anthropic.messages.stream(
          {
            model: CLAUDE_MODEL,
            max_tokens: MAX_TOKENS,
            system: systemPrompt,
            messages: messagesForClaude,
          },
          { signal: abortController.signal }
        );

        for await (const event of claudeStream) {
          if (abortController.signal.aborted) break;

          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const text = event.delta.text;
            fullResponse += text;
            send({ type: 'content', text });
          }
        }

        if (!abortController.signal.aborted && fullResponse) {
          send({ type: 'done' });

          // Persist updated conversation history — non-blocking
          const updatedMessages: AnthropicMessage[] = [
            ...messagesForClaude,
            { role: 'assistant', content: fullResponse },
          ];

          supabase
            .from('sessions')
            .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
            .eq('id', sessionId)
            .then(({ error }) => {
              if (error) console.error('Session update failed (non-critical):', error);
            });

          // Store both messages in memory with embeddings — fully non-blocking
          storeMemory(
            supabase, sessionId, message, 'user_message',
            context.recruiterName, context.company, embedding
          );

          generateEmbedding(fullResponse).then((responseEmbedding) => {
            storeMemory(
              supabase, sessionId, fullResponse, 'assistant_response',
              context.recruiterName, context.company, responseEmbedding
            );
          });
        }
      } catch (error) {
        console.error('Chat stream error:', error);

        if (error instanceof Anthropic.AuthenticationError) {
          send({ type: 'error', message: 'Configuration error. Please contact Pablo.' });
        } else if (error instanceof Anthropic.RateLimitError) {
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
