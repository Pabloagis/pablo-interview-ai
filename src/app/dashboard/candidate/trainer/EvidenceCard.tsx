'use client';

import { type EvidenceItem, type EvidenceQuality } from '@/lib/coverage-nodes';
import { usePlatformT, type PlatformStrings } from '@/context/platform-i18n';

// ── Quality visual config ─────────────────────────────────────────────────────

const QUALITY_COLOR: Record<EvidenceQuality, string> = {
  verified:       '#3ec870',
  solid:          '#5580f0',
  vague:          '#c08840',
  missing_detail: 'rgba(255,255,255,0.38)',
};
const QUALITY_LABEL_KEY: Record<EvidenceQuality, keyof PlatformStrings> = {
  verified:       'ev_quality_verified',
  solid:          'ev_quality_solid',
  vague:          'ev_quality_vague',
  missing_detail: 'ev_quality_missing_detail',
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  item: EvidenceItem;
  isNew?: boolean;           // triggers entrance animation
  onFollowUp: (item: EvidenceItem) => void;
  // Retire the older facts this item contradicts, or keep both. Nothing happens
  // until one of the two is chosen — silence leaves every fact in place.
  onSupersede?: (item: EvidenceItem, replace: boolean) => void;
}

export default function EvidenceCard({ item, isNew = false, onFollowUp, onSupersede }: Props) {
  const t = usePlatformT();
  const nodeLabel   = t.nodes[item.nodeKey]?.label ?? item.nodeKey;
  const qualityColor = QUALITY_COLOR[item.quality];
  const qualityLabel = t[QUALITY_LABEL_KEY[item.quality]] as string;
  const canFollowUp = (item.quality === 'vague' || item.quality === 'missing_detail')
    && !!item.followUpQuestion
    && !item.followUpSent;
  const pendingSupersede = !!item.supersedes?.length && !item.supersedeChoice;

  return (
    <div
      className="rounded-xl border bg-[rgba(255,255,255,0.03)] px-3.5 py-3 flex flex-col gap-2"
      style={{
        borderColor: `${qualityColor}22`,
        // Entrance: slide from left (conversation side) + scale, mimicking "evidence flying in"
        animation: isNew ? 'evidence-enter 0.38s cubic-bezier(0.2, 0, 0, 1) forwards' : undefined,
      }}
    >
      {/* ── Header row ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        {/* Node label */}
        <span className="text-[10px] text-[rgba(255,255,255,0.35)] font-medium uppercase tracking-wider truncate">
          {nodeLabel}
        </span>

        {/* Quality badge */}
        <span
          className="shrink-0 text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded"
          style={{
            color:      qualityColor,
            background: `${qualityColor}18`,
            border:     `1px solid ${qualityColor}28`,
          }}
        >
          {qualityLabel}
        </span>
      </div>

      {/* ── Extracted content ────────────────────────────────────────────── */}
      <p className="text-xs text-[rgba(255,255,255,0.65)] leading-snug">
        {item.content}
      </p>

      {/* ── Replacement prompt — this fact contradicts an older one ────── */}
      {pendingSupersede && (
        <div className="rounded-lg border border-[#c08840]/25 bg-[#c08840]/[0.07] px-2.5 py-2 flex flex-col gap-2">
          <span className="text-[10px] font-medium text-[#d8a45c] leading-snug">
            {t.ev_replaces_question}
          </span>

          {/* The old text, verbatim — the candidate decides against what it says,
              not against a summary of it. */}
          <div className="flex flex-col gap-1">
            {item.supersedes!.map(old => (
              <p
                key={old.id}
                className="text-[11px] text-[rgba(255,255,255,0.42)] leading-snug pl-2 border-l border-[rgba(255,255,255,0.15)] line-through decoration-[rgba(255,255,255,0.25)]"
              >
                {old.content}
              </p>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSupersede?.(item, true)}
              className="px-2 py-1 rounded-md text-[10px] font-medium text-white transition-opacity hover:opacity-85"
              style={{ background: 'rgba(192,136,64,0.9)' }}
            >
              {t.ev_replaces_confirm}
            </button>
            <button
              onClick={() => onSupersede?.(item, false)}
              className="px-2 py-1 rounded-md text-[10px] font-medium text-[rgba(255,255,255,0.5)] border border-[rgba(255,255,255,0.14)] hover:text-white transition-colors"
            >
              {t.ev_replaces_keep}
            </button>
          </div>
        </div>
      )}

      {item.supersedeChoice === 'replaced' && (
        <span className="text-[10px] text-[#3ec870]">{t.ev_replaced_done}</span>
      )}
      {item.supersedeChoice === 'kept' && (
        <span className="text-[10px] text-[rgba(255,255,255,0.22)]">{t.ev_replaced_kept}</span>
      )}

      {/* ── Follow-up button — only for vague / missing detail ────────── */}
      {canFollowUp && (
        <button
          onClick={() => onFollowUp(item)}
          className="self-start flex items-center gap-1.5 text-[10px] font-medium transition-colors mt-0.5"
          style={{ color: qualityColor }}
        >
          {t.ev_probe}
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
            <path d="M1.5 7.5L7.5 1.5M7.5 1.5H3.5M7.5 1.5V5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Sent indicator */}
      {item.followUpSent && (
        <span className="text-[10px] text-[rgba(255,255,255,0.22)]">
          {t.ev_followup_sent}
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
          {t.ev_not_saved}
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
