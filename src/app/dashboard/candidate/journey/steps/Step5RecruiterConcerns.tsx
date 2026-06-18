'use client';

import { useState, useEffect, useRef } from 'react';
import type { AnalysisResult } from '@/app/api/training/analyze/route';
import type { GeneratedModuleOptions } from '@/app/api/generate-module-options/route';

interface Props {
  analysis: AnalysisResult | null;
  moduleOptions: GeneratedModuleOptions | null;
  onAdvance: () => void;
  onBack: () => void;
  onNavigate: (step: number) => void;
}

interface ConcernItem {
  concern: string;
  why: string;
  response: string;
  skipped: boolean;
}

function buildItems(opts: GeneratedModuleOptions | null): ConcernItem[] {
  if (!opts?.options.length) return [];
  return opts.options.map(o => ({
    concern: o.label,
    why: o.detail,
    response: '',
    skipped: false,
  }));
}

export default function Step5RecruiterConcerns({ moduleOptions, onAdvance, onBack }: Props) {
  const [generatedOpts, setGeneratedOpts] = useState<GeneratedModuleOptions | null>(moduleOptions);
  const [items, setItems] = useState<ConcernItem[]>(() => buildItems(moduleOptions));
  const [generating, setGenerating] = useState(false);
  const [current, setCurrent] = useState(0);
  const generatingRef = useRef(false);

  useEffect(() => {
    if (items.length > 0 || generatingRef.current) return;
    generatingRef.current = true;
    setGenerating(true);
    fetch('/api/generate-module-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'recruiter_concerns' }),
    })
      .then(r => r.json())
      .then((j: { options?: GeneratedModuleOptions }) => {
        if (j.options) {
          setGeneratedOpts(j.options);
          setItems(buildItems(j.options));
        }
      })
      .catch(() => {})
      .finally(() => setGenerating(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function updateCurrent(patch: Partial<ConcernItem>) {
    setItems(prev => prev.map((item, i) => i === current ? { ...item, ...patch } : item));
  }

  function goNext() {
    if (current < items.length - 1) setCurrent(c => c + 1);
  }

  function goPrev() {
    if (current > 0) setCurrent(c => c - 1);
  }

  function handleAdvance() {
    const addressed = items
      .filter(i => i.response.trim())
      .map(i => ({ concern: i.concern, response: i.response.trim() }));
    const skipped = items
      .filter(i => !i.response.trim())
      .map(i => i.concern);

    fetch('/api/training/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recruiter_concerns: { addressed, skipped } }),
    }).catch(() => {});

    fetch('/api/generate-module-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'career_narrative' }),
    }).catch(() => {});

    onAdvance();
  }

  // ── Loading ──────────────────────────────────────────────────────

  if (generating && items.length === 0) {
    return (
      <div className="max-w-lg">
        <StepLabel />
        <h1 className="text-xl font-bold text-white mt-1 mb-8">
          What a recruiter is likely to push back on.
        </h1>
        <div className="flex items-center gap-3 py-6 text-sm text-[rgba(255,255,255,0.4)]">
          <div className="w-4 h-4 rounded-full border-2 border-t-[#4060d0] animate-spin flex-shrink-0" />
          Personalising your next step…
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg">
        <StepLabel />
        <h1 className="text-xl font-bold text-white mt-1 mb-6">
          What a recruiter is likely to push back on.
        </h1>
        <p className="text-sm text-[rgba(255,255,255,0.4)] mb-6">
          No concerns identified yet. Complete the AI Analysis step first.
        </p>
        <button onClick={onBack} className={BTN_BACK}>← Back</button>
      </div>
    );
  }

  const item = items[current];
  const isFirst = current === 0;
  const isLast = current === items.length - 1;
  const answeredCount = items.filter(i => i.response.trim()).length;

  // ── Main render ──────────────────────────────────────────────────

  return (
    <div className="max-w-lg">

      <div className="mb-6">
        <StepLabel />
        <h1 className="text-xl font-bold text-white mt-1 mb-1">
          What a recruiter is likely to push back on.
        </h1>
        <p className="text-sm text-[rgba(255,255,255,0.45)]">
          Read each concern. Write your honest response if you have one —
          or move on. Your Digital Twin will learn from what you give it.
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mb-6">
        {items.map((it, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`transition-all rounded-full ${
              i === current
                ? 'w-5 h-1.5 bg-[#4060d0]'
                : it.response.trim()
                ? 'w-1.5 h-1.5 bg-green-500/50'
                : 'w-1.5 h-1.5 bg-[rgba(255,255,255,0.15)]'
            }`}
            aria-label={`Concern ${i + 1}`}
          />
        ))}
        <span className="ml-auto text-[11px] text-[rgba(255,255,255,0.28)] tabular-nums">
          {current + 1} / {items.length}
        </span>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.03)] p-6 mb-5 flex flex-col gap-5">

        {/* Concern + why */}
        <div>
          <div className="flex items-start gap-2 mb-3">
            <span className="text-amber-400 text-xs mt-0.5 flex-shrink-0">⚠</span>
            <p className="text-base font-semibold text-white leading-snug">
              {item.concern}
            </p>
          </div>
          <p className="text-sm text-[rgba(255,255,255,0.45)] leading-relaxed pl-5">
            {item.why}
          </p>
        </div>

        {/* Response */}
        <div className="border-t border-[rgba(255,255,255,0.06)] pt-4">
          <label className="block text-[10px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider mb-2">
            Your response{item.response.trim() ? ' ✓' : ' (optional)'}
          </label>
          <textarea
            value={item.response}
            onChange={e => updateCurrent({ response: e.target.value })}
            rows={4}
            placeholder="How would you address this in an interview? Write naturally — not a polished script…"
            className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.09)] rounded-xl px-4 py-3 text-sm text-white resize-none focus:outline-none focus:border-[rgba(64,96,208,0.5)] transition-colors placeholder-[rgba(255,255,255,0.2)] leading-relaxed"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={onBack} className={BTN_BACK}>← Back</button>
          <button
            onClick={goPrev}
            disabled={isFirst}
            className="inline-flex items-center px-3 py-2.5 rounded-xl border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.5)] hover:text-white text-sm transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            aria-label="Previous"
          >
            ←
          </button>
        </div>

        {isLast ? (
          <button onClick={handleAdvance} className={BTN_PRIMARY}>
            Continue →
          </button>
        ) : (
          <button onClick={goNext} className={BTN_PRIMARY}>
            Next →
          </button>
        )}
      </div>

      {/* Footer: answered count + coaching tip */}
      <div className="mt-5 flex flex-col gap-2">
        {answeredCount > 0 && (
          <p className="text-xs text-[rgba(255,255,255,0.28)]">
            {answeredCount} of {items.length} concern{items.length !== 1 ? 's' : ''} answered
          </p>
        )}
        {generatedOpts?.coaching_tip && (
          <p className="text-xs text-[rgba(255,255,255,0.28)] italic">
            💡 {generatedOpts.coaching_tip}
          </p>
        )}
      </div>
    </div>
  );
}

function StepLabel() {
  return (
    <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-widest">
      Recruiter Concerns · Step 5 of 10
    </span>
  );
}

const BTN_PRIMARY = 'inline-flex px-6 py-2.5 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] text-white text-sm font-medium transition-colors';
const BTN_BACK    = 'inline-flex px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.5)] hover:text-white text-sm transition-colors';
