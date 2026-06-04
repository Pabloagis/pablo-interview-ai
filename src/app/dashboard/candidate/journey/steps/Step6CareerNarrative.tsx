'use client';

import { useState } from 'react';
import type { AnalysisResult } from '@/app/api/training/analyze/route';
import type { TrainingData } from '../../TrainingHub';
import VoiceRecorder from '../../components/VoiceRecorder';

interface Props {
  analysis: AnalysisResult | null;
  data: TrainingData;
  onSaved: (moduleId: string, message?: string) => void;
  onAdvance: () => void;
  onBack: () => void;
}

const QUESTION = 'Tell me about yourself.';

type FramingState = 'reviewing' | 'editing' | 'done';

export default function Step6CareerNarrative({ analysis, data, onSaved, onAdvance, onBack }: Props) {
  const topStrength = analysis?.hidden_strengths?.[0]?.strength ?? null;
  const [framingState, setFramingState] = useState<FramingState>(topStrength ? 'reviewing' : 'done');
  const [editedStrength, setEditedStrength] = useState(topStrength ?? '');

  const existing = data.responses.find(r => r.module === 'real_interview' && r.question === QUESTION);
  const [answer, setAnswer] = useState(existing?.answer_text ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveAnswer(text: string) {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/training/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'real_interview', question: QUESTION, answer_text: text }),
      });
      setSaved(true);
      onSaved('real_interview', 'Career narrative saved — your Digital Twin knows how you introduce yourself.');
    } catch { /* silent */ }
    setSaving(false);
  }

  // ── Framing phase — AI-inferred strength confirmation ──────────────────────
  if (framingState === 'reviewing' && topStrength) {
    return (
      <div className="max-w-xl">
        <StepLabel />
        <h1 className="text-xl font-bold text-white mt-1 mb-6">Your professional story, in your own words.</h1>

        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5 mb-6">
          <p className="text-xs text-[rgba(255,255,255,0.38)] mb-3">
            Based on your CV, I think one of your strongest advantages is:
          </p>
          <p className="text-white font-medium text-sm mb-4">{editedStrength || topStrength}</p>

          <p className="text-[10px] text-[rgba(255,255,255,0.35)] mb-2">Does this feel accurate?</p>
          <div className="flex gap-2 flex-wrap">
            <SmallBtn color="green" onClick={() => setFramingState('done')}>Yes</SmallBtn>
            <SmallBtn color="blue" onClick={() => setFramingState('editing')}>Edit</SmallBtn>
            <SmallBtn color="red" onClick={() => setFramingState('done')}>Not really</SmallBtn>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onBack} className={BTN_BACK}>← Back</button>
          <button onClick={() => setFramingState('done')} className={BTN_SKIP}>Skip this →</button>
        </div>
      </div>
    );
  }

  if (framingState === 'editing') {
    return (
      <div className="max-w-xl">
        <StepLabel />
        <h1 className="text-xl font-bold text-white mt-1 mb-6">Your professional story, in your own words.</h1>

        <div className="rounded-xl border border-[rgba(64,96,208,0.3)] bg-[rgba(64,96,208,0.04)] p-5 mb-6">
          <p className="text-xs text-[rgba(255,255,255,0.38)] mb-3">Edit how you'd describe your key advantage:</p>
          <textarea
            value={editedStrength}
            onChange={e => setEditedStrength(e.target.value)}
            rows={3}
            autoFocus
            className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(64,96,208,0.4)] rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none mb-3"
          />
          <div className="flex gap-2">
            <SmallBtn color="blue" onClick={() => setFramingState('done')}>Continue with this</SmallBtn>
            <button onClick={() => setFramingState('reviewing')} className="text-xs text-[rgba(255,255,255,0.35)] hover:text-white transition-colors">Cancel</button>
          </div>
        </div>

        <button onClick={onBack} className={BTN_BACK}>← Back</button>
      </div>
    );
  }

  // ── Answer phase ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl">
      <StepLabel />
      <h1 className="text-xl font-bold text-white mt-1 mb-1">{QUESTION}</h1>
      <p className="text-sm text-[rgba(255,255,255,0.4)] mb-5">
        Your natural answer — not a rehearsed pitch. What do you actually say?
      </p>

      <textarea
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        rows={7}
        placeholder="Start with where you are now, then what led you here…"
        className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.10)] rounded-xl px-4 py-3 text-sm text-white resize-none focus:outline-none focus:border-[rgba(64,96,208,0.5)] transition-colors mb-3"
      />

      <div className="mb-5">
        <VoiceRecorder
          onTranscript={t => setAnswer(prev => prev ? prev + ' ' + t : t)}
        />
      </div>

      {saved && (
        <p className="text-xs text-green-400 mb-4">
          ✓ Saved — your Digital Twin knows how you introduce yourself.
        </p>
      )}

      <div className="flex gap-3 flex-wrap">
        {framingState !== 'done' || topStrength
          ? <button onClick={onBack} className={BTN_BACK}>← Back</button>
          : <button onClick={onBack} className={BTN_BACK}>← Back</button>
        }
        <button
          onClick={async () => { await saveAnswer(answer); onAdvance(); }}
          disabled={saving || !answer.trim()}
          className={`${BTN_PRIMARY} disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {saving ? 'Saving…' : 'Save & Continue →'}
        </button>
        {!answer.trim() && (
          <button onClick={onAdvance} className={BTN_SKIP}>Skip →</button>
        )}
      </div>
    </div>
  );
}

function StepLabel() {
  return (
    <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-widest">
      Career Narrative · Step 6 of 10
    </span>
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
