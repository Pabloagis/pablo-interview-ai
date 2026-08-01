'use client';

import { useState, useEffect, useRef } from 'react';
import type { PublishLevel } from '@/lib/coverage-nodes';
import { usePlatformT, type PlatformStrings } from '@/context/platform-i18n';

// Level colours — single source of truth (matches TrainerShell)
const LEVEL_COLOR: Record<PublishLevel, string> = {
  sharp:       '#60c080',
  solid:       '#5080f0',
  basic:       '#4060d0',
  unpublished: '#6080a0',
};

// unpublished shows NO badge, so it maps to no key (empty label handled below)
const LEVEL_LABEL_KEY: Record<Exclude<PublishLevel, 'unpublished'>, keyof PlatformStrings> = {
  sharp: 'level_sharp',
  solid: 'level_solid',
  basic: 'level_basic',
};

// ── Core geometry ─────────────────────────────────────────────────────────────
// The core is an extruded hexagonal prism: SLICES copies of the same clip-path
// stacked along Z, each a little darker as it recedes. Swaying the stack a few
// degrees exposes the side wall, which is what makes it read as a solid object
// instead of a flat badge — and it costs nothing but a handful of spans.
//
// No `filter` on the prism or any of its ancestors: a filter forces
// transform-style back to flat, which would collapse the extrusion. The bloom is
// a separate blurred plate behind the stack instead.
const HEX_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
const SLICES = 9;
const SLICE_Z = 2.4;                      // px between slices
const BACK_TINT = [10, 13, 19] as const;  // #0a0d13 — the panel's own dark

/** "#60c080" → [96, 192, 128] */
function toRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Blend from the panel dark towards the level colour — the extrusion ramp. */
function shade(rgb: [number, number, number], t: number): string {
  const c = rgb.map((v, i) => Math.round(BACK_TINT[i] + (v - BACK_TINT[i]) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  readiness: number;
  publishLevel: PublishLevel;
  size?: number;
}

export default function AgentCore({ readiness, publishLevel, size = 200 }: Props) {
  const t = usePlatformT();
  // ── Spring pulse guard ───────────────────────────────────────────────────
  // prevReadinessRef is initialised to the *current* readiness so the very first
  // render (and StrictMode's synthetic unmount/remount) never fires the pulse.
  const prevReadinessRef = useRef(readiness);
  const animatingRef     = useRef(false);
  const [pulseKey, setPulseKey] = useState(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = prevReadinessRef.current;
    prevReadinessRef.current = readiness;

    // Only pulse on a genuine upward change; ignore the initial mount value.
    if (readiness > prev && !animatingRef.current) {
      animatingRef.current = true;
      setPulseKey(k => k + 1);
      const timer = setTimeout(() => { animatingRef.current = false; }, 700);
      return () => clearTimeout(timer);
    }
  }, [readiness]);

  // ── Geometry (all proportional to `size`) ───────────────────────────────
  const cx = size / 2;

  const ringR  = Math.round(size * 0.440); // readiness ring radius
  const ringW  = Math.max(5, Math.round(size * 0.036));
  const ringC  = 2 * Math.PI * ringR;      // circumference
  const pct    = Math.min(Math.max(readiness, 0), 100) / 100;
  const offset = ringC * (1 - pct);

  // Leading cap: where the arc currently ends. A bright dot, so the ring reads
  // as a live sweep rather than a static gauge.
  const capAngle = -Math.PI / 2 + pct * 2 * Math.PI;
  const capX = cx + ringR * Math.cos(capAngle);
  const capY = cx + ringR * Math.sin(capAngle);

  const color = LEVEL_COLOR[publishLevel];
  const rgb   = toRgb(color);
  const label = publishLevel === 'unpublished' ? '' : (t[LEVEL_LABEL_KEY[publishLevel]] as string);

  // ── Pointer parallax ─────────────────────────────────────────────────────
  // Written straight to CSS custom properties: no re-render per mousemove.
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const stage = stageRef.current;
    const scene = sceneRef.current;
    if (!stage || !scene) return;
    const r = stage.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width  - 0.5;
    const ny = (e.clientY - r.top)  / r.height - 0.5;
    // Kept modest on purpose: the deeper a ring sits, the further parallax
    // slides it sideways relative to the core's silhouette, and past roughly
    // 12deg the back rings start to graze the number.
    scene.style.setProperty('--ac-ry', `${(nx *  12).toFixed(2)}deg`);
    scene.style.setProperty('--ac-rx', `${(ny *  -9).toFixed(2)}deg`);
  }

  function resetParallax() {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.style.setProperty('--ac-ry', '0deg');
    scene.style.setProperty('--ac-rx', '0deg');
  }

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <AgentCoreStyles />

      <div
        ref={stageRef}
        className="ac-stage"
        style={{
          '--ac-size': `${size}px`,
          '--ac-c':    color,
          '--ac-rgb':  `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`,
        } as React.CSSProperties}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetParallax}
        role="img"
        aria-label={`Agent readiness ${readiness} of 100${label ? `, level ${label}` : ''}`}
      >
        <div ref={sceneRef} className="ac-scene">

          {/* Volumetric light the assembly sits in */}
          <div className="ac-halo" aria-hidden />

          {/* ── Orbits — real 3D planes, not painted ellipses ────────── */}
          <div className="ac-orbit ac-orbit-a" aria-hidden />
          <div className="ac-orbit ac-orbit-b" aria-hidden />
          <div className="ac-orbit ac-orbit-c" aria-hidden>
            <span className="ac-satellite" />
          </div>

          {/* ── Readiness arc ─────────────────────────────────────────── */}
          <svg
            className="ac-arc"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            aria-hidden
          >
            <defs>
              <filter id="ac-arc-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={ringW * 0.5} result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Track */}
            <circle
              cx={cx} cy={cx} r={ringR}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={ringW}
            />

            {/* Progress — animates on both length and colour, pure CSS */}
            <circle
              cx={cx} cy={cx} r={ringR}
              fill="none"
              stroke={color}
              strokeWidth={ringW}
              strokeLinecap="round"
              strokeDasharray={ringC}
              strokeDashoffset={offset}
              filter="url(#ac-arc-glow)"
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: `${cx}px ${cx}px`,
                transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.45s ease',
              }}
            />

            {/* Leading cap */}
            {pct > 0 && pct < 1 && (
              <circle
                cx={capX} cy={capY} r={ringW * 0.42}
                fill="#fff"
                opacity={0.9}
                style={{
                  transition: 'cx 0.9s cubic-bezier(0.4, 0, 0.2, 1), cy 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            )}
          </svg>

          {/* ── Core: extruded hex prism carrying the number ──────────── */}
          {/* key=pulseKey remounts the group so the spring restarts cleanly on a
              readiness increase, with no manual animation reset. */}
          <div key={pulseKey} className="ac-core" data-pulse={pulseKey > 0 ? 'true' : undefined}>
            <div className="ac-prism">
              {/* Blurred plate behind the stack — the emissive bloom. Carrying
                  the filter here keeps it off the 3D-preserving ancestors. */}
              <span className="ac-bloom" aria-hidden />
              {/* Slightly oversized hexagon at the back: reads as a lit edge */}
              <span className="ac-rim" aria-hidden />

              {Array.from({ length: SLICES }, (_, i) => (
                <span
                  key={i}
                  className="ac-slice"
                  aria-hidden
                  style={{
                    background: shade(rgb, 0.10 + i * 0.022),
                    transform: `translateZ(${((i - (SLICES - 1)) * SLICE_Z).toFixed(1)}px)`,
                  }}
                />
              ))}

              {/* Front face: glass highlight over the top slice */}
              <span
                className="ac-facet"
                aria-hidden
                style={{ transform: `translateZ(${(SLICE_Z * 0.2).toFixed(1)}px)` }}
              />

              {/* The number sits flat on the face. The prism sways ±13° — enough
                  to show depth, nowhere near enough to hurt legibility. */}
              <div className="ac-face">
                <span className="ac-num">{readiness}</span>
                <span className="ac-den">/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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

// ── Scene styles ──────────────────────────────────────────────────────────────

function AgentCoreStyles() {
  return (
    <style>{`
      .ac-stage {
        position: relative;
        width:  var(--ac-size);
        height: var(--ac-size);
        perspective: calc(var(--ac-size) * 2.6);
        perspective-origin: 50% 50%;
      }
      .ac-scene {
        --ac-rx: 0deg;
        --ac-ry: 0deg;
        position: absolute;
        inset: 0;
        transform-style: preserve-3d;
        transform: rotateX(var(--ac-rx)) rotateY(var(--ac-ry));
        transition: transform 380ms cubic-bezier(0.22, 0.61, 0.36, 1);
      }

      /* Volumetric light the assembly sits in */
      .ac-halo {
        position: absolute;
        inset: 12%;
        border-radius: 50%;
        background: radial-gradient(circle,
          rgba(var(--ac-rgb), 0.30) 0%,
          rgba(var(--ac-rgb), 0.08) 45%,
          transparent 70%);
        animation: ac-breathe 4.6s ease-in-out infinite;
      }
      @keyframes ac-breathe {
        0%, 100% { opacity: 0.55; transform: translateZ(calc(var(--ac-size) * -0.23)) scale(0.94); }
        50%      { opacity: 0.95; transform: translateZ(calc(var(--ac-size) * -0.23)) scale(1.05); }
      }

      /* ── Orbits ───────────────────────────────────────────────────── */
      /* Alpha lives in border-color, never in \`opacity\`: opacity is a grouping
         property and would flatten the satellite out of the 3D scene.
         Each orbit is pushed back by more than its own Z extent (radius x the
         sine of its tilt) so the near half of the ring never crosses in front
         of the core. A steeply tilted ring sweeps through the centre of the
         scene, and an orbit line drawn over the readiness number cuts the
         glyphs in half — the number wins. Behind the prism they still read as
         depth, better in fact: they disappear behind it and swing back out.
         The push-back exceeds the extent by ~0.12 x size rather than matching
         it: pointer parallax swings the whole scene, and a ring sitting a
         couple of pixels behind the face emerges from behind the silhouette as
         soon as it rotates. */
      .ac-orbit {
        position: absolute;
        border-radius: 50%;
        transform-style: preserve-3d;
      }
      .ac-orbit-a {
        inset: 15%;   /* r = 0.35 x size, tilt 74deg -> z extent 0.34 */
        border: 1px dashed rgba(var(--ac-rgb), 0.34);
        animation: ac-orbit-a 26s linear infinite;
      }
      .ac-orbit-b {
        inset: 25%;   /* r = 0.25 x size, tilt 78deg -> z extent 0.25 */
        border: 1px solid rgba(var(--ac-rgb), 0.20);
        animation: ac-orbit-b 18s linear infinite reverse;
      }
      .ac-orbit-c {
        inset: 9%;    /* r = 0.41 x size, compound tilt -> z extent 0.38 */
        border: 1px solid rgba(255, 255, 255, 0.10);
        animation: ac-orbit-c 34s linear infinite;
      }
      @keyframes ac-orbit-a {
        from { transform: translateZ(calc(var(--ac-size) * -0.46)) rotateX(74deg) rotateZ(0deg);   }
        to   { transform: translateZ(calc(var(--ac-size) * -0.46)) rotateX(74deg) rotateZ(360deg); }
      }
      @keyframes ac-orbit-b {
        from { transform: translateZ(calc(var(--ac-size) * -0.42)) rotateY(78deg) rotateZ(0deg);   }
        to   { transform: translateZ(calc(var(--ac-size) * -0.42)) rotateY(78deg) rotateZ(360deg); }
      }
      @keyframes ac-orbit-c {
        from { transform: translateZ(calc(var(--ac-size) * -0.52)) rotateX(62deg) rotateY(26deg) rotateZ(0deg);   }
        to   { transform: translateZ(calc(var(--ac-size) * -0.52)) rotateX(62deg) rotateY(26deg) rotateZ(360deg); }
      }
      /* One lit body riding the outer orbit */
      .ac-satellite {
        position: absolute;
        top: -3px; left: 50%;
        width: 6px; height: 6px;
        margin-left: -3px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 0 8px var(--ac-c), 0 0 18px rgba(var(--ac-rgb), 0.7);
      }

      /* ── Readiness arc ────────────────────────────────────────────── */
      .ac-arc {
        position: absolute;
        inset: 0;
        transform: translateZ(-6px);
        overflow: visible;
      }

      /* ── Core prism ───────────────────────────────────────────────── */
      .ac-core {
        position: absolute;
        left: 50%; top: 50%;
        width:  calc(var(--ac-size) * 0.46);
        height: calc(var(--ac-size) * 0.46);
        margin-left: calc(var(--ac-size) * -0.23);
        margin-top:  calc(var(--ac-size) * -0.23);
        transform-style: preserve-3d;
      }
      .ac-core[data-pulse] { animation: ac-pulse 0.65s ease-out; }

      /* Sway, not spin: the face never turns far enough to hurt the number */
      .ac-prism {
        position: absolute;
        inset: 0;
        transform-style: preserve-3d;
        animation: ac-sway 9s ease-in-out infinite;
      }
      @keyframes ac-sway {
        0%, 100% { transform: rotateY(-13deg) rotateX(6deg);  }
        50%      { transform: rotateY( 13deg) rotateX(-3deg); }
      }

      .ac-slice, .ac-rim, .ac-facet {
        position: absolute;
        inset: 0;
        clip-path: ${HEX_CLIP};
      }
      /* Lit edge peeking out from behind the stack */
      .ac-rim {
        inset: -2px;
        background: var(--ac-c);
        transform: translateZ(-${((SLICES - 1) * SLICE_Z + 1).toFixed(1)}px);
      }
      /* Emissive bloom. \`filter\` flattens this element's own subtree, which is
         fine — it has none — while its ancestors stay 3D. */
      .ac-bloom {
        position: absolute;
        inset: -16%;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(var(--ac-rgb), 0.55) 0%, transparent 68%);
        filter: blur(9px);
        transform: translateZ(-${((SLICES - 1) * SLICE_Z + 6).toFixed(1)}px);
      }
      /* Glass top: specular sweep across the front slice */
      .ac-facet {
        background: linear-gradient(148deg,
          rgba(255,255,255,0.18) 0%,
          rgba(255,255,255,0.07) 26%,
          rgba(255,255,255,0.00) 55%,
          rgba(0,0,0,0.14) 78%,
          rgba(0,0,0,0.30) 100%);
      }

      /* ── Number ───────────────────────────────────────────────────── */
      .ac-face {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        /* No gap, and a small denominator: the whole block has to stay inside
           the hexagon's full-width band (25%-75% of its height), or its edges
           fall past the silhouette onto open scene. */
        gap: 0;
        transform: translateZ(${(SLICE_Z * 0.6).toFixed(1)}px);
      }
      .ac-num {
        font-family: 'SF Mono', 'Fira Mono', 'Consolas', monospace;
        font-size: calc(var(--ac-size) * 0.155);
        line-height: 1;
        font-weight: 600;
        letter-spacing: 0.01em;
        font-variant-numeric: tabular-nums;
        color: #fff;
        text-shadow:
          0 1px 3px rgba(0, 0, 0, 0.9),
          0 0 16px rgba(var(--ac-rgb), 0.65);
      }
      .ac-den {
        font-family: 'SF Mono', 'Fira Mono', 'Consolas', monospace;
        font-size: calc(var(--ac-size) * 0.046);
        line-height: 1.4;
        letter-spacing: 0.14em;
        color: rgba(255, 255, 255, 0.5);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
      }

      /* Spring, approximated: overshoot, settle, smaller overshoot, settle */
      @keyframes ac-pulse {
        0%   { transform: scale(1);    }
        20%  { transform: scale(1.16); }
        42%  { transform: scale(0.95); }
        62%  { transform: scale(1.06); }
        80%  { transform: scale(0.99); }
        100% { transform: scale(1);    }
      }

      @media (prefers-reduced-motion: reduce) {
        .ac-scene { transition: none; }
        .ac-halo, .ac-orbit-a, .ac-orbit-b, .ac-orbit-c, .ac-prism, .ac-core[data-pulse] {
          animation: none;
        }
        .ac-halo    { transform: translateZ(calc(var(--ac-size) * -0.23)); opacity: 0.75; }
        .ac-orbit-a { transform: translateZ(calc(var(--ac-size) * -0.46)) rotateX(74deg); }
        .ac-orbit-b { transform: translateZ(calc(var(--ac-size) * -0.42)) rotateY(78deg); }
        .ac-orbit-c { transform: translateZ(calc(var(--ac-size) * -0.52)) rotateX(62deg) rotateY(26deg); }
        .ac-prism   { transform: rotateY(-11deg) rotateX(5deg); }
      }
    `}</style>
  );
}
