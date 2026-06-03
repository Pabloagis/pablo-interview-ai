'use client';

import { useState, useEffect, useCallback } from 'react';
import EvidenceScore from './components/EvidenceScore';
import ModuleShell from './components/ModuleShell';
import LogoutButton from '../LogoutButton';
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
                {/* Module content — wired in Phase 5 */}
                <div className="text-xs text-[rgba(255,255,255,0.3)] italic py-2">
                  Module content coming in Phase 5…
                </div>
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

// Re-export for use in module components
export type { ScoreResult };
export { MODULE_META };
