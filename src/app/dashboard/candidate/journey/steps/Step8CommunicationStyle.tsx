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

const FALLBACK_QUESTIONS = [
  { q: 'How do you typically communicate with clients or stakeholders who are under pressure?', hint: 'Think of a specific pattern you use — not what you think you should do.' },
  { q: 'What motivates you most in your day-to-day work?',                                     hint: 'Honest answer — not what sounds impressive.' },
  { q: 'How do you work best — structured or flexible?',                                       hint: 'Most people are somewhere in between. Where exactly are you?' },
  { q: 'What triggers frustration for you at work, and how do you manage it?',                 hint: 'Self-awareness here matters more than the answer itself.' },
  { q: 'How do you prefer to receive feedback — immediately or with time to reflect?',         hint: 'Be specific about what actually works for you.' },
];

interface Question { q: string; hint: string }

export default function Step8CommunicationStyle({ data, moduleOptions, onSaved, onAdvance, onBack }: Props) {
  const [generatedOpts, setGeneratedOpts] = useState<GeneratedModuleOptions | null>(moduleOptions);
  const [generating, setGenerating] = useState(!moduleOptions);
  const generatingRef = useRef(false);

  useEffect(() => {
    if (generatedOpts || generatingRef.current) return;
    generatingRef.current = true;
    fetch('/api/generate-module-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'communication_style' }),
    })
      .then(r => r.json())
      .then((j: { options?: GeneratedModuleOptions }) => { if (j.options) setGeneratedOpts(j.options); })
      .catch(() => {})
      .finally(() => setGenerating(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const questions: Question[] = generatedOpts?.options.map(o => ({ q: o.label, hint: o.detail })) ?? FALLBACK_QUESTIONS;

  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(
      questions.map(({ q }) => {
        const existing = data.responses.find(r => r.module === 'communication_style' && r.question === q);
        return [q, existing?.answer_text ?? ''];
      })
    )
  );
  const [saving, setSaving] = useState(false);

  const current = questions[qIdx];
  const isFirst = qIdx === 0;
  const isLast  = qIdx === questions.length - 1;
  const answeredCount = questions.filter(({ q }) => answers[q]?.trim()).length;

  async function saveAndNext() {
    const text = answers[current.q]?.trim();
    if (text) {
      setSaving(true);
      try {
        await fetch('/api/training/responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ module: 'communication_style', question: current.q, answer_text: text }),
        });
        onSaved('communication_style', 'Communication style updated.');
      } catch { /* silent */ }
      setSaving(false);
    }

    if (isLast) {
      fetch('/api/training/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communication_style: Object.fromEntries(questions.map(({ q }) => [q, answers[q] ?? ''])) }),
      }).catch(() => {});
      fetch('/api/generate-module-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'interview_readiness' }),
      }).catch(() => {});
      onAdvance();
    } else {
      setQIdx(i => i + 1);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────

  if (generating && !generatedOpts) {
    return (
      <div className="max-w-lg">
        <StepLabel />
        <h1 className="text-xl font-bold text-white mt-1 mb-8">How you think and work.</h1>
        <div className="flex items-center gap-3 py-6 text-sm text-[rgba(255,255,255,0.4)]">
          <div className="w-4 h-4 rounded-full border-2 border-t-[#4060d0] animate-spin flex-shrink-0" />
          Personalising your next step…
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <StepLabel />
        <h1 className="text-xl font-bold text-white mt-1 mb-1">How you think and work.</h1>
        <p className="text-sm text-[rgba(255,255,255,0.45)]">
          This is how your Digital Twin learns to sound like you. Answer honestly — not impressively.
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mb-6">
        {questions.map((item, i) => (
          <button
            key={i}
            onClick={() => setQIdx(i)}
            className={`transition-all rounded-full ${
              i === qIdx
                ? 'w-5 h-1.5 bg-[#4060d0]'
                : answers[item.q]?.trim()
                ? 'w-1.5 h-1.5 bg-green-500/50'
                : 'w-1.5 h-1.5 bg-[rgba(255,255,255,0.15)]'
            }`}
            aria-label={`Question ${i + 1}`}
          />
        ))}
        <span className="ml-auto text-[11px] text-[rgba(255,255,255,0.28)] tabular-nums">
          {qIdx + 1} / {questions.length}
        </span>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.03)] p-6 mb-5">
        <p className="text-sm font-semibold text-white mb-1">{current.q}</p>
        <p className="text-xs text-[rgba(255,255,255,0.35)] italic mb-5">{current.hint}</p>
        <textarea
          key={current.q}
          value={answers[current.q] ?? ''}
          onChange={e => setAnswers(prev => ({ ...prev, [current.q]: e.target.value }))}
          rows={5}
          placeholder="Your honest answer…"
          className="w-full bg-transparent text-sm text-white resize-none focus:outline-none placeholder-[rgba(255,255,255,0.2)] leading-relaxed"
        />
        <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <VoiceRecorder
            onTranscript={t => setAnswers(prev => ({ ...prev, [current.q]: prev[current.q] ? prev[current.q] + ' ' + t : t }))}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {isFirst
            ? <button onClick={onBack} className={BTN_BACK}>← Back</button>
            : <button onClick={() => setQIdx(i => i - 1)} className={BTN_BACK}>← Prev</button>
          }
        </div>
        <button
          onClick={saveAndNext}
          disabled={saving}
          className={`${BTN_PRIMARY} disabled:opacity-40`}
        >
          {saving ? 'Saving…' : isLast ? 'Continue →' : 'Next →'}
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-1.5">
        {answeredCount > 0 && (
          <p className="text-xs text-[rgba(255,255,255,0.28)]">
            {answeredCount} of {questions.length} answered
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
      Communication Style · Step 8 of 10
    </span>
  );
}

const BTN_PRIMARY = 'inline-flex px-6 py-2.5 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] text-white text-sm font-medium transition-colors';
const BTN_BACK    = 'inline-flex px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.5)] hover:text-white text-sm transition-colors';
