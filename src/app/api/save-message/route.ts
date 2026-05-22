import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, role, content } = await request.json() as {
      sessionId?: string;
      role?: string;
      content?: string;
    };

    if (!sessionId || !content || !['user', 'assistant'].includes(role ?? '')) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: session } = await supabase
      .from('sessions')
      .select('recruiter_name, email, company, role')
      .eq('id', sessionId)
      .single();

    const { error } = await supabase
      .from('message_events')
      .insert({
        session_id: sessionId,
        recruiter_name: session?.recruiter_name ?? null,
        email: session?.email ?? null,
        company: session?.company ?? null,
        role: session?.role ?? null,
        message_role: role,
        content,
      });

    if (error) {
      console.error('message_events insert failed (non-critical):', error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('save-message error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
