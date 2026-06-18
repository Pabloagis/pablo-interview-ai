import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await supabase
      .from('candidate_context')
      .select('context, last_updated')
      .eq('candidate_id', user.id)
      .single();

    return NextResponse.json({
      context: data?.context ?? null,
      last_updated: data?.last_updated ?? null,
    });
  } catch (err) {
    console.error('[training/context GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Merges partial context data into the existing record (one level deep for objects)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const incoming = await req.json() as Record<string, unknown>;

    const { data: existing } = await supabase
      .from('candidate_context')
      .select('context')
      .eq('candidate_id', user.id)
      .single();

    const base = (existing?.context ?? {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...base };

    for (const [key, value] of Object.entries(incoming)) {
      const baseVal = base[key];
      const isPlainObject = (v: unknown): v is Record<string, unknown> =>
        v !== null && typeof v === 'object' && !Array.isArray(v);

      if (isPlainObject(value) && isPlainObject(baseVal)) {
        merged[key] = { ...baseVal, ...value };
      } else {
        merged[key] = value;
      }
    }

    const { error } = await supabase
      .from('candidate_context')
      .upsert(
        { candidate_id: user.id, context: merged, last_updated: new Date().toISOString() },
        { onConflict: 'candidate_id' }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[training/context POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
