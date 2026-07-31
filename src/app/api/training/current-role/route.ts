// ─────────────────────────────────────────────────────────────────────────────
// Add a role to the candidate's work history without re-uploading a CV.
//
// Why this exists: cv_data is what the RECRUITER DIRECTORY reads — current_role,
// skills, years_experience all come from it. A candidate who changes job and only
// tells the trainer would keep showing their old job to every recruiter, because
// the only writer of cv_data was the CV upload. Chat corrections fix what the agent
// SAYS; this fixes what the directory SHOWS.
//
// Every field is typed by the candidate. Nothing here is inferred — in particular
// the end date of the previous role is only written when they supply it, because
// guessing it would be inventing a fact about their history.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { computeAndPersistCoverage } from '@/lib/coverage-service';
import { COVERAGE_NODES, type CoverageNodeKey, type NodeState } from '@/lib/coverage-nodes';

export const dynamic = 'force-dynamic';

interface WorkEntry {
  company: string;
  role: string;
  start_date: string;
  end_date: string;
  description?: string;
}

interface RequestBody {
  company: string;
  role: string;
  start_date: string;
  end_date?: string | null;        // blank → this is their current role
  previous_end_date?: string | null; // closes still-open earlier entries, if given
}

// Values CV extraction uses for "still there", across the four platform languages.
const OPEN_ENDED = new Set([
  '', 'present', 'presente', 'actual', 'actualidad', 'current', 'now',
  'attuale', 'oggi', 'atual', 'hoje', 'hoy', 'ongoing',
]);

const isOpenEnded = (v: unknown) =>
  typeof v !== 'string' || OPEN_ENDED.has(v.trim().toLowerCase());

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseAuthClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const company    = body.company?.trim();
  const role       = body.role?.trim();
  const startDate  = body.start_date?.trim();
  const endDate    = body.end_date?.trim() ?? '';
  const prevEnd    = body.previous_end_date?.trim() ?? '';

  if (!company || !role || !startDate) {
    return NextResponse.json(
      { error: 'company, role and start_date are required' },
      { status: 400 }
    );
  }

  const { data: existing, error: readErr } = await supabase
    .from('candidate_profiles')
    .select('cv_data')
    .eq('candidate_id', user.id)
    .maybeSingle();

  if (readErr) {
    console.error('[training/current-role] read failed:', readErr.message);
    return NextResponse.json({ error: 'Could not read your profile' }, { status: 500 });
  }

  const cvData = { ...((existing?.cv_data ?? {}) as Record<string, unknown>) };
  const history = Array.isArray(cvData.work_history)
    ? [...(cvData.work_history as WorkEntry[])]
    : [];

  // Close out earlier open-ended roles ONLY with the date the candidate gave.
  // Left blank, previous roles are untouched — someone can legitimately hold two.
  const closed = prevEnd
    ? history.map(entry =>
        isOpenEnded(entry.end_date) ? { ...entry, end_date: prevEnd } : entry
      )
    : history;

  const newEntry: WorkEntry = {
    company,
    role,
    start_date: startDate,
    end_date: endDate,
  };

  // Newest first, matching how CV extraction returns work history.
  cvData.work_history = [newEntry, ...closed];

  // current_role drives the recruiter directory card, so it moves only when this
  // role is actually open-ended.
  if (!endDate) cvData.current_role = role;

  const { error: writeErr } = await supabase
    .from('candidate_profiles')
    .upsert(
      { candidate_id: user.id, cv_data: cvData, updated_at: new Date().toISOString() },
      { onConflict: 'candidate_id' }
    );

  if (writeErr) {
    console.error('[training/current-role] write failed:', writeErr.message);
    return NextResponse.json({ error: 'Could not save the role' }, { status: 500 });
  }

  // A new role can light role_history — recompute so the ring matches the data.
  let coverage: {
    nodeStates: Record<CoverageNodeKey, NodeState>;
    readiness: number;
    publishLevel: string;
  } | null = null;
  try {
    const result = await computeAndPersistCoverage(user.id, createServerSupabaseClient());
    coverage = {
      nodeStates: Object.fromEntries(
        COVERAGE_NODES.map(n => [n.key, result.nodes[n.key].state])
      ) as Record<CoverageNodeKey, NodeState>,
      readiness:    result.readiness,
      publishLevel: result.publishLevel,
    };
  } catch (err) {
    console.error('[training/current-role] coverage recompute failed (non-fatal):', err);
  }

  return NextResponse.json({ success: true, cvData, coverage });
}
