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

const RESHAPE_OPTIONS = [
  { label: 'Make it shorter',      angle: 'Rewrite in 80–100 words. Keep only the most important thread.' },
  { label: 'More conversational',  angle: 'Make it sound warmer and more natural — like they\'re talking to someone they\'ve just met.' },
  { label: 'More commercial',      angle: 'Lean into business impact and commercial direction. Frame everything as value creation.' },
  { label: 'Different opening',    angle: 'Keep the same content but try a completely different opening line.' },
];

type Mode = 'generating' | 'viewing' | 'editing';

export default function Step6CareerNarrative({ data, onSaved, onAdvance, onBack }: Props) {
  const existing = data.responses.find(
    r => r.module === 'real_interview' && r.question === FALLBACK_QUESTION
  );

  const [mode, setMode]             = useState<Mode>(existing?.answer_text ? 'viewing' : 'generating');
  const [narrative, setNarrative]   = useState(existing?.answer_text ?? '');
  const [draft, setDraft]           = useState(existing?.answer_text ?? '');
  const [reshaping, setReshaping]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const hasGeneratedRef             = useRef(!!existing?.answer_text);

  // Auto-generate on mount if no existing narrative
  useEffect(() => {
    if (hasGeneratedRef.current) return;
    hasGeneratedRef.current = true;
    generate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function generate(angle?: string) {
    setError('');
    if (angle) setReshaping(true);
    else setMode('generating');

    try {
      const res = await fetch('/api/training/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(angle ? { angle } : {}),
      });
      const json = await res.json() as { narrative?: string; error?: string };
      if (!res.ok || !json.narrative) {
        setError(json.error ?? 'Generation failed. Please try again.');
        setMode('viewing');
        return;
      }
      setNarrative(json.narrative);
      setDraft(json.narrative);
      setMode('viewing');
    } catch {
      setError('Something went wrong. Please try again.');
      setMode('viewing');
    } finally {
      setReshaping(false);
    }
  }

  function startEdit() {
    setDraft(narrative);
    setMode('editing');
  }

  function cancelEdit() {
    setDraft(narrative);
    setMode('viewing');
  }

  async function saveAndAdvance() {
    const text = (mode === 'editing' ? draft : narrative).trim();
    if (!text) { onAdvance(); return; }

    setSaving(true);
    try {
      await fetch('/api/training/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'real_interview', question: FALLBACK_QUESTION, answer_text: text }),
      });
      if (mode === 'editing') setNarrative(draft);
      onSaved('real_interview', 'Career narrative saved.');
      fetch('/api/training/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career_narrative: text }),
      }).catch(() => {});
      fetch('/api/generate-module-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'story_evidence' }),
      }).catch(() => {});
      onAdvance();
    } catch {
      setError('Failed to save. Please try again.');
    }
    setSaving(false);
  }

  // ── Loading / generating ─────────────────────────────────────────

  if (mode === 'generating') {
    return (
      <div className="max-w-lg">
        <StepLabel />
        <h1 className="text-xl font-bold text-white mt-1 mb-10">
          Writing your career narrative…
        </h1>
        <div className="flex flex-col items-center gap-5 py-8">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-[rgba(64,96,208,0.15)]" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#4060d0] animate-spin" style={{ animationDuration: '1.2s' }} />
          </div>
          <p className="text-sm text-[rgba(255,255,255,0.4)] text-center">
            Reading your background and finding the thread that connects it…
          </p>
        </div>
      </div>
    );
  }

  // ── View / edit mode ─────────────────────────────────────────────

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <StepLabel />
        <h1 className="text-xl font-bold text-white mt-1 mb-1">Your career narrative.</h1>
        <p className="text-sm text-[rgba(255,255,255,0.45)]">
          {mode === 'editing'
            ? 'Edit it until it sounds exactly like you.'
            : 'InterviewMind wrote this from your background. Read it, reshape it, make it yours.'}
        </p>
      </div>

      {/* Narrative card */}
      <div className={`rounded-2xl border p-6 mb-5 transition-colors ${
        mode === 'editing'
          ? 'border-[rgba(64,96,208,0.4)] bg-[rgba(64,96,208,0.04)]'
          : 'border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.03)]'
      }`}>

        {/* Label */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.28)] uppercase tracking-widest">
            {mode === 'editing' ? 'Editing' : '"Tell me about yourself."'}
          </span>
          {mode === 'viewing' && narrative && (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 text-[11px] text-[rgba(255,255,255,0.35)] hover:text-white transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          )}
        </div>

        {mode === 'viewing' ? (
          /* Reading view — clean typography */
          <p className="text-[15px] text-[rgba(255,255,255,0.88)] leading-[1.75] tracking-[0.01em]">
            {narrative || 'No narrative yet.'}
          </p>
        ) : (
          /* Edit mode — textarea + voice */
          <>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              autoFocus
              rows={8}
              className="w-full bg-transparent text-[15px] text-white leading-[1.75] resize-none focus:outline-none placeholder-[rgba(255,255,255,0.2)]"
              placeholder="Write your career narrative here…"
            />
            <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
              <VoiceRecorder onTranscript={t => setDraft(prev => prev ? prev + ' ' + t : t)} />
            </div>
          </>
        )}
      </div>

      {/* Reshape chips — only in view mode */}
      {mode === 'viewing' && narrative && (
        <div className="mb-5">
          <p className="text-[10px] text-[rgba(255,255,255,0.28)] uppercase tracking-wider mb-2">
            Reshape it
          </p>
          <div className="flex flex-wrap gap-1.5">
            {RESHAPE_OPTIONS.map(opt => (
              <button
                key={opt.label}
                onClick={() => generate(opt.angle)}
                disabled={reshaping}
                className="px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] text-xs text-[rgba(255,255,255,0.55)] hover:text-white hover:border-[rgba(64,96,208,0.4)] hover:bg-[rgba(64,96,208,0.08)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {reshaping ? '…' : opt.label}
              </button>
            ))}
            <button
              onClick={() => generate()}
              disabled={reshaping}
              className="px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] text-xs text-[rgba(255,255,255,0.55)] hover:text-white hover:border-[rgba(255,255,255,0.22)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ↺ Regenerate
            </button>
          </div>
          {reshaping && (
            <p className="text-xs text-[rgba(255,255,255,0.35)] mt-2 flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full border border-t-[#4060d0] border-[rgba(255,255,255,0.15)] animate-spin" />
              Rewriting…
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 mb-4">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {mode === 'editing' ? (
          <>
            <button onClick={cancelEdit} className={BTN_BACK}>Cancel</button>
            <button
              onClick={saveAndAdvance}
              disabled={saving || !draft.trim()}
              className={`${BTN_PRIMARY} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {saving ? 'Saving…' : 'Save & Continue →'}
            </button>
          </>
        ) : (
          <>
            <button onClick={onBack} className={BTN_BACK}>← Back</button>
            <button
              onClick={saveAndAdvance}
              disabled={saving}
              className={`${BTN_PRIMARY} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {saving ? 'Saving…' : narrative ? 'Save & Continue →' : 'Skip →'}
            </button>
          </>
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

const BTN_PRIMARY = 'inline-flex px-6 py-2.5 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] text-white text-sm font-medium transition-colors';
const BTN_BACK    = 'inline-flex px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.5)] hover:text-white text-sm transition-colors';
