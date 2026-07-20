'use client';

// Adaptive career-goal picker — extracted verbatim from TrainingHub's CareerGoalStep
// so the wizard (Step 2) and the trainer's inline onboarding control share ONE
// implementation. Autosaves to /api/training/career-goal and mirrors into
// /api/training/context, exactly as before.

import { useState, useEffect, useRef } from 'react';
import type { GeneratedModuleOptions } from '@/app/api/generate-module-options/route';

export default function CareerGoalPicker({
  currentGoal,
  moduleOptions,
  onSaved,
}: {
  currentGoal: string | null;
  moduleOptions: GeneratedModuleOptions | null;
  onSaved: (goal: string) => void;
}) {
  const parseInitial = () => {
    if (!currentGoal) return { goals: [] as string[], other: '' };
    try {
      const p = JSON.parse(currentGoal) as { goals?: string[]; other?: string };
      return { goals: p.goals ?? [], other: p.other ?? '' };
    } catch {
      return { goals: [currentGoal], other: '' };
    }
  };

  const init = parseInitial();
  const [selected, setSelected] = useState<string[]>(init.goals);
  const [freeText, setFreeText] = useState(init.other);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Adaptive options state
  const [options, setOptions] = useState<GeneratedModuleOptions | null>(moduleOptions);
  const [generating, setGenerating] = useState(false);
  const generatingRef = useRef(false);

  // Trigger generation on arrival if no options cached yet
  useEffect(() => {
    if (options || generatingRef.current) return;
    generatingRef.current = true;
    setGenerating(true);
    fetch('/api/generate-module-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'career_goal' }),
    })
      .then(r => r.json())
      .then((j: { options?: GeneratedModuleOptions }) => { if (j.options) setOptions(j.options); })
      .catch(() => {})
      .finally(() => setGenerating(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function scheduleAutosave(goals: string[], text: string) {
    if (goals.length === 0) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setSaveStatus('saving');
    autosaveTimer.current = setTimeout(async () => {
      try {
        await fetch('/api/training/career-goal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ career_goal: JSON.stringify({ goals, other: text.trim() }) }),
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch { setSaveStatus('idle'); }
    }, 1000);
  }

  function toggle(label: string) {
    setSelected(prev => {
      const next = prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label];
      scheduleAutosave(next, freeText);
      return next;
    });
  }

  function handleFreeTextChange(text: string) {
    setFreeText(text);
    scheduleAutosave(selected, text);
  }

  async function handleSave() {
    if (selected.length === 0) return;
    setSaving(true);
    setError('');
    const value = JSON.stringify({ goals: selected, other: freeText.trim() });
    try {
      const res = await fetch('/api/training/career-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career_goal: value }),
      });
      if (!res.ok) {
        const j = await res.json() as { error?: string };
        setError(j.error ?? 'Failed to save. Please try again.');
        return;
      }

      // Update candidate_context with career goals
      fetch('/api/training/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career_goals: selected, career_goal_text: freeText.trim() }),
      }).catch(() => {});

      // Pre-generate options for the next adaptive module
      fetch('/api/generate-module-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'hidden_strengths' }),
      }).catch(() => {});

      onSaved(value);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // Loading state while generating
  if (generating && !options) {
    return (
      <div className="flex items-center gap-3 py-8 text-sm text-[rgba(255,255,255,0.4)]">
        <div className="w-4 h-4 rounded-full border-2 border-t-[#4060d0] animate-spin flex-shrink-0" />
        Analysing your CV…
      </div>
    );
  }

  const displayOptions = options?.options ?? [];

  return (
    <div>
      {options?.coaching_tip && (
        <p className="text-xs text-[rgba(255,255,255,0.38)] italic mb-4">
          💡 {options.coaching_tip}
        </p>
      )}

      <div className="flex flex-col gap-2 mb-5">
        {displayOptions.map(opt => {
          const isSelected = selected.includes(opt.label);
          return (
            <button
              key={opt.label}
              onClick={() => !saving && toggle(opt.label)}
              disabled={saving}
              className={[
                'text-left px-4 py-3.5 rounded-xl border text-sm transition-all flex items-start gap-3',
                isSelected
                  ? 'border-[#4060d0] bg-[rgba(64,96,208,0.12)] text-white'
                  : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[rgba(255,255,255,0.6)]',
                saving ? 'opacity-50 cursor-not-allowed' : 'hover:border-[rgba(255,255,255,0.20)] hover:text-white',
              ].join(' ')}
            >
              <span className={`w-4 h-4 rounded mt-0.5 flex-shrink-0 flex items-center justify-center text-[10px] border transition-all ${
                isSelected ? 'bg-[#4060d0] border-[#4060d0] text-white' : 'border-[rgba(255,255,255,0.25)]'
              }`}>
                {isSelected ? '✓' : ''}
              </span>
              <span>
                <span className="block">{opt.label}</span>
                {opt.detail && (
                  <span className="block text-xs text-[rgba(255,255,255,0.35)] mt-0.5 font-normal">{opt.detail}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Free text */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-[rgba(255,255,255,0.4)] mb-1.5">
          Anything else?
        </label>
        <textarea
          value={freeText}
          onChange={e => handleFreeTextChange(e.target.value)}
          placeholder="Add your own context if needed..."
          rows={2}
          disabled={saving}
          className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.10)] rounded-xl px-4 py-2.5 text-sm text-white resize-none focus:outline-none focus:border-[rgba(64,96,208,0.5)] transition-colors placeholder-[rgba(255,255,255,0.22)] disabled:opacity-50"
        />
        {saveStatus !== 'idle' && (
          <p className="text-[10px] text-[rgba(255,255,255,0.28)] mt-1 flex items-center gap-1">
            {saveStatus === 'saving'
              ? <><span className="inline-block w-2.5 h-2.5 rounded-full border border-t-[rgba(255,255,255,0.4)] border-[rgba(255,255,255,0.12)] animate-spin" />Saving…</>
              : '✓ Saved'}
          </p>
        )}
      </div>

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      {selected.length > 0 && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex px-6 py-2.5 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {saving ? 'Saving…' : 'Continue →'}
        </button>
      )}
    </div>
  );
}
