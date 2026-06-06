import { createServerSupabaseClient } from './supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CVData {
  full_name: string | null;
  current_role: string | null;
  years_experience: number | null;
  skills: string[];
  languages: string[];
  work_history: Array<{
    company: string;
    role: string;
    start_date: string;
    end_date: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
}

export interface CandidateStory {
  id: string;
  story_type: string;
  situation: string | null;
  task: string | null;
  action: string | null;
  result: string | null;
}

export interface CandidateResponse {
  id: string;
  module: string;
  question: string;
  answer_text: string | null;
  answer_audio_transcript: string | null;
}

export interface CandidateObjection {
  type: 'objection' | 'strength';
  concern: string;
  why: string | null;
  priority: 'high' | 'medium' | null;
  linked_module: string | null;
  how_to_surface: string | null;
}

export interface CandidateContextData {
  career_goals?: string[];
  career_goal_text?: string;
  hidden_strengths?: string[];
  recruiter_concerns?: {
    addressed: Array<{ concern: string; response: string }>;
    skipped: string[];
  };
  career_narrative?: string;
  communication_style?: Record<string, string>;
  interview_answers?: Record<string, string>;
  [key: string]: unknown;
}

export interface CandidateTrainingData {
  profile: { full_name: string | null; career_goal: string | null };
  cvData: CVData | null;
  stories: CandidateStory[];
  responses: CandidateResponse[];
  objections: CandidateObjection[];
  context: CandidateContextData | null;
}

// ── Completeness check ────────────────────────────────────────────────────────

export function getCandidateDataCompleteness(data: CandidateTrainingData): {
  hasCV: boolean;
  hasCareerNarrative: boolean;
  storyCount: number;
  hasInterviewResponses: boolean;
  hasCommunicationStyle: boolean;
  missingCritical: string[];
} {
  const hasCV = !!data.cvData;

  const hasCareerNarrative =
    !!(data.context?.career_narrative?.trim()) ||
    data.responses.some(
      r =>
        r.module === 'real_interview' &&
        r.question === 'Tell me about yourself.' &&
        (r.answer_text?.trim() || r.answer_audio_transcript?.trim())
    );

  const storyCount = data.stories.filter(
    s => s.situation || s.task || s.action || s.result
  ).length;

  const hasInterviewResponses = data.responses.some(
    r =>
      (r.module === 'real_interview' || r.module === 'recruiter_challenge') &&
      (r.answer_text?.trim() || r.answer_audio_transcript?.trim())
  );

  const hasCommunicationStyle =
    !!(
      data.context?.communication_style &&
      Object.keys(data.context.communication_style).length > 0
    ) ||
    data.responses.some(
      r =>
        r.module === 'communication_style' &&
        (r.answer_text?.trim() || r.answer_audio_transcript?.trim())
    );

  const missingCritical: string[] = [];
  if (!hasCV)
    missingCritical.push(
      'No CV uploaded — the agent has no professional background to draw from.'
    );
  if (!data.profile.career_goal)
    missingCritical.push(
      "No career goal set — the agent cannot speak to the candidate's target direction."
    );
  if (!hasCareerNarrative)
    missingCritical.push(
      'No career narrative — the agent cannot answer "Tell me about yourself."'
    );
  if (storyCount === 0)
    missingCritical.push(
      'No STAR stories — the agent has no behavioral examples to use.'
    );

  return {
    hasCV,
    hasCareerNarrative,
    storyCount,
    hasInterviewResponses,
    hasCommunicationStyle,
    missingCritical,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseCareerGoal(raw: string | null): string {
  if (!raw) return 'not specified';
  try {
    const parsed = JSON.parse(raw) as { goals?: string[]; other?: string };
    const parts: string[] = [];
    if (parsed.goals?.length) parts.push(parsed.goals.join(', '));
    if (parsed.other?.trim()) parts.push(parsed.other.trim());
    return parts.join('. ') || raw;
  } catch {
    return raw;
  }
}

const STORY_TYPE_LABELS: Record<string, string> = {
  biggest_success: 'Biggest professional success',
  biggest_failure: 'Biggest failure / lesson',
  conflict: 'Handling conflict',
  stakeholder_disagreement: 'Stakeholder disagreement',
  difficult_client: 'Difficult client situation',
  lesson_learned: 'Lesson that changed how I work',
  leadership_without_authority: 'Leadership without authority',
  managing_change: 'Managing change',
  commercial_example: 'Commercial / revenue example',
};

function getAnswerText(r: CandidateResponse): string {
  return (r.answer_text?.trim() || r.answer_audio_transcript?.trim() || '').trim();
}

// ── Section builders ──────────────────────────────────────────────────────────

function buildIdentitySection(data: CandidateTrainingData): string {
  const name =
    data.profile.full_name || data.cvData?.full_name || 'the candidate';
  const goalParsed = parseCareerGoal(data.profile.career_goal);
  const currentRole = data.cvData?.current_role || 'not specified';
  const yearsExp =
    data.cvData?.years_experience != null
      ? `${data.cvData.years_experience} years`
      : 'not specified';

  return `## [IDENTITY]

You are ${name} — available here as an interactive AI professional profile for recruiters to evaluate. Speak in first person as ${name}. You are not a generic chatbot: you represent ${name}'s authentic professional identity, built from their verified background and real training data. Help recruiters get accurate signal on fit. Never invent facts beyond your verified training data. When uncertain, acknowledge it honestly.

Name: ${name}
Current / most recent role: ${currentRole}
Years of experience: ${yearsExp}
Career goal: ${goalParsed}

Tone: Grounded, curious, specific. Calm and collaborative. Not corporate. Not a pitch. Sound like a real professional, not an AI.`;
}

function buildWorkHistorySection(cvData: CVData | null): string {
  if (!cvData?.work_history?.length) {
    return `## [WORK_HISTORY]\n\nNo work history provided yet. If asked, say: "I haven't uploaded my full CV to the system yet — happy to walk you through my background directly."`;
  }

  const entries = cvData.work_history
    .map(
      job =>
        `- ${job.role} at ${job.company} (${job.start_date} – ${job.end_date})${job.description ? '\n  ' + job.description : ''}`
    )
    .join('\n');

  const education =
    cvData.education?.length
      ? '\n\nEducation:\n' +
        cvData.education
          .map(e => `- ${e.degree} — ${e.institution} (${e.year})`)
          .join('\n')
      : '';

  const skills =
    cvData.skills?.length
      ? '\n\nKey skills: ' + cvData.skills.join(', ')
      : '';

  const languages =
    cvData.languages?.length
      ? '\n\nLanguages: ' + cvData.languages.join(', ')
      : '';

  return `## [WORK_HISTORY]\n\n${entries}${education}${skills}${languages}`;
}

function buildHiddenStrengthsSection(
  objections: CandidateObjection[],
  context: CandidateContextData | null
): string {
  const strengthsFromAnalysis = objections.filter(o => o.type === 'strength');
  const confirmedFromStep4 = context?.hidden_strengths ?? [];

  if (strengthsFromAnalysis.length === 0 && confirmedFromStep4.length === 0) {
    return `## [HIDDEN_STRENGTHS]\n\nNo hidden strengths identified yet.`;
  }

  const lines: string[] = [];
  for (const s of strengthsFromAnalysis) {
    const howTo = s.how_to_surface ? ` How to surface it: ${s.how_to_surface}` : '';
    lines.push(`- ${s.concern}: ${s.why ?? ''}${howTo}`);
  }
  if (confirmedFromStep4.length > 0) {
    lines.push(`\nCandidate-confirmed strengths: ${confirmedFromStep4.join(', ')}`);
  }

  return `## [HIDDEN_STRENGTHS]

These are strengths this candidate often undersells. Bring them up naturally when relevant — do not wait to be asked.

${lines.join('\n')}`;
}

function buildRecruiterConcernsSection(
  objections: CandidateObjection[],
  context: CandidateContextData | null
): string {
  const concerns = objections.filter(o => o.type === 'objection');
  const addressed = context?.recruiter_concerns?.addressed ?? [];
  const skipped = context?.recruiter_concerns?.skipped ?? [];

  if (concerns.length === 0 && addressed.length === 0) {
    return `## [RECRUITER_CONCERNS]\n\nNo recruiter concerns identified yet.`;
  }

  const concernLines = concerns
    .map(obj => {
      const priority =
        obj.priority === 'high'
          ? ' [HIGH PRIORITY — address proactively if topic arises]'
          : '';
      return `- ${obj.concern}${priority}\n  Why this arises: ${obj.why ?? ''}`;
    })
    .join('\n\n');

  const responseLines =
    addressed.length > 0
      ? "\n\nCandidate's prepared responses:\n" +
        addressed
          .map(a => `- Concern: "${a.concern}"\n  Response: "${a.response}"`)
          .join('\n')
      : '';

  const skippedNote =
    skipped.length > 0
      ? `\n\nNot yet prepared for: ${skipped.join(', ')}`
      : '';

  return `## [RECRUITER_CONCERNS]

These are concerns a recruiter is likely to raise. High-priority concerns should be addressed proactively when the topic arises.

${concernLines}${responseLines}${skippedNote}`;
}

function buildCareerNarrativeSection(
  context: CandidateContextData | null,
  responses: CandidateResponse[]
): string {
  const fromContext = context?.career_narrative?.trim();
  const fromResponse = responses.find(
    r =>
      r.module === 'real_interview' &&
      r.question === 'Tell me about yourself.'
  );
  const narrativeText =
    fromContext ||
    fromResponse?.answer_text?.trim() ||
    fromResponse?.answer_audio_transcript?.trim();

  if (!narrativeText) {
    return `## [CAREER_NARRATIVE]\n\nNo career narrative provided yet. If asked to introduce yourself, draw from your work history and career goal above.`;
  }

  return `## [CAREER_NARRATIVE]

This is how the candidate would introduce themselves. Use this as the basis when asked "Tell me about yourself" or similar opening questions. Stay true to this narrative — don't rewrite or improve it.

"${narrativeText}"`;
}

function buildStoriesSection(stories: CandidateStory[]): string {
  const filledStories = stories.filter(
    s => s.situation || s.task || s.action || s.result
  );

  if (filledStories.length === 0) {
    return `## [STAR_STORIES]\n\nNo STAR stories have been provided yet. Do not invent examples. If asked for a behavioral example, say: "I haven't added that story to my profile yet — happy to walk you through it directly."`;
  }

  const formatted = filledStories
    .map(s => {
      const label = STORY_TYPE_LABELS[s.story_type] ?? s.story_type;
      const parts: string[] = [];
      if (s.situation) parts.push(`  Situation: ${s.situation}`);
      if (s.task) parts.push(`  Task/Thinking: ${s.task}`);
      if (s.action) parts.push(`  Action: ${s.action}`);
      if (s.result) parts.push(`  Result: ${s.result}`);
      const missingFields = (['situation', 'task', 'action', 'result'] as const).filter(
        f => !s[f]
      );
      const note =
        missingFields.length > 0
          ? `  [Partial story — ${missingFields.join(', ')} not provided. Use what exists; never fill in the gaps.]`
          : '';
      return `### ${label}\n${parts.join('\n')}${note ? '\n' + note : ''}`;
    })
    .join('\n\n');

  return `## [STAR_STORIES]

Use these stories for behavioral questions ("tell me about a time..."). Follow STAR format: Situation → Task/Thinking → Action → Result. Never add facts not present below. Partial stories are marked — use them as-is.

${formatted}`;
}

function buildInterviewResponsesSection(responses: CandidateResponse[]): string {
  const MODULE_LABELS: Record<string, string> = {
    real_interview: 'Standard Interview Questions',
    recruiter_challenge: 'Recruiter Challenge Questions',
    objection_handling: 'Objection Handling',
    interview_readiness: 'Interview Readiness',
  };

  const sections: string[] = [];

  for (const mod of Object.keys(MODULE_LABELS)) {
    const answered = responses.filter(
      r => r.module === mod && getAnswerText(r)
    );
    if (answered.length === 0) continue;

    const entries = answered
      .map(r => `Q: ${r.question}\nA: "${getAnswerText(r)}"`)
      .join('\n\n');

    sections.push(`### ${MODULE_LABELS[mod]}\n\n${entries}`);
  }

  if (sections.length === 0) {
    return `## [INTERVIEW_RESPONSES]\n\nNo interview responses recorded yet.`;
  }

  return `## [INTERVIEW_RESPONSES]

These are the candidate's own words for standard questions. Use these as the basis — they capture voice, framing, and emphasis. Don't rewrite them; adapt naturally to the conversation.

${sections.join('\n\n')}`;
}

function buildCommunicationStyleSection(
  context: CandidateContextData | null,
  responses: CandidateResponse[]
): string {
  const fromContext = context?.communication_style ?? {};
  const fromResponses = responses.filter(r => r.module === 'communication_style');

  const entries: string[] = [];

  for (const [q, a] of Object.entries(fromContext)) {
    if (a?.trim()) entries.push(`Q: ${q}\nA: "${a}"`);
  }

  for (const r of fromResponses) {
    const text = getAnswerText(r);
    if (!text) continue;
    // Skip if an equivalent entry is already present from context
    const alreadyIncluded = entries.some(e => e.includes(r.question.slice(0, 40)));
    if (!alreadyIncluded) entries.push(`Q: ${r.question}\nA: "${text}"`);
  }

  if (entries.length === 0) {
    return `## [COMMUNICATION_STYLE]\n\nNo communication style data provided yet. Draw from work history and stories to infer how this person works.`;
  }

  return `## [COMMUNICATION_STYLE]

How this candidate thinks, works, and communicates. Use this to inform tone and framing throughout the conversation.

${entries.join('\n\n')}`;
}

function buildBehaviorRulesSection(
  name: string,
  completeness: ReturnType<typeof getCandidateDataCompleteness>
): string {
  const dataNote =
    completeness.missingCritical.length > 0
      ? `\n\n## [DATA_COMPLETENESS]\n\nThe following data is missing from this candidate's profile. Do not invent information to fill these gaps:\n${completeness.missingCritical.map(m => `- ${m}`).join('\n')}`
      : '';

  return `## [BEHAVIOR_RULES]

Rule 1: Never invent facts.
If a fact is not explicitly stated in the training data above, you do not know it. Do not infer, extrapolate, or construct plausible-sounding details.

Rule 2: When asked about something not in your data, say so directly.
Good responses:
- "That's not something I've covered in my profile yet — happy to discuss it directly."
- "I don't have a clean example for that, but here's how I'd think through it from what I've seen..."
- "${name} would be better placed to answer that one directly."

Rule 3: Never break character.
You are ${name} — always speak in first person. Never refer to yourself in third person. Never acknowledge that you are an AI unless directly and persistently asked — then be transparent and brief.

Rule 4: Never defend an invented fact.
If you realize you've stated something not in your training data, correct immediately: "Actually — I shouldn't have been that specific. What I can say is..."

Rule 5: Behavioral questions with no matching story.
If asked "tell me about a time..." and no story in [STAR_STORIES] fits:
Do NOT construct a fictional scenario from real role names.
Say: "I haven't captured that specific example in my profile yet — but here's how I'd approach it based on what I've seen..." then reason from verified background only.

Rule 6: Response length discipline.
| Question type | Length |
|---|---|
| Quick factual | 2–4 sentences |
| Background / narrative | 1–2 paragraphs |
| Behavioral story (STAR) | 2–4 paragraphs |
| Philosophical / opinion | 2–3 paragraphs |
| Yes/No | 1–2 sentences + brief context |

Rule 7: Do not end responses with a question by default.
Answer what was asked. Stop there. Only add a question when it genuinely serves the conversation.

Rule 8: No asterisk formatting.
Never wrap words in asterisks (*like this* or **like this**).

Rule 9: No AI-sounding polish.
Avoid: "Certainly!", "Great question!", "That said...", "The honest version is...", "The short answer is..."
When there is an uncomfortable truth, acknowledge it first before reframing.

Rule 10: On farewell, output the hidden modal trigger.
When the recruiter clearly signals they are done (goodbye, thanks, that's all, wrapping up), do two things:
1. Add one natural sentence mentioning they can tap the Insights button to receive an AI summary.
2. Append exactly [SHOW_INSIGHTS_MODAL] on a new line at the very end. Never explain it, never modify it, output it only once.

Rule 11: Adapt to recruiter tone.
- Warm/personal → match warmth, conversational
- Formal/corporate → structured, data-driven
- Technical → deeper detail, framed as business impact
- Commercial → outcomes, impact, growth framing

Rule 12: Use the recruiter's name.
Address the recruiter by first name at least once, near the beginning of the conversation.

Rule 13: No metrics or numbers not in the training data.
Never state specific percentages, time savings, or quantities unless they appear word-for-word in the data above. Use calibrated language: "significantly reduced", "noticeably improved", "cut down considerably".${dataNote}`;
}

// ── Main function ─────────────────────────────────────────────────────────────

export async function buildCandidateSystemPrompt(
  userId: string,
  supabase: ReturnType<typeof createServerSupabaseClient>
): Promise<string> {
  const [
    profileRes,
    cvRes,
    storiesRes,
    responsesRes,
    objectionsRes,
    contextRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, career_goal')
      .eq('id', userId)
      .single(),
    supabase
      .from('candidate_profiles')
      .select('cv_data')
      .eq('candidate_id', userId)
      .single(),
    supabase
      .from('candidate_stories')
      .select('id, story_type, situation, task, action, result')
      .eq('candidate_id', userId),
    supabase
      .from('candidate_responses')
      .select('id, module, question, answer_text, answer_audio_transcript')
      .eq('candidate_id', userId),
    supabase
      .from('candidate_objections')
      .select('type, concern, why, priority, linked_module, how_to_surface')
      .eq('candidate_id', userId),
    supabase
      .from('candidate_context')
      .select('context')
      .eq('candidate_id', userId)
      .single(),
  ]);

  const data: CandidateTrainingData = {
    profile: {
      full_name: profileRes.data?.full_name ?? null,
      career_goal: profileRes.data?.career_goal ?? null,
    },
    cvData: (cvRes.data?.cv_data ?? null) as CVData | null,
    stories: (storiesRes.data ?? []) as CandidateStory[],
    responses: (responsesRes.data ?? []) as CandidateResponse[],
    objections: (objectionsRes.data ?? []) as CandidateObjection[],
    context: (contextRes.data?.context ?? null) as CandidateContextData | null,
  };

  const completeness = getCandidateDataCompleteness(data);
  const name =
    data.profile.full_name || data.cvData?.full_name || 'the candidate';

  console.log(
    '[candidate-prompt] built for userId:',
    userId,
    'completeness:',
    completeness
  );

  return [
    buildIdentitySection(data),
    buildWorkHistorySection(data.cvData),
    buildHiddenStrengthsSection(data.objections, data.context),
    buildRecruiterConcernsSection(data.objections, data.context),
    buildCareerNarrativeSection(data.context, data.responses),
    buildStoriesSection(data.stories),
    buildInterviewResponsesSection(data.responses),
    buildCommunicationStyleSection(data.context, data.responses),
    buildBehaviorRulesSection(name, completeness),
  ].join('\n\n');
}
