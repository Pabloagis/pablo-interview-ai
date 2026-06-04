'use client';

import { useState } from 'react';
import type { AnalysisResult } from '@/app/api/training/analyze/route';

interface Props {
  analysis: AnalysisResult | null;
  onAdvance: () => void;
  onBack: () => void;
}

type ItemStatus = 'pending' | 'confirmed' | 'editing' | 'rejected';

interface StrengthItem {
  original: string;
  why: string;
  how_to_surface: string;
  status: ItemStatus;
  editedText: string;
}

export default function Step4HiddenStrengths({ analysis, onAdvance, onBack }: Props) {
  const [items, setItems] = useState<StrengthItem[]>(
    (analysis?.hidden_strengths ?? []).map(s => ({
      original: s.strength,
      why: s.why,
      how_to_surface: s.how_to_surface,
      status: 'pending',
      editedText: s.strength,
    }))
  );

  const allReviewed = items.length === 0 || items.every(i => i.status !== 'pending' && i.status !== 'editing');

  function update(idx: number, patch: Partial<StrengthItem>) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, ...patch } : item));
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-widest">
          Hidden Strengths · Step 4 of 10
        </span>
        <h1 className="text-xl font-bold text-white mt-1 mb-1">Review what your Digital Twin found.</h1>
        <p className="text-sm text-[rgba(255,255,255,0.4)]">
          Confirm, edit, or redirect each one. Your Digital Twin will adjust.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] p-5 mb-6">
          <p className="text-sm text-[rgba(255,255,255,0.4)]">
            No strengths identified yet. Go back and run the AI Analysis first.
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
                  {item.how_to_surface && item.status === 'pending' && (
                    <p className="mt-2 text-xs text-[rgba(255,255,255,0.26)] italic">
                      💡 {item.how_to_surface}
                    </p>
                  )}
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

      <div className="flex gap-3">
        <button onClick={onBack} className={BTN_BACK}>← Back</button>
        {allReviewed
          ? <button onClick={onAdvance} className={BTN_PRIMARY}>Continue →</button>
          : <button onClick={onAdvance} className={BTN_SKIP}>Skip for now →</button>
        }
      </div>
    </div>
  );
}

function SmallBtn({
  color,
  onClick,
  children,
}: {
  color: 'green' | 'blue' | 'red';
  onClick: () => void;
  children: React.ReactNode;
}) {
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
