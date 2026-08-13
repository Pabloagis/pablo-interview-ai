'use client';

// Anticipated questions — the hybrid flow, UI side.
// Framing throughout: "a recruiter will ask this — how do YOU answer?"
// There is deliberately NO AI-suggested answer to accept. The only action on a
// proposed gap is "Write your answer." Vague answers are probed, not stored.

import { useCallback, useEffect, useState } from 'react';
import { usePlatformT } from '@/context/platform-i18n';

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

const QUALITY_COLOR: Record<string, string> = { verified: '#4A9E5C', solid: '#5B9BF6' };

export default function AnticipatedQuestions() {
  const t = usePlatformT();
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
        setProbes(p => ({ ...p, [gap.topic]: data.followUpQuestion ?? t.ant_default_probe }));
      }
    } catch {
      setProbes(p => ({ ...p, [gap.topic]: t.ant_error }));
    } finally {
      setBusy(b => ({ ...b, [gap.topic]: false }));
    }
  }, [drafts, busy, load, t]);

  const removeStored = useCallback(async (item: StoredItem) => {
    await fetch(`/api/training/anticipated?id=${item.id}`, { method: 'DELETE' });
    await load();
  }, [load]);

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-2">
        <SectionLabel />
        <p className="font-mono text-[11px] text-[var(--text-disabled)]">{t.ant_scanning}</p>
      </div>
    );
  }

  if (proposed.length === 0 && stored.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-3">
      <SectionLabel />
      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed -mt-1">
        {t.ant_intro}
      </p>

      {/* ── Proposed gaps — needs your answer ──────────────────────────────── */}
      {proposed.map(gap => (
        <div key={gap.topic} className="rounded-[var(--radius-md)] border border-[rgba(212,168,67,0.2)] bg-[rgba(212,168,67,0.04)] px-4 py-3.5 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded" style={{ color: 'var(--warning)', background: 'rgba(212,168,67,0.1)' }}>
              {t.ant_needs_answer}
            </span>
            <span className="text-xs font-medium text-[var(--text-primary)]">{gap.topic}</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{gap.rationale}</p>

          <textarea
            value={drafts[gap.topic] ?? ''}
            onChange={e => setDrafts(d => ({ ...d, [gap.topic]: e.target.value }))}
            rows={3}
            placeholder={t.ant_placeholder}
            className="w-full rounded-[var(--radius-sm)] bg-[var(--surface-raised)] border border-[var(--border-visible)] px-3 py-2 text-xs text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--text-primary)] placeholder:text-[var(--text-disabled)] leading-relaxed"
          />

          {probes[gap.topic] && (
            <p className="text-[11px] text-[var(--warning)] leading-relaxed">
              {t.ant_needs_more(probes[gap.topic])}
            </p>
          )}

          <button
            onClick={() => submit(gap)}
            disabled={busy[gap.topic] || !(drafts[gap.topic] ?? '').trim()}
            className="self-start px-4 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-[0.06em] transition-colors disabled:opacity-40"
            style={{ background: 'var(--text-display)', color: 'var(--black)' }}
          >
            {busy[gap.topic] ? t.ant_checking : t.ant_write_answer}
          </button>
        </div>
      ))}

      {/* ── Stored / answered ──────────────────────────────────────────────── */}
      {stored.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          <p className="font-mono text-[10px] text-[var(--text-disabled)] uppercase tracking-wider">{t.ant_your_answers}</p>
          {stored.map(item => (
            <div key={item.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded"
                  style={{ color: QUALITY_COLOR[item.quality], background: `${QUALITY_COLOR[item.quality]}1a` }}>
                  {item.quality}
                </span>
                <span className="text-xs font-medium text-[var(--text-primary)]">{item.topic}</span>
                <div className="flex-1 min-w-0" />
                <button onClick={() => removeStored(item)} className="font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors">
                  {t.ant_remove}
                </button>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionLabel() {
  const t = usePlatformT();
  return (
    <p className="font-mono text-[10px] text-[var(--text-disabled)] uppercase tracking-wider">
      {t.ant_section}
    </p>
  );
}
