import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { computeAndPersistCoverage } from '@/lib/coverage-service';

export const dynamic = 'force-dynamic';

// GET /api/training/coverage — returns pre-computed rows from coverage_nodes table
export async function GET() {
  const auth = await createServerSupabaseAuthClient();
  const { data: { user }, error: authErr } = await auth.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('coverage_nodes')
    .select('node_key, state, score, evidence_ids, updated_at')
    .eq('candidate_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ nodes: data ?? [] });
}

// POST /api/training/coverage — recompute coverage from the UNION of legacy journey
// data + evidence_items, then upsert. Shares computeAndPersistCoverage with the
// trainer extract route so a manual recompute can never wipe conversational coverage.
export async function POST(_req: NextRequest) {
  const auth = await createServerSupabaseAuthClient();
  const { data: { user }, error: authErr } = await auth.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const result   = await computeAndPersistCoverage(user.id, supabase);

  return NextResponse.json({
    nodes: result.nodes,
    readiness: result.readiness,
    publishLevel: result.publishLevel,
  });
}
