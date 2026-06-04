'use client';

import { useState } from 'react';
import type { AnalysisResult } from '@/app/api/training/analyze/route';

interface Props {
  analysis: AnalysisResult | null;
  onAdvance: () => void;
  onBack: () => void;
  onNavigate: (step: number) => void;
}

type ConcernStatus = 'pending' | 'building' | 'skipped';

interface ConcernState {
  concern: string;
  why: string;
  priority: 'high' | 'medium';
  linked_module: string;
  status: ConcernStatus;
}

// Maps the Claude-returned linked_module to the relevant journey step
const MODULE_TO_STEP: Record<string, number> = {
  story_library: 7,
  recruiter_challenge: 9,
  objection_handling: 9,
  real_interview: 6,
};

export default function Step5RecruiterConcerns({ analysis, onAdvance, onBack, onNavigate }: Props) {
  const [items, setItems] = useState<ConcernState[]>(
    (analysis?.objections ?? []).map(obj => ({
      concern: obj.concern,
      why: obj.why,
      priority: obj.priority,
      linked_module: obj.linked_module,
      status: 'pending',
    }))
  );

  const allDecided = items.length === 0 || items.every(i => i.status !== 'pending');

  function update(idx: number, patch: Partial<ConcernState>) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, ...patch } : item));
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-widest">
          Recruiter Concerns · Step 5 of 10
        </span>
        <h1 className="text-xl font-bold text-white mt-1 mb-1">Build your responses.</h1>
        <p className="text-sm text-[rgba(255,255,255,0.4)]">
          These are concerns a recruiter may raise. Decide how to address each one.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] p-5 mb-6">
          <p className="text-sm text-[rgba(255,255,255,0.4)]">
            No concerns identified yet. Go back and run the AI Analysis first.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {items.map((item, idx) => {
            const targetStep = MODULE_TO_STEP[item.linked_module] ?? 9;
            return (
              <div
                key={idx}
                className={`rounded-xl border p-4 transition-colors ${
                  item.status === 'building' ? 'border-[rgba(64,96,208,0.3)] bg-[rgba(64,96,208,0.04)]' :
                  item.status === 'skipped'  ? 'border-[rgba(255,255,255,0.05)] opacity-40' :
                  'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span className={`text-xs shrink-0 mt-0.5 ${item.priority === 'high' ? 'text-red-400' : 'text-amber-400'}`}>
                    {item.priority === 'high' ? '⚠' : '△'}
                  </span>
                  <p className="text-sm text-white font-medium leading-snug">{item.concern}</p>
                </div>
                <p className="text-xs text-[rgba(255,255,255,0.4)] leading-relaxed mb-3 pl-4">
                  {item.why}
                </p>

                {item.status === 'pending' && (
                  <div className="flex gap-2 flex-wrap pl-4">
                    <button
                      onClick={() => { update(idx, { status: 'building' }); onNavigate(targetStep); }}
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

                {item.status === 'building' && (
                  <p className="text-xs text-[#6080f0] pl-4">Working on this in the relevant step.</p>
                )}
                {item.status === 'skipped' && (
                  <p className="text-xs text-[rgba(255,255,255,0.25)] pl-4">Flagged for later.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className={BTN_BACK}>← Back</button>
        {allDecided
          ? <button onClick={onAdvance} className={BTN_PRIMARY}>Continue →</button>
          : <button onClick={onAdvance} className={BTN_SKIP}>Skip for now →</button>
        }
      </div>
    </div>
  );
}

const BTN_PRIMARY = 'inline-flex px-6 py-2.5 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] text-white text-sm font-medium transition-colors';
const BTN_BACK    = 'inline-flex px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.5)] hover:text-white text-sm transition-colors';
const BTN_SKIP    = 'inline-flex px-5 py-2.5 rounded-xl bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.6)] hover:text-white text-sm transition-colors';
