'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { TrainingData, Story } from '../../TrainingHub';
import type { GeneratedModuleOptions } from '@/app/api/generate-module-options/route';
import { STORY_TYPES, STORY_OPTIONS } from '../../modules/storyData';

interface Props {
  data: TrainingData;
  moduleOptions: GeneratedModuleOptions | null;
  onSaved: (moduleId: string, message?: string) => void;
  onAdvance: () => void;
  onBack: () => void;
}

// STAR fields shown one at a time inside each story
const STAR_FIELDS: { key: keyof Omit<Story, 'id' | 'story_type'>; label: string; hint: string }[] = [
  { key: 'situation', label: 'Situation',       hint: 'Set the scene. What was happening and why did it matter?' },
  { key: 'task',      label: 'Task / Thinking', hint: 'What was your role? What were you trying to achieve?' },
  { key: 'action',    label: 'Action',          hint: 'What did YOU specifically do? Be concrete — not "we".' },
  { key: 'result',    label: 'Result',          hint: 'What happened? Add a metric if you have one — even approximate.' },
];

// ── Single story editor (one STAR field at a time) ────────────────

function SingleStoryEditor({
  storyType,
  initial,
  onSaved,
}: {
  storyType: string;
  initial: Story | null;
  onSaved: Props['onSaved'];
}) {
  const [fieldIdx, setFieldIdx] = useState(0);
  const [fields, setFields] = useState({
    situation: initial?.situation ?? '',
    task:      initial?.task      ?? '',
    action:    initial?.action    ?? '',
    result:    initial?.result    ?? '',
  });
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const options = STORY_OPTIONS[storyType] ?? STORY_OPTIONS['biggest_success'];
  const currentField = STAR_FIELDS[fieldIdx];
  const isLastField = fieldIdx === STAR_FIELDS.length - 1;

  const saveField = useCallback(
    async (key: string, value: string, currentFields: typeof fields) => {
      try {
        await fetch('/api/training/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ story_type: storyType, ...currentFields, [key]: value }),
        });
        onSaved('stories', 'Story saved — your Digital Twin just learned this.');
      } catch { /* silent */ }
    },
    [storyType, onSaved]
  );

  function handleChange(key: keyof typeof fields, value: string) {
    const updated = { ...fields, [key]: value };
    setFields(updated);
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => saveField(key, value, updated), 2000);
  }

  const completedFields = STAR_FIELDS.filter(f => fields[f.key].trim()).length;

  return (
    <div className="flex flex-col gap-4">
      {/* STAR field progress dots */}
      <div className="flex items-center gap-1.5">
        {STAR_FIELDS.map((f, i) => (
          <button
            key={f.key}
            onClick={() => setFieldIdx(i)}
            className={`transition-all rounded-full ${
              i === fieldIdx
                ? 'w-5 h-1.5 bg-[#4060d0]'
                : fields[f.key].trim()
                ? 'w-1.5 h-1.5 bg-green-500/50'
                : 'w-1.5 h-1.5 bg-[rgba(255,255,255,0.15)]'
            }`}
            aria-label={f.label}
          />
        ))}
        <span className="ml-auto text-[10px] text-[rgba(255,255,255,0.28)] tabular-nums">
          {currentField.label} · {fieldIdx + 1} / {STAR_FIELDS.length}
        </span>
        {completedFields > 0 && (
          <span className="text-[10px] text-green-400/60">{completedFields} filled</span>
        )}
      </div>

      {/* Current field */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.03)] p-5">
        <p className="text-sm font-semibold text-white mb-0.5">{currentField.label}</p>
        <p className="text-xs text-[rgba(255,255,255,0.35)] italic mb-4">{currentField.hint}</p>

        {/* Prompt chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(options[currentField.key] ?? []).map((opt: { label: string; text: string }) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => handleChange(currentField.key, opt.text)}
              className="text-[10px] px-2.5 py-1 rounded-md bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.09)] text-[rgba(255,255,255,0.42)] hover:bg-[rgba(64,96,208,0.15)] hover:text-[rgba(180,200,255,0.9)] hover:border-[rgba(64,96,208,0.4)] transition-all"
            >
              {opt.label}
            </button>
          ))}
        </div>

        <textarea
          key={currentField.key}
          rows={4}
          value={fields[currentField.key]}
          onChange={e => handleChange(currentField.key, e.target.value)}
          placeholder="Your exact words matter more than polished prose…"
          className="w-full bg-transparent text-sm text-[rgba(255,255,255,0.85)] resize-none focus:outline-none placeholder-[rgba(255,255,255,0.2)] leading-relaxed"
        />
        <p className="text-[10px] text-[rgba(255,255,255,0.18)] italic mt-2">Auto-saves as you type.</p>
      </div>

      {/* Field navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setFieldIdx(i => Math.max(i - 1, 0))}
          disabled={fieldIdx === 0}
          className="px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.4)] text-xs hover:text-white transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        {!isLastField && (
          <button
            onClick={() => setFieldIdx(i => i + 1)}
            className="px-3 py-1.5 rounded-lg border border-[rgba(64,96,208,0.3)] bg-[rgba(64,96,208,0.08)] text-[#6080f0] text-xs hover:bg-[rgba(64,96,208,0.15)] transition-colors"
          >
            Next field →
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export default function Step7StoryEvidence({ data, moduleOptions, onSaved, onAdvance, onBack }: Props) {
  const [generatedOpts, setGeneratedOpts] = useState<GeneratedModuleOptions | null>(moduleOptions);
  const [generating, setGenerating] = useState(false);
  const generatingRef = useRef(false);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (generatedOpts || generatingRef.current) return;
    generatingRef.current = true;
    setGenerating(true);
    fetch('/api/generate-module-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'story_evidence' }),
    })
      .then(r => r.json())
      .then((j: { options?: GeneratedModuleOptions }) => { if (j.options) setGeneratedOpts(j.options); })
      .catch(() => {})
      .finally(() => setGenerating(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getStory = (type: string): Story | null =>
    data.stories.find(s => s.story_type === type) ?? null;

  const isStarted = (type: string) => {
    const s = getStory(type);
    return !!(s?.situation || s?.task || s?.action || s?.result);
  };

  const completedCount = STORY_TYPES.filter(t => isStarted(t.id)).length;
  const activeType = STORY_TYPES[activeIdx];

  function handleAdvance() {
    fetch('/api/training/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stories_started: completedCount }),
    }).catch(() => {});
    fetch('/api/generate-module-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'communication_style' }),
    }).catch(() => {});
    onAdvance();
  }

  return (
    <div className="max-w-lg">
      <div className="mb-5">
        <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-widest">
          Story Evidence · Step 7 of 10
        </span>
        <h1 className="text-xl font-bold text-white mt-1 mb-1">The stories that make your Twin credible.</h1>
        <p className="text-sm text-[rgba(255,255,255,0.45)]">
          {completedCount} of {STORY_TYPES.length} stories added. Complete as many as you have.
        </p>
      </div>

      {/* AI recommendation */}
      {generatedOpts?.suggested_question && (
        <div className="rounded-xl border border-[rgba(64,96,208,0.18)] bg-[rgba(64,96,208,0.04)] px-4 py-3 mb-5">
          <p className="text-[10px] text-[#6080f0] uppercase tracking-wider font-semibold mb-0.5">Start here</p>
          <p className="text-sm text-white">{generatedOpts.suggested_question}</p>
        </div>
      )}

      {generating && !generatedOpts && (
        <div className="flex items-center gap-2 mb-5 text-xs text-[rgba(255,255,255,0.35)]">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-t-[#4060d0] animate-spin flex-shrink-0" />
          Personalising your next step…
        </div>
      )}

      {/* Story type selector — compact chips */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {STORY_TYPES.map((type, idx) => (
          <button
            key={type.id}
            onClick={() => setActiveIdx(idx)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] border transition-all ${
              idx === activeIdx
                ? 'bg-[rgba(64,96,208,0.18)] border-[rgba(64,96,208,0.4)] text-white font-medium'
                : isStarted(type.id)
                  ? 'bg-[rgba(96,192,128,0.08)] border-[rgba(96,192,128,0.2)] text-green-400'
                  : 'bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.4)] hover:text-white hover:border-[rgba(255,255,255,0.18)]'
            }`}
          >
            {isStarted(type.id) && idx !== activeIdx ? '✓ ' : ''}{type.label}
          </button>
        ))}
      </div>

      {/* Active story — STAR fields one at a time */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-white">{activeType.label}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveIdx(i => Math.max(i - 1, 0))}
              disabled={activeIdx === 0}
              className="px-2 py-1 text-[10px] text-[rgba(255,255,255,0.4)] hover:text-white disabled:opacity-20 transition-colors"
            >←</button>
            <span className="text-[10px] text-[rgba(255,255,255,0.3)]">{activeIdx + 1} / {STORY_TYPES.length}</span>
            <button
              onClick={() => setActiveIdx(i => Math.min(i + 1, STORY_TYPES.length - 1))}
              disabled={activeIdx === STORY_TYPES.length - 1}
              className="px-2 py-1 text-[10px] text-[rgba(255,255,255,0.4)] hover:text-white disabled:opacity-20 transition-colors"
            >→</button>
          </div>
        </div>
        <SingleStoryEditor
          key={activeType.id}
          storyType={activeType.id}
          initial={getStory(activeType.id)}
          onSaved={onSaved}
        />
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className={BTN_BACK}>← Back</button>
        {completedCount > 0
          ? <button onClick={handleAdvance} className={BTN_PRIMARY}>Continue →</button>
          : <button onClick={handleAdvance} className={BTN_SKIP}>Skip for now →</button>
        }
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
const BTN_SKIP    = 'inline-flex px-5 py-2.5 rounded-xl bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.6)] hover:text-white text-sm transition-colors';
