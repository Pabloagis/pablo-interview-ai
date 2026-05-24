import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

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
  return NextResponse.json({ expired: count });
}
