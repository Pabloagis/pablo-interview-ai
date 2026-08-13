'use client';

import { useEffect, useRef, useState } from 'react';

// Publish-step slug manager. Live preview + validation before publish; read-only after.
// Self-fetches from /api/candidate/slug so PublishPanel needs no extra props beyond `locked`.
export default function SlugManager({ locked }: { locked: boolean }) {
  const [slug, setSlug] = useState<string | null>(null);
  const [editable, setEditable] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [check, setCheck] = useState<{ available: boolean; reason?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/candidate/slug');
        if (res.ok) {
          const d = (await res.json()) as { slug: string | null; suggested: string; editable: boolean };
          setSlug(d.slug ?? d.suggested);
          setDraft(d.slug ?? d.suggested);
          setEditable(d.editable && !locked);
        }
      } catch { /* non-fatal */ }
      finally { setLoaded(true); }
    })();
  }, [locked]);

  function onDraft(v: string) {
    const next = v.toLowerCase();
    setDraft(next);
    setCheck(null);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/candidate/slug?check=${encodeURIComponent(next)}`);
        if (res.ok) setCheck((await res.json()) as { available: boolean; reason?: string });
      } catch { /* ignore */ }
    }, 350);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/candidate/slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: draft }),
      });
      const d = (await res.json()) as { slug?: string; error?: string };
      if (res.ok && d.slug) { setSlug(d.slug); setEditing(false); setCheck(null); }
      else setCheck({ available: false, reason: d.error ?? 'Could not save.' });
    } catch { setCheck({ available: false, reason: 'Could not save.' }); }
    finally { setSaving(false); }
  }

  if (!loaded || !slug) return null;

  const readOnly = locked || !editable;

  return (
    <div className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 flex flex-col gap-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-disabled)]">Your public link</p>

      {editing ? (
        <>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-[var(--text-secondary)] font-mono text-[12px]">interviewmind.one/</span>
            <input
              value={draft}
              onChange={e => onDraft(e.target.value)}
              autoFocus
              className="flex-1 min-w-0 rounded-[var(--radius-sm)] bg-[var(--surface-raised)] border border-[var(--border-visible)] px-2 py-1 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--text-primary)]"
            />
          </div>
          {check && (
            <p className={`font-mono text-[11px] ${check.available ? 'text-[var(--success)]' : 'text-[var(--accent)]'}`}>
              {check.available ? 'Available' : check.reason}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setEditing(false); setDraft(slug); setCheck(null); }}
              className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || (check !== null && !check.available)}
              className="font-mono text-[11px] uppercase tracking-[0.06em] px-3 py-1 rounded-full text-[var(--black)] bg-[var(--text-display)] disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save link'}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-[var(--text-secondary)] break-all">
            interviewmind.one/<span className="text-[var(--text-primary)]">{slug}</span>
          </p>
          {readOnly ? (
            <p className="font-mono text-[11px] text-[var(--text-disabled)]">Changing a shared link would break it. Editing comes later.</p>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="self-start font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--interactive)] hover:text-[var(--text-primary)] transition-colors"
            >
              Edit link
            </button>
          )}
        </>
      )}
    </div>
  );
}
