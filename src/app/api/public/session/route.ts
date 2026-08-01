import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { maybeSendReports } from '@/lib/public-report';
import {
  ipFromRequest,
  hashIp,
  checkSessionCreate,
  isPublicChatEnabled,
} from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const STALE_MS = 30 * 60 * 1000;

// Lazy backstop: close up to 5 stale public sessions and fire their reports.
// The daily cron guarantees delivery; this keeps abandoned sessions from lingering.
async function lazySweep(supabase: ReturnType<typeof createServerSupabaseClient>): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_MS).toISOString();
  const { data: stale } = await supabase
    .from('sessions')
    .select('id')
    .eq('source', 'public')
    .is('ended_at', null)
    .lt('last_activity_at', cutoff)
    .limit(5);

  for (const row of stale ?? []) {
    await supabase.from('sessions').update({ ended_at: new Date().toISOString() }).eq('id', row.id);
    void maybeSendReports(row.id); // best-effort; cron backstops any drop
  }
}

export async function POST(request: NextRequest) {
  if (!isPublicChatEnabled()) {
    return NextResponse.json({ error: 'Public chat is temporarily unavailable.' }, { status: 503 });
  }

  let slug: string;
  let resume: string | undefined;
  try {
    ({ slug, resume } = (await request.json()) as { slug: string; resume?: string });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const ipHash = hashIp(ipFromRequest(request));

  // Identity resolution — service client only, never trusts the client for candidate_id.
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, published_at')
    .eq('slug', slug)
    .maybeSingle();

  // 404 whether missing or unpublished — never confirm which slugs exist.
  if (!profile || !profile.published_at) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // ── Resume ────────────────────────────────────────────────────────────────
  // The visitor's browser remembers only the session id; the transcript comes
  // back from the database, so what they see always matches what the agent will
  // actually be given as history. A stored transcript could drift from it.
  //
  // "Same visitor" is enforced with the ip_hash already on the row: a session id
  // that leaks (shared link, copied localStorage) does not open someone else's
  // conversation. It is a coarse check — the same office NAT shares a hash — but
  // it is the only identity a public page has without asking for a login, and it
  // fails closed: anything unexpected just starts a fresh session.
  if (typeof resume === 'string' && resume.length > 0) {
    const { data: prior } = await supabase
      .from('sessions')
      .select('id, candidate_id, source, messages, ended_at, ip_hash, last_activity_at')
      .eq('id', resume)
      .maybeSingle();

    const fresh = prior?.last_activity_at
      ? Date.now() - new Date(prior.last_activity_at).getTime() < STALE_MS
      : false;

    if (
      prior &&
      prior.source === 'public' &&
      prior.candidate_id === profile.id &&
      !prior.ended_at &&
      prior.ip_hash === ipHash &&
      fresh
    ) {
      // Not a new session, so it does not spend the session-create budget.
      return NextResponse.json({
        sessionId: prior.id,
        messages: (prior.messages ?? []) as Array<{ role: string; content: string }>,
        resumed: true,
      });
    }
  }

  const limit = await checkSessionCreate(supabase, ipHash);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many sessions. Please try again later.' }, { status: 429 });
  }

  await lazySweep(supabase);

  const now = new Date().toISOString();
  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      candidate_id: profile.id,
      source: 'public',
      ip_hash: ipHash,
      last_activity_at: now,
      messages: [],
    })
    .select('id')
    .single();

  if (error || !session) {
    console.error('[public/session] insert failed:', error);
    return NextResponse.json({ error: 'Could not start session' }, { status: 500 });
  }

  return NextResponse.json({ sessionId: session.id, messages: [], resumed: false });
}
