'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import type { PublishLevel } from '@/lib/coverage-nodes';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  readiness: number;
  publishLevel: PublishLevel;
  candidateName: string;
  conversationSlot: ReactNode;
  dashboardSlot: ReactNode;
  onTestAgent?: () => void;
}

// ── Level colours (single source of truth) ────────────────────────────────────

const LEVEL_COLOR: Record<PublishLevel, string> = {
  sharp:       '#60c080',
  solid:       '#5080f0',
  basic:       '#4060d0',
  unpublished: '#6080a0',
};

const LEVEL_LABEL: Record<PublishLevel, string> = {
  sharp:       'Sharp',
  solid:       'Solid',
  basic:       'Basic',
  unpublished: 'Unpublished',
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
        stroke="rgba(255,255,255,0.08)"
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
  const color = LEVEL_COLOR[publishLevel];
  return (
    <div className="flex items-center gap-2">
      <ReadinessRing readiness={readiness} publishLevel={publishLevel} size={size} />
      <span className="text-xs font-medium tabular-nums" style={{ color }}>
        {readiness}
      </span>
      <span
        className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
        style={{ color, background: `${color}1a` }}
      >
        {LEVEL_LABEL[publishLevel]}
      </span>
    </div>
  );
}

// ── Main shell ────────────────────────────────────────────────────────────────

export default function TrainerShell({
  readiness,
  publishLevel,
  candidateName,
  conversationSlot,
  dashboardSlot,
  onTestAgent,
}: Props) {
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
    <div className="fixed inset-0 flex flex-col bg-[#0d0f14]">

      {/* ── Mobile top bar (hidden ≥ lg) ───────────────────────────────────── */}
      <div className="lg:hidden shrink-0 h-12 flex items-center px-4 gap-3 border-b border-white/[0.08]">
        <ReadinessWidget readiness={readiness} publishLevel={publishLevel} size={28} />
        <div className="flex-1 min-w-0" />
        {onTestAgent && (
          <button
            onClick={onTestAgent}
            className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded border transition-colors"
            style={{
              color:        LEVEL_COLOR[publishLevel],
              borderColor:  `${LEVEL_COLOR[publishLevel]}40`,
              background:   `${LEVEL_COLOR[publishLevel]}0d`,
            }}
            aria-label="Test your agent"
          >
            Test agent
          </button>
        )}
        <a
          href="/dashboard/candidate"
          className="text-[10px] text-[rgba(255,255,255,0.35)] hover:text-white transition-colors"
        >
          Full profile ↗
        </a>
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1.5 text-[rgba(255,255,255,0.45)] hover:text-white transition-colors text-xs"
          aria-label="Open coverage dashboard"
        >
          Coverage
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
        <div className="hidden lg:flex w-[45%] shrink-0 flex-col border-l border-white/[0.08] overflow-y-auto">
          {/* Desktop header with readiness widget */}
          <div className="sticky top-0 z-10 bg-[#0d0f14] shrink-0 h-14 flex items-center px-5 border-b border-white/[0.08] gap-3">
            <ReadinessWidget readiness={readiness} publishLevel={publishLevel} size={32} />
            <div className="flex-1 min-w-0" />
            <a
              href="/dashboard/candidate"
              className="shrink-0 text-[10px] text-[rgba(255,255,255,0.35)] hover:text-white transition-colors"
            >
              Edit full profile ↗
            </a>
            <span className="text-[11px] text-[rgba(255,255,255,0.28)] truncate">
              {candidateName}
            </span>
            {onTestAgent && (
              <button
                onClick={onTestAgent}
                className="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded border transition-colors hover:opacity-80"
                style={{
                  color:       LEVEL_COLOR[publishLevel],
                  borderColor: `${LEVEL_COLOR[publishLevel]}40`,
                  background:  `${LEVEL_COLOR[publishLevel]}0d`,
                }}
                aria-label="Test your agent"
              >
                Test agent
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
          'lg:hidden fixed inset-0 z-50 flex flex-col bg-[#0d0f14]',
          'transition-transform duration-300 ease-in-out',
          sheetOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        aria-hidden={!sheetOpen}
      >
        {/* Sheet header */}
        <div className="shrink-0 h-12 flex items-center px-4 gap-3 border-b border-white/[0.08]">
          <ReadinessWidget readiness={readiness} publishLevel={publishLevel} size={28} />
          <div className="flex-1 min-w-0" />
          <button
            onClick={() => setSheetOpen(false)}
            className="flex items-center gap-1.5 text-[rgba(255,255,255,0.45)] hover:text-white transition-colors text-xs"
            aria-label="Close coverage dashboard"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 2.5L4.5 6L7.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
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
