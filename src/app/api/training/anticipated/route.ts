// GET    /api/training/anticipated       — list the candidate's stored anticipated answers
// DELETE /api/training/anticipated?id=... — remove one (used for edit = delete + re-answer)

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await createServerSupabaseAuthClient();
  const { data: { user }, error: authErr } = await auth.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from('anticipated_questions')
    .select('id, topic, trigger_hint, answer, quality, updated_at')
    .eq('candidate_id', user.id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function DELETE(request: NextRequest) {
  const auth = await createServerSupabaseAuthClient();
  const { data: { user }, error: authErr } = await auth.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = createServerSupabaseClient();
  // Scope the delete to the owner — belt and braces on top of RLS.
  const { error } = await db.from('anticipated_questions').delete().eq('id', id).eq('candidate_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
