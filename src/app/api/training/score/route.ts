import { NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import {
  STORY_TYPES,
  REAL_INTERVIEW_QUESTIONS,
  RECRUITER_CHALLENGE_QUESTIONS,
  OBJECTION_QUESTIONS,
  scoreLabel,
} from '@/lib/training-constants';

export const dynamic = 'force-dynamic';

export interface ScoreBreakdown {
  cv: number;
  stories: number;
  real_interview_answers: number;
  recruiter_challenge: number;
  objection_handling: number;
  interview_transcripts: number;
  recruiter_feedback: number;
  professional_artifacts: number;
  ai_conversations: number;
  free_training: number;
}

export interface ScoreResult {
  total: number;
  breakdown: ScoreBreakdown;
  label: string;
  qualitySignals: string[];
}


function buildQualitySignals(breakdown: ScoreBreakdown): string[] {
  const signals: string[] = [];

  // Ordered by value — highest missing sources first
  if (breakdown.interview_transcripts === 0) {
    signals.push(
      "Your AI has never seen a real interview. This is the single most valuable thing you can upload."
    );
  }
  if (breakdown.recruiter_feedback === 0) {
    signals.push(
      "Your AI has no external evidence about you. Recruiter feedback would change that significantly."
    );
  }
  if (breakdown.real_interview_answers === 0) {
    signals.push(
      "Your AI knows your CV but has never heard you argue your case. Complete the Real Interview Answers module."
    );
  }
  if (breakdown.recruiter_challenge === 0) {
    signals.push(
      "Your AI doesn't know how you defend yourself under pressure. Complete the Recruiter Challenge module."
    );
  }
  if (breakdown.objection_handling === 0) {
    signals.push(
      "Your AI doesn't know how you handle objections. This matters most for sales and CS roles."
    );
  }
  if (breakdown.cv === 0) {
    signals.push(
      "Your AI doesn't have your CV yet. Upload it to give your AI your career history."
    );
  }
  if (breakdown.stories < 25) {
    const completed = Math.round(breakdown.stories / 5);
    signals.push(
      `Your AI knows ${completed} of 9 stories. Stories are how interviewers remember you.`
    );
  }

  return signals.slice(0, 3);
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseAuthClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [profileRes, storiesRes, responsesRes, rawDataRes] = await Promise.all([
      supabase.from('candidate_profiles').select('cv_data').eq('candidate_id', user.id).single(),
      supabase.from('candidate_stories').select('story_type, situation, task, action, result').eq('candidate_id', user.id),
      supabase.from('candidate_responses').select('module, question, answer_text, answer_audio_transcript').eq('candidate_id', user.id),
      supabase.from('candidate_raw_data').select('source_type').eq('candidate_id', user.id),
    ]);

    const breakdown: ScoreBreakdown = {
      cv: 0,
      stories: 0,
      real_interview_answers: 0,
      recruiter_challenge: 0,
      objection_handling: 0,
      interview_transcripts: 0,
      recruiter_feedback: 0,
      professional_artifacts: 0,
      ai_conversations: 0,
      free_training: 0,
    };

    // CV: +10 if uploaded and has data
    if (profileRes.data?.cv_data) breakdown.cv = 10;

    // Stories: +5 per story with at least one field filled, max 45
    const stories = storiesRes.data ?? [];
    const completedStories = stories.filter(
      s => s.situation || s.task || s.action || s.result
    ).length;
    breakdown.stories = Math.min(completedStories * 5, 45);

    // Module responses
    const responses = responsesRes.data ?? [];
    const hasAnswer = (q: string, module: string) =>
      responses.some(
        r => r.module === module && r.question === q &&
        (r.answer_text?.trim() || r.answer_audio_transcript?.trim())
      );

    const answeredRealInterview = REAL_INTERVIEW_QUESTIONS.filter(
      q => hasAnswer(q, 'real_interview')
    ).length;
    if (answeredRealInterview > 0) {
      breakdown.real_interview_answers = Math.round((answeredRealInterview / REAL_INTERVIEW_QUESTIONS.length) * 15);
    }

    const answeredChallenge = RECRUITER_CHALLENGE_QUESTIONS.filter(
      q => hasAnswer(q, 'recruiter_challenge')
    ).length;
    if (answeredChallenge > 0) {
      breakdown.recruiter_challenge = Math.round((answeredChallenge / RECRUITER_CHALLENGE_QUESTIONS.length) * 10);
    }

    const answeredObjections = OBJECTION_QUESTIONS.filter(
      q => hasAnswer(q, 'objection_handling')
    ).length;
    if (answeredObjections > 0) {
      breakdown.objection_handling = Math.round((answeredObjections / OBJECTION_QUESTIONS.length) * 10);
    }

    // Raw data sources
    const rawItems = rawDataRes.data ?? [];
    const countByType = (type: string) => rawItems.filter(r => r.source_type === type).length;

    if (countByType('interview_transcript') > 0) breakdown.interview_transcripts = 20;
    if (countByType('recruiter_feedback') > 0) breakdown.recruiter_feedback = 15;
    if (countByType('professional_artifact') > 0) breakdown.professional_artifacts = 8;
    if (countByType('ai_conversation') > 0) breakdown.ai_conversations = 8;
    if (countByType('free_training') > 0) breakdown.free_training = 5;

    const total = Math.min(
      Object.values(breakdown).reduce((a, b) => a + b, 0),
      100
    );

    const result: ScoreResult = {
      total,
      breakdown,
      label: scoreLabel(total),
      qualitySignals: buildQualitySignals(breakdown),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[training/score]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

