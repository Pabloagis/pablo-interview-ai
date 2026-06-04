'use client';

import type { ScoreResult } from '@/app/api/training/score/route';
import IdentityScore from '../../components/IdentityScore';

interface Props {
  score: ScoreResult | null;
  onNavigate: (step: number) => void;
  onBack: () => void;
}

function computeDimensions(b: ScoreResult['breakdown']): Record<string, number> {
  return {
    'Career Story':       Math.round((b.cv / 10) * 30 + (b.stories / 45) * 70),
    'Motivation & Goals': Math.round((b.real_interview_answers / 15) * 100),
    'Commercial Evidence':Math.round((b.interview_transcripts / 20) * 50 + (b.professional_artifacts / 8) * 30 + (b.free_training / 5) * 20),
    'Leadership Examples':Math.round((b.stories / 45) * 80 + (b.recruiter_challenge / 10) * 20),
    'Communication Style':Math.round((b.recruiter_feedback / 15) * 60 + (b.ai_conversations / 8) * 40),
    'Objection Responses':Math.round((b.objection_handling / 10) * 50 + (b.recruiter_challenge / 10) * 50),
  };
}

// Maps a weak dimension to the most relevant journey step
const DIM_TO_STEP: Record<string, number> = {
  'Career Story':       7,
  'Motivation & Goals': 6,
  'Commercial Evidence':7,
  'Leadership Examples':7,
  'Communication Style':8,
  'Objection Responses':9,
};

export default function Step10FinalReview({ score, onNavigate, onBack }: Props) {
  if (!score) {
    return (
      <div className="max-w-xl">
        <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-widest">
          Final Review · Step 10 of 10
        </span>
        <h1 className="text-xl font-bold text-white mt-1">Loading your Digital Twin…</h1>
      </div>
    );
  }

  const dims = computeDimensions(score.breakdown);
  const strong = Object.entries(dims).filter(([, v]) => v > 60);
  const weak   = Object.entries(dims).filter(([, v]) => v <= 60);

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-widest">
          Final Review · Step 10 of 10
        </span>
        <h1 className="text-xl font-bold text-white mt-1 mb-1">Your Digital Twin is ready.</h1>
        <p className="text-sm text-[rgba(255,255,255,0.4)]">
          Here&apos;s what it can and cannot yet discuss confidently.
        </p>
      </div>

      {/* Full identity score breakdown */}
      <IdentityScore score={score} />

      {/* What's covered */}
      {strong.length > 0 && (
        <div className="rounded-xl border border-[rgba(96,192,128,0.18)] bg-[rgba(96,192,128,0.04)] p-4 mb-3">
          <p className="text-[10px] font-semibold text-green-400 uppercase tracking-wider mb-3">
            Your Digital Twin can confidently discuss:
          </p>
          <div className="flex flex-col gap-1.5">
            {strong.map(([dim]) => (
              <div key={dim} className="flex items-center gap-2 text-sm text-[rgba(255,255,255,0.7)]">
                <span className="text-green-400 text-xs">✓</span>
                <span>{dim}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What needs work */}
      {weak.length > 0 && (
        <div className="rounded-xl border border-[rgba(255,180,0,0.14)] bg-[rgba(255,180,0,0.03)] p-4 mb-6">
          <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-3">
            Still needs more evidence for:
          </p>
          <div className="flex flex-col gap-2">
            {weak.map(([dim]) => (
              <div key={dim} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[rgba(255,255,255,0.55)]">
                  <span className="text-amber-400 text-xs">⚠</span>
                  <span>{dim}</span>
                </div>
                <button
                  onClick={() => onNavigate(DIM_TO_STEP[dim] ?? 7)}
                  className="text-[10px] text-[#6080f0] hover:text-white transition-colors shrink-0"
                >
                  Improve →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <button onClick={onBack} className={BTN_BACK}>← Back</button>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={BTN_SECONDARY}
        >
          Preview your Digital Twin ↗
        </a>
      </div>
    </div>
  );
}

const BTN_BACK     = 'inline-flex px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.5)] hover:text-white text-sm transition-colors';
const BTN_SECONDARY = 'inline-flex px-6 py-2.5 rounded-xl bg-[rgba(255,255,255,0.07)] hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.08)] text-white text-sm font-medium transition-colors';
