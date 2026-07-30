import { NextResponse } from 'next/server';
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

// POST removed with /interview. It minted an empty session for the recruiter-only
// chat page; in v3 a recruiter simply opens the candidate's public agent at /<slug>,
// which creates its own session through /api/public/session. The old insert also set
// `consent_to_email`, a column the v3 schema clean-up drops.

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
