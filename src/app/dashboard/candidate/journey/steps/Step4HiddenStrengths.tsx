'use client';

import { useState, useEffect, useRef } from 'react';
import type { AnalysisResult } from '@/app/api/training/analyze/route';
import type { GeneratedModuleOptions } from '@/app/api/generate-module-options/route';

interface Props {
  analysis: AnalysisResult | null;
  moduleOptions: GeneratedModuleOptions | null;
  onAdvance: () => void;
  onBack: () => void;
}

interface StrengthItem {
  label: string;
  why: string;
  included: boolean;
  draftLabel: string;
  draftWhy: string;
}

function buildItems(opts: GeneratedModuleOptions | null): StrengthItem[] {
  if (!opts?.options.length) return [];
  return opts.options.map(o => ({
    label: o.label,
    why: o.detail,
    included: true,
    draftLabel: o.label,
    draftWhy: o.detail,
  }));
}

export default function Step4HiddenStrengths({ moduleOptions, onAdvance, onBack }: Props) {
  const [generatedOpts, setGeneratedOpts] = useState<GeneratedModuleOptions | null>(moduleOptions);
  const [items, setItems] = useState<StrengthItem[]>(() => buildItems(moduleOptions));
  const [generating, setGenerating] = useState(false);
  const [current, setCurrent] = useState(0);
  const [editing, setEditing] = useState(false);
  const generatingRef = useRef(false);

  useEffect(() => {
    if (items.length > 0 || generatingRef.current) return;
    generatingRef.current = true;
    setGenerating(true);
    fetch('/api/generate-module-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'hidden_strengths' }),
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

  function updateCurrent(patch: Partial<StrengthItem>) {
    setItems(prev => prev.map((item, i) => i === current ? { ...item, ...patch } : item));
  }

  function saveEdit() {
    const item = items[current];
    updateCurrent({
      label: item.draftLabel.trim() || item.label,
      why: item.draftWhy.trim() || item.why,
    });
    setEditing(false);
  }

  function cancelEdit() {
    const item = items[current];
    updateCurrent({ draftLabel: item.label, draftWhy: item.why });
    setEditing(false);
  }

  function goNext() {
    if (editing) return;
    if (current < items.length - 1) setCurrent(c => c + 1);
  }

  function goPrev() {
    if (editing) return;
    if (current > 0) setCurrent(c => c - 1);
  }

  function handleAdvance() {
    const confirmed = items.filter(i => i.included).map(i => i.label);
    fetch('/api/training/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hidden_strengths: confirmed }),
    }).catch(() => {});
    fetch('/api/generate-module-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'recruiter_concerns' }),
    }).catch(() => {});
    onAdvance();
  }

  // ── Loading ──────────────────────────────────────────────────────

  if (generating && items.length === 0) {
    return (
      <div className="max-w-lg">
        <StepLabel />
        <h1 className="text-xl font-bold text-white mt-1 mb-8">
          What your AI spotted in your background.
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
          What your AI spotted in your background.
        </h1>
        <p className="text-sm text-[rgba(255,255,255,0.4)] mb-6">
          No strengths identified yet. Complete the AI Analysis step first.
        </p>
        <button onClick={onBack} className={BTN_BACK}>← Back</button>
      </div>
    );
  }

  const item = items[current];
  const isLast = current === items.length - 1;
  const isFirst = current === 0;

  // ── Main render ──────────────────────────────────────────────────

  return (
    <div className="max-w-lg">

      <div className="mb-6">
        <StepLabel />
        <h1 className="text-xl font-bold text-white mt-1 mb-1">
          What your AI spotted in your background.
        </h1>
        <p className="text-sm text-[rgba(255,255,255,0.45)]">
          Strengths candidates with your background often undersell.
          Keep the ones that feel accurate, edit anything that doesn't sound like you.
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mb-6">
        {items.map((it, i) => (
          <button
            key={i}
            onClick={() => { if (!editing) setCurrent(i); }}
            className={`transition-all rounded-full ${
              i === current
                ? 'w-5 h-1.5 bg-[#4060d0]'
                : it.included
                ? 'w-1.5 h-1.5 bg-[rgba(255,255,255,0.25)]'
                : 'w-1.5 h-1.5 bg-[rgba(255,255,255,0.10)]'
            }`}
            aria-label={`Strength ${i + 1}`}
          />
        ))}
        <span className="ml-auto text-[11px] text-[rgba(255,255,255,0.28)] tabular-nums">
          {current + 1} / {items.length}
        </span>
      </div>

      {/* Card */}
      <div className={`rounded-2xl border p-6 mb-5 transition-all min-h-[200px] flex flex-col ${
        editing
          ? 'border-[rgba(64,96,208,0.4)] bg-[rgba(64,96,208,0.04)]'
          : item.included
          ? 'border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.03)]'
          : 'border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)] opacity-60'
      }`}>

        {editing ? (
          /* ── Edit mode ── */
          <div className="flex flex-col gap-4 flex-1">
            <div>
              <label className="block text-[10px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider mb-2">
                Strength
              </label>
              <input
                type="text"
                value={item.draftLabel}
                onChange={e => updateCurrent({ draftLabel: e.target.value })}
                autoFocus
                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(64,96,208,0.35)] rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-[rgba(64,96,208,0.65)] transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider mb-2">
                Why it matters in interviews
              </label>
              <textarea
                value={item.draftWhy}
                onChange={e => updateCurrent({ draftWhy: e.target.value })}
                rows={4}
                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(64,96,208,0.35)] rounded-xl px-4 py-2.5 text-sm text-[rgba(255,255,255,0.8)] resize-none focus:outline-none focus:border-[rgba(64,96,208,0.65)] transition-colors leading-relaxed"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={saveEdit}
                className="px-4 py-1.5 rounded-lg bg-[rgba(64,96,208,0.2)] border border-[rgba(64,96,208,0.35)] text-[#6080f0] text-xs font-medium hover:bg-[rgba(64,96,208,0.3)] transition-colors"
              >
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="px-3 py-1.5 text-[rgba(255,255,255,0.35)] text-xs hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* ── View mode ── */
          <div className="flex flex-col flex-1">
            <div className="flex items-start justify-between gap-3 mb-4">
              <p className="text-base font-semibold text-white leading-snug flex-1">
                {item.label}
              </p>
              {/* Edit icon */}
              <button
                onClick={() => setEditing(true)}
                aria-label="Edit"
                className="flex-shrink-0 p-1.5 rounded-lg text-[rgba(255,255,255,0.22)] hover:text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-[rgba(255,255,255,0.5)] leading-relaxed flex-1">
              {item.why}
            </p>

            {/* Include toggle */}
            <div className="flex items-center gap-2.5 mt-5 pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <button
                onClick={() => updateCurrent({ included: !item.included })}
                className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${
                  item.included
                    ? 'bg-[#4060d0] border-[#4060d0]'
                    : 'border-[rgba(255,255,255,0.25)] bg-transparent'
                }`}
                aria-label={item.included ? 'Remove from Digital Twin' : 'Add to Digital Twin'}
              >
                {item.included && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className="text-xs text-[rgba(255,255,255,0.38)]">
                {item.included ? 'Your Digital Twin will use this strength' : 'Not included — uncheck to remove'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={onBack} className={BTN_BACK}>← Back</button>
          <button
            onClick={goPrev}
            disabled={isFirst || editing}
            className="inline-flex items-center px-3 py-2.5 rounded-xl border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.5)] hover:text-white text-sm transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            aria-label="Previous"
          >
            ←
          </button>
        </div>

        {isLast ? (
          <button
            onClick={handleAdvance}
            disabled={editing}
            className={`${BTN_PRIMARY} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={goNext}
            disabled={editing}
            className={`${BTN_PRIMARY} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            Next →
          </button>
        )}
      </div>

      {/* Coaching tip */}
      {generatedOpts?.coaching_tip && (
        <p className="text-xs text-[rgba(255,255,255,0.28)] italic mt-5">
          💡 {generatedOpts.coaching_tip}
        </p>
      )}
    </div>
  );
}

function StepLabel() {
  return (
    <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-widest">
      Hidden Strengths · Step 4 of 10
    </span>
  );
}

const BTN_PRIMARY = 'inline-flex px-6 py-2.5 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] text-white text-sm font-medium transition-colors';
const BTN_BACK    = 'inline-flex px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.5)] hover:text-white text-sm transition-colors';
