import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { generateReport } from '@/lib/report';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const { data: session, error } = await supabase
    .from('sessions')
    .select('messages, recruiter_name, company')
    .eq('id', id)
    .single();

  if (error || !session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const messages = (session.messages ?? []) as Array<{ role: string; content: string }>;

  try {
    const report = await generateReport({
      messages,
      recruiterName: session.recruiter_name,
      company: session.company,
    });
    return NextResponse.json(report);
  } catch (err) {
    console.error('[api/report] generateReport failed:', err);
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 });
  }
}
