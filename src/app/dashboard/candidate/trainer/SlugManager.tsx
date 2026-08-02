'use client';

import { useEffect, useRef, useState } from 'react';
import { usePlatformT } from '@/context/platform-i18n';
import { BASE_URL, BASE_HOST } from '@/lib/base-url';

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
  // Whether the address shown is actually saved on the profile, or merely the
  // suggestion the API derives from the candidate's name. They render the same,
  // so without this the card advertises a link nobody owns.
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
            <span className="text-white/40">{BASE_HOST}/</span>
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
          <div className="flex items-center gap-2 mt-1">
            <p className={`flex-1 min-w-0 text-sm break-all ${locked ? 'text-white/80' : 'text-white/45'}`}>
              {BASE_HOST}/<span className={locked ? 'text-white' : 'text-white/70'}>{slug}</span>
            </p>

            {/* Opens the real recruiter-facing page, not the sandbox — this is
                the candidate checking what they are about to share. Before
                publishing that page 404s, so the button is inert rather than
                absent: a control that vanishes reads as a bug, one that is
                disabled with a reason explains the state. */}
            {locked ? (
              <a
                href={`${BASE_URL}/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-white/[0.14] text-white/70 hover:text-white hover:border-white/30 transition-colors"
              >
                {t.slug_open}
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M4.5 1.5h6v6M10.5 1.5L5 7M9 7.5v3h-7.5V3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            ) : (
              <span
                title={t.slug_open_blocked}
                className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium border border-white/[0.08] text-white/25 cursor-not-allowed"
              >
                {t.slug_open}
              </span>
            )}
          </div>

          {/* `locked` is set by the parent from `published_at`, so it is the publish
              state: until the agent is published this address 404s for everyone.
              Saying so here is the whole point of the card — a link the candidate
              believes is live is worse than no link. */}
          {!locked && (
            <p className="text-[11px] text-[rgba(220,170,90,0.85)] leading-relaxed">
              {t.slug_not_live}
              {!claimed && <> {t.slug_not_reserved}</>}
            </p>
          )}

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
