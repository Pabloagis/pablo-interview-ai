'use client';

// Anticipated questions — the hybrid flow, UI side.
// Framing throughout: "a recruiter will ask this — how do YOU answer?"
// There is deliberately NO AI-suggested answer to accept. The only action on a
// proposed gap is "Write your answer." Vague answers are probed, not stored.

import { useCallback, useEffect, useState } from 'react';

interface ProposedGap {
  topic: string;
  rationale: string;
  trigger_hint: string;
  kind: string;
}
interface StoredItem {
  id: string;
  topic: string;
  trigger_hint: string;
  answer: string;
  quality: 'solid' | 'verified';
}

const QUALITY_COLOR: Record<string, string> = { verified: '#3ec870', solid: '#5580f0' };

export default function AnticipatedQuestions() {
  const [proposed, setProposed] = useState<ProposedGap[]>([]);
  const [stored, setStored] = useState<StoredItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Per-gap local UI state, keyed by topic.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [probes, setProbes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        fetch('/api/training/anticipated'),
        fetch('/api/training/anticipated/detect'),
      ]);
      const s = sRes.ok ? await sRes.json() : { items: [] };
      const d = dRes.ok ? await dRes.json() : { gaps: [] };
      setStored((s.items ?? []) as StoredItem[]);
      setProposed((d.gaps ?? []) as ProposedGap[]);
    } catch {
      /* non-fatal — training hub keeps working */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = useCallback(async (gap: ProposedGap) => {
    const answer = (drafts[gap.topic] ?? '').trim();
    if (!answer || busy[gap.topic]) return;
    setBusy(b => ({ ...b, [gap.topic]: true }));
    setProbes(p => { const n = { ...p }; delete n[gap.topic]; return n; });
    try {
      const res = await fetch('/api/training/anticipated/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: gap.topic, trigger_hint: gap.trigger_hint, answer }),
      });
      const data = await res.json() as { stored?: boolean; followUpQuestion?: string; row?: StoredItem; quality?: string };
      if (data.stored) {
        // Move from proposed → stored.
        setProposed(prev => prev.filter(g => g.topic !== gap.topic));
        setDrafts(d => { const n = { ...d }; delete n[gap.topic]; return n; });
        await load();
      } else {
        // Vague / missing detail — probe, do not store.
        setProbes(p => ({ ...p, [gap.topic]: data.followUpQuestion ?? 'Add a specific detail — a date, a name, or a concrete outcome you can defend.' }));
      }
    } catch {
      setProbes(p => ({ ...p, [gap.topic]: 'Something went wrong — try again.' }));
    } finally {
      setBusy(b => ({ ...b, [gap.topic]: false }));
    }
  }, [drafts, busy, load]);

  const removeStored = useCallback(async (item: StoredItem) => {
    await fetch(`/api/training/anticipated?id=${item.id}`, { method: 'DELETE' });
    await load();
  }, [load]);

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-2">
        <SectionLabel />
        <p className="text-[11px] text-white/25">Scanning your background for questions recruiters will ask…</p>
      </div>
    );
  }

  if (proposed.length === 0 && stored.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-3">
      <SectionLabel />
      <p className="text-[11px] text-white/40 leading-relaxed -mt-1">
        A recruiter will ask these. Answer each one in your own words — your agent speaks only what you write here, never a version it made up.
      </p>

      {/* ── Proposed gaps — needs your answer ──────────────────────────────── */}
      {proposed.map(gap => (
        <div key={gap.topic} className="rounded-xl border border-[#c0884033] bg-[#c0884008] px-4 py-3.5 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: '#c08840', background: '#c0884018' }}>
              Needs your answer
            </span>
            <span className="text-xs font-semibold text-white/80">{gap.topic}</span>
          </div>
          <p className="text-[11px] text-white/45 leading-relaxed">{gap.rationale}</p>

          <textarea
            value={drafts[gap.topic] ?? ''}
            onChange={e => setDrafts(d => ({ ...d, [gap.topic]: e.target.value }))}
            rows={3}
            placeholder="Write your answer — the real reason, in your own words."
            className="w-full rounded-lg bg-white/[0.04] border border-white/[0.09] px-3 py-2 text-xs text-white resize-none focus:outline-none focus:border-white/25 placeholder-white/20 leading-relaxed"
          />

          {probes[gap.topic] && (
            <p className="text-[11px] text-[#c08840] leading-relaxed">
              Needs more to be usable: {probes[gap.topic]}
            </p>
          )}

          <button
            onClick={() => submit(gap)}
            disabled={busy[gap.topic] || !(drafts[gap.topic] ?? '').trim()}
            className="self-start px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
            style={{ background: '#4060d0', color: 'white' }}
          >
            {busy[gap.topic] ? 'Checking…' : 'Write your answer'}
          </button>
        </div>
      ))}

      {/* ── Stored / answered ──────────────────────────────────────────────── */}
      {stored.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">Your answers</p>
          {stored.map(item => (
            <div key={item.id} className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{ color: QUALITY_COLOR[item.quality], background: `${QUALITY_COLOR[item.quality]}1a` }}>
                  {item.quality}
                </span>
                <span className="text-xs font-semibold text-white/75">{item.topic}</span>
                <div className="flex-1 min-w-0" />
                <button onClick={() => removeStored(item)} className="text-[10px] text-white/30 hover:text-white/70 transition-colors">
                  Remove
                </button>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionLabel() {
  return (
    <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">
      Anticipated questions
    </p>
  );
}
