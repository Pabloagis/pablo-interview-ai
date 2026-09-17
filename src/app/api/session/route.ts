import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { notifyNewSession } from '@/lib/notify';
import { SessionCreateRequest, SessionCreateResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as {
      sessionId?: string;
      recruiterName?: string | null;
      company?: string | null;
      role?: string | null;
    };
    const { sessionId, recruiterName, company, role } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const payload: Record<string, unknown> = {};
    if (recruiterName) payload.recruiter_name = recruiterName;
    if (company)       payload.company        = company;
    if (role)          payload.role           = role;

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createServerSupabaseClient();

    // Read current session to check if this is the first time we're setting name/company/role
    const { data: current } = await supabase
      .from('sessions')
      .select('recruiter_name, company, role, email')
      .eq('id', sessionId)
      .single();

    const isFirstContext = current && !current.recruiter_name && !current.company && !current.role;

    const { error } = await supabase.from('sessions').update(payload).eq('id', sessionId);
    if (error) {
      console.error('[session PATCH] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notify Pablo when we first learn who is interviewing
    if (isFirstContext) {
      notifyNewSession(recruiterName || null, current?.email || null, company || null, role || null);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[session PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SessionCreateRequest = await request.json().catch(() => ({}));
    const { recruiterName, company, role, email, consentToEmail } = body;

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        recruiter_name: recruiterName || null,
        company: company || null,
        role: role || null,
        email: email || null,
        consent_to_email: consentToEmail ?? false,
        messages: [],
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    const response: SessionCreateResponse = {
      sessionId: data.id,
      createdAt: data.created_at,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Session creation error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
