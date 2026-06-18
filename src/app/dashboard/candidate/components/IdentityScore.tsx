'use client';

import type { ScoreResult } from '@/app/api/training/score/route';

interface Props {
  score: ScoreResult;
}

// Maps the 10-item raw breakdown to 6 identity dimensions (each 0-100)
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

const UNDERSTOOD_LABELS: Record<string, string> = {
  'Career Story': 'Career History',
  'Motivation & Goals': 'Career Direction',
  'Commercial Evidence': 'Commercial Impact',
  'Leadership Examples': 'Leadership',
  'Communication Style': 'Communication Style',
  'Objection Responses': 'Objection Handling',
};

function identityLabel(total: number): string {
  if (total <= 30) return 'Your Digital Twin knows the basics';
  if (total <= 60) return 'Your Digital Twin can handle simple conversations';
  if (total <= 85) return 'Your Digital Twin understands how you think';
  return 'Your Digital Twin is ready ⭐';
}

function ScoreRing({ pct }: { pct: number }) {
  const r = 52;
  const cx = 64;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);
  const color = pct <= 30 ? '#6080a0' : pct <= 60 ? '#4060d0' : pct <= 85 ? '#5080f0' : '#60c080';

  return (
    <svg width={128} height={128} viewBox="0 0 128 128" aria-hidden>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={10} />
      <circle
        cx={cx} cy={cx} r={r}
        fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.16,1,0.3,1), stroke 400ms ease' }}
      />
      <text x={cx} y={cx - 6} textAnchor="middle" fill="white" fontSize={22} fontWeight={700}>{pct}%</text>
      <text x={cx} y={cx + 14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={10}>Confidence</text>
    </svg>
  );
}

export default function IdentityScore({ score }: Props) {
  const { total, breakdown } = score;
  const dimensions = computeDimensions(breakdown);
  const understood = Object.entries(dimensions).filter(([, v]) => v > 60);
  const needsEvidence = Object.entries(dimensions).filter(([, v]) => v <= 60);

  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="shrink-0">
          <ScoreRing pct={total} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-base mb-0.5">{identityLabel(total)}</p>
          <p className="text-[rgba(255,255,255,0.4)] text-xs mb-4">Identity Confidence Score</p>

          <div className="flex flex-col gap-1.5 text-xs">
            {understood.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider mb-0.5">
                  Your Digital Twin understands:
                </p>
                {understood.map(([dim]) => (
                  <div key={dim} className="flex items-center gap-2 text-green-400">
                    <span>✓</span>
                    <span>{UNDERSTOOD_LABELS[dim]}</span>
                  </div>
                ))}
              </>
            )}
            {needsEvidence.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider mt-3 mb-0.5">
                  Needs more evidence for:
                </p>
                {needsEvidence.map(([dim]) => (
                  <div key={dim} className="flex items-center gap-2 text-amber-400">
                    <span>⚠</span>
                    <span>{UNDERSTOOD_LABELS[dim]}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dimension breakdown bars */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {Object.entries(dimensions).map(([dim, pct]) => (
          <div key={dim}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-[rgba(255,255,255,0.4)] uppercase tracking-wide">{dim}</span>
              <span className="text-[10px] text-[rgba(255,255,255,0.5)]">{pct}%</span>
            </div>
            <div className="h-1 rounded-full bg-[rgba(255,255,255,0.07)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: pct > 60 ? '#60c080' : '#4060d0',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
