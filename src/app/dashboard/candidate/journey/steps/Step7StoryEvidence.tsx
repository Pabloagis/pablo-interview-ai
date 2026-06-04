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

const STAR_FIELDS: { key: keyof Omit<Story, 'id' | 'story_type'>; label: string; hint: string }[] = [
  { key: 'situation', label: 'Situation',       hint: 'Set the scene. What was happening? Why did it matter?' },
  { key: 'task',      label: 'Task / Thinking', hint: 'What was your role? What were you trying to achieve?' },
  { key: 'action',    label: 'Action',          hint: 'What did YOU specifically do? Be concrete — not "we".' },
  { key: 'result',    label: 'Result',          hint: 'What happened? Add a metric if you have one — even approximate.' },
];

function SingleStoryEditor({
  storyType,
  initial,
  onSaved,
}: {
  storyType: string;
  initial: Story | null;
  onSaved: Props['onSaved'];
}) {
  const [fields, setFields] = useState({
    situation: initial?.situation ?? '',
    task:      initial?.task      ?? '',
    action:    initial?.action    ?? '',
    result:    initial?.result    ?? '',
  });
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const options = STORY_OPTIONS[storyType] ?? STORY_OPTIONS['biggest_success'];

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

  return (
    <div className="flex flex-col gap-4">
      {STAR_FIELDS.map(f => (
        <div key={f.key}>
          <p className="text-xs font-semibold text-white mb-0.5">{f.label}</p>
          <p className="text-[10px] text-[rgba(255,255,255,0.35)] mb-2">{f.hint}</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(options[f.key] ?? []).map((opt: { label: string; text: string }) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => handleChange(f.key, opt.text)}
                className="text-[10px] px-2.5 py-1 rounded-md bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.45)] hover:bg-[rgba(64,96,208,0.15)] hover:text-[rgba(180,200,255,0.9)] hover:border-[rgba(64,96,208,0.4)] transition-all"
              >
                {opt.label}
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            value={fields[f.key]}
            onChange={e => handleChange(f.key, e.target.value)}
            placeholder="Your exact words matter more than polished prose…"
            className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.10)] rounded-lg px-3 py-2 text-xs text-[rgba(255,255,255,0.85)] resize-y focus:outline-none focus:border-[rgba(64,96,208,0.5)] transition-colors leading-relaxed"
            style={{ minHeight: 72 }}
          />
        </div>
      ))}
      <p className="text-[10px] text-[rgba(255,255,255,0.2)] italic">Auto-saves as you type.</p>
    </div>
  );
}

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
    <div className="max-w-xl">
      <div className="mb-4">
        <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-widest">
          Story Evidence · Step 7 of 10
        </span>
        <h1 className="text-xl font-bold text-white mt-1 mb-1">The stories that make your Twin credible.</h1>
        <p className="text-sm text-[rgba(255,255,255,0.4)]">
          {completedCount} of {STORY_TYPES.length} stories added. Complete as many as you have.
        </p>
      </div>

      {/* Adaptive recommendation banner */}
      {(generatedOpts?.coaching_tip || generatedOpts?.suggested_question) && (
        <div className="rounded-xl border border-[rgba(64,96,208,0.18)] bg-[rgba(64,96,208,0.04)] p-4 mb-5">
          {generatedOpts.coaching_tip && (
            <p className="text-xs text-[rgba(255,255,255,0.45)] italic mb-2">💡 {generatedOpts.coaching_tip}</p>
          )}
          {generatedOpts.suggested_question && (
            <p className="text-sm text-white">
              <span className="text-[10px] text-[#6080f0] uppercase tracking-wider font-semibold block mb-0.5">Start here</span>
              {generatedOpts.suggested_question}
            </p>
          )}
        </div>
      )}

      {generating && !generatedOpts && (
        <div className="flex items-center gap-3 mb-4 text-sm text-[rgba(255,255,255,0.4)]">
          <div className="w-4 h-4 rounded-full border-2 border-t-[#4060d0] animate-spin flex-shrink-0" />
          Personalising your next step…
        </div>
      )}

      {/* Story type selector chips */}
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

      {/* Active story editor */}
      <div className="rounded-xl border border-[rgba(64,96,208,0.2)] bg-[rgba(64,96,208,0.03)] p-4 mb-6">
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
    </div>
  );
}

const BTN_PRIMARY = 'inline-flex px-6 py-2.5 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] text-white text-sm font-medium transition-colors';
const BTN_BACK    = 'inline-flex px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.5)] hover:text-white text-sm transition-colors';
const BTN_SKIP    = 'inline-flex px-5 py-2.5 rounded-xl bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.6)] hover:text-white text-sm transition-colors';
