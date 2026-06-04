'use client';

import { useState, useEffect, useRef } from 'react';
import type { AnalysisResult } from '@/app/api/training/analyze/route';
import type { GeneratedModuleOptions } from '@/app/api/generate-module-options/route';

interface Props {
  analysis: AnalysisResult | null;
  moduleOptions: GeneratedModuleOptions | null;
  onAdvance: () => void;
  onBack: () => void;
  onNavigate: (step: number) => void; // kept for API compatibility, not used internally
}

type ConcernStatus = 'pending' | 'building' | 'responded' | 'skipped';

interface ConcernItem {
  concern: string;
  why: string;
  status: ConcernStatus;
  response: string;
}

function buildItems(
  opts: GeneratedModuleOptions | null,
  analysis: AnalysisResult | null
): ConcernItem[] {
  if (opts?.options.length) {
    return opts.options.map(o => ({ concern: o.label, why: o.detail, status: 'pending', response: '' }));
  }
  return (analysis?.objections ?? []).map(obj => ({
    concern: obj.concern,
    why: obj.why,
    status: 'pending',
    response: '',
  }));
}

export default function Step5RecruiterConcerns({ analysis, moduleOptions, onAdvance, onBack }: Props) {
  const [generatedOpts, setGeneratedOpts] = useState<GeneratedModuleOptions | null>(moduleOptions);
  const [items, setItems] = useState<ConcernItem[]>(() => buildItems(moduleOptions, analysis));
  const [generating, setGenerating] = useState(false);
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
          setItems(buildItems(j.options, null));
        }
      })
      .catch(() => {})
      .finally(() => setGenerating(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const allDecided = items.length > 0 && items.every(i => i.status === 'responded' || i.status === 'skipped');

  function update(idx: number, patch: Partial<ConcernItem>) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, ...patch } : item));
  }

  function handleAdvance() {
    const addressed = items.filter(i => i.status === 'responded').map(i => ({ concern: i.concern, response: i.response }));
    const skipped   = items.filter(i => i.status === 'skipped').map(i => i.concern);

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

  if (generating && items.length === 0) {
    return (
      <div className="max-w-xl">
        <StepLabel />
        <h1 className="text-xl font-bold text-white mt-1 mb-8">Build your responses.</h1>
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
        <h1 className="text-xl font-bold text-white mt-1 mb-1">Build your responses.</h1>
        <p className="text-sm text-[rgba(255,255,255,0.4)]">
          These are concerns a recruiter may raise. Decide how to address each one.
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
            No concerns identified yet. Complete the AI Analysis step first.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-4 transition-colors ${
                item.status === 'responded' ? 'border-[rgba(96,192,128,0.25)] bg-[rgba(96,192,128,0.04)]' :
                item.status === 'building'  ? 'border-[rgba(64,96,208,0.35)] bg-[rgba(64,96,208,0.04)]' :
                item.status === 'skipped'   ? 'border-[rgba(255,255,255,0.05)] opacity-40' :
                'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]'
              }`}
            >
              {/* Concern header */}
              <div className="flex items-start gap-2 mb-2">
                <span className="text-xs text-amber-400 shrink-0 mt-0.5">⚠</span>
                <p className="text-sm text-white font-medium leading-snug">{item.concern}</p>
              </div>
              <p className="text-xs text-[rgba(255,255,255,0.4)] leading-relaxed mb-3 pl-4">{item.why}</p>

              {/* Pending — show action buttons */}
              {item.status === 'pending' && (
                <div className="flex gap-2 flex-wrap pl-4">
                  <button
                    onClick={() => update(idx, { status: 'building' })}
                    className="px-3 py-1.5 rounded-lg bg-[rgba(64,96,208,0.15)] border border-[rgba(64,96,208,0.3)] text-[#6080f0] text-xs hover:bg-[rgba(64,96,208,0.25)] transition-colors"
                  >
                    Build a response →
                  </button>
                  <button
                    onClick={() => update(idx, { status: 'skipped' })}
                    className="px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.4)] text-xs hover:text-white transition-colors"
                  >
                    Skip for now
                  </button>
                </div>
              )}

              {/* Building — inline textarea */}
              {item.status === 'building' && (
                <div className="pl-4">
                  <p className="text-[10px] text-[rgba(255,255,255,0.35)] mb-2">
                    How would you respond to this in an interview?
                  </p>
                  <textarea
                    value={item.response}
                    onChange={e => update(idx, { response: e.target.value })}
                    rows={4}
                    autoFocus
                    placeholder="Write your honest, natural response — not a polished script…"
                    className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(64,96,208,0.3)] rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-[rgba(64,96,208,0.6)] transition-colors mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => update(idx, { status: 'responded' })}
                      disabled={!item.response.trim()}
                      className="px-3 py-1.5 rounded-lg bg-[rgba(96,192,128,0.15)] border border-[rgba(96,192,128,0.3)] text-green-400 text-xs hover:bg-[rgba(96,192,128,0.25)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Save response ✓
                    </button>
                    <button
                      onClick={() => update(idx, { status: 'pending', response: '' })}
                      className="px-3 py-1.5 text-[rgba(255,255,255,0.35)] text-xs hover:text-white transition-colors"
                    >
                      Never mind
                    </button>
                  </div>
                </div>
              )}

              {/* Responded */}
              {item.status === 'responded' && (
                <div className="pl-4">
                  <p className="text-xs text-green-400 mb-1">✓ Response saved</p>
                  <p className="text-xs text-[rgba(255,255,255,0.4)] leading-relaxed italic">
                    &ldquo;{item.response.slice(0, 120)}{item.response.length > 120 ? '…' : ''}&rdquo;
                  </p>
                  <button
                    onClick={() => update(idx, { status: 'building' })}
                    className="mt-2 text-[10px] text-[rgba(255,255,255,0.3)] hover:text-white transition-colors"
                  >
                    Edit
                  </button>
                </div>
              )}

              {/* Skipped */}
              {item.status === 'skipped' && (
                <div className="flex items-center justify-between pl-4">
                  <p className="text-xs text-[rgba(255,255,255,0.25)]">Flagged for later.</p>
                  <button
                    onClick={() => update(idx, { status: 'pending' })}
                    className="text-[10px] text-[rgba(255,255,255,0.3)] hover:text-white transition-colors"
                  >
                    Reconsider
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {generatedOpts?.suggested_question && (
        <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4 mb-5">
          <p className="text-[10px] text-[rgba(255,255,255,0.3)] uppercase tracking-wider mb-1">Hardest question to prepare for</p>
          <p className="text-sm text-[rgba(255,255,255,0.6)] italic">{generatedOpts.suggested_question}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className={BTN_BACK}>← Back</button>
        {allDecided
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
      Recruiter Concerns · Step 5 of 10
    </span>
  );
}

const BTN_PRIMARY = 'inline-flex px-6 py-2.5 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] text-white text-sm font-medium transition-colors';
const BTN_BACK    = 'inline-flex px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.5)] hover:text-white text-sm transition-colors';
const BTN_SKIP    = 'inline-flex px-5 py-2.5 rounded-xl bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.6)] hover:text-white text-sm transition-colors';
