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

// Matches exact strings in training-constants.ts for score tracking
const ALL_QUESTIONS = [
  // Real interview (excludes "Tell me about yourself" — covered in Step 6)
  { module: 'real_interview',     q: 'Why are you looking for a new role?',                                           hint: 'Honest and grounded. Recruiters hear rehearsed answers constantly.' },
  { module: 'real_interview',     q: 'Tell me about a time you failed.',                                              hint: 'Pick a real one. How you talk about failure says more than the failure itself.' },
  { module: 'real_interview',     q: "What's your biggest weakness?",                                                 hint: 'Avoid clichés. Pick something real and show how you manage it.' },
  { module: 'real_interview',     q: 'Where do you see yourself in three years?',                                     hint: 'Be honest about your direction — vague answers are forgettable.' },
  { module: 'real_interview',     q: 'Why do you want to work in this industry?',                                     hint: 'What actually draws you here? The real reason matters.' },
  { module: 'real_interview',     q: 'What makes you different from other candidates?',                               hint: "Don't perform. What do you genuinely bring that others don't?" },
  // Recruiter challenge
  { module: 'recruiter_challenge', q: 'Your CV shows only a few months in SaaS. Why are you qualified for this role?', hint: 'This is a real objection. How do you actually handle it?' },
  { module: 'recruiter_challenge', q: 'Why should we hire you over someone with more direct experience?',               hint: 'Make your case. Not a polished one — your real one.' },
  { module: 'recruiter_challenge', q: "You've moved roles quite frequently. How do we know you'll stay?",               hint: "Answer directly. Don't deflect or over-explain." },
  { module: 'recruiter_challenge', q: 'Your background is operations, not sales. Why do you think you can sell?',       hint: 'Show your commercial instinct through how you argue this.' },
  { module: 'recruiter_challenge', q: "What's the gap between where you are now and where this role needs you to be?",  hint: 'Honesty here builds more trust than a defensive answer.' },
] as const;

type QuestionKey = `${string}::${string}`;

export default function Step9InterviewReadiness({ data, onSaved, onAdvance, onBack }: Props) {
  const makeKey = (m: string, q: string): QuestionKey => `${m}::${q}` as QuestionKey;

  const [qIdx, setQIdx] = useState(() => {
    const first = ALL_QUESTIONS.findIndex(({ module: m, q }) => {
      const existing = data.responses.find(r => r.module === m && r.question === q);
      return !(existing?.answer_text?.trim() || existing?.answer_audio_transcript?.trim());
    });
    return first >= 0 ? first : 0;
  });

  const [answers, setAnswers] = useState<Record<QuestionKey, string>>(
    () => Object.fromEntries(
      ALL_QUESTIONS.map(({ module: m, q }) => {
        const existing = data.responses.find(r => r.module === m && r.question === q);
        return [makeKey(m, q), existing?.answer_text ?? ''];
      })
    ) as Record<QuestionKey, string>
  );

  const [saving, setSaving] = useState(false);

  const current = ALL_QUESTIONS[qIdx];
  const key = makeKey(current.module, current.q);
  const isLast = qIdx === ALL_QUESTIONS.length - 1;
  const answeredCount = ALL_QUESTIONS.filter(({ module: m, q }) => answers[makeKey(m, q)]?.trim()).length;
  const sectionLabel = current.module === 'real_interview' ? 'Real Interview' : 'Recruiter Challenge';

  async function saveAndAdvance() {
    const text = answers[key]?.trim();
    if (text) {
      setSaving(true);
      try {
        await fetch('/api/training/responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ module: current.module, question: current.q, answer_text: text }),
        });
        onSaved(current.module, 'Answer saved.');
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
          Interview Readiness · Step 9 of 10
        </span>
        <h1 className="text-xl font-bold text-white mt-1 mb-1">Pressure-test your Digital Twin.</h1>
        <p className="text-sm text-[rgba(255,255,255,0.4)]">
          {answeredCount} of {ALL_QUESTIONS.length} answered.
        </p>
      </div>

      {/* Progress track */}
      <div className="flex gap-1 mb-5">
        {ALL_QUESTIONS.map((item, i) => (
          <button
            key={i}
            onClick={() => setQIdx(i)}
            className={`h-1.5 rounded-full transition-all flex-1 ${
              i === qIdx ? 'bg-[#4060d0]' :
              answers[makeKey(item.module, item.q)]?.trim() ? 'bg-green-500/50' :
              'bg-[rgba(255,255,255,0.10)]'
            }`}
          />
        ))}
      </div>

      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5 mb-4">
        <div className="mb-3">
          <span className="text-[10px] text-[rgba(255,255,255,0.3)] uppercase tracking-wider">
            {sectionLabel} · {qIdx + 1} of {ALL_QUESTIONS.length}
          </span>
          <p className="text-sm font-medium text-white mt-1 mb-0.5">{current.q}</p>
          <p className="text-xs text-[rgba(255,255,255,0.35)] italic">{current.hint}</p>
        </div>
        <textarea
          value={answers[key] ?? ''}
          onChange={e => setAnswers(prev => ({ ...prev, [key]: e.target.value }))}
          rows={5}
          placeholder="Your real answer — don't perform…"
          className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.10)] rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-[rgba(64,96,208,0.5)] transition-colors mb-3"
        />
        <VoiceRecorder
          onTranscript={t =>
            setAnswers(prev => ({
              ...prev,
              [key]: prev[key] ? prev[key] + ' ' + t : t,
            }))
          }
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
        {!answers[key]?.trim() && (
          <button onClick={skip} className={BTN_SKIP}>Skip</button>
        )}
      </div>
    </div>
  );
}

const BTN_PRIMARY = 'inline-flex px-6 py-2.5 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] text-white text-sm font-medium transition-colors';
const BTN_BACK    = 'inline-flex px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.5)] hover:text-white text-sm transition-colors';
const BTN_SKIP    = 'inline-flex px-5 py-2.5 rounded-xl bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.6)] hover:text-white text-sm transition-colors';
