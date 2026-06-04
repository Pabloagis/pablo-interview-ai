import { NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { getAnthropicClient } from '@/lib/anthropic';
import { CLAUDE_MODEL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export interface AnalysisObjection {
  concern: string;
  why: string;
  priority: 'high' | 'medium';
  linked_module: string;
}

export interface AnalysisStrength {
  strength: string;
  why: string;
  how_to_surface: string;
}

export interface AnalysisResult {
  learned: string[];
  objections: AnalysisObjection[];
  hidden_strengths: AnalysisStrength[];
}

// GET — return existing analysis reconstructed from candidate_objections rows
export async function GET() {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await supabase
      .from('candidate_objections')
      .select('*')
      .eq('candidate_id', user.id)
      .order('created_at', { ascending: true });

    if (!data || data.length === 0) {
      return NextResponse.json({ analysis: null });
    }

    const objections: AnalysisObjection[] = data
      .filter(r => r.type === 'objection')
      .map(r => ({
        concern: r.concern,
        why: r.why ?? '',
        priority: (r.priority ?? 'medium') as 'high' | 'medium',
        linked_module: r.linked_module ?? '',
      }));

    const hidden_strengths: AnalysisStrength[] = data
      .filter(r => r.type === 'strength')
      .map(r => ({
        strength: r.concern,
        why: r.why ?? '',
        how_to_surface: r.how_to_surface ?? '',
      }));

    return NextResponse.json({
      analysis: { learned: [], objections, hidden_strengths },
    });
  } catch (err) {
    console.error('[training/analyze GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — run Claude analysis, persist results, return full analysis including learned[]
export async function POST() {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [profileRes, cvRes] = await Promise.all([
      supabase.from('profiles').select('career_goal').eq('id', user.id).single(),
      supabase.from('candidate_profiles').select('cv_data').eq('candidate_id', user.id).single(),
    ]);

    const careerGoal = profileRes.data?.career_goal;
    const cvData = cvRes.data?.cv_data;

    if (!cvData) {
      return NextResponse.json({ error: 'No CV uploaded yet.' }, { status: 400 });
    }
    if (!careerGoal) {
      return NextResponse.json({ error: 'Career goal not set.' }, { status: 400 });
    }

    const prompt = `You are an experienced recruiter and career strategist.
Analyse this CV for a candidate whose stated goal is: "${careerGoal}"

CV data:
${JSON.stringify(cvData, null, 2)}

Return only valid JSON — no markdown, no explanation, no code fences:
{
  "learned": [
    "3 to 5 short specific strings describing what you can see about this person from their CV — be specific to their actual background, not generic"
  ],
  "objections": [
    {
      "concern": "a specific recruiter concern based on this CV",
      "why": "why this concern arises from this specific background and goal",
      "priority": "high or medium",
      "linked_module": "which module best helps address this: story_library | recruiter_challenge | objection_handling | real_interview"
    }
  ],
  "hidden_strengths": [
    {
      "strength": "a specific strength visible in this CV that candidates often undersell",
      "why": "why this is a genuine strength relevant to their stated goal",
      "how_to_surface": "one concrete suggestion for how to bring this out in an interview"
    }
  ]
}

Aim for 3-5 learned items, 2-4 objections, 2-3 hidden strengths.
Be specific to this person's actual background. Do not use generic phrases.
Return only valid JSON.`;

    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/m, '').trim();

    let analysis: AnalysisResult;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      console.error('[training/analyze] Invalid JSON from Claude:', raw.slice(0, 300));
      return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
    }

    // Replace any existing analysis for this candidate
    await supabase.from('candidate_objections').delete().eq('candidate_id', user.id);

    const rows = [
      ...(analysis.objections ?? []).map(obj => ({
        candidate_id: user.id,
        type: 'objection' as const,
        concern: obj.concern,
        why: obj.why,
        priority: obj.priority,
        linked_module: obj.linked_module,
        how_to_surface: null,
      })),
      ...(analysis.hidden_strengths ?? []).map(str => ({
        candidate_id: user.id,
        type: 'strength' as const,
        concern: str.strength,
        why: str.why,
        priority: null,
        linked_module: null,
        how_to_surface: str.how_to_surface,
      })),
    ];

    if (rows.length > 0) {
      await supabase.from('candidate_objections').insert(rows);
    }

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error('[training/analyze POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
