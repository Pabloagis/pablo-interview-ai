'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import JourneyMap, { type StepState } from './journey/JourneyMap';
import LogoutButton from '../LogoutButton';
import CvUpload from './modules/CvUpload';
import type { ScoreResult } from '@/app/api/training/score/route';

// ── Types shared with module components ───────────────────────────────────────

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

// Re-exports used by consumers
export type { ScoreResult };

// ── Journey steps ─────────────────────────────────────────────────────────────

const JOURNEY_STEPS = [
  { number: 1, label: 'Import CV' },
  { number: 2, label: 'Career Goal' },
  { number: 3, label: 'AI Analysis' },
  { number: 4, label: 'Hidden Strengths' },
  { number: 5, label: 'Recruiter Concerns' },
  { number: 6, label: 'Career Narrative' },
  { number: 7, label: 'Story Evidence' },
  { number: 8, label: 'Communication Style' },
  { number: 9, label: 'Interview Readiness' },
  { number: 10, label: 'Final Review' },
] as const;

const CAREER_GOALS = [
  'Land more interviews',
  'Win the interviews I already have',
  'Change industry or sector',
  'Move into a more commercial role',
  'Build a stronger professional brand',
  'Explore a new career direction',
] as const;

// Placeholder descriptions shown in Phase 2 for steps 3-10
const STEP_PLACEHOLDER: Record<number, { title: string; subtitle: string; body: string }> = {
  3: {
    title: "Here's what I've learned.",
    subtitle: 'AI Analysis',
    body: 'Claude will analyse your CV against your career goal and surface hidden strengths and potential recruiter concerns specific to your background.',
  },
  4: {
    title: 'Review what your Digital Twin found.',
    subtitle: 'Hidden Strengths',
    body: 'Confirm, edit, or rewrite each strength identified in the AI analysis. This shapes how your Digital Twin represents you.',
  },
  5: {
    title: 'Build your responses.',
    subtitle: 'Recruiter Concerns',
    body: 'For each potential concern, decide whether to build a response now or flag it for later.',
  },
  6: {
    title: 'Your professional story, in your own words.',
    subtitle: 'Career Narrative',
    body: 'Build your career narrative through conversation — not a form. Your Digital Twin proposes based on your CV; you confirm or redirect.',
  },
  7: {
    title: 'The stories that make your Twin credible.',
    subtitle: 'Story Evidence',
    body: 'Walk through your key professional stories using the STAR format. Your Digital Twin proposes; you refine.',
  },
  8: {
    title: 'How you think and work.',
    subtitle: 'Communication Style',
    body: 'Answer questions about your work style and motivations. This is how your Digital Twin learns to sound like you.',
  },
  9: {
    title: 'Pressure-test your Digital Twin.',
    subtitle: 'Interview Readiness',
    body: 'Answer real interview and challenge questions. Voice recording available per question.',
  },
  10: {
    title: 'Your Digital Twin is ready.',
    subtitle: 'Final Review',
    body: 'See your full Identity Confidence Score with a breakdown of what your Digital Twin can and cannot yet discuss confidently.',
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  name: string;
  email: string;
}

export default function TrainingHub({ name, email }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [data, setData] = useState<TrainingData>({ stories: [], responses: [], rawData: [], cvLoaded: false });
  const [careerGoal, setCareerGoal] = useState<string | null>(null);
  const [analysisExists, setAnalysisExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveConfirmations, setSaveConfirmations] = useState<Record<string, string | null>>({});

  // Prevents auto-step re-triggering on every fetchAll
  const initialStepRef = useRef(false);

  const fetchAll = useCallback(async () => {
    try {
      const [scoreRes, storiesRes, responsesRes, rawRes, cvRes, goalRes, analysisRes] = await Promise.all([
        fetch('/api/training/score'),
        fetch('/api/training/stories'),
        fetch('/api/training/responses'),
        fetch('/api/training/raw-data'),
        fetch('/api/training/cv'),
        fetch('/api/training/career-goal'),
        fetch('/api/training/analyze'),
      ]);

      const [scoreData, storiesData, responsesData, rawData, cvData, goalData, analysisData] = await Promise.all([
        scoreRes.json(),
        storiesRes.json(),
        responsesRes.json(),
        rawRes.json(),
        cvRes.json(),
        goalRes.json(),
        analysisRes.json(),
      ]);

      const cvLoaded = !!cvData.cvData;
      const goal = goalData.career_goal ?? null;
      const hasAnalysis = !!analysisData.analysis;

      setScore(scoreData);
      setData({
        stories: storiesData.stories ?? [],
        responses: responsesData.responses ?? [],
        rawData: rawData.items ?? [],
        cvLoaded,
      });
      setCareerGoal(goal);
      setAnalysisExists(hasAnalysis);

      // On first load only, jump to the first incomplete step
      if (!initialStepRef.current) {
        initialStepRef.current = true;
        if (!cvLoaded) setCurrentStep(1);
        else if (!goal) setCurrentStep(2);
        else if (!hasAnalysis) setCurrentStep(3);
      }
    } catch (err) {
      console.error('[TrainingHub] fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onSaved = useCallback((moduleId: string, message?: string) => {
    setSaveConfirmations(prev => ({
      ...prev,
      [moduleId]: message ?? 'Your Digital Twin just learned something new.',
    }));
    fetchAll();
    setTimeout(() => setSaveConfirmations(prev => ({ ...prev, [moduleId]: null })), 4000);
  }, [fetchAll]);

  const advance = () => setCurrentStep(s => Math.min(s + 1, 10));
  const back = () => setCurrentStep(s => Math.max(s - 1, 1));

  // ── Step state computation for sidebar ───────────────────────────────────────

  const stepStates: StepState[] = JOURNEY_STEPS.map(step => {
    if (step.number === currentStep) return 'current';
    switch (step.number) {
      case 1: return data.cvLoaded ? 'completed' : 'upcoming';
      case 2: return careerGoal ? 'completed' : 'upcoming';
      case 3:
        if (analysisExists) return 'completed';
        return (data.cvLoaded && careerGoal) ? 'needs-evidence' : 'upcoming';
      default:
        return currentStep > step.number ? 'completed' : 'upcoming';
    }
  });

  // ── Step renderer ─────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (currentStep) {
      // ── Step 1: Import CV ────────────────────────────────────────────────────
      case 1:
        return (
          <div className="max-w-xl">
            <StepHeader number={1} title="Let's start with what you have." subtitle="Upload your CV and we'll take it from there." />
            <CvUpload data={data} onSaved={onSaved} />
            {saveConfirmations.cv && (
              <p className="mt-3 text-xs text-green-400">{saveConfirmations.cv}</p>
            )}
            {data.cvLoaded && (
              <button onClick={advance} className={CONTINUE_BTN + ' mt-6'}>
                Continue →
              </button>
            )}
          </div>
        );

      // ── Step 2: Career Goal ──────────────────────────────────────────────────
      case 2:
        return (
          <div className="max-w-xl">
            <StepHeader number={2} title="What are you trying to achieve?" subtitle="Your Digital Twin will be built around this." />
            <CareerGoalStep
              currentGoal={careerGoal}
              onSaved={goal => { setCareerGoal(goal); advance(); }}
            />
          </div>
        );

      // ── Steps 3-10: Phase 3 placeholders ────────────────────────────────────
      default: {
        const meta = STEP_PLACEHOLDER[currentStep];
        return (
          <div className="max-w-xl">
            <div className="mb-1">
              <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-widest">
                {meta.subtitle} · Step {currentStep} of 10
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1 mb-5">{meta.title}</h1>

            <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] p-5 mb-6">
              <p className="text-sm text-[rgba(255,255,255,0.5)] leading-relaxed">{meta.body}</p>
            </div>

            <div className="flex gap-3">
              {currentStep > 1 && (
                <button onClick={back} className={BACK_BTN}>← Back</button>
              )}
              {currentStep < 10 && (
                <button onClick={advance} className={SKIP_BTN}>Skip for now →</button>
              )}
            </div>
          </div>
        );
      }
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center">
        <p className="text-[rgba(255,255,255,0.3)] text-sm">Loading your Digital Twin…</p>
      </div>
    );
  }

  // ── Layout ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0f14]">

      {/* Left: Journey map */}
      <JourneyMap
        steps={JOURNEY_STEPS.map((s, i) => ({ number: s.number, label: s.label, state: stepStates[i] }))}
        currentStep={currentStep}
        onStepClick={setCurrentStep}
        confidenceScore={score?.total ?? 0}
        mobileOpen={mobileMapOpen}
        onMobileToggle={() => setMobileMapOpen(o => !o)}
      />

      {/* Right: Main content */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">

        {/* Top bar */}
        <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <button
            onClick={() => setMobileMapOpen(true)}
            className="lg:hidden text-xs text-[rgba(255,255,255,0.38)] hover:text-white transition-colors"
          >
            ☰ Journey
          </button>
          <span className="hidden lg:block text-xs text-[rgba(255,255,255,0.3)]">
            Build your Career Digital Twin
          </span>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-xs text-[rgba(255,255,255,0.25)]">{name}</span>
            <LogoutButton />
          </div>
        </header>

        {/* Step content */}
        <div className="flex-1 px-6 py-8">
          {renderStep()}
        </div>

        {/* Footer */}
        <footer className="shrink-0 px-6 pb-5">
          <p className="text-[10px] text-[rgba(255,255,255,0.18)] text-center">
            {email} · A professional representation built from evidence rather than assumptions.
          </p>
        </footer>
      </main>
    </div>
  );
}

// ── Button styles ─────────────────────────────────────────────────────────────

const CONTINUE_BTN = 'inline-flex px-6 py-2.5 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] text-white text-sm font-medium transition-colors';
const BACK_BTN = 'inline-flex px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.5)] hover:text-white text-sm transition-colors';
const SKIP_BTN = 'inline-flex px-5 py-2.5 rounded-xl bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.6)] hover:text-white text-sm transition-colors';

// ── Sub-components ────────────────────────────────────────────────────────────

function StepHeader({ number, title, subtitle }: { number: number; title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-widest">
        Step {number} of 10
      </span>
      <h1 className="text-xl font-bold text-white mt-1 mb-1">{title}</h1>
      <p className="text-sm text-[rgba(255,255,255,0.5)]">{subtitle}</p>
    </div>
  );
}

function CareerGoalStep({
  currentGoal,
  onSaved,
}: {
  currentGoal: string | null;
  onSaved: (goal: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSelect(goal: string) {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/training/career-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career_goal: goal }),
      });
      if (!res.ok) {
        const j = await res.json() as { error?: string };
        setError(j.error ?? 'Failed to save. Please try again.');
        return;
      }
      onSaved(goal);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-2 mb-4">
        {CAREER_GOALS.map(goal => (
          <button
            key={goal}
            onClick={() => !saving && handleSelect(goal)}
            disabled={saving}
            className={[
              'text-left px-4 py-3.5 rounded-xl border text-sm transition-all',
              currentGoal === goal
                ? 'border-[#4060d0] bg-[rgba(64,96,208,0.12)] text-white'
                : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[rgba(255,255,255,0.6)]',
              saving ? 'opacity-50 cursor-not-allowed' : 'hover:border-[rgba(255,255,255,0.20)] hover:text-white',
            ].join(' ')}
          >
            {goal}
          </button>
        ))}
      </div>
      {saving && <p className="text-xs text-[rgba(255,255,255,0.4)]">Saving…</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
