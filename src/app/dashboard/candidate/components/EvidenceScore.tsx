'use client';

import type { ScoreResult } from '@/app/api/training/score/route';

interface Props {
  score: ScoreResult;
}

const BREAKDOWN_LABELS: Record<string, { label: string; max: number }> = {
  cv:                     { label: 'CV Upload',              max: 10 },
  stories:                { label: 'Story Library',          max: 45 },
  real_interview_answers: { label: 'Real Interview Answers', max: 15 },
  recruiter_challenge:    { label: 'Recruiter Challenge',    max: 10 },
  objection_handling:     { label: 'Objection Handling',     max: 10 },
  interview_transcripts:  { label: 'Interview Transcripts',  max: 20 },
  recruiter_feedback:     { label: 'Recruiter Feedback',     max: 15 },
  professional_artifacts: { label: 'Professional Artifacts', max: 8  },
  ai_conversations:       { label: 'AI Conversations',       max: 8  },
  free_training:          { label: 'Free Training',          max: 5  },
};

// SVG arc for the circular progress ring
function ScoreRing({ pct }: { pct: number }) {
  const r = 52;
  const cx = 64;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);

  const color =
    pct <= 30 ? '#6080a0' :
    pct <= 60 ? '#4060d0' :
    pct <= 85 ? '#5080f0' :
    '#60c080';

  return (
    <svg width={128} height={128} viewBox="0 0 128 128" aria-hidden="true">
      {/* Track */}
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={10}
      />
      {/* Progress */}
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.16,1,0.3,1), stroke 400ms ease' }}
      />
      {/* Score text */}
      <text x={cx} y={cx - 6} textAnchor="middle" fill="white" fontSize={22} fontWeight={700}>
        {pct}%
      </text>
      <text x={cx} y={cx + 14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={10}>
        Evidence
      </text>
    </svg>
  );
}

export default function EvidenceScore({ score }: Props) {
  const { total, label, qualitySignals, breakdown } = score;

  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-6 mb-6">
      {/* Top row: ring + label + signals */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Ring */}
        <div className="shrink-0">
          <ScoreRing pct={total} />
        </div>

        {/* Label + quality signals */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-base mb-1">{label}</p>
          <p className="text-[rgba(255,255,255,0.4)] text-xs mb-4">Evidence Quality Score</p>

          {qualitySignals.length > 0 && (
            <div className="flex flex-col gap-2">
              {qualitySignals.map((signal, i) => (
                <div
                  key={i}
                  className="flex gap-2 items-start text-xs text-[rgba(255,255,255,0.6)] leading-relaxed"
                >
                  <span className="shrink-0 mt-0.5 text-[#4060d0]">›</span>
                  <span>{signal}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
        {Object.entries(BREAKDOWN_LABELS).map(([key, { label: name, max }]) => {
          const value = (breakdown as unknown as Record<string, number>)[key] ?? 0;
          const pct = max > 0 ? Math.round((value / max) * 100) : 0;

          return (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-[rgba(255,255,255,0.4)] uppercase tracking-wide">{name}</span>
                <span className="text-[10px] text-[rgba(255,255,255,0.5)]">{value}/{max}%</span>
              </div>
              <div className="h-1 rounded-full bg-[rgba(255,255,255,0.07)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#4060d0] transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
