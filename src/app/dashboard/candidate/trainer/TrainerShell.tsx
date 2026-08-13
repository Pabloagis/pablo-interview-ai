'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import type { PublishLevel } from '@/lib/coverage-nodes';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import LogoutButton from '../../LogoutButton';
import { usePlatformT, type PlatformStrings } from '@/context/platform-i18n';

// publishLevel → translation key for its label.
const LEVEL_LABEL_KEY: Record<PublishLevel, keyof PlatformStrings> = {
  sharp:       'level_sharp',
  solid:       'level_solid',
  basic:       'level_basic',
  unpublished: 'level_unpublished',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  readiness: number;
  publishLevel: PublishLevel;
  candidateName: string;
  /** The candidate's public address, once claimed. */
  publicSlug: string | null;
  /** Whether that address is live — an unpublished slug 404s, so the link waits. */
  published: boolean;
  conversationSlot: ReactNode;
  dashboardSlot: ReactNode;
  onTestAgent?: () => void;
}

// ── Level colours (single source of truth) ────────────────────────────────────

const LEVEL_COLOR: Record<PublishLevel, string> = {
  sharp:       '#4A9E5C', // --success
  solid:       '#5B9BF6', // --interactive
  basic:       '#999999', // --text-secondary
  unpublished: '#767676', // --text-disabled
};

// ── Readiness ring SVG ────────────────────────────────────────────────────────

function ReadinessRing({
  readiness,
  publishLevel,
  size = 32,
  strokeWidth = 3.5,
}: {
  readiness: number;
  publishLevel: PublishLevel;
  size?: number;
  strokeWidth?: number;
}) {
  const color = LEVEL_COLOR[publishLevel];
  const cx = size / 2;
  const r = cx - strokeWidth - 1;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(readiness, 100) / 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`Readiness ${readiness}%`}
      className="flex-shrink-0"
    >
      {/* Track */}
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth={strokeWidth}
      />
      {/* Progress — starts at 12 o'clock */}
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cx}px` }}
      />
    </svg>
  );
}

// ── Compact readiness widget (mobile top bar + desktop header) ────────────────

function ReadinessWidget({
  readiness,
  publishLevel,
  size,
}: {
  readiness: number;
  publishLevel: PublishLevel;
  size?: number;
}) {
  const t = usePlatformT();
  const color = LEVEL_COLOR[publishLevel];
  return (
    <div className="flex items-center gap-2">
      <ReadinessRing readiness={readiness} publishLevel={publishLevel} size={size} />
      <span className="font-mono text-[12px] tabular-nums" style={{ color }}>
        {readiness}
      </span>
      <span
        className="font-mono text-[10px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-[var(--radius-sm)]"
        style={{ color, background: `${color}1a` }}
      >
        {t[LEVEL_LABEL_KEY[publishLevel]] as string}
      </span>
    </div>
  );
}

// ── Account menu ──────────────────────────────────────────────────────────────
// The trainer had no exit: no way to open your own live agent, and no way to sign
// out. Both live here, behind the candidate's initial.

function AccountMenu({
  candidateName,
  publicSlug,
  published,
}: {
  candidateName: string;
  publicSlug: string | null;
  published: boolean;
}) {
  const t = usePlatformT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = candidateName.trim().charAt(0).toUpperCase() || '?';
  const agentLive = published && !!publicSlug;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={t.nav_account}
        aria-haspopup="menu"
        aria-expanded={open}
        className={[
          'w-7 h-7 rounded-full border font-mono text-[11px] uppercase transition-colors',
          open
            ? 'bg-[var(--surface-raised)] border-[var(--text-primary)] text-[var(--text-display)]'
            : 'bg-[var(--surface)] border-[var(--border-visible)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)]',
        ].join(' ')}
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 z-50 min-w-[210px] rounded-[var(--radius-md)] py-1 border border-[var(--border-visible)] bg-[var(--surface-raised)]"
        >
          <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-disabled)] truncate border-b border-[var(--border)] mb-1">
            {candidateName}
          </p>

          {agentLive ? (
            <a
              href={`/${publicSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              className="flex items-center justify-between gap-2 w-full px-3 py-2 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)] transition-colors"
            >
              {t.nav_my_agent}
              <span className="text-[var(--text-disabled)]">↗</span>
            </a>
          ) : (
            <p className="px-3 py-2 text-[12px] leading-snug text-[var(--text-disabled)]">
              {t.nav_my_agent_locked}
            </p>
          )}

          <LogoutButton className="block w-full px-3 py-2 text-left text-[13px] text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)] transition-colors cursor-pointer" />
        </div>
      )}
    </div>
  );
}

// ── Main shell ────────────────────────────────────────────────────────────────

export default function TrainerShell({
  readiness,
  publishLevel,
  candidateName,
  publicSlug,
  published,
  conversationSlot,
  dashboardSlot,
  onTestAgent,
}: Props) {
  const t = usePlatformT();
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close sheet on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSheetOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sheetOpen]);

  return (
    // Root: fixed inset-0 — this IS the viewport. w-full, not w-screen.
    <div className="fixed inset-0 flex flex-col bg-[var(--black)]">

      {/* ── Mobile top bar (hidden ≥ lg) ───────────────────────────────────── */}
      <div className="lg:hidden shrink-0 h-12 flex items-center px-4 gap-3 border-b border-[var(--border-visible)]">
        <ReadinessWidget readiness={readiness} publishLevel={publishLevel} size={28} />
        <div className="flex-1 min-w-0" />
        <LanguageSwitcher />
        {onTestAgent && (
          <button
            onClick={onTestAgent}
            className="font-mono text-[10px] uppercase tracking-[0.06em] px-2 py-1 rounded-[var(--radius-sm)] border transition-colors"
            style={{
              color:        LEVEL_COLOR[publishLevel],
              borderColor:  `${LEVEL_COLOR[publishLevel]}40`,
              background:   `${LEVEL_COLOR[publishLevel]}0d`,
            }}
            aria-label={t.shell_test_agent}
          >
            {t.shell_test_agent}
          </button>
        )}
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label={t.shell_coverage}
        >
          {t.shell_coverage}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* ── Main content row ────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex overflow-hidden">

        {/* Conversation panel — full-width on mobile, ~55% on desktop */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          {conversationSlot}
        </div>

        {/* Dashboard sidebar — hidden on mobile, visible ≥ lg */}
        <div className="hidden lg:flex w-[45%] shrink-0 flex-col border-l border-[var(--border-visible)] overflow-y-auto">
          {/* Desktop header with readiness widget */}
          <div className="sticky top-0 z-10 bg-[var(--black)] shrink-0 h-14 flex items-center px-5 border-b border-[var(--border-visible)] gap-3">
            <ReadinessWidget readiness={readiness} publishLevel={publishLevel} size={32} />
            <div className="flex-1 min-w-0" />
            <LanguageSwitcher />
            <AccountMenu candidateName={candidateName} publicSlug={publicSlug} published={published} />
            {onTestAgent && (
              <button
                onClick={onTestAgent}
                className="shrink-0 font-mono text-[10px] uppercase tracking-[0.06em] px-2.5 py-1 rounded-[var(--radius-sm)] border transition-colors hover:opacity-80"
                style={{
                  color:       LEVEL_COLOR[publishLevel],
                  borderColor: `${LEVEL_COLOR[publishLevel]}40`,
                  background:  `${LEVEL_COLOR[publishLevel]}0d`,
                }}
                aria-label={t.shell_test_agent}
              >
                {t.shell_test_agent}
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0 overflow-y-auto p-5">
            {dashboardSlot}
          </div>
        </div>
      </div>

      {/* ── Mobile full-screen sheet (hidden ≥ lg) ─────────────────────────── */}
      {/* Uses translate instead of display:none so transition works */}
      <div
        ref={sheetRef}
        className={[
          'lg:hidden fixed inset-0 z-50 flex flex-col bg-[var(--black)]',
          'transition-transform duration-300 ease-in-out',
          sheetOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        aria-hidden={!sheetOpen}
      >
        {/* Sheet header */}
        <div className="shrink-0 h-12 flex items-center px-4 gap-3 border-b border-[var(--border-visible)]">
          <ReadinessWidget readiness={readiness} publishLevel={publishLevel} size={28} />
          <div className="flex-1 min-w-0" />
          {/* Account lives in the sheet on mobile — the top bar is already full */}
          <AccountMenu candidateName={candidateName} publicSlug={publicSlug} published={published} />
          <button
            onClick={() => setSheetOpen(false)}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label={t.shell_back}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 2.5L4.5 6L7.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t.shell_back}
          </button>
        </div>
        {/* Sheet content — independently scrollable */}
        <div className="flex-1 min-w-0 overflow-y-auto p-5">
          {dashboardSlot}
        </div>
      </div>
    </div>
  );
}
