import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await supabase
      .from('profiles')
      .select('career_goal')
      .eq('id', user.id)
      .single();

    return NextResponse.json({ career_goal: data?.career_goal ?? null });
  } catch (err) {
    console.error('[training/career-goal GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as { career_goal?: string };
    if (!body.career_goal?.trim()) {
      return NextResponse.json({ error: 'career_goal is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('profiles')
      .update({ career_goal: body.career_goal.trim() })
      .eq('id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[training/career-goal POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
