import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { getAnthropicClient } from '@/lib/anthropic';
import { CLAUDE_MODEL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

type WorkHistoryItem = { company: string; role: string; start_date: string; end_date: string; description: string };
type CVData = { full_name?: string; current_role?: string; work_history?: WorkHistoryItem[] };
type CandidateContextData = { hidden_strengths?: string[]; career_goals?: string[]; career_goal_text?: string };

function parseCareerGoal(raw: string | null): string {
  if (!raw) return '';
  try {
    const p = JSON.parse(raw) as { goals?: string[]; other?: string };
    return [p.goals?.join(', '), p.other?.trim()].filter(Boolean).join('. ');
  } catch { return raw; }
}

// POST — generate a fresh career narrative draft
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({})) as { angle?: string };
    const angle = body.angle ?? null; // optional reshaping instruction

    const [profileRes, cvRes, contextRes, objectionsRes] = await Promise.all([
      supabase.from('profiles').select('full_name, career_goal').eq('id', user.id).single(),
      supabase.from('candidate_profiles').select('cv_data').eq('candidate_id', user.id).single(),
      supabase.from('candidate_context').select('context').eq('candidate_id', user.id).single(),
      supabase.from('candidate_objections').select('type, concern').eq('candidate_id', user.id),
    ]);

    const cv = (cvRes.data?.cv_data ?? {}) as CVData;
    const ctx = (contextRes.data?.context ?? {}) as CandidateContextData;
    const name = profileRes.data?.full_name ?? cv.full_name ?? 'the candidate';
    const goalRaw = profileRes.data?.career_goal ?? null;
    const careerGoal = parseCareerGoal(goalRaw) || ctx.career_goals?.join(', ') || '';

    const strengths = [
      ...(ctx.hidden_strengths ?? []),
      ...((objectionsRes.data ?? []).filter(o => o.type === 'strength').map(o => o.concern)),
    ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);

    const workHistory = (cv.work_history ?? [])
      .map(j => `${j.role} at ${j.company} (${j.start_date}–${j.end_date})`)
      .join(' → ');

    const angleInstruction = angle
      ? `\n\nReshaping instruction: ${angle}`
      : '';

    const prompt = `You are helping a job candidate prepare for interviews. Write their answer to "Tell me about yourself."

Candidate: ${name}
Career goal: ${careerGoal || 'not specified'}
Career arc: ${workHistory || 'not provided'}
Key strengths: ${strengths.length ? strengths.join(', ') : 'not specified'}${angleInstruction}

Write a natural, authentic 130–180 word answer. Strict rules:
- First person throughout
- Grounded and specific — no corporate buzzwords ("leveraging synergies", "passionate about", "journey")
- Connect their career arc logically — make the path feel intentional
- End with where they're headed and why it makes sense given their background
- Sound like a real professional in a real conversation, not a pitch
- Do NOT open with "I" — find a more natural opening
- Do NOT use bullet points or headers
- If career goal or work history is sparse, write something honest and directional rather than padding

Return only the narrative text. No labels, no quotes, no explanation.`;

    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const narrative = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    if (!narrative) {
      return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ narrative });
  } catch (err) {
    console.error('[training/narrative POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
