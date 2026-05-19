import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { SessionCreateRequest, SessionCreateResponse } from '@/lib/types';
import { isValidEmail } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body: SessionCreateRequest = await request.json();
    const { recruiterName, company, role, email, consentToEmail } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        recruiter_name: recruiterName || null,
        company: company || null,
        role: role || null,
        email: email,
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
