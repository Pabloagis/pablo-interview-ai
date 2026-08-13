'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import type { PublishLevel } from '@/lib/coverage-nodes';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { usePlatformT, type PlatformStrings } from '@/context/platform-i18n';

const LEVEL_LABEL_KEY: Record<PublishLevel, keyof PlatformStrings> = {
  sharp:       'level_sharp',
  solid:       'level_solid',
  basic:       'level_basic',
  unpublished: 'level_unpublished',
};

// Map readiness levels to Nothing tokens (literal values so they work in SVG attributes)
const LEVEL_COLOR: Record<PublishLevel, string> = {
  sharp:       '#4A9E5C', // --success
  solid:       '#5B9BF6', // --interactive (dark)
  basic:       '#999999', // --text-secondary
  unpublished: '#767676', // --text-disabled
};

interface Props {
  readiness: number;
  publishLevel: PublishLevel;
  candidateName: string;
  conversationSlot: ReactNode;
  dashboardSlot: ReactNode;
  onTestAgent?: () => void;
}

// ── Readiness ring SVG ────────────────────────────────────────────────────────

function ReadinessRing({
  readiness, publishLevel, size = 32, strokeWidth = 3.5,
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
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      aria-label={`Readiness ${readiness}%`} className="flex-shrink-0">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--border-visible)" strokeWidth={strokeWidth} />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cx}px` }} />
    </svg>
  );
}

// ── Compact readiness widget ──────────────────────────────────────────────────

function ReadinessWidget({ readiness, publishLevel, size }: {
  readiness: number; publishLevel: PublishLevel; size?: number;
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
        className="font-mono text-[10px] uppercase tracking-[0.06em] px-1.5 py-0.5 rounded-[var(--radius-sm)]"
        style={{ color, background: `${color}1a` }}
      >
        {t[LEVEL_LABEL_KEY[publishLevel]] as string}
      </span>
    </div>
  );
}

// ── Main shell ────────────────────────────────────────────────────────────────

export default function TrainerShell({
  readiness, publishLevel, candidateName, conversationSlot, dashboardSlot, onTestAgent,
}: Props) {
  const t = usePlatformT();
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setSheetOpen(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sheetOpen]);

  const levelColor = LEVEL_COLOR[publishLevel];

  return (
    <div className="fixed inset-0 flex flex-col bg-[var(--black)]">

      {/* ── Mobile top bar ──────────────────────────────────────────── */}
      <div className="lg:hidden shrink-0 h-12 flex items-center px-4 gap-3 border-b border-[var(--border-visible)]">
        <ReadinessWidget readiness={readiness} publishLevel={publishLevel} size={28} />
        <div className="flex-1 min-w-0" />
        <LanguageSwitcher />
        {onTestAgent && (
          <button
            onClick={onTestAgent}
            className="font-mono text-[10px] uppercase tracking-[0.06em] px-2 py-1 rounded-[var(--radius-sm)] border transition-colors duration-[180ms] hover:opacity-80"
            style={{ color: levelColor, borderColor: `${levelColor}40`, background: `${levelColor}0d` }}
            aria-label={t.shell_test_agent}
          >
            {t.shell_test_agent}
          </button>
        )}
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-[180ms]"
          aria-label={t.shell_coverage}
        >
          {t.shell_coverage}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* ── Main content row ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex overflow-hidden">

        {/* Conversation panel */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          {conversationSlot}
        </div>

        {/* Dashboard sidebar — hidden on mobile */}
        <div className="hidden lg:flex w-[45%] shrink-0 flex-col border-l border-[var(--border-visible)] overflow-y-auto">
          <div className="sticky top-0 z-10 bg-[var(--black)] shrink-0 h-14 flex items-center px-5 border-b border-[var(--border-visible)] gap-3">
            <ReadinessWidget readiness={readiness} publishLevel={publishLevel} size={32} />
            <div className="flex-1 min-w-0" />
            <LanguageSwitcher />
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-disabled)] truncate">
              {candidateName}
            </span>
            {onTestAgent && (
              <button
                onClick={onTestAgent}
                className="shrink-0 font-mono text-[10px] uppercase tracking-[0.06em] px-2.5 py-1 rounded-[var(--radius-sm)] border transition-colors duration-[180ms] hover:opacity-80"
                style={{ color: levelColor, borderColor: `${levelColor}40`, background: `${levelColor}0d` }}
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

      {/* ── Mobile full-screen sheet ──────────────────────────────────── */}
      <div
        ref={sheetRef}
        className={[
          'lg:hidden fixed inset-0 z-50 flex flex-col bg-[var(--black)]',
          'transition-transform duration-300 ease-in-out',
          sheetOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        aria-hidden={!sheetOpen}
      >
        <div className="shrink-0 h-12 flex items-center px-4 gap-3 border-b border-[var(--border-visible)]">
          <ReadinessWidget readiness={readiness} publishLevel={publishLevel} size={28} />
          <div className="flex-1 min-w-0" />
          <button
            onClick={() => setSheetOpen(false)}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-[180ms]"
            aria-label={t.shell_back}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 2.5L4.5 6L7.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t.shell_back}
          </button>
        </div>
        <div className="flex-1 min-w-0 overflow-y-auto p-5">
          {dashboardSlot}
        </div>
      </div>
    </div>
  );
}
