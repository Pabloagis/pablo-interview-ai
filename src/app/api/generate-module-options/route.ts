import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { getAnthropicClient } from '@/lib/anthropic';
import { CLAUDE_MODEL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export interface GeneratedModuleOptions {
  options: { label: string; detail: string }[];
  suggested_question: string;
  coaching_tip: string;
}

// Per-module instructions sent to Claude alongside the full candidate context
const MODULE_INSTRUCTIONS: Record<string, string> = {
  career_goal: `Generate 4 specific career goals tailored to this person's actual background and experience.
option.label: a concrete, specific goal for this person (max 10 words — not generic).
option.detail: one sentence on why this goal is achievable given their specific history.
suggested_question: the question that would best reveal what they really want next.
coaching_tip: one insight on how to position their background for their target direction.`,

  hidden_strengths: `Generate 4 strengths this specific person has that candidates with their background typically undersell.
Base these on their actual roles, tenure, and language — not generic strengths.
option.label: the strength, phrased in plain language they would recognise.
option.detail: why this is genuinely valuable and how to surface it in an interview.
suggested_question: the question that would most reveal their strongest genuine differentiator.
coaching_tip: what most candidates in their position fail to articulate confidently.`,

  recruiter_concerns: `Generate 4 specific concerns a recruiter would raise about this exact profile.
Be direct — these are real objections, not softened versions.
option.label: the specific concern a recruiter would voice.
option.detail: why this concern arises from their specific background and target role.
suggested_question: the hardest question they need to be ready to answer.
coaching_tip: the most important objection to address first and how to reframe it.`,

  career_narrative: `Generate 4 compelling opening hooks for this person's "tell me about yourself" answer.
Each hook is a different angle — operational, commercial, personal journey, or transformation.
option.label: the first sentence of a narrative hook (their actual voice).
option.detail: how this hook leads into a strong positioning story for their goals.
suggested_question: the most powerful framing angle for their specific situation.
coaching_tip: what makes their narrative genuinely different from other candidates.`,

  story_evidence: `Generate 4 specific story areas this person should develop first, based on gaps and goals.
option.label: the story area or specific experience type to capture.
option.detail: why this story matters for their goals and what aspect to focus on.
suggested_question: the most important experience from their background that needs a full STAR story.
coaching_tip: what makes their stories different from other candidates in their space.`,

  communication_style: `Generate 4 questions that would reveal this specific person's authentic communication and working style.
Tailor questions to their background — someone from operations gets different questions than a pure sales person.
option.label: the question to ask them (write it as a direct question).
option.detail: what this question reveals about how they work and communicate.
suggested_question: the single question that would most reveal how they think under pressure.
coaching_tip: what communication strength their background suggests they naturally have.`,

  interview_readiness: `Generate 4 personalized challenge questions specific to this candidate's known vulnerabilities and target role.
These should be the hardest questions they are likely to face given their background.
option.label: the challenge question, written exactly as a recruiter would ask it.
option.detail: why this question is particularly relevant to their specific profile.
suggested_question: the question they are currently least prepared to answer well.
coaching_tip: how to reframe their biggest vulnerability into a credible strength.`,
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as { module?: string; regenerate?: boolean };
    const moduleName = body.module;

    if (!moduleName || !MODULE_INSTRUCTIONS[moduleName]) {
      return NextResponse.json({ error: 'Invalid module' }, { status: 400 });
    }

    // Fetch full candidate context
    const { data: contextRow } = await supabase
      .from('candidate_context')
      .select('context')
      .eq('candidate_id', user.id)
      .single();

    const ctx = (contextRow?.context ?? {}) as Record<string, unknown>;

    // Return cached unless regeneration forced
    if (!body.regenerate) {
      const cached = (ctx.generated_options as Record<string, unknown> | undefined)?.[moduleName];
      if (cached) return NextResponse.json({ options: cached as GeneratedModuleOptions, cached: true });
    }

    const prompt = `You are helping build a Career Digital Twin for a professional.
Here is everything we know about them so far:

${JSON.stringify(ctx, null, 2)}

Generate adaptive content for the "${moduleName}" step of their identity journey.

${MODULE_INSTRUCTIONS[moduleName]}

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "options": [
    { "label": "...", "detail": "..." },
    { "label": "...", "detail": "..." },
    { "label": "...", "detail": "..." },
    { "label": "...", "detail": "..." }
  ],
  "suggested_question": "...",
  "coaching_tip": "..."
}

Rules:
- Exactly 4 options — no more, no less
- Every option must be specific to this person — never generic filler
- Use their actual roles, companies, and language from the context where possible
- If context is thin, make confident inferences from what exists
- Never repeat information already confirmed in their context`;

    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/m, '').trim();

    let generated: GeneratedModuleOptions;
    try {
      generated = JSON.parse(cleaned);
    } catch {
      console.error('[generate-module-options] Invalid JSON from Claude:', raw.slice(0, 300));
      return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 });
    }

    // Cache in candidate_context.generated_options
    const existingGenerated = (ctx.generated_options ?? {}) as Record<string, unknown>;
    const updatedCtx = {
      ...ctx,
      generated_options: { ...existingGenerated, [moduleName]: generated },
    };

    await supabase.from('candidate_context').upsert(
      { candidate_id: user.id, context: updatedCtx, last_updated: new Date().toISOString() },
      { onConflict: 'candidate_id' }
    );

    return NextResponse.json({ options: generated, cached: false });
  } catch (err) {
    console.error('[generate-module-options]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
