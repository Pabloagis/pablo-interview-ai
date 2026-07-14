'use client';

import { COVERAGE_NODE_MAP, type EvidenceItem, type EvidenceQuality } from '@/lib/coverage-nodes';

// ── Quality visual config ─────────────────────────────────────────────────────

const QUALITY_CONFIG: Record<EvidenceQuality, { label: string; color: string }> = {
  verified:       { label: 'Verified',        color: '#3ec870' },
  solid:          { label: 'Solid',           color: '#5580f0' },
  vague:          { label: 'Vague',           color: '#c08840' },
  missing_detail: { label: 'Missing detail',  color: 'rgba(255,255,255,0.38)' },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  item: EvidenceItem;
  isNew?: boolean;           // triggers entrance animation
  onFollowUp: (item: EvidenceItem) => void;
}

export default function EvidenceCard({ item, isNew = false, onFollowUp }: Props) {
  const node    = COVERAGE_NODE_MAP.get(item.nodeKey);
  const quality = QUALITY_CONFIG[item.quality];
  const canFollowUp = (item.quality === 'vague' || item.quality === 'missing_detail')
    && !!item.followUpQuestion
    && !item.followUpSent;

  return (
    <div
      className="rounded-xl border bg-[rgba(255,255,255,0.03)] px-3.5 py-3 flex flex-col gap-2"
      style={{
        borderColor: `${quality.color}22`,
        // Entrance: slide from left (conversation side) + scale, mimicking "evidence flying in"
        animation: isNew ? 'evidence-enter 0.38s cubic-bezier(0.2, 0, 0, 1) forwards' : undefined,
      }}
    >
      {/* ── Header row ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        {/* Node label */}
        <span className="text-[10px] text-[rgba(255,255,255,0.35)] font-medium uppercase tracking-wider truncate">
          {node?.label ?? item.nodeKey}
        </span>

        {/* Quality badge */}
        <span
          className="shrink-0 text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded"
          style={{
            color:      quality.color,
            background: `${quality.color}18`,
            border:     `1px solid ${quality.color}28`,
          }}
        >
          {quality.label}
        </span>
      </div>

      {/* ── Extracted content ────────────────────────────────────────────── */}
      <p className="text-xs text-[rgba(255,255,255,0.65)] leading-snug">
        {item.content}
      </p>

      {/* ── Follow-up button — only for vague / missing detail ────────── */}
      {canFollowUp && (
        <button
          onClick={() => onFollowUp(item)}
          className="self-start flex items-center gap-1.5 text-[10px] font-medium transition-colors mt-0.5"
          style={{ color: quality.color }}
        >
          Probe this
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
            <path d="M1.5 7.5L7.5 1.5M7.5 1.5H3.5M7.5 1.5V5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Sent indicator */}
      {item.followUpSent && (
        <span className="text-[10px] text-[rgba(255,255,255,0.22)]">
          Follow-up sent
        </span>
      )}

      {/* Not-saved indicator — extraction succeeded but DB insert failed */}
      {item.persisted === false && (
        <span className="flex items-center gap-1 text-[10px] text-[#c08840]">
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
            <path d="M4.5 0.8L8.5 7.8H0.5L4.5 0.8Z" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round"/>
            <path d="M4.5 3.6V5.2" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
            <circle cx="4.5" cy="6.3" r="0.5" fill="currentColor"/>
          </svg>
          Not saved — reload may lose this
        </span>
      )}
    </div>
  );
}

// ── Keyframe (injected once alongside the component) ─────────────────────────
// Defined here so it's co-located with the animation it controls.
export function EvidenceCardStyles() {
  return (
    <style>{`
      @keyframes evidence-enter {
        0%   { transform: translateX(-18px) scale(0.94); opacity: 0; }
        55%  { transform: translateX(3px)   scale(1.01); opacity: 1; }
        100% { transform: translateX(0)     scale(1);    opacity: 1; }
      }
    `}</style>
  );
}
