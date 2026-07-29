import { createHash } from 'crypto';
import type { createServerSupabaseClient } from './supabase';

type SupabaseAdmin = ReturnType<typeof createServerSupabaseClient>;

// ── Public-chat limits (single source of truth) ──────────────────────────────
export const SESSION_PER_HOUR = 5;
export const SESSION_PER_DAY  = 20;
export const MESSAGE_PER_HOUR = 40;
export const MAX_TURNS        = 25;   // per public session
export const PUBLIC_MAX_TOKENS = 800;
export const HISTORY_MAX_EXCHANGES = 12; // last N exchanges sent to the model

export function isPublicChatEnabled(): boolean {
  return process.env.PUBLIC_CHAT_ENABLED !== 'false';
}

/** First hop of x-forwarded-for is the client IP on Vercel. */
export function ipFromRequest(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

/** Never store raw IPs — sha256 with a server-side salt. */
export function hashIp(ip: string): string {
  const salt = process.env.RATE_LIMIT_SALT ?? '';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

function windowStart(period: 'hour' | 'day'): string {
  const d = new Date();
  d.setUTCMilliseconds(0);
  d.setUTCSeconds(0);
  d.setUTCMinutes(0);
  if (period === 'day') d.setUTCHours(0);
  return d.toISOString();
}

// Atomic insert-or-increment via the deployed Postgres function. Returns the new count.
// Fails OPEN (returns 0 → allowed) on a transient DB error so a hiccup never takes down chat.
async function bump(
  supabase: SupabaseAdmin,
  bucket: string,
  subject: string,
  period: 'hour' | 'day',
): Promise<number> {
  const { data, error } = await supabase.rpc('bump_rate_limit', {
    p_bucket: bucket,
    p_subject: subject,
    p_window: windowStart(period),
  });
  if (error) {
    console.error('[rate-limit] bump_rate_limit failed (fail-open):', error);
    return 0;
  }
  return typeof data === 'number' ? data : 0;
}

export interface LimitResult {
  allowed: boolean;
  reason?: string;
}

/** Session creation: 5/IP/hour and 20/IP/day. */
export async function checkSessionCreate(supabase: SupabaseAdmin, ipHash: string): Promise<LimitResult> {
  const hour = await bump(supabase, 'session_create:hour', ipHash, 'hour');
  if (hour > SESSION_PER_HOUR) return { allowed: false, reason: 'hourly session limit' };
  const day = await bump(supabase, 'session_create:day', ipHash, 'day');
  if (day > SESSION_PER_DAY) return { allowed: false, reason: 'daily session limit' };
  return { allowed: true };
}

/** Message send: 40/IP/hour. Called BEFORE any Anthropic/Haiku call. */
export async function checkMessage(supabase: SupabaseAdmin, ipHash: string): Promise<LimitResult> {
  const hour = await bump(supabase, 'message:hour', ipHash, 'hour');
  if (hour > MESSAGE_PER_HOUR) return { allowed: false, reason: 'hourly message limit' };
  return { allowed: true };
}

// ── Usage logging — every public model call ──────────────────────────────────
export function logUsage(
  supabase: SupabaseAdmin,
  row: {
    candidateId: string | null;
    sessionId: string | null;
    model: string;
    inputTokens: number | null;
    outputTokens: number | null;
  },
): void {
  // Fire-and-forget; id is bigserial (do not supply), source is 'public'.
  supabase
    .from('usage_events')
    .insert({
      candidate_id: row.candidateId,
      session_id: row.sessionId,
      model: row.model,
      input_tokens: row.inputTokens,
      output_tokens: row.outputTokens,
      source: 'public',
    })
    .then(({ error }) => {
      if (error) console.error('[rate-limit] usage_events insert failed (non-critical):', error);
    });
}
