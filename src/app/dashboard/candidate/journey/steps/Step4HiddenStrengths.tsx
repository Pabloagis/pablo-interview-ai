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
  editing: boolean;
  draftLabel: string;
  draftWhy: string;
}

function buildItems(
  opts: GeneratedModuleOptions | null,
  analysis: AnalysisResult | null
): StrengthItem[] {
  if (opts?.options.length) {
    return opts.options.map(o => ({
      label: o.label,
      why: o.detail,
      included: true,
      editing: false,
      draftLabel: o.label,
      draftWhy: o.detail,
    }));
  }
  return (analysis?.hidden_strengths ?? []).map(s => ({
    label: s.strength,
    why: s.why,
    included: true,
    editing: false,
    draftLabel: s.strength,
    draftWhy: s.why,
  }));
}

export default function Step4HiddenStrengths({ analysis, moduleOptions, onAdvance, onBack }: Props) {
  const [generatedOpts, setGeneratedOpts] = useState<GeneratedModuleOptions | null>(moduleOptions);
  const [items, setItems] = useState<StrengthItem[]>(() => buildItems(moduleOptions, analysis));
  const [generating, setGenerating] = useState(false);
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
          setItems(buildItems(j.options, null));
        }
      })
      .catch(() => {})
      .finally(() => setGenerating(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function update(idx: number, patch: Partial<StrengthItem>) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, ...patch } : item));
  }

  function startEdit(idx: number) {
    const item = items[idx];
    update(idx, { editing: true, draftLabel: item.label, draftWhy: item.why });
  }

  function saveEdit(idx: number) {
    const item = items[idx];
    update(idx, {
      label: item.draftLabel.trim() || item.label,
      why: item.draftWhy.trim() || item.why,
      editing: false,
    });
  }

  function cancelEdit(idx: number) {
    update(idx, { editing: false });
  }

  function handleAdvance() {
    const confirmed = items
      .filter(i => i.included)
      .map(i => i.label);

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
      <div className="max-w-xl">
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

  // ── Main render ──────────────────────────────────────────────────

  const includedCount = items.filter(i => i.included).length;

  return (
    <div className="max-w-xl">

      <div className="mb-6">
        <StepLabel />
        <h1 className="text-xl font-bold text-white mt-1 mb-1">
          What your AI spotted in your background.
        </h1>
        <p className="text-sm text-[rgba(255,255,255,0.45)]">
          These are strengths candidates with your background often undersell.
          Keep the ones that feel accurate, uncheck the ones that don't,
          and edit any wording that doesn't sound like you.
        </p>
      </div>

      {generatedOpts?.coaching_tip && (
        <p className="text-xs text-[rgba(255,255,255,0.35)] italic mb-5">
          💡 {generatedOpts.coaching_tip}
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] p-5 mb-6">
          <p className="text-sm text-[rgba(255,255,255,0.4)]">
            No strengths identified yet. Complete the AI Analysis step first.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {items.map((item, idx) => (
            <StrengthCard
              key={idx}
              item={item}
              onToggle={() => update(idx, { included: !item.included })}
              onStartEdit={() => startEdit(idx)}
              onSaveEdit={() => saveEdit(idx)}
              onCancelEdit={() => cancelEdit(idx)}
              onDraftLabelChange={v => update(idx, { draftLabel: v })}
              onDraftWhyChange={v => update(idx, { draftWhy: v })}
            />
          ))}
        </div>
      )}

      {items.length > 0 && (
        <p className="text-xs text-[rgba(255,255,255,0.28)] mb-5">
          {includedCount} of {items.length} strength{items.length !== 1 ? 's' : ''} selected
        </p>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className={BTN_BACK}>← Back</button>
        <button onClick={handleAdvance} className={BTN_PRIMARY}>Continue →</button>
      </div>
    </div>
  );
}

// ── Card component ────────────────────────────────────────────────

interface CardProps {
  item: StrengthItem;
  onToggle: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDraftLabelChange: (v: string) => void;
  onDraftWhyChange: (v: string) => void;
}

function StrengthCard({
  item,
  onToggle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDraftLabelChange,
  onDraftWhyChange,
}: CardProps) {
  const borderColor = item.editing
    ? 'border-[rgba(64,96,208,0.4)]'
    : item.included
    ? 'border-[rgba(255,255,255,0.10)]'
    : 'border-[rgba(255,255,255,0.05)]';

  const bgColor = item.editing
    ? 'bg-[rgba(64,96,208,0.04)]'
    : 'bg-[rgba(255,255,255,0.02)]';

  return (
    <div className={`rounded-xl border p-4 transition-all ${borderColor} ${bgColor} ${!item.included && !item.editing ? 'opacity-45' : ''}`}>

      {item.editing ? (
        /* ── Edit mode: both fields visible and editable ── */
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider mb-1.5">
              Strength
            </label>
            <input
              type="text"
              value={item.draftLabel}
              onChange={e => onDraftLabelChange(e.target.value)}
              autoFocus
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(64,96,208,0.35)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[rgba(64,96,208,0.6)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider mb-1.5">
              Why it matters
            </label>
            <textarea
              value={item.draftWhy}
              onChange={e => onDraftWhyChange(e.target.value)}
              rows={3}
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(64,96,208,0.35)] rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-[rgba(64,96,208,0.6)] transition-colors leading-relaxed"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={onSaveEdit}
              className="px-4 py-1.5 rounded-lg bg-[rgba(64,96,208,0.2)] border border-[rgba(64,96,208,0.35)] text-[#6080f0] text-xs font-medium hover:bg-[rgba(64,96,208,0.3)] transition-colors"
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="px-3 py-1.5 text-[rgba(255,255,255,0.35)] text-xs hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* ── Default mode: checkbox + text + edit icon ── */
        <div className="flex items-start gap-3">
          {/* Toggle checkbox */}
          <button
            onClick={onToggle}
            aria-label={item.included ? 'Remove strength' : 'Add strength'}
            className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${
              item.included
                ? 'bg-[#4060d0] border-[#4060d0]'
                : 'border-[rgba(255,255,255,0.25)] bg-transparent'
            }`}
          >
            {item.included && (
              <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium leading-snug mb-1 transition-colors ${item.included ? 'text-white' : 'text-[rgba(255,255,255,0.4)]'}`}>
              {item.label}
            </p>
            <p className="text-xs text-[rgba(255,255,255,0.38)] leading-relaxed">
              {item.why}
            </p>
          </div>

          {/* Edit icon */}
          <button
            onClick={onStartEdit}
            aria-label="Edit"
            className="mt-0.5 flex-shrink-0 p-1 rounded text-[rgba(255,255,255,0.22)] hover:text-[rgba(255,255,255,0.7)] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Shared ────────────────────────────────────────────────────────

function StepLabel() {
  return (
    <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-widest">
      Hidden Strengths · Step 4 of 10
    </span>
  );
}

const BTN_PRIMARY = 'inline-flex px-6 py-2.5 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] text-white text-sm font-medium transition-colors';
const BTN_BACK    = 'inline-flex px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.5)] hover:text-white text-sm transition-colors';
