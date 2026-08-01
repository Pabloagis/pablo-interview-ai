'use client';

import { useEffect, useRef, useState } from 'react';
import { usePlatformT } from '@/context/platform-i18n';

// The candidate's public link — its own card, sibling to the publish panel.
// It lived inside PublishPanel before, which put an address the candidate shares
// with recruiters inside a panel about readiness and refusals; the two say
// different things and now sit in different cards.
//
// Live preview + validation before publish; read-only once the link is shared.
// Self-fetches from /api/candidate/slug so the parent needs no extra props
// beyond `locked`.
export default function SlugManager({ locked }: { locked: boolean }) {
  const t = usePlatformT();
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
      else setCheck({ available: false, reason: d.error ?? t.slug_save_failed });
    } catch { setCheck({ available: false, reason: t.slug_save_failed }); }
    finally { setSaving(false); }
  }

  if (!loaded || !slug) return null;

  const readOnly = locked || !editable;

  return (
    <div className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-4 flex flex-col gap-2">
      <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
        {t.slug_title}
      </p>
      <p className="text-[11px] text-white/35 leading-relaxed">
        {t.slug_intro}
      </p>

      {editing ? (
        <>
          <div className="flex items-center gap-1 text-sm mt-1">
            <span className="text-white/40">interviewmind.one/</span>
            <input
              value={draft}
              onChange={e => onDraft(e.target.value)}
              autoFocus
              className="flex-1 min-w-0 rounded-md bg-white/[0.05] border border-white/[0.12] px-2 py-1 text-white text-sm focus:outline-none"
            />
          </div>
          {check && (
            <p className={`text-[11px] ${check.available ? 'text-[rgba(96,192,128,0.85)]' : 'text-[rgba(220,120,120,0.85)]'}`}>
              {check.available ? t.slug_available : check.reason}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setEditing(false); setDraft(slug); setCheck(null); }}
              className="text-[11px] text-white/40 hover:text-white/70"
            >
              {t.slug_cancel}
            </button>
            <button
              onClick={save}
              disabled={saving || (check !== null && !check.available)}
              className="text-[11px] font-medium px-3 py-1 rounded-md text-white disabled:opacity-40"
              style={{ background: '#4060d0' }}
            >
              {saving ? t.slug_saving : t.slug_save}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-white/80 break-all mt-1">
            interviewmind.one/<span className="text-white">{slug}</span>
          </p>
          {readOnly ? (
            <p className="text-[11px] text-white/35">{t.slug_locked_note}</p>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="self-start text-[11px] text-[#6080f0] hover:text-white transition-colors"
            >
              {t.slug_edit}
            </button>
          )}
        </>
      )}
    </div>
  );
}
