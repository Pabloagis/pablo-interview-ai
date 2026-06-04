'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import JourneyMap, { type StepState } from './journey/JourneyMap';
import LogoutButton from '../LogoutButton';
import CvUpload from './modules/CvUpload';
import Step3Analysis from './journey/steps/Step3Analysis';
import Step4HiddenStrengths from './journey/steps/Step4HiddenStrengths';
import Step5RecruiterConcerns from './journey/steps/Step5RecruiterConcerns';
import Step6CareerNarrative from './journey/steps/Step6CareerNarrative';
import Step7StoryEvidence from './journey/steps/Step7StoryEvidence';
import Step8CommunicationStyle from './journey/steps/Step8CommunicationStyle';
import Step9InterviewReadiness from './journey/steps/Step9InterviewReadiness';
import Step10FinalReview from './journey/steps/Step10FinalReview';
import type { ScoreResult } from '@/app/api/training/score/route';
import type { AnalysisResult } from '@/app/api/training/analyze/route';
import type { GeneratedModuleOptions } from '@/app/api/generate-module-options/route';

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
  { number: 1,  label: 'Import CV' },
  { number: 2,  label: 'Career Goal' },
  { number: 3,  label: 'AI Analysis' },
  { number: 4,  label: 'Hidden Strengths' },
  { number: 5,  label: 'Recruiter Concerns' },
  { number: 6,  label: 'Career Narrative' },
  { number: 7,  label: 'Story Evidence' },
  { number: 8,  label: 'Communication Style' },
  { number: 9,  label: 'Interview Readiness' },
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
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [candidateContext, setCandidateContext] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveConfirmations, setSaveConfirmations] = useState<Record<string, string | null>>({});

  const initialStepRef = useRef(false);

  const fetchAll = useCallback(async () => {
    try {
      const [scoreRes, storiesRes, responsesRes, rawRes, cvRes, goalRes, analysisRes, contextRes] = await Promise.all([
        fetch('/api/training/score'),
        fetch('/api/training/stories'),
        fetch('/api/training/responses'),
        fetch('/api/training/raw-data'),
        fetch('/api/training/cv'),
        fetch('/api/training/career-goal'),
        fetch('/api/training/analyze'),
        fetch('/api/training/context'),
      ]);

      const [scoreData, storiesData, responsesData, rawData, cvData, goalData, analysisData, contextData] = await Promise.all([
        scoreRes.json(),
        storiesRes.json(),
        responsesRes.json(),
        rawRes.json(),
        cvRes.json(),
        goalRes.json(),
        analysisRes.json(),
        contextRes.json(),
      ]);

      const cvLoaded   = !!cvData.cvData;
      const goal       = goalData.career_goal ?? null;
      const analysisResult = analysisData.analysis ?? null;

      setScore(scoreData);
      setData({
        stories:  storiesData.stories  ?? [],
        responses: responsesData.responses ?? [],
        rawData:  rawData.items ?? [],
        cvLoaded,
      });
      setCareerGoal(goal);
      setAnalysis(analysisResult);
      setCandidateContext(contextData.context ?? null);

      // On first load, jump to first incomplete step
      if (!initialStepRef.current) {
        initialStepRef.current = true;
        if (!cvLoaded)       setCurrentStep(1);
        else if (!goal)      setCurrentStep(2);
        else if (!analysisResult) setCurrentStep(3);
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

  const advance  = () => setCurrentStep(s => Math.min(s + 1, 10));
  const back     = () => setCurrentStep(s => Math.max(s - 1, 1));

  // Sync AI analysis into candidate_context once so generate-module-options can use it
  useEffect(() => {
    if (!analysis) return;
    const existing = (candidateContext?.ai_analysis ?? null);
    if (existing) return; // already synced
    fetch('/api/training/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ai_analysis: analysis }),
    }).catch(() => {});
  }, [analysis, candidateContext]);

  // ── Step state computation ────────────────────────────────────────────────

  const stepStates: StepState[] = JOURNEY_STEPS.map(step => {
    if (step.number === currentStep) return 'current';
    switch (step.number) {
      case 1: return data.cvLoaded ? 'completed' : 'upcoming';
      case 2: return careerGoal ? 'completed' : 'upcoming';
      case 3:
        if (analysis) return 'completed';
        return (data.cvLoaded && careerGoal) ? 'needs-evidence' : 'upcoming';
      default:
        return currentStep > step.number ? 'completed' : 'upcoming';
    }
  });

  // ── Step renderer ─────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="max-w-xl">
            <StepHeader number={1} title="Let's start with what you have." subtitle="Upload your CV and we'll take it from there." />
            <CvUpload data={data} onSaved={onSaved} />
            {saveConfirmations.cv && (
              <p className="mt-3 text-xs text-green-400">{saveConfirmations.cv}</p>
            )}
            {data.cvLoaded && (
              <button onClick={advance} className={`${BTN_PRIMARY} mt-6`}>
                Continue →
              </button>
            )}
          </div>
        );

      case 2: {
        const goalOptions = (
          (candidateContext?.generated_options as Record<string, GeneratedModuleOptions> | undefined)
        )?.career_goal ?? null;
        return (
          <div className="max-w-xl">
            <StepHeader number={2} title="What are you trying to achieve?" subtitle="Your Digital Twin will be built around this." />
            <CareerGoalStep
              currentGoal={careerGoal}
              moduleOptions={goalOptions}
              onSaved={goal => { setCareerGoal(goal); advance(); }}
            />
          </div>
        );
      }

      case 3:
        return (
          <Step3Analysis
            analysis={analysis}
            onAdvance={advance}
            onBack={back}
            onAnalyzed={fetchAll}
          />
        );

      case 4: {
        const opts4 = ((candidateContext?.generated_options as Record<string, GeneratedModuleOptions> | undefined))?.hidden_strengths ?? null;
        return (
          <Step4HiddenStrengths
            analysis={analysis}
            moduleOptions={opts4}
            onAdvance={advance}
            onBack={back}
          />
        );
      }

      case 5: {
        const opts5 = ((candidateContext?.generated_options as Record<string, GeneratedModuleOptions> | undefined))?.recruiter_concerns ?? null;
        return (
          <Step5RecruiterConcerns
            analysis={analysis}
            moduleOptions={opts5}
            onAdvance={advance}
            onBack={back}
            onNavigate={setCurrentStep}
          />
        );
      }

      case 6: {
        const opts6 = ((candidateContext?.generated_options as Record<string, GeneratedModuleOptions> | undefined))?.career_narrative ?? null;
        return (
          <Step6CareerNarrative
            data={data}
            moduleOptions={opts6}
            onSaved={onSaved}
            onAdvance={advance}
            onBack={back}
          />
        );
      }

      case 7: {
        const opts7 = ((candidateContext?.generated_options as Record<string, GeneratedModuleOptions> | undefined))?.story_evidence ?? null;
        return (
          <Step7StoryEvidence
            data={data}
            moduleOptions={opts7}
            onSaved={onSaved}
            onAdvance={advance}
            onBack={back}
          />
        );
      }

      case 8: {
        const opts8 = ((candidateContext?.generated_options as Record<string, GeneratedModuleOptions> | undefined))?.communication_style ?? null;
        return (
          <Step8CommunicationStyle
            data={data}
            moduleOptions={opts8}
            onSaved={onSaved}
            onAdvance={advance}
            onBack={back}
          />
        );
      }

      case 9: {
        const opts9 = ((candidateContext?.generated_options as Record<string, GeneratedModuleOptions> | undefined))?.interview_readiness ?? null;
        return (
          <Step9InterviewReadiness
            data={data}
            moduleOptions={opts9}
            onSaved={onSaved}
            onAdvance={advance}
            onBack={back}
          />
        );
      }

      case 10:
        return (
          <Step10FinalReview
            score={score}
            onNavigate={setCurrentStep}
            onBack={back}
          />
        );

      default:
        return null;
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center">
        <p className="text-[rgba(255,255,255,0.3)] text-sm">Loading your Digital Twin…</p>
      </div>
    );
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0f14]">

      <JourneyMap
        steps={JOURNEY_STEPS.map((s, i) => ({ number: s.number, label: s.label, state: stepStates[i] }))}
        currentStep={currentStep}
        onStepClick={setCurrentStep}
        confidenceScore={score?.total ?? 0}
        mobileOpen={mobileMapOpen}
        onMobileToggle={() => setMobileMapOpen(o => !o)}
      />

      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">

        <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <button
            onClick={() => setMobileMapOpen(true)}
            className="lg:hidden text-xs text-[rgba(255,255,255,0.38)] hover:text-white transition-colors"
          >
            ☰ Journey
          </button>
          <span className="hidden lg:block text-xs text-[rgba(255,255,255,0.28)]">
            Build your Career Digital Twin
          </span>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-xs text-[rgba(255,255,255,0.22)]">{name}</span>
            <LogoutButton />
          </div>
        </header>

        <div className="flex-1 px-6 py-8">
          {renderStep()}
        </div>

        <footer className="shrink-0 px-6 pb-5">
          <p className="text-[10px] text-[rgba(255,255,255,0.15)] text-center">
            {email} · A professional representation built from evidence rather than assumptions.
          </p>
        </footer>

      </main>
    </div>
  );
}

// ── Button styles ─────────────────────────────────────────────────────────────

const BTN_PRIMARY = 'inline-flex px-6 py-2.5 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] text-white text-sm font-medium transition-colors';

// ── Sub-components (Steps 1 & 2 are simple enough to inline) ─────────────────

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
  moduleOptions,
  onSaved,
}: {
  currentGoal: string | null;
  moduleOptions: GeneratedModuleOptions | null;
  onSaved: (goal: string) => void;
}) {
  const parseInitial = () => {
    if (!currentGoal) return { goals: [] as string[], other: '' };
    try {
      const p = JSON.parse(currentGoal) as { goals?: string[]; other?: string };
      return { goals: p.goals ?? [], other: p.other ?? '' };
    } catch {
      return { goals: [currentGoal], other: '' };
    }
  };

  const init = parseInitial();
  const [selected, setSelected] = useState<string[]>(init.goals);
  const [freeText, setFreeText] = useState(init.other);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Adaptive options state
  const [options, setOptions] = useState<GeneratedModuleOptions | null>(moduleOptions);
  const [generating, setGenerating] = useState(false);
  const generatingRef = useRef(false);

  // Trigger generation on arrival if no options cached yet
  useEffect(() => {
    if (options || generatingRef.current) return;
    generatingRef.current = true;
    setGenerating(true);
    fetch('/api/generate-module-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'career_goal' }),
    })
      .then(r => r.json())
      .then((j: { options?: GeneratedModuleOptions }) => { if (j.options) setOptions(j.options); })
      .catch(() => {})
      .finally(() => setGenerating(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(label: string) {
    setSelected(prev =>
      prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]
    );
  }

  async function handleSave() {
    if (selected.length === 0) return;
    setSaving(true);
    setError('');
    const value = JSON.stringify({ goals: selected, other: freeText.trim() });
    try {
      const res = await fetch('/api/training/career-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career_goal: value }),
      });
      if (!res.ok) {
        const j = await res.json() as { error?: string };
        setError(j.error ?? 'Failed to save. Please try again.');
        return;
      }

      // Update candidate_context with career goals
      fetch('/api/training/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career_goals: selected, career_goal_text: freeText.trim() }),
      }).catch(() => {});

      // Pre-generate options for the next adaptive module
      fetch('/api/generate-module-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'hidden_strengths' }),
      }).catch(() => {});

      onSaved(value);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // Loading state while generating
  if (generating && !options) {
    return (
      <div className="flex items-center gap-3 py-8 text-sm text-[rgba(255,255,255,0.4)]">
        <div className="w-4 h-4 rounded-full border-2 border-t-[#4060d0] animate-spin flex-shrink-0" />
        Analysing your CV…
      </div>
    );
  }

  const displayOptions = options?.options ?? [];

  return (
    <div>
      {options?.coaching_tip && (
        <p className="text-xs text-[rgba(255,255,255,0.38)] italic mb-4">
          💡 {options.coaching_tip}
        </p>
      )}

      <div className="flex flex-col gap-2 mb-5">
        {displayOptions.map(opt => {
          const isSelected = selected.includes(opt.label);
          return (
            <button
              key={opt.label}
              onClick={() => !saving && toggle(opt.label)}
              disabled={saving}
              className={[
                'text-left px-4 py-3.5 rounded-xl border text-sm transition-all flex items-start gap-3',
                isSelected
                  ? 'border-[#4060d0] bg-[rgba(64,96,208,0.12)] text-white'
                  : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[rgba(255,255,255,0.6)]',
                saving ? 'opacity-50 cursor-not-allowed' : 'hover:border-[rgba(255,255,255,0.20)] hover:text-white',
              ].join(' ')}
            >
              <span className={`w-4 h-4 rounded mt-0.5 flex-shrink-0 flex items-center justify-center text-[10px] border transition-all ${
                isSelected ? 'bg-[#4060d0] border-[#4060d0] text-white' : 'border-[rgba(255,255,255,0.25)]'
              }`}>
                {isSelected ? '✓' : ''}
              </span>
              <span>
                <span className="block">{opt.label}</span>
                {opt.detail && (
                  <span className="block text-xs text-[rgba(255,255,255,0.35)] mt-0.5 font-normal">{opt.detail}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Free text */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-[rgba(255,255,255,0.4)] mb-1.5">
          Anything else?
        </label>
        <textarea
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
          placeholder="Add your own context if needed..."
          rows={2}
          disabled={saving}
          className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.10)] rounded-xl px-4 py-2.5 text-sm text-white resize-none focus:outline-none focus:border-[rgba(64,96,208,0.5)] transition-colors placeholder-[rgba(255,255,255,0.22)] disabled:opacity-50"
        />
      </div>

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      {selected.length > 0 && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex px-6 py-2.5 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {saving ? 'Saving…' : 'Continue →'}
        </button>
      )}
    </div>
  );
}
