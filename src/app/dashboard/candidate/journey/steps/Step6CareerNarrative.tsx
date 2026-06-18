'use client';

import { useState, useEffect, useRef } from 'react';
import type { TrainingData } from '../../TrainingHub';
import type { GeneratedModuleOptions } from '@/app/api/generate-module-options/route';
import VoiceRecorder from '../../components/VoiceRecorder';

interface Props {
  data: TrainingData;
  moduleOptions: GeneratedModuleOptions | null;
  onSaved: (moduleId: string, message?: string) => void;
  onAdvance: () => void;
  onBack: () => void;
}

const FALLBACK_QUESTION = 'Tell me about yourself.';

export default function Step6CareerNarrative({ data, moduleOptions, onSaved, onAdvance, onBack }: Props) {
  const [generatedOpts, setGeneratedOpts] = useState<GeneratedModuleOptions | null>(moduleOptions);
  const [generating, setGenerating] = useState(false);
  const generatingRef = useRef(false);

  useEffect(() => {
    if (generatedOpts || generatingRef.current) return;
    generatingRef.current = true;
    setGenerating(true);
    fetch('/api/generate-module-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'career_narrative' }),
    })
      .then(r => r.json())
      .then((j: { options?: GeneratedModuleOptions }) => { if (j.options) setGeneratedOpts(j.options); })
      .catch(() => {})
      .finally(() => setGenerating(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const existing = data.responses.find(r => r.module === 'real_interview' && r.question === FALLBACK_QUESTION);
  const [answer, setAnswer] = useState(existing?.answer_text ?? '');
  const [saving, setSaving] = useState(false);

  async function saveAndAdvance() {
    if (!answer.trim()) { onAdvance(); return; }
    setSaving(true);
    try {
      await fetch('/api/training/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'real_interview', question: FALLBACK_QUESTION, answer_text: answer }),
      });
      onSaved('real_interview', 'Career narrative saved.');
      fetch('/api/training/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career_narrative: answer }),
      }).catch(() => {});
      fetch('/api/generate-module-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'story_evidence' }),
      }).catch(() => {});
      onAdvance();
    } catch { /* silent */ }
    setSaving(false);
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-widest">
          Career Narrative · Step 6 of 10
        </span>
        <h1 className="text-xl font-bold text-white mt-1 mb-1">Your story, in your own words.</h1>
        <p className="text-sm text-[rgba(255,255,255,0.45)]">
          How would you answer "Tell me about yourself"? Write naturally — not a rehearsed pitch.
        </p>
      </div>

      {/* Compact hook chips */}
      {generating && !generatedOpts ? (
        <div className="flex items-center gap-2 mb-5 text-xs text-[rgba(255,255,255,0.35)]">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-t-[#4060d0] animate-spin flex-shrink-0" />
          Generating angles…
        </div>
      ) : generatedOpts?.options.length ? (
        <div className="mb-5">
          <p className="text-[10px] text-[rgba(255,255,255,0.3)] uppercase tracking-wider mb-2">
            Start from an angle — or write from scratch below
          </p>
          <div className="flex flex-wrap gap-1.5">
            {generatedOpts.options.map(opt => (
              <button
                key={opt.label}
                onClick={() => { if (!answer.trim()) setAnswer(opt.label + ' '); }}
                title={opt.detail}
                className="px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] text-xs text-[rgba(255,255,255,0.55)] hover:text-white hover:border-[rgba(64,96,208,0.4)] hover:bg-[rgba(64,96,208,0.08)] transition-all"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Main textarea */}
      <div className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.03)] p-6 mb-5">
        <p className="text-sm font-medium text-white mb-1">{FALLBACK_QUESTION}</p>
        <p className="text-xs text-[rgba(255,255,255,0.32)] italic mb-4">
          Ground it in something real — where you are now, what led you here.
        </p>
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          rows={7}
          placeholder="Start with where you are now, then what led you here…"
          className="w-full bg-transparent text-sm text-white resize-none focus:outline-none placeholder-[rgba(255,255,255,0.2)] leading-relaxed"
        />
        <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <VoiceRecorder onTranscript={t => setAnswer(prev => prev ? prev + ' ' + t : t)} />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className={BTN_BACK}>← Back</button>
        <button
          onClick={saveAndAdvance}
          disabled={saving}
          className={`${BTN_PRIMARY} disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {saving ? 'Saving…' : answer.trim() ? 'Save & Continue →' : 'Skip →'}
        </button>
      </div>

      {generatedOpts?.coaching_tip && (
        <p className="text-xs text-[rgba(255,255,255,0.28)] italic mt-5">
          💡 {generatedOpts.coaching_tip}
        </p>
      )}
    </div>
  );
}

const BTN_PRIMARY = 'inline-flex px-6 py-2.5 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] text-white text-sm font-medium transition-colors';
const BTN_BACK    = 'inline-flex px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.5)] hover:text-white text-sm transition-colors';
