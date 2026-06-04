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

function QuestionsForm({
  questions,
  data,
  coaching_tip,
  onSaved,
  onAdvance,
  onBack,
}: {
  questions: Question[];
  data: TrainingData;
  coaching_tip?: string;
  onSaved: Props['onSaved'];
  onAdvance: () => void;
  onBack: () => void;
}) {
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
  const isLast = qIdx === questions.length - 1;
  const answeredCount = questions.filter(({ q }) => answers[q]?.trim()).length;

  async function saveAndAdvance() {
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
      const allAnswers = Object.fromEntries(
        questions.map(({ q }) => [q, answers[q] ?? ''])
      );

      fetch('/api/training/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communication_style: allAnswers }),
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

  function skip() {
    if (isLast) onAdvance();
    else setQIdx(i => i + 1);
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-widest">
          Communication Style · Step 8 of 10
        </span>
        <h1 className="text-xl font-bold text-white mt-1 mb-1">How you think and work.</h1>
        <p className="text-sm text-[rgba(255,255,255,0.4)]">
          {answeredCount} of {questions.length} answered. This is how your Digital Twin learns to sound like you.
        </p>
      </div>

      {coaching_tip && (
        <p className="text-xs text-[rgba(255,255,255,0.38)] italic mb-4">💡 {coaching_tip}</p>
      )}

      {/* Progress track */}
      <div className="flex gap-1 mb-5">
        {questions.map((_, i) => (
          <button key={i} onClick={() => setQIdx(i)}
            className={`h-1.5 rounded-full transition-all flex-1 ${
              i === qIdx ? 'bg-[#4060d0]' :
              answers[questions[i].q]?.trim() ? 'bg-green-500/50' : 'bg-[rgba(255,255,255,0.10)]'
            }`}
          />
        ))}
      </div>

      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5 mb-4">
        <p className="text-sm font-medium text-white mb-1">{current.q}</p>
        <p className="text-xs text-[rgba(255,255,255,0.35)] italic mb-4">{current.hint}</p>
        <textarea
          value={answers[current.q] ?? ''}
          onChange={e => setAnswers(prev => ({ ...prev, [current.q]: e.target.value }))}
          rows={5}
          placeholder="Your honest answer…"
          className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.10)] rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-[rgba(64,96,208,0.5)] transition-colors mb-3"
        />
        <VoiceRecorder
          onTranscript={t => setAnswers(prev => ({ ...prev, [current.q]: prev[current.q] ? prev[current.q] + ' ' + t : t }))}
        />
      </div>

      <div className="flex gap-3">
        {qIdx > 0
          ? <button onClick={() => setQIdx(i => i - 1)} className={BTN_BACK}>← Prev</button>
          : <button onClick={onBack} className={BTN_BACK}>← Back</button>
        }
        <button onClick={saveAndAdvance} disabled={saving} className={`${BTN_PRIMARY} disabled:opacity-40`}>
          {saving ? 'Saving…' : isLast ? 'Continue →' : 'Next →'}
        </button>
        {!answers[current.q]?.trim() && (
          <button onClick={skip} className={BTN_SKIP}>Skip</button>
        )}
      </div>
    </div>
  );
}

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

  if (generating && !generatedOpts) {
    return (
      <div className="max-w-xl">
        <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-widest">
          Communication Style · Step 8 of 10
        </span>
        <h1 className="text-xl font-bold text-white mt-1 mb-8">How you think and work.</h1>
        <div className="flex items-center gap-3 py-6 text-sm text-[rgba(255,255,255,0.4)]">
          <div className="w-4 h-4 rounded-full border-2 border-t-[#4060d0] animate-spin flex-shrink-0" />
          Personalising your next step…
        </div>
      </div>
    );
  }

  const questions: Question[] = generatedOpts?.options.map(o => ({ q: o.label, hint: o.detail })) ?? FALLBACK_QUESTIONS;

  return (
    <QuestionsForm
      questions={questions}
      data={data}
      coaching_tip={generatedOpts?.coaching_tip}
      onSaved={onSaved}
      onAdvance={onAdvance}
      onBack={onBack}
    />
  );
}

const BTN_PRIMARY = 'inline-flex px-6 py-2.5 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] text-white text-sm font-medium transition-colors';
const BTN_BACK    = 'inline-flex px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.5)] hover:text-white text-sm transition-colors';
const BTN_SKIP    = 'inline-flex px-5 py-2.5 rounded-xl bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.6)] hover:text-white text-sm transition-colors';
