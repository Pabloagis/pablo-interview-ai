import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('candidate_stories')
      .select('*')
      .eq('candidate_id', user.id)
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });

    return NextResponse.json({ stories: data ?? [] });
  } catch (err) {
    console.error('[training/stories GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as {
      story_type: string;
      situation?: string;
      task?: string;
      action?: string;
      result?: string;
    };

    if (!body.story_type) {
      return NextResponse.json({ error: 'story_type is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('candidate_stories')
      .upsert(
        {
          candidate_id: user.id,
          story_type: body.story_type,
          situation: body.situation ?? null,
          task: body.task ?? null,
          action: body.action ?? null,
          result: body.result ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'candidate_id,story_type' }
      )
      .select()
      .single();

    if (error) {
      console.error('[training/stories POST]', error);
      return NextResponse.json({ error: 'Failed to save story' }, { status: 500 });
    }

    return NextResponse.json({ success: true, story: data });
  } catch (err) {
    console.error('[training/stories POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
