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
  try {
    ({ slug } = (await request.json()) as { slug: string });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const ipHash = hashIp(ipFromRequest(request));

  const limit = await checkSessionCreate(supabase, ipHash);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many sessions. Please try again later.' }, { status: 429 });
  }

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

  return NextResponse.json({ sessionId: session.id });
}
