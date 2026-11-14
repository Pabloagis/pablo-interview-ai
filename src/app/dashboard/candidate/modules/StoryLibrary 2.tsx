'use client';

import { useState, useRef, useCallback } from 'react';
import type { TrainingData, Story } from '../TrainingHub';
import { STORY_TYPES, STORY_OPTIONS } from './storyData';
import type { StoryOption } from './storyData';

interface Props {
  data: TrainingData;
  onSaved: (moduleId: string, message?: string) => void;
}

const STAR_FIELDS: { key: keyof Omit<Story, 'id' | 'story_type'>; label: string; microcopy: string }[] = [
  {
    key: 'situation',
    label: 'Situation',
    microcopy: 'Set the scene. What was happening? Why did it matter?',
  },
  {
    key: 'task',
    label: 'Task / Thinking',
    microcopy: 'What was your role? What were you trying to achieve?',
  },
  {
    key: 'action',
    label: 'Action',
    microcopy: 'What did YOU specifically do? Be concrete — not "we".',
  },
  {
    key: 'result',
    label: 'Result',
    microcopy: 'What happened? Add a metric if you have one — even approximate.',
  },
];

// ── Single story field with options + textarea ────────────────────────────────

function StoryField({
  storyId,
  field,
  label,
  microcopy,
  options,
  value,
  onChange,
}: {
  storyId: string;
  field: string;
  label: string;
  microcopy: string;
  options: StoryOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  function pickOption(opt: StoryOption) {
    setSelected(opt.label);
    onChange(opt.text);
  }

  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-white mb-0.5">{label}</p>
      <p className="text-[10px] text-[rgba(255,255,255,0.35)] mb-2 leading-relaxed">{microcopy}</p>

      {/* Option chips */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {options.map(opt => (
          <button
            key={opt.label}
            type="button"
            onClick={() => pickOption(opt)}
            className="text-[10px] px-2.5 py-1 rounded-md transition-all"
            style={{
              background: selected === opt.label
                ? 'rgba(64,96,208,0.25)'
                : 'rgba(255,255,255,0.05)',
              border: selected === opt.label
                ? '0.5px solid rgba(64,96,208,0.5)'
                : '0.5px solid rgba(255,255,255,0.1)',
              color: selected === opt.label
                ? 'rgba(180,200,255,0.95)'
                : 'rgba(255,255,255,0.45)',
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <textarea
        rows={3}
        value={value}
        onChange={e => { setSelected(null); onChange(e.target.value); }}
        placeholder="Edit freely — your exact words matter more than polished prose…"
        className="w-full resize-y rounded-lg text-xs leading-relaxed outline-none transition-colors"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.85)',
          padding: '10px 12px',
          minHeight: 72,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(64,96,208,0.5)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
      />
    </div>
  );
}

// ── Single story editor ───────────────────────────────────────────────────────

function StoryEditor({
  storyType,
  initial,
  onSaved,
}: {
  storyType: string;
  initial: Story | null;
  onSaved: (moduleId: string, message?: string) => void;
}) {
  const [fields, setFields] = useState({
    situation: initial?.situation ?? '',
    task: initial?.task ?? '',
    action: initial?.action ?? '',
    result: initial?.result ?? '',
  });
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const options = STORY_OPTIONS[storyType] ?? STORY_OPTIONS['biggest_success'];

  const saveField = useCallback(
    async (key: string, value: string) => {
      try {
        await fetch('/api/training/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ story_type: storyType, ...fields, [key]: value }),
        });
        onSaved('stories', 'Your AI just learned this story.');
      } catch {
        // silent — non-blocking
      }
    },
    [storyType, fields, onSaved]
  );

  function handleChange(key: keyof typeof fields, value: string) {
    setFields(prev => ({ ...prev, [key]: value }));
    if (timers.current[key]) clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => saveField(key, value), 2000);
  }

  return (
    <div className="pt-2">
      {STAR_FIELDS.map(f => (
        <StoryField
          key={f.key}
          storyId={storyType}
          field={f.key}
          label={f.label}
          microcopy={f.microcopy}
          options={options[f.key as keyof typeof options]}
          value={fields[f.key]}
          onChange={v => handleChange(f.key, v)}
        />
      ))}
      <p className="text-[10px] text-[rgba(255,255,255,0.2)] italic">Auto-saves as you type.</p>
    </div>
  );
}

// ── Story Library ──────────────────────────────────────────────────────────────

export default function StoryLibrary({ data, onSaved }: Props) {
  const [openStory, setOpenStory] = useState<string | null>(null);

  const getStory = (type: string) =>
    data.stories.find(s => s.story_type === type) ?? null;

  const isStarted = (type: string) => {
    const s = getStory(type);
    return !!(s?.situation || s?.task || s?.action || s?.result);
  };

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-[rgba(255,255,255,0.4)] leading-relaxed mb-3">
        Interviewers always return to the same stories. Your AI needs to know yours — in detail,
        with specifics, in your own words. Complete as many as you have. No minimum required.
      </p>

      {STORY_TYPES.map(({ id, label }) => {
        const started = isStarted(id);
        const isOpen = openStory === id;

        return (
          <div key={id} className="rounded-lg border overflow-hidden transition-colors"
            style={{
              borderColor: isOpen
                ? 'rgba(64,96,208,0.35)'
                : started
                  ? 'rgba(96,192,128,0.2)'
                  : 'rgba(255,255,255,0.07)',
              background: isOpen ? 'rgba(64,96,208,0.04)' : 'transparent',
            }}>
            <button
              type="button"
              onClick={() => setOpenStory(prev => prev === id ? null : id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
            >
              <div
                className="shrink-0 w-2 h-2 rounded-full"
                style={{ background: started ? 'rgba(96,192,128,0.8)' : 'rgba(255,255,255,0.15)' }}
              />
              <span className="flex-1 text-xs text-[rgba(255,255,255,0.75)]">{label}</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="rgba(255,255,255,0.25)" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {isOpen && (
              <div className="px-3 pb-3 border-t border-[rgba(255,255,255,0.05)]">
                <StoryEditor
                  storyType={id}
                  initial={getStory(id)}
                  onSaved={onSaved}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
