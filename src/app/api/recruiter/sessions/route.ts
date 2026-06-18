import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export interface SessionHistoryItem {
  id: string;
  candidate_id: string;
  candidate_name: string;
  company: string | null;
  role: string | null;
  created_at: string;
}

// POST — create a recruiter-initiated session for a specific candidate
export async function POST(request: NextRequest) {
  try {
    const authClient = await createServerSupabaseAuthClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: recruiterProfile } = await authClient
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();
    if (recruiterProfile?.role !== 'recruiter') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json() as { candidate_id?: string };
    const { candidate_id } = body;
    if (!candidate_id) {
      return NextResponse.json({ error: 'candidate_id is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Verify the target is a real candidate
    const { data: candidateProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', candidate_id)
      .single();

    if (!candidateProfile || candidateProfile.role !== 'candidate') {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        recruiter_name: recruiterProfile.full_name ?? null,
        candidate_id,
        recruiter_id: user.id,
        messages: [],
        consent_to_email: false,
      })
      .select('id')
      .single();

    if (error || !session) {
      console.error('[recruiter/sessions POST]', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    console.error('[recruiter/sessions POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET — list this recruiter's past sessions that are linked to a candidate
export async function GET() {
  try {
    const authClient = await createServerSupabaseAuthClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'recruiter') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createServerSupabaseClient();

    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, candidate_id, company, role, created_at')
      .eq('recruiter_id', user.id)
      .not('candidate_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ sessions: [] });
    }

    // Resolve candidate names in a single query
    const candidateIds = [
      ...new Set(
        sessions
          .map(s => s.candidate_id)
          .filter((id): id is string => id !== null)
      ),
    ];

    const { data: candidateProfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', candidateIds);

    const nameById = new Map(
      (candidateProfiles ?? []).map(p => [p.id, p.full_name ?? 'Unknown'])
    );

    const result: SessionHistoryItem[] = sessions.map(s => ({
      id: s.id,
      candidate_id: s.candidate_id!,
      candidate_name: nameById.get(s.candidate_id ?? '') ?? 'Unknown',
      company: s.company,
      role: s.role,
      created_at: s.created_at,
    }));

    return NextResponse.json({ sessions: result });
  } catch (err) {
    console.error('[recruiter/sessions GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
