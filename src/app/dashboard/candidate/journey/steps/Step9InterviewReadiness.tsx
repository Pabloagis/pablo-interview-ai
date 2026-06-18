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
  { module: 'real_interview',      q: 'Why are you looking for a new role?',                                           hint: 'Honest and grounded. Recruiters hear rehearsed answers constantly.' },
  { module: 'real_interview',      q: 'Tell me about a time you failed.',                                              hint: 'Pick a real one. How you talk about failure says more than the failure itself.' },
  { module: 'real_interview',      q: "What's your biggest weakness?",                                                 hint: 'Avoid clichés. Pick something real and show how you manage it.' },
  { module: 'recruiter_challenge', q: 'Your CV shows only a few months in SaaS. Why are you qualified for this role?', hint: 'This is a real objection. How do you actually handle it?' },
  { module: 'recruiter_challenge', q: 'Why should we hire you over someone with more direct experience?',               hint: 'Make your case. Not a polished one — your real one.' },
  { module: 'recruiter_challenge', q: "What's the gap between where you are now and where this role needs you to be?",  hint: 'Honesty here builds more trust than a defensive answer.' },
];

interface Question { module: string; q: string; hint: string }

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

  const questions: Question[] = generatedOpts?.options.map(o => ({
    module: 'interview_readiness',
    q: o.label,
    hint: o.detail,
  })) ?? FALLBACK_QUESTIONS;

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
  const isFirst = qIdx === 0;
  const isLast  = qIdx === questions.length - 1;
  const answeredCount = questions.filter(({ module: m, q }) => answers[makeKey(m, q)]?.trim()).length;

  async function saveAndNext() {
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
      fetch('/api/training/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interview_answers: Object.fromEntries(questions.map(({ module: m, q }) => [q, answers[makeKey(m, q)] ?? ''])) }),
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
        <h1 className="text-xl font-bold text-white mt-1 mb-8">Pressure-test your Digital Twin.</h1>
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
        <h1 className="text-xl font-bold text-white mt-1 mb-1">Pressure-test your Digital Twin.</h1>
        <p className="text-sm text-[rgba(255,255,255,0.45)]">
          Hard questions your Digital Twin needs to be able to handle. Answer in your own words — not a rehearsed script.
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
                : answers[makeKey(item.module, item.q)]?.trim()
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
          key={key}
          value={answers[key] ?? ''}
          onChange={e => setAnswers(prev => ({ ...prev, [key]: e.target.value }))}
          rows={5}
          placeholder="Your real answer — don't perform…"
          className="w-full bg-transparent text-sm text-white resize-none focus:outline-none placeholder-[rgba(255,255,255,0.2)] leading-relaxed"
        />
        <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <VoiceRecorder
            onTranscript={t => setAnswers(prev => ({ ...prev, [key]: prev[key] ? prev[key] + ' ' + t : t }))}
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
      Interview Readiness · Step 9 of 10
    </span>
  );
}

const BTN_PRIMARY = 'inline-flex px-6 py-2.5 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] text-white text-sm font-medium transition-colors';
const BTN_BACK    = 'inline-flex px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.5)] hover:text-white text-sm transition-colors';
