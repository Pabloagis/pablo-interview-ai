'use client';

import { useState, useRef, useEffect } from 'react';
import VoiceRecorder from '../components/VoiceRecorder';
import type { TrainingData } from '../TrainingHub';

interface Question {
  question: string;
  microcopy: string;
}

interface Props {
  moduleId: string;
  intro: string;
  questions: Question[];
  data: TrainingData;
  onSaved: (moduleId: string, message?: string) => void;
}

function QuestionBlock({
  moduleId,
  question,
  microcopy,
  initialValue,
  onSaved,
}: {
  moduleId: string;
  question: string;
  microcopy: string;
  initialValue: string;
  onSaved: (moduleId: string, message?: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync if parent data updates (e.g. after voice transcript saved)
  useEffect(() => { setValue(initialValue); }, [initialValue]);

  async function save(text: string) {
    try {
      await fetch('/api/training/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: moduleId, question, answer_text: text }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onSaved(moduleId, 'Your AI just heard how you answer this question.');
    } catch {
      // non-blocking
    }
  }

  function handleChange(text: string) {
    setValue(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(text), 2000);
  }

  function handleVoiceTranscript(transcript: string) {
    const merged = value ? `${value.trimEnd()} ${transcript}` : transcript;
    handleChange(merged);
  }

  const hasAnswer = value.trim().length > 0;

  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-start gap-2 mb-1.5">
        <div
          className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full"
          style={{ background: hasAnswer ? 'rgba(96,192,128,0.8)' : 'rgba(255,255,255,0.2)' }}
        />
        <p className="text-xs font-semibold text-white leading-snug">{question}</p>
      </div>
      <p className="text-[10px] text-[rgba(255,255,255,0.3)] mb-2 pl-3.5 leading-relaxed italic">
        {microcopy}
      </p>

      <textarea
        rows={4}
        value={value}
        onChange={e => handleChange(e.target.value)}
        placeholder="Answer exactly as you would in a real interview. Don't edit for perfection — authenticity is more valuable."
        className="w-full resize-y rounded-lg text-xs leading-relaxed outline-none"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.85)',
          padding: '10px 12px',
          minHeight: 88,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(64,96,208,0.5)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
      />

      <div className="flex items-center justify-between mt-1.5 pl-0.5">
        <VoiceRecorder onTranscript={handleVoiceTranscript} />
        {saved && (
          <span className="text-[10px] text-[rgba(96,192,128,0.8)] transition-opacity">
            Saved ✓
          </span>
        )}
      </div>
    </div>
  );
}

export default function OpenResponseModule({ moduleId, intro, questions, data, onSaved }: Props) {
  function getInitialValue(question: string) {
    const r = data.responses.find(
      r => r.module === moduleId && r.question === question
    );
    return r?.answer_text ?? r?.answer_audio_transcript ?? '';
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-[rgba(255,255,255,0.4)] leading-relaxed mb-4 italic">
        {intro}
      </p>

      <div
        className="rounded-xl p-4"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '0.5px solid rgba(255,255,255,0.07)',
        }}
      >
        {questions.map(q => (
          <QuestionBlock
            key={q.question}
            moduleId={moduleId}
            question={q.question}
            microcopy={q.microcopy}
            initialValue={getInitialValue(q.question)}
            onSaved={onSaved}
          />
        ))}
      </div>

      <p className="text-[10px] text-[rgba(255,255,255,0.2)] italic mt-1">
        Auto-saves 2 seconds after you stop typing.
      </p>
    </div>
  );
}
