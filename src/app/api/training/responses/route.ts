import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('candidate_responses')
      .select('*')
      .eq('candidate_id', user.id)
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });

    return NextResponse.json({ responses: data ?? [] });
  } catch (err) {
    console.error('[training/responses GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as {
      module: string;
      question: string;
      answer_text?: string;
      answer_audio_transcript?: string;
    };

    if (!body.module || !body.question) {
      return NextResponse.json({ error: 'module and question are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('candidate_responses')
      .upsert(
        {
          candidate_id: user.id,
          module: body.module,
          question: body.question,
          answer_text: body.answer_text ?? null,
          answer_audio_transcript: body.answer_audio_transcript ?? null,
        },
        { onConflict: 'candidate_id,module,question' }
      )
      .select()
      .single();

    if (error) {
      console.error('[training/responses POST]', error);
      return NextResponse.json({ error: 'Failed to save response' }, { status: 500 });
    }

    return NextResponse.json({ success: true, response: data });
  } catch (err) {
    console.error('[training/responses POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
