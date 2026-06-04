'use client';

import { useState } from 'react';
import type { TrainingData } from '../../TrainingHub';
import VoiceRecorder from '../../components/VoiceRecorder';

interface Props {
  data: TrainingData;
  onSaved: (moduleId: string, message?: string) => void;
  onAdvance: () => void;
  onBack: () => void;
}

const QUESTIONS = [
  {
    q: 'How do you typically communicate with clients or stakeholders who are under pressure?',
    hint: 'Think of a specific pattern you use — not what you think you should do.',
  },
  {
    q: 'What motivates you most in your day-to-day work?',
    hint: 'Honest answer — not what sounds impressive.',
  },
  {
    q: 'How do you work best — structured or flexible?',
    hint: 'Most people are somewhere in between. Where exactly are you?',
  },
  {
    q: 'What triggers frustration for you at work, and how do you manage it?',
    hint: 'Self-awareness here matters more than the answer itself.',
  },
  {
    q: 'How do you prefer to receive feedback — immediately in the moment, or with time to reflect?',
    hint: 'Be specific about what actually works for you.',
  },
];

export default function Step8CommunicationStyle({ data, onSaved, onAdvance, onBack }: Props) {
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(
      QUESTIONS.map(({ q }) => {
        const existing = data.responses.find(
          r => r.module === 'communication_style' && r.question === q
        );
        return [q, existing?.answer_text ?? ''];
      })
    )
  );
  const [saving, setSaving] = useState(false);

  const current = QUESTIONS[qIdx];
  const answeredCount = QUESTIONS.filter(({ q }) => answers[q]?.trim()).length;
  const isLast = qIdx === QUESTIONS.length - 1;

  async function saveAndAdvance() {
    const text = answers[current.q]?.trim();
    if (text) {
      setSaving(true);
      try {
        await fetch('/api/training/responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module: 'communication_style',
            question: current.q,
            answer_text: text,
          }),
        });
        onSaved('communication_style', 'Communication style updated.');
      } catch { /* silent */ }
      setSaving(false);
    }
    if (isLast) onAdvance();
    else setQIdx(i => i + 1);
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
          {answeredCount} of {QUESTIONS.length} answered. This is how your Digital Twin learns to sound like you.
        </p>
      </div>

      {/* Progress track */}
      <div className="flex gap-1 mb-5">
        {QUESTIONS.map((_, i) => (
          <button
            key={i}
            onClick={() => setQIdx(i)}
            className={`h-1.5 rounded-full transition-all flex-1 ${
              i === qIdx ? 'bg-[#4060d0]' :
              answers[QUESTIONS[i].q]?.trim() ? 'bg-green-500/50' :
              'bg-[rgba(255,255,255,0.10)]'
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
          onTranscript={t =>
            setAnswers(prev => ({
              ...prev,
              [current.q]: prev[current.q] ? prev[current.q] + ' ' + t : t,
            }))
          }
        />
      </div>

      <div className="flex gap-3">
        {qIdx > 0
          ? <button onClick={() => setQIdx(i => i - 1)} className={BTN_BACK}>← Prev</button>
          : <button onClick={onBack} className={BTN_BACK}>← Back</button>
        }
        <button
          onClick={saveAndAdvance}
          disabled={saving}
          className={`${BTN_PRIMARY} disabled:opacity-40`}
        >
          {saving ? 'Saving…' : isLast ? 'Continue →' : 'Next →'}
        </button>
        {!answers[current.q]?.trim() && (
          <button onClick={skip} className={BTN_SKIP}>Skip</button>
        )}
      </div>
    </div>
  );
}

const BTN_PRIMARY = 'inline-flex px-6 py-2.5 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] text-white text-sm font-medium transition-colors';
const BTN_BACK    = 'inline-flex px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.5)] hover:text-white text-sm transition-colors';
const BTN_SKIP    = 'inline-flex px-5 py-2.5 rounded-xl bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.6)] hover:text-white text-sm transition-colors';
