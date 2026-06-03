'use client';

import { useState, useEffect, useCallback } from 'react';
import EvidenceScore from './components/EvidenceScore';
import ModuleShell from './components/ModuleShell';
import LogoutButton from '../LogoutButton';
import CvUpload from './modules/CvUpload';
import StoryLibrary from './modules/StoryLibrary';
import OpenResponseModule from './modules/OpenResponseModule';
import UploadModule from './modules/UploadModule';
import type { ScoreResult } from '@/app/api/training/score/route';

// ── Types shared across modules ──────────────────────────────────────────────

export interface Story {
  id: string;
  story_type: string;
  situation: string | null;
  task: string | null;
  action: string | null;
  result: string | null;
}

export interface Response {
  id: string;
  module: string;
  question: string;
  answer_text: string | null;
  answer_audio_transcript: string | null;
}

export interface RawDataItem {
  id: string;
  source_type: string;
  artifact_type: string | null;
  raw_text: string | null;
  file_name: string | null;
  created_at: string;
}

export interface TrainingData {
  stories: Story[];
  responses: Response[];
  rawData: RawDataItem[];
  cvLoaded: boolean;
}

// ── Module metadata ───────────────────────────────────────────────────────────

const MODULE_META = [
  {
    id: 'cv',
    title: 'CV Upload',
    description: 'Give your AI your career history. The foundation — not the ceiling.',
    valueLabel: '+10%',
    isHighValue: false,
  },
  {
    id: 'stories',
    title: 'Story Library',
    description: 'Interviewers always return to the same stories. Your AI needs to know yours — in detail, with specifics, in your own words.',
    valueLabel: '+5% per story, max +45%',
    isHighValue: false,
  },
  {
    id: 'real_interview',
    title: 'Real Interview Answers',
    description: "Answer these questions exactly as you would in a real interview. Don't polish. Don't perform. Your natural language is what your AI needs.",
    valueLabel: '+15%',
    isHighValue: false,
  },
  {
    id: 'recruiter_challenge',
    title: 'Recruiter Challenge',
    description: "These are the uncomfortable questions recruiters actually ask. Your AI needs to know how you defend yourself — not a polished answer, but your real one.",
    valueLabel: '+10%',
    isHighValue: false,
  },
  {
    id: 'objection_handling',
    title: 'Objection Handling',
    description: 'How you handle objections reveals more about your commercial instinct than any CV. Answer as you would in a real client conversation.',
    valueLabel: '+10%',
    isHighValue: false,
  },
  {
    id: 'interview_transcripts',
    title: 'Interview Transcripts',
    description: 'A single real interview transcript is worth more than all the forms in this system combined. It shows how you actually think, speak, and perform under real pressure.',
    valueLabel: '+20%',
    isHighValue: true,
  },
  {
    id: 'recruiter_feedback',
    title: 'Recruiter & Coach Feedback',
    description: 'External assessment of your profile — even rejections — contains signal your AI needs. This is how others see you, not how you see yourself.',
    valueLabel: '+15%',
    isHighValue: false,
  },
  {
    id: 'professional_artifacts',
    title: 'Professional Artifacts',
    description: 'What you have created reveals how you think better than any CV or form.',
    valueLabel: '+8%',
    isHighValue: false,
  },
  {
    id: 'ai_conversations',
    title: 'AI Conversation Exports',
    description: 'Long conversations with AI assistants about your career capture your real reasoning process. This is among the most valuable unstructured data you can give your AI.',
    valueLabel: '+8%',
    isHighValue: false,
  },
  {
    id: 'free_training',
    title: 'Free Training',
    description: "Raw notes, a philosophy, context that doesn't fit anywhere else. Exact wording matters — don't clean it up.",
    valueLabel: '+5%',
    isHighValue: false,
  },
] as const;

// ── Completion helpers ────────────────────────────────────────────────────────

function getCompletionLabel(
  moduleId: string,
  data: TrainingData,
  score: ScoreResult | null
): { label: string; complete: boolean } {
  const { stories, responses, rawData, cvLoaded } = data;

  const answeredIn = (mod: string) =>
    responses.filter(r => r.module === mod && (r.answer_text?.trim() || r.answer_audio_transcript?.trim())).length;

  const rawCount = (type: string) => rawData.filter(r => r.source_type === type).length;

  switch (moduleId) {
    case 'cv':
      return cvLoaded
        ? { label: 'CV uploaded', complete: true }
        : { label: 'Not uploaded', complete: false };
    case 'stories': {
      const done = stories.filter(s => s.situation || s.task || s.action || s.result).length;
      return done === 0
        ? { label: '0 / 9 stories', complete: false }
        : { label: `${done} / 9 ${done === 9 ? '✓' : 'stories'}`, complete: done === 9 };
    }
    case 'real_interview': {
      const done = answeredIn('real_interview');
      return { label: `${done} / 7 answered`, complete: done === 7 };
    }
    case 'recruiter_challenge': {
      const done = answeredIn('recruiter_challenge');
      return { label: `${done} / 5 answered`, complete: done === 5 };
    }
    case 'objection_handling': {
      const done = answeredIn('objection_handling');
      return { label: `${done} / 5 answered`, complete: done === 5 };
    }
    case 'interview_transcripts': {
      const n = rawCount('interview_transcript');
      return n === 0
        ? { label: 'Nothing uploaded yet', complete: false }
        : { label: `${n} transcript${n !== 1 ? 's' : ''} uploaded`, complete: true };
    }
    case 'recruiter_feedback': {
      const n = rawCount('recruiter_feedback');
      return n === 0
        ? { label: 'Nothing added yet', complete: false }
        : { label: `${n} item${n !== 1 ? 's' : ''} added`, complete: true };
    }
    case 'professional_artifacts': {
      const n = rawCount('professional_artifact');
      return n === 0
        ? { label: 'Nothing uploaded yet', complete: false }
        : { label: `${n} artifact${n !== 1 ? 's' : ''} uploaded`, complete: true };
    }
    case 'ai_conversations': {
      const n = rawCount('ai_conversation');
      return n === 0
        ? { label: 'Nothing uploaded yet', complete: false }
        : { label: `${n} export${n !== 1 ? 's' : ''} uploaded`, complete: true };
    }
    case 'free_training': {
      const n = rawCount('free_training');
      return n === 0
        ? { label: 'Nothing added yet', complete: false }
        : { label: `${n} item${n !== 1 ? 's' : ''} added`, complete: true };
    }
    default:
      return { label: '', complete: false };
  }
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  name: string;
  email: string;
}

export default function TrainingHub({ name, email }: Props) {
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [data, setData] = useState<TrainingData>({
    stories: [],
    responses: [],
    rawData: [],
    cvLoaded: false,
  });
  const [openModule, setOpenModule] = useState<string | null>(null);
  const [saveConfirmations, setSaveConfirmations] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [scoreRes, storiesRes, responsesRes, rawRes, cvRes] = await Promise.all([
        fetch('/api/training/score'),
        fetch('/api/training/stories'),
        fetch('/api/training/responses'),
        fetch('/api/training/raw-data'),
        fetch('/api/training/cv'),
      ]);

      const [scoreData, storiesData, responsesData, rawData, cvData] = await Promise.all([
        scoreRes.json(),
        storiesRes.json(),
        responsesRes.json(),
        rawRes.json(),
        cvRes.json(),
      ]);

      setScore(scoreData);
      setData({
        stories: storiesData.stories ?? [],
        responses: responsesData.responses ?? [],
        rawData: rawData.items ?? [],
        cvLoaded: !!cvData.cvData,
      });
    } catch (err) {
      console.error('[TrainingHub] fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Called by module components after a successful save
  const onSaved = useCallback((moduleId: string, message?: string) => {
    setSaveConfirmations(prev => ({
      ...prev,
      [moduleId]: message ?? 'Your AI just learned something new.',
    }));
    fetchAll();
    // Clear after 4s so the effect re-triggers next save
    setTimeout(() => {
      setSaveConfirmations(prev => ({ ...prev, [moduleId]: null }));
    }, 4000);
  }, [fetchAll]);

  const toggleModule = (id: string) =>
    setOpenModule(prev => (prev === id ? null : id));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center">
        <div className="text-[rgba(255,255,255,0.3)] text-sm">Loading your training hub…</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d0f14] px-4 py-10">
      <div className="w-full max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-1">
            <h1 className="text-xl font-bold text-white">Training Hub</h1>
            <LogoutButton />
          </div>
          <p className="text-[rgba(255,255,255,0.4)] text-sm">
            Welcome back, {name}. Every module you complete makes your AI more authentic.
          </p>
        </div>

        {/* Evidence Quality Score */}
        {score && <EvidenceScore score={score} />}

        {/* Module list */}
        <div className="flex flex-col gap-3">
          {MODULE_META.map(mod => {
            const completion = getCompletionLabel(mod.id, data, score);

            return (
              <ModuleShell
                key={mod.id}
                id={mod.id}
                title={mod.title}
                description={mod.description}
                valueLabel={mod.valueLabel}
                isHighValue={mod.isHighValue}
                completionLabel={completion.label}
                isComplete={completion.complete}
                isOpen={openModule === mod.id}
                onToggle={() => toggleModule(mod.id)}
                saveConfirmation={saveConfirmations[mod.id] ?? null}
              >
                {mod.id === 'cv' && (
                  <CvUpload data={data} onSaved={onSaved} />
                )}
                {mod.id === 'stories' && (
                  <StoryLibrary data={data} onSaved={onSaved} />
                )}
                {mod.id === 'real_interview' && (
                  <OpenResponseModule
                    moduleId="real_interview"
                    intro="Answer these questions exactly as you would in a real interview. Don't polish. Don't perform. Your natural language is what your AI needs."
                    questions={REAL_INTERVIEW_QUESTIONS}
                    data={data}
                    onSaved={onSaved}
                  />
                )}
                {mod.id === 'recruiter_challenge' && (
                  <OpenResponseModule
                    moduleId="recruiter_challenge"
                    intro="These are the uncomfortable questions recruiters actually ask. Your AI needs to know how you defend yourself — not a polished answer, but your real one."
                    questions={RECRUITER_CHALLENGE_QUESTIONS}
                    data={data}
                    onSaved={onSaved}
                  />
                )}
                {mod.id === 'objection_handling' && (
                  <OpenResponseModule
                    moduleId="objection_handling"
                    intro="How you handle objections reveals more about your commercial instinct than any CV. Answer as you would in a real client conversation."
                    questions={OBJECTION_QUESTIONS}
                    data={data}
                    onSaved={onSaved}
                  />
                )}
                {mod.id === 'interview_transcripts' && (
                  <UploadModule
                    moduleId="interview_transcripts"
                    sourceType="interview_transcript"
                    intro="A single real interview transcript is worth more than all the forms in this system combined. It shows how you actually think, speak, and perform under real pressure."
                    instructions={`If any interviews were recorded (Teams, Zoom, Meet):
1. Find the recording in your email or calendar
2. Transcribe free with: Otter.ai, Fireflies, or your video platform's built-in feature
3. Export as TXT or PDF and upload here

No recording? Write a reconstruction — even rough notes on what you were asked and how you answered are valuable.`}
                    data={data}
                    onSaved={onSaved}
                    saveMessage="Transcript processed. This is the most authentic training data your AI has received."
                  />
                )}
                {mod.id === 'recruiter_feedback' && (
                  <UploadModule
                    moduleId="recruiter_feedback"
                    sourceType="recruiter_feedback"
                    intro="External assessment of your profile — even rejections — contains signal your AI needs. This is how others see you, not how you see yourself."
                    instructions={`Search your inbox for:
- Post-interview feedback emails
- Recruiter debrief messages
- Career coach notes or summaries
- Any message that assessed your candidacy

Copy/paste directly or upload as PDF.`}
                    data={data}
                    onSaved={onSaved}
                    saveMessage="Feedback added. Your AI now has an external perspective on you."
                  />
                )}
                {mod.id === 'professional_artifacts' && (
                  <UploadModule
                    moduleId="professional_artifacts"
                    sourceType="professional_artifact"
                    intro="What you have created reveals how you think better than any CV or form."
                    instructions="Upload LinkedIn posts, project documentation, presentations, case studies, cover letters, portfolio material, or paste a personal website URL."
                    artifactTypes={[
                      { value: 'post', label: 'LinkedIn post' },
                      { value: 'project', label: 'Project / case study' },
                      { value: 'cover_letter', label: 'Cover letter' },
                      { value: 'presentation', label: 'Presentation' },
                      { value: 'application', label: 'Job application' },
                      { value: 'other', label: 'Other' },
                    ]}
                    data={data}
                    onSaved={onSaved}
                    saveMessage="Artifact added. Your AI just saw how you work."
                  />
                )}
                {mod.id === 'ai_conversations' && (
                  <UploadModule
                    moduleId="ai_conversations"
                    sourceType="ai_conversation"
                    intro="Long conversations with AI assistants about your career capture your real reasoning process. This is among the most valuable unstructured data you can give your AI."
                    instructions={`Export conversations where you discussed career decisions, interview prep, professional challenges, or goals.

- ChatGPT: Settings → Data Controls → Export Data
- Claude: Download conversation from chat menu

Upload the exported file (TXT, JSON) or paste directly.`}
                    data={data}
                    onSaved={onSaved}
                    saveMessage="Conversation added. Your AI just saw how you reason."
                  />
                )}
                {mod.id === 'free_training' && (
                  <UploadModule
                    moduleId="free_training"
                    sourceType="free_training"
                    intro="Raw notes, a philosophy, context that doesn't fit anywhere else. Exact wording matters — don't clean it up."
                    instructions=""
                    data={data}
                    onSaved={onSaved}
                    saveMessage="Added. Your AI will factor this in."
                  />
                )}
              </ModuleShell>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-[rgba(255,255,255,0.2)]">
            {email} · Training saves automatically
          </p>
        </div>
      </div>
    </main>
  );
}

// ── Question data for open-response modules ──────────────────────────────────

const REAL_INTERVIEW_QUESTIONS = [
  { question: 'Tell me about yourself.', microcopy: 'Your natural answer — not a rehearsed pitch. What do you actually say?' },
  { question: 'Why are you looking for a new role?', microcopy: 'Honest and grounded. Recruiters hear rehearsed answers constantly.' },
  { question: 'Tell me about a time you failed.', microcopy: 'Pick a real one. How you talk about failure says more than the failure itself.' },
  { question: "What's your biggest weakness?", microcopy: 'Avoid clichés. Pick something real and show how you manage it.' },
  { question: 'Where do you see yourself in three years?', microcopy: 'Be honest about your direction — vague answers are forgettable.' },
  { question: 'Why do you want to work in this industry?', microcopy: 'What actually draws you here? The real reason matters.' },
  { question: 'What makes you different from other candidates?', microcopy: "Don't perform. What do you genuinely bring that others don't?" },
];

const RECRUITER_CHALLENGE_QUESTIONS = [
  { question: 'Your CV shows only a few months in SaaS. Why are you qualified for this role?', microcopy: 'This is a real objection. How do you actually handle it?' },
  { question: 'Why should we hire you over someone with more direct experience?', microcopy: 'Make your case. Not a polished one — your real one.' },
  { question: "You've moved roles quite frequently. How do we know you'll stay?", microcopy: "Answer directly. Don't deflect or over-explain." },
  { question: "Your background is operations, not sales. Why do you think you can sell?", microcopy: 'Show your commercial instinct through how you argue this.' },
  { question: "What's the gap between where you are now and where this role needs you to be?", microcopy: 'Honesty here builds more trust than a defensive answer.' },
];

const OBJECTION_QUESTIONS = [
  { question: 'The client says your solution is too expensive.', microcopy: 'Answer as you would in a real client conversation — not a training exercise.' },
  { question: 'The GM refuses to change the current process.', microcopy: 'How do you handle resistance from someone with authority?' },
  { question: 'The client is happy with their existing vendor.', microcopy: "What's your honest approach when the door seems closed?" },
  { question: 'The implementation is taking longer than expected and the client is frustrated.', microcopy: 'How you manage this moment reveals your commercial instinct.' },
  { question: "The client asks for a feature you don't have.", microcopy: "What do you actually say? Don't script it." },
];

// Re-export for use in module components
export type { ScoreResult };
export { MODULE_META };
