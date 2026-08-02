import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { maybeSendReports } from '@/lib/public-report';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Called by the End-conversation button AND navigator.sendBeacon (pagehide).
// Beacon sends a Blob with type application/json, so request.json() works for both.
export async function POST(request: NextRequest) {
  let body: { sessionId?: string; recruiterName?: string; recruiterEmail?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { sessionId, recruiterName, recruiterEmail } = body;
  if (!sessionId) return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });

  const supabase = createServerSupabaseClient();

  const { data: session } = await supabase
    .from('sessions')
    .select('id, source, ended_at')
    .eq('id', sessionId)
    .single();
  if (!session || session.source !== 'public') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Persist optional visitor-supplied fields; never blank an existing value.
  const patch: Record<string, string> = {};
  if (!session.ended_at) patch.ended_at = new Date().toISOString();
  if (recruiterName?.trim()) patch.recruiter_name = recruiterName.trim();
  if (recruiterEmail?.trim()) patch.recruiter_email = recruiterEmail.trim();
  if (Object.keys(patch).length > 0) {
    await supabase.from('sessions').update(patch).eq('id', sessionId);
  }

  await maybeSendReports(sessionId);
  return NextResponse.json({ ok: true });
}
