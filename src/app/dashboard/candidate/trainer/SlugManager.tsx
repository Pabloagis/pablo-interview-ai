'use client';

import { useEffect, useRef, useState } from 'react';
import { usePlatformT } from '@/context/platform-i18n';
import { BASE_URL, BASE_HOST } from '@/lib/base-url';

export default function SlugManager({ locked }: { locked: boolean }) {
  const t = usePlatformT();
  const [slug, setSlug] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);
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
          setClaimed(d.slug != null);
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
      if (res.ok && d.slug) { setSlug(d.slug); setClaimed(true); setEditing(false); setCheck(null); }
      else setCheck({ available: false, reason: d.error ?? t.slug_save_failed });
    } catch { setCheck({ available: false, reason: t.slug_save_failed }); }
    finally { setSaving(false); }
  }

  if (!loaded || !slug) return null;

  const readOnly = locked || !editable;

  return (
    <div className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 flex flex-col gap-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-disabled)]">
        {t.slug_title}
      </p>
      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
        {t.slug_intro}
      </p>

      {editing ? (
        <>
          <div className="flex items-center gap-1 text-[var(--body-sm)] mt-1">
            <span className="text-[var(--text-secondary)] font-mono text-[12px]">{BASE_HOST}/</span>
            <input
              value={draft}
              onChange={e => onDraft(e.target.value)}
              autoFocus
              className="flex-1 min-w-0 rounded-[var(--radius-sm)] bg-[var(--surface-raised)] border border-[var(--border-visible)] px-2 py-1 text-[var(--text-primary)] text-[var(--body-sm)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-[180ms]"
            />
          </div>
          {check && (
            <p className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: check.available ? 'var(--success)' : 'var(--accent)' }}>
              {check.available ? t.slug_available : check.reason}
            </p>
          )}
          <div className="flex gap-2 justify-end mt-1">
            <button
              onClick={() => { setEditing(false); setDraft(slug); setCheck(null); }}
              className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors duration-[180ms]"
            >
              {t.slug_cancel}
            </button>
            <button
              onClick={save}
              disabled={saving || (check !== null && !check.available)}
              className="font-mono text-[11px] uppercase tracking-[0.06em] px-4 py-1.5 rounded-full bg-[var(--text-display)] text-[var(--black)] disabled:opacity-40 transition-colors duration-[180ms]"
            >
              {saving ? t.slug_saving : t.slug_save}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mt-1">
            <p className="flex-1 min-w-0 text-[var(--body-sm)] break-all text-[var(--text-secondary)]">
              {BASE_HOST}/<span className="text-[var(--text-primary)]">{slug}</span>
            </p>

            {locked ? (
              <a
                href={`${BASE_URL}/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-sm)] font-mono text-[11px] uppercase tracking-[0.06em] border border-[var(--border-visible)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors duration-[180ms]"
              >
                {t.slug_open}
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M4.5 1.5h6v6M10.5 1.5L5 7M9 7.5v3h-7.5V3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            ) : (
              <span
                title={t.slug_open_blocked}
                className="shrink-0 px-2.5 py-1 rounded-[var(--radius-sm)] font-mono text-[11px] uppercase tracking-[0.06em] border border-[var(--border)] text-[var(--text-disabled)] cursor-not-allowed"
              >
                {t.slug_open}
              </span>
            )}
          </div>

          {!locked && (
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--warning)' }}>
              {t.slug_not_live}
              {!claimed && <> {t.slug_not_reserved}</>}
            </p>
          )}

          {readOnly ? (
            <p className="text-[11px] text-[var(--text-disabled)]">{t.slug_locked_note}</p>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="self-start font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--interactive)] hover:text-[var(--text-primary)] transition-colors duration-[180ms]"
            >
              {t.slug_edit}
            </button>
          )}
        </>
      )}
    </div>
  );
}
