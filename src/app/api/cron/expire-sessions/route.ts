import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  // Keep-alive read: confirms the DB is reachable before doing any writes.
  // This SELECT is what prevents Supabase from pausing the project due to inactivity.
  const { error: pingError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (pingError) {
    console.error('[cron/expire-sessions] DB ping failed:', pingError);
    return NextResponse.json({ error: pingError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('sessions')
    .update({ email_sent_at: new Date().toISOString() })
    .is('email_sent_at', null)
    .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .select('id');

  if (error) {
    console.error('[cron/expire-sessions] Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const count = data?.length ?? 0;
  console.log(`[cron/expire-sessions] Expired ${count} sessions`);
  return NextResponse.json({ alive: true, expired: count });
}
