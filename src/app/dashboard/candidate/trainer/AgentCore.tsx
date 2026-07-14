'use client';

import { useState, useEffect, useRef } from 'react';
import type { PublishLevel } from '@/lib/coverage-nodes';

// Level colours — single source of truth (matches TrainerShell)
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
  unpublished: '',
};

// ── Hexagon geometry ──────────────────────────────────────────────────────────
// Pointy-top regular hexagon, starting at angle -90° (12 o'clock)
function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2; // -90°, -30°, 30°, 90°, 150°, 210°
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  readiness: number;
  publishLevel: PublishLevel;
  size?: number;
}

export default function AgentCore({ readiness, publishLevel, size = 200 }: Props) {
  // ── Spring pulse guard ───────────────────────────────────────────────────
  // prevReadinessRef is initialised to the *current* readiness so the very first
  // render (and StrictMode's synthetic unmount/remount) never fires the pulse.
  const prevReadinessRef = useRef(readiness);
  const animatingRef     = useRef(false);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    const prev = prevReadinessRef.current;
    prevReadinessRef.current = readiness;

    // Only pulse on a genuine upward change; ignore initial mount value.
    if (readiness > prev && !animatingRef.current) {
      animatingRef.current = true;
      setPulseKey(k => k + 1);
      const t = setTimeout(() => { animatingRef.current = false; }, 700);
      return () => clearTimeout(t);
    }
  }, [readiness]);

  // ── Geometry (all proportional to `size`) ───────────────────────────────
  const cx = size / 2;

  const ringR  = Math.round(size * 0.440); // readiness ring radius
  const ringW  = Math.max(5, Math.round(size * 0.036));
  const ringC  = 2 * Math.PI * ringR;      // circumference
  const offset = ringC * (1 - Math.min(readiness, 100) / 100);

  const orbitR  = Math.round(size * 0.360); // dashed orbit ring
  const innerR  = Math.round(size * 0.285); // static inner ring
  const coreR   = Math.round(size * 0.093); // hexagon apothem-ish radius
  const glowR   = coreR + Math.round(size * 0.055);
  const dotR    = Math.round(coreR * 0.28);

  const color    = LEVEL_COLOR[publishLevel];
  const label    = LEVEL_LABEL[publishLevel];
  const filterId = `agent-glow-${size}`;

  return (
    <div className="flex flex-col items-center gap-3 select-none">

      {/* ── Keyframe definitions (scoped by name prefix) ──────────────── */}
      <style>{`
        @keyframes agent-orbit-spin {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        @keyframes agent-core-breathe {
          0%, 100% { opacity: 0.45; }
          50%      { opacity: 0.80; }
        }
        /*
         * Spring approximation — no library needed.
         * Values hand-tuned to match overshoot → settle feel.
         * Easing: ease-out so the initial movement is fast and snappy.
         */
        @keyframes agent-core-pulse {
          0%   { transform: scale(1);    }
          20%  { transform: scale(1.22); }
          42%  { transform: scale(0.93); }
          62%  { transform: scale(1.09); }
          80%  { transform: scale(0.98); }
          100% { transform: scale(1);    }
        }
        @keyframes agent-glow-pulse {
          0%   { opacity: 0.12; }
          20%  { opacity: 0.35; }
          100% { opacity: 0.12; }
        }
      `}</style>

      {/* ── SVG canvas ────────────────────────────────────────────────── */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`Agent readiness ${readiness} of 100, level ${label || 'unpublished'}`}
        overflow="visible"
      >
        <defs>
          <filter id={filterId} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Readiness ring — track ─────────────────────────────────── */}
        <circle
          cx={cx} cy={cx} r={ringR}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={ringW}
        />

        {/* ── Readiness ring — progress ──────────────────────────────── */}
        {/* stroke-dashoffset transitions with a material ease-out curve.
            stroke transitions colour on level change. Both are CSS, so they
            compose cleanly with no JS timers. */}
        <circle
          cx={cx} cy={cx} r={ringR}
          fill="none"
          stroke={color}
          strokeWidth={ringW}
          strokeLinecap="round"
          strokeDasharray={ringC}
          strokeDashoffset={offset}
          style={{
            transform: `rotate(-90deg)`,
            transformOrigin: `${cx}px ${cx}px`,
            transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.45s ease',
          }}
        />

        {/* ── Dashed orbit ring — slowly rotates to keep the core alive ─ */}
        <circle
          cx={cx} cy={cx} r={orbitR}
          fill="none"
          stroke={color}
          strokeWidth={0.75}
          strokeDasharray="3 10"
          opacity={0.20}
          style={{
            transformOrigin: `${cx}px ${cx}px`,
            animation: 'agent-orbit-spin 28s linear infinite',
          }}
        />

        {/* ── Static inner reference ring ────────────────────────────── */}
        <circle
          cx={cx} cy={cx} r={innerR}
          fill="none"
          stroke="rgba(255,255,255,0.055)"
          strokeWidth={0.5}
        />

        {/* ── Agent core (hexagon group) ─────────────────────────────── */}
        {/* key=pulseKey forces React to remount the group, restarting the
            CSS animation cleanly without needing to clear/reset it manually. */}
        <g
          key={pulseKey}
          style={{
            transformOrigin: `${cx}px ${cx}px`,
            animation: pulseKey > 0
              ? 'agent-core-pulse 0.65s ease-out forwards'
              : undefined,
          }}
        >
          {/* Soft glow halo — also pulses on readiness increase */}
          <circle
            cx={cx} cy={cx}
            r={glowR}
            fill={color}
            filter={`url(#${filterId})`}
            style={{
              animation: pulseKey > 0
                ? 'agent-glow-pulse 0.65s ease-out forwards'
                : undefined,
              opacity: 0.12,
            }}
          />

          {/* Hexagon body */}
          <polygon
            points={hexPoints(cx, cx, coreR)}
            fill={color}
            opacity={0.90}
          />

          {/* Centre dot — constant slow breathe to signal the system is live */}
          <circle
            cx={cx} cy={cx}
            r={dotR}
            fill="white"
            style={{ animation: 'agent-core-breathe 2.8s ease-in-out infinite' }}
          />
        </g>

        {/* ── Readiness number — ghosted above the core, inside the ring ─ */}
        <text
          x={cx}
          y={cx - coreR - 10}
          textAnchor="middle"
          dominantBaseline="auto"
          fill="rgba(255,255,255,0.18)"
          fontSize={Math.round(size * 0.062)}
          fontFamily="'SF Mono', 'Fira Mono', 'Consolas', monospace"
          letterSpacing="0.05em"
        >
          {readiness}
        </text>
      </svg>

      {/* ── Level badge — below the ring ──────────────────────────────── */}
      {label ? (
        <div
          className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest transition-colors duration-400"
          style={{
            color,
            background: `${color}18`,
            border: `1px solid ${color}35`,
          }}
        >
          {label}
        </div>
      ) : (
        /* Placeholder keeps layout stable when unpublished — no badge shown */
        <div className="h-6" aria-hidden />
      )}
    </div>
  );
}
