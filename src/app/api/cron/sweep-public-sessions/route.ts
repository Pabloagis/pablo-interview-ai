import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { maybeSendReports } from '@/lib/public-report';

export const dynamic = 'force-dynamic';

const STALE_MS = 30 * 60 * 1000;

// Daily BACKSTOP only (Vercel Hobby cron max is daily). The End button + sendBeacon +
// the lazy sweep on session creation are the primary triggers; this catches anything
// that fell through — including ended sessions whose fire-and-forget report was dropped.
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const cutoff = new Date(Date.now() - STALE_MS).toISOString();

  // Public sessions still needing a report: not yet sent, under the attempt cap, and
  // either already ended or idle past the threshold.
  const { data: rows } = await supabase
    .from('sessions')
    .select('id, ended_at')
    .eq('source', 'public')
    .is('report_sent_at', null)
    .lt('report_attempts', 3)
    .or(`ended_at.not.is.null,last_activity_at.lt.${cutoff}`)
    .limit(50);

  let processed = 0;
  for (const row of rows ?? []) {
    if (!row.ended_at) {
      await supabase.from('sessions').update({ ended_at: new Date().toISOString() }).eq('id', row.id);
    }
    await maybeSendReports(row.id);
    processed++;
  }

  return NextResponse.json({ processed });
}
