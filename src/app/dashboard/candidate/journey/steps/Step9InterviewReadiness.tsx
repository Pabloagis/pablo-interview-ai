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

// Fallback questions matching exact strings in training-constants.ts for score tracking
const FALLBACK_QUESTIONS = [
  { module: 'real_interview',      q: 'Why are you looking for a new role?',                                           hint: 'Honest and grounded. Recruiters hear rehearsed answers constantly.' },
  { module: 'real_interview',      q: 'Tell me about a time you failed.',                                              hint: 'Pick a real one. How you talk about failure says more than the failure itself.' },
  { module: 'real_interview',      q: "What's your biggest weakness?",                                                 hint: 'Avoid clichés. Pick something real and show how you manage it.' },
  { module: 'recruiter_challenge', q: 'Your CV shows only a few months in SaaS. Why are you qualified for this role?', hint: 'This is a real objection. How do you actually handle it?' },
  { module: 'recruiter_challenge', q: 'Why should we hire you over someone with more direct experience?',               hint: 'Make your case. Not a polished one — your real one.' },
  { module: 'recruiter_challenge', q: "What's the gap between where you are now and where this role needs you to be?",  hint: 'Honesty here builds more trust than a defensive answer.' },
];

interface Question { module: string; q: string; hint: string }

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
  const makeKey = (m: string, q: string) => `${m}::${q}`;

  const [qIdx, setQIdx] = useState(() => {
    const first = questions.findIndex(({ module: m, q }) => {
      const ex = data.responses.find(r => r.module === m && r.question === q);
      return !(ex?.answer_text?.trim() || ex?.answer_audio_transcript?.trim());
    });
    return first >= 0 ? first : 0;
  });

  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(
      questions.map(({ module: m, q }) => {
        const ex = data.responses.find(r => r.module === m && r.question === q);
        return [makeKey(m, q), ex?.answer_text ?? ''];
      })
    )
  );
  const [saving, setSaving] = useState(false);

  const current = questions[qIdx];
  const key = makeKey(current.module, current.q);
  const isLast = qIdx === questions.length - 1;
  const answeredCount = questions.filter(({ module: m, q }) => answers[makeKey(m, q)]?.trim()).length;

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

    if (isLast) {
      const answeredPairs = Object.fromEntries(
        questions.map(({ module: m, q }) => [q, answers[makeKey(m, q)] ?? ''])
      );

      fetch('/api/training/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interview_answers: answeredPairs }),
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
          Interview Readiness · Step 9 of 10
        </span>
        <h1 className="text-xl font-bold text-white mt-1 mb-1">Pressure-test your Digital Twin.</h1>
        <p className="text-sm text-[rgba(255,255,255,0.4)]">{answeredCount} of {questions.length} answered.</p>
      </div>

      {coaching_tip && (
        <p className="text-xs text-[rgba(255,255,255,0.38)] italic mb-4">💡 {coaching_tip}</p>
      )}

      {/* Progress track */}
      <div className="flex gap-1 mb-5">
        {questions.map((item, i) => (
          <button key={i} onClick={() => setQIdx(i)}
            className={`h-1.5 rounded-full transition-all flex-1 ${
              i === qIdx ? 'bg-[#4060d0]' :
              answers[makeKey(item.module, item.q)]?.trim() ? 'bg-green-500/50' : 'bg-[rgba(255,255,255,0.10)]'
            }`}
          />
        ))}
      </div>

      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5 mb-4">
        <div className="mb-3">
          <span className="text-[10px] text-[rgba(255,255,255,0.3)] uppercase tracking-wider">
            Question {qIdx + 1} of {questions.length}
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
          onTranscript={t => setAnswers(prev => ({ ...prev, [key]: prev[key] ? prev[key] + ' ' + t : t }))}
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

export default function Step9InterviewReadiness({ data, moduleOptions, onSaved, onAdvance, onBack }: Props) {
  const [generatedOpts, setGeneratedOpts] = useState<GeneratedModuleOptions | null>(moduleOptions);
  const [generating, setGenerating] = useState(!moduleOptions);
  const generatingRef = useRef(false);

  useEffect(() => {
    if (generatedOpts || generatingRef.current) return;
    generatingRef.current = true;
    fetch('/api/generate-module-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'interview_readiness' }),
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
          Interview Readiness · Step 9 of 10
        </span>
        <h1 className="text-xl font-bold text-white mt-1 mb-8">Pressure-test your Digital Twin.</h1>
        <div className="flex items-center gap-3 py-6 text-sm text-[rgba(255,255,255,0.4)]">
          <div className="w-4 h-4 rounded-full border-2 border-t-[#4060d0] animate-spin flex-shrink-0" />
          Personalising your next step…
        </div>
      </div>
    );
  }

  // Adaptive questions use 'interview_readiness' module; fallback uses original modules for score tracking
  const questions: Question[] = generatedOpts?.options.map(o => ({
    module: 'interview_readiness',
    q: o.label,
    hint: o.detail,
  })) ?? FALLBACK_QUESTIONS;

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
