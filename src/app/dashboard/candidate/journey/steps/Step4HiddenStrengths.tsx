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

type ItemStatus = 'pending' | 'confirmed' | 'editing' | 'rejected';

interface StrengthItem {
  original: string;
  why: string;
  status: ItemStatus;
  editedText: string;
}

function buildItems(
  opts: GeneratedModuleOptions | null,
  analysis: AnalysisResult | null
): StrengthItem[] {
  if (opts?.options.length) {
    return opts.options.map(o => ({
      original: o.label,
      why: o.detail,
      status: 'pending',
      editedText: o.label,
    }));
  }
  return (analysis?.hidden_strengths ?? []).map(s => ({
    original: s.strength,
    why: s.why,
    status: 'pending',
    editedText: s.strength,
  }));
}

export default function Step4HiddenStrengths({ analysis, moduleOptions, onAdvance, onBack }: Props) {
  const [generatedOpts, setGeneratedOpts] = useState<GeneratedModuleOptions | null>(moduleOptions);
  const [items, setItems] = useState<StrengthItem[]>(() => buildItems(moduleOptions, analysis));
  const [generating, setGenerating] = useState(false);
  const generatingRef = useRef(false);

  // Trigger generation if no items available from either source
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

  const allReviewed = items.length > 0 && items.every(i => i.status !== 'pending' && i.status !== 'editing');

  function update(idx: number, patch: Partial<StrengthItem>) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, ...patch } : item));
  }

  function handleAdvance() {
    const confirmed = items.filter(i => i.status === 'confirmed').map(i => i.original);

    // Update candidate_context
    fetch('/api/training/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hidden_strengths: confirmed }),
    }).catch(() => {});

    // Pre-generate next adaptive step
    fetch('/api/generate-module-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'recruiter_concerns' }),
    }).catch(() => {});

    onAdvance();
  }

  if (generating && items.length === 0) {
    return (
      <div className="max-w-xl">
        <StepLabel />
        <h1 className="text-xl font-bold text-white mt-1 mb-8">Review what your Digital Twin found.</h1>
        <div className="flex items-center gap-3 py-6 text-sm text-[rgba(255,255,255,0.4)]">
          <div className="w-4 h-4 rounded-full border-2 border-t-[#4060d0] animate-spin flex-shrink-0" />
          Personalising your next step…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <StepLabel />
        <h1 className="text-xl font-bold text-white mt-1 mb-1">Review what your Digital Twin found.</h1>
        <p className="text-sm text-[rgba(255,255,255,0.4)]">
          Confirm, edit, or redirect each one. Your Digital Twin will adjust.
        </p>
      </div>

      {generatedOpts?.coaching_tip && (
        <p className="text-xs text-[rgba(255,255,255,0.38)] italic mb-4">
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
            <div
              key={idx}
              className={`rounded-xl border p-4 transition-colors ${
                item.status === 'confirmed' ? 'border-[rgba(96,192,128,0.25)] bg-[rgba(96,192,128,0.04)]' :
                item.status === 'rejected'  ? 'border-[rgba(255,255,255,0.05)] opacity-50' :
                item.status === 'editing'   ? 'border-[rgba(64,96,208,0.35)] bg-[rgba(64,96,208,0.04)]' :
                'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]'
              }`}
            >
              {item.status === 'editing' ? (
                <textarea
                  value={item.editedText}
                  onChange={e => update(idx, { editedText: e.target.value })}
                  rows={3}
                  autoFocus
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(64,96,208,0.4)] rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none mb-3"
                />
              ) : (
                <div className="mb-3">
                  <p className="text-sm text-white font-medium mb-1">
                    {item.status === 'confirmed' ? '✓ ' : item.status === 'rejected' ? '✕ ' : '⭐ '}
                    {item.original}
                  </p>
                  <p className="text-xs text-[rgba(255,255,255,0.38)] leading-relaxed">{item.why}</p>
                </div>
              )}

              {item.status === 'pending' && (
                <div>
                  <p className="text-[10px] text-[rgba(255,255,255,0.35)] mb-2">Does this feel accurate?</p>
                  <div className="flex gap-2 flex-wrap">
                    <SmallBtn color="green" onClick={() => update(idx, { status: 'confirmed' })}>Yes</SmallBtn>
                    <SmallBtn color="blue"  onClick={() => update(idx, { status: 'editing' })}>Edit</SmallBtn>
                    <SmallBtn color="red"   onClick={() => update(idx, { status: 'rejected' })}>Not really</SmallBtn>
                  </div>
                </div>
              )}

              {item.status === 'editing' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => update(idx, { status: 'confirmed', original: item.editedText })}
                    className="px-3 py-1.5 rounded-lg bg-[rgba(64,96,208,0.2)] border border-[rgba(64,96,208,0.35)] text-[#6080f0] text-xs hover:bg-[rgba(64,96,208,0.3)] transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => update(idx, { status: 'pending', editedText: item.original })}
                    className="px-3 py-1.5 text-[rgba(255,255,255,0.35)] text-xs hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {item.status === 'confirmed' && (
                <p className="text-xs text-green-400">Your Digital Twin knows this strength.</p>
              )}
              {item.status === 'rejected' && (
                <p className="text-xs text-[rgba(255,255,255,0.25)]">Noted — deprioritised.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {generatedOpts?.suggested_question && allReviewed && (
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4 mb-5">
          <p className="text-[10px] text-[rgba(255,255,255,0.3)] uppercase tracking-wider mb-1">Worth remembering</p>
          <p className="text-sm text-[rgba(255,255,255,0.6)] italic">{generatedOpts.suggested_question}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className={BTN_BACK}>← Back</button>
        {allReviewed
          ? <button onClick={handleAdvance} className={BTN_PRIMARY}>Continue →</button>
          : <button onClick={handleAdvance} className={BTN_SKIP}>Skip for now →</button>
        }
      </div>
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

function SmallBtn({ color, onClick, children }: { color: 'green' | 'blue' | 'red'; onClick: () => void; children: React.ReactNode }) {
  const s = {
    green: 'bg-[rgba(96,192,128,0.12)] border-[rgba(96,192,128,0.3)] text-green-400 hover:bg-[rgba(96,192,128,0.2)]',
    blue:  'bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[rgba(255,255,255,0.10)]',
    red:   'bg-[rgba(200,60,60,0.10)] border-[rgba(200,60,60,0.25)] text-red-400 hover:bg-[rgba(200,60,60,0.18)]',
  };
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${s[color]}`}>
      {children}
    </button>
  );
}

const BTN_PRIMARY = 'inline-flex px-6 py-2.5 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] text-white text-sm font-medium transition-colors';
const BTN_BACK    = 'inline-flex px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.5)] hover:text-white text-sm transition-colors';
const BTN_SKIP    = 'inline-flex px-5 py-2.5 rounded-xl bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.6)] hover:text-white text-sm transition-colors';
