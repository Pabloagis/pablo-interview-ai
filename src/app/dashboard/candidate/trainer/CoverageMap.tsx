'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  COVERAGE_NODES,
  type CoverageNodeKey,
  type CoverageNodeConfig,
  type CoverageCluster,
  type NodeState,
} from '@/lib/coverage-nodes';
import { usePlatformT, type PlatformStrings } from '@/context/platform-i18n';

// state → translation key for its short label
const STATE_LABEL_KEY: Record<NodeState, keyof PlatformStrings> = {
  dark:     'cov_state_no_data',
  weak:     'cov_state_partial',
  solid:    'cov_state_solid',
  verified: 'cov_state_verified',
};
// non-dark state → translation key for the "what the agent says now" line
const AGENT_TEXT_KEY: Record<Exclude<NodeState, 'dark'>, keyof PlatformStrings> = {
  weak:     'cov_agent_weak',
  solid:    'cov_agent_solid',
  verified: 'cov_agent_verified',
};

// ── Layout ────────────────────────────────────────────────────────────────────
// The map is a CSS grid, NOT absolute SVG coordinates. This is deliberate:
// labels are real text in real cells, so they wrap and can never overlap each
// other or get clipped at the edges, at any container width or language. The
// constellation lines are drawn afterwards from *measured* orb centres, so the
// wiring follows the layout instead of the layout following the wiring.
//
// Quadrants keep their meaning: Track record TL, Judgement TR, Motivation BL,
// Logistics BR — same reading as before, just laid out by the browser.
const CLUSTER_ORDER: CoverageCluster[] = [
  'track_record', 'judgement', 'motivation', 'logistics',
];

const CLUSTER_TITLE_KEY: Record<CoverageCluster, keyof PlatformStrings> = {
  track_record: 'cluster_track_record',
  judgement:    'cluster_judgement',
  motivation:   'cluster_motivation',
  logistics:    'cluster_logistics',
};

// Per-node vertical stagger (px) — breaks the grid rhythm so the field reads as
// a floating constellation rather than a table. Small enough that the reserved
// cell space still guarantees no label collisions.
const NODE_LIFT: Partial<Record<CoverageNodeKey, number>> = {
  signature_stories:     -9,
  metrics_impact:         7,
  tools_systems:         -5,
  conflict_disagreement: -8,
  limits_gaps:            6,
  decision_style:        -4,
  company_fit:            8,
  compensation:          -6,
};

// Lines connecting nodes within each cluster (constellation links)
const CLUSTER_LINES: Array<[CoverageNodeKey, CoverageNodeKey]> = [
  // Track record — quadrilateral
  ['role_history',       'signature_stories'    ],
  ['role_history',       'tools_systems'        ],
  ['signature_stories',  'metrics_impact'       ],
  ['tools_systems',      'metrics_impact'       ],
  // Judgement — quadrilateral
  ['failure_modes',      'conflict_disagreement'],
  ['failure_modes',      'decision_style'       ],
  ['decision_style',     'limits_gaps'          ],
  ['limits_gaps',        'conflict_disagreement'],
  // Motivation — single link
  ['career_narrative',   'company_fit'          ],
  // Logistics — single link
  ['constraints',        'compensation'         ],
];

// ── Node visual configuration per state ───────────────────────────────────────
// `core`/`rim` build the sphere gradient, `glow` the emitted light, `label` the
// text colour (always kept above the legibility floor — never the raw fill).
const NODE_VISUAL: Record<NodeState, {
  core: string;
  rim: string;
  glow: string;
  label: string;
  stateColor: string;
}> = {
  dark: {
    core:       '#222222',               // --border
    rim:        '#111111',               // --surface
    glow:       'rgba(255,255,255,0)',
    label:      '#767676',               // --text-disabled
    stateColor: '#767676',
  },
  weak: {
    core:       '#D4A843',               // --warning
    rim:        '#7A5A20',
    glow:       'rgba(212,168,67,0.28)',
    label:      '#D4A843',
    stateColor: '#D4A843',
  },
  solid: {
    core:       '#5B9BF6',               // --interactive
    rim:        '#1A3A80',
    glow:       'rgba(91,155,246,0.28)',
    label:      '#5B9BF6',
    stateColor: '#5B9BF6',
  },
  verified: {
    core:       '#4A9E5C',               // --success
    rim:        '#1A5A30',
    glow:       'rgba(74,158,92,0.28)',
    label:      '#4A9E5C',
    stateColor: '#4A9E5C',
  },
};

const LIT: Record<NodeState, boolean> = {
  dark: false, weak: true, solid: true, verified: true,
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface NodeData {
  state: NodeState;
  score: number;
}

interface Props {
  nodes: Record<CoverageNodeKey, NodeData>;
  onTrainNode?: (key: CoverageNodeKey) => void;
}

type Point = { x: number; y: number };

// Distance from an element's own box to the stage origin, ignoring transforms.
// getBoundingClientRect() would fold in the parallax rotation and make the wires
// drift away from the orbs; offsetLeft/offsetTop are transform-independent.
function offsetCentre(el: HTMLElement, root: HTMLElement): Point {
  let x = 0;
  let y = 0;
  let cur: HTMLElement | null = el;
  while (cur && cur !== root) {
    x += cur.offsetLeft;
    y += cur.offsetTop;
    cur = cur.offsetParent as HTMLElement | null;
  }
  return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CoverageMap({ nodes, onTrainNode }: Props) {
  const t = usePlatformT();
  const [selected, setSelected] = useState<CoverageNodeKey | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const gridRef  = useRef<HTMLDivElement>(null);
  const orbRefs  = useRef<Partial<Record<CoverageNodeKey, HTMLSpanElement | null>>>({});

  const [wires, setWires] = useState<{ w: number; h: number; pts: Partial<Record<CoverageNodeKey, Point>> }>(
    { w: 0, h: 0, pts: {} }
  );

  // ── Measure orb centres → constellation geometry ─────────────────────────
  // Re-runs on any size change (ResizeObserver on the stage and on the grid, so
  // a label wrapping onto a second line is caught too) and on language change,
  // because translated labels change the cell heights.
  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const pts: Partial<Record<CoverageNodeKey, Point>> = {};
    for (const node of COVERAGE_NODES) {
      const el = orbRefs.current[node.key];
      if (el) pts[node.key] = offsetCentre(el, stage);
    }
    setWires({ w: stage.offsetWidth, h: stage.offsetHeight, pts });
  }, []);

  // useEffect, not useLayoutEffect: this component is server-rendered, and
  // useLayoutEffect warns during SSR. The wires simply appear on the frame
  // after the field paints.
  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (stageRef.current) ro.observe(stageRef.current);
    if (gridRef.current)  ro.observe(gridRef.current);
    return () => ro.disconnect();
  }, [measure, t]);

  // ── Pointer parallax ─────────────────────────────────────────────────────
  // Writes CSS variables directly — no re-render per mouse move. Capped at a few
  // degrees so the labels stay flat enough to read.
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const stage = stageRef.current;
    const scene = sceneRef.current;
    if (!stage || !scene) return;
    const r = stage.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width  - 0.5;
    const ny = (e.clientY - r.top)  / r.height - 0.5;
    scene.style.setProperty('--cov-ry', `${(nx *  4).toFixed(2)}deg`);
    scene.style.setProperty('--cov-rx', `${(ny * -3).toFixed(2)}deg`);
    scene.style.setProperty('--cov-shift', `${(nx * -6).toFixed(2)}px`);
  }

  function resetParallax() {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.style.setProperty('--cov-ry', '0deg');
    scene.style.setProperty('--cov-rx', '0deg');
    scene.style.setProperty('--cov-shift', '0px');
  }

  const selectedConfig = selected
    ? COVERAGE_NODES.find(n => n.key === selected) ?? null
    : null;
  const selectedData = selected ? nodes[selected] : null;

  function handleNodeClick(key: CoverageNodeKey) {
    setSelected(prev => (prev === key ? null : key));
  }

  function handleTrain() {
    if (!selected) return;
    onTrainNode?.(selected);
    setSelected(null);
  }

  return (
    <div className="flex flex-col gap-0">
      <CoverageMapStyles />

      {/* ── 3D stage ──────────────────────────────────────────────────── */}
      {/* .cov-shell is the query container: type sizing follows the sidebar
          width, which is never the viewport width. Kept outside the stage so
          containment can't interfere with the 3D scene inside it. */}
      <div className="cov-shell">
      <div
        ref={stageRef}
        className="cov-stage"
        onPointerMove={handlePointerMove}
        onPointerLeave={resetParallax}
        role="group"
        aria-label={t.shell_coverage}
      >
        <div ref={sceneRef} className="cov-scene">


          {/* ── Constellation wiring — drawn from measured orb centres ── */}
          {wires.w > 0 && (
            <svg
              className="cov-wires"
              width={wires.w}
              height={wires.h}
              viewBox={`0 0 ${wires.w} ${wires.h}`}
              aria-hidden
            >
              {CLUSTER_LINES.map(([a, b]) => {
                const pa = wires.pts[a];
                const pb = wires.pts[b];
                if (!pa || !pb) return null;

                // Bowed link — a straight line reads flat; the arc sells depth.
                const mx = (pa.x + pb.x) / 2;
                const my = (pa.y + pb.y) / 2;
                const dx = pb.x - pa.x;
                const dy = pb.y - pa.y;
                const len = Math.hypot(dx, dy) || 1;
                const bow = Math.min(len * 0.11, 22);
                const cxp = mx + (-dy / len) * bow;
                const cyp = my + ( dx / len) * bow;
                const d = `M ${pa.x} ${pa.y} Q ${cxp} ${cyp} ${pb.x} ${pb.y}`;

                const live = LIT[nodes[a].state] && LIT[nodes[b].state];
                const flowColor = NODE_VISUAL[
                  nodes[a].score >= nodes[b].score ? nodes[a].state : nodes[b].state
                ].stateColor;

                return (
                  <g key={`${a}-${b}`}>
                    <path d={d} className="cov-wire" />
                    {live && (
                      <path
                        d={d}
                        pathLength={240}
                        className="cov-wire-flow"
                        stroke={flowColor}
                        style={{ animationDelay: `${(a.length * 0.37) % 3}s` }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          )}

          {/* ── Node field — four cluster panels, real grid, real text ── */}
          <div ref={gridRef} className="cov-grid">
            {CLUSTER_ORDER.map(cluster => {
              const clusterNodes = COVERAGE_NODES.filter(n => n.cluster === cluster);
              return (
                <div key={cluster} className="cov-panel">
                  <p className="cov-panel-title">
                    {(t[CLUSTER_TITLE_KEY[cluster]] as string).toUpperCase()}
                  </p>

                  <div className="cov-panel-nodes">
                    {clusterNodes.map((node, i) => {
                      const data = nodes[node.key];
                      const vis  = NODE_VISUAL[data.state];
                      const isSelected = selected === node.key;

                      return (
                        <button
                          key={node.key}
                          type="button"
                          onClick={() => handleNodeClick(node.key)}
                          className="cov-node"
                          data-selected={isSelected || undefined}
                          data-lit={LIT[data.state] || undefined}
                          style={{
                            '--cov-core':  vis.core,
                            '--cov-rim':   vis.rim,
                            '--cov-glow':  vis.glow,
                            '--cov-label': vis.label,
                            '--cov-ring':  vis.stateColor,
                            '--cov-lift':  `${NODE_LIFT[node.key] ?? 0}px`,
                            '--cov-delay': `${((i * 0.7) + cluster.length * 0.23).toFixed(2)}s`,
                          } as React.CSSProperties}
                          aria-pressed={isSelected}
                          aria-label={`${t.nodes[node.key].label} — ${t[STATE_LABEL_KEY[data.state]]}`}
                        >
                          <span className="cov-orb-wrap">
                            <span
                              ref={el => { orbRefs.current[node.key] = el; }}
                              className="cov-orb"
                            />
                            <span className="cov-orb-shadow" aria-hidden />
                          </span>
                          <span className="cov-label">{t.nodes[node.key].label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>

      {/* ── Node detail panel ────────────────────────────────────────────── */}
      {selectedConfig && selectedData && (
        <div className="mt-3">
          <NodePanel
            config={selectedConfig}
            data={selectedData}
            onClose={() => setSelected(null)}
            onTrain={handleTrain}
          />
        </div>
      )}
    </div>
  );
}

// ── Scene styles ──────────────────────────────────────────────────────────────
// Kept in one place next to the markup it dresses. Everything motion-related is
// disabled under prefers-reduced-motion; nothing about legibility depends on it.

function CoverageMapStyles() {
  return (
    <style>{`
      .cov-shell {
        container-type: inline-size;
        container-name: cov;
        width: 100%;
      }
      .cov-stage {
        position: relative;
        width: 100%;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-visible);
        background: var(--surface);
        overflow: hidden;
        perspective: 900px;
        perspective-origin: 50% 46%;
        touch-action: pan-y;
      }
      .cov-scene {
        --cov-rx: 0deg;
        --cov-ry: 0deg;
        --cov-shift: 0px;
        position: relative;
        transform-style: preserve-3d;
        transform:
          rotateX(calc(2deg + var(--cov-rx)))
          rotateY(var(--cov-ry))
          translateX(var(--cov-shift));
        transition: transform 320ms cubic-bezier(0.22, 0.61, 0.36, 1);
      }

      /* Wiring sits behind the orbs */
      .cov-wires {
        position: absolute;
        inset: 0;
        transform: translateZ(6px);
        pointer-events: none;
        overflow: visible;
      }
      .cov-wire {
        fill: none;
        stroke: var(--border-visible);
        stroke-width: 1;
      }
      .cov-wire-flow {
        fill: none;
        stroke-width: 1.4;
        stroke-linecap: round;
        opacity: 0.70;
        stroke-dasharray: 8 232;
        animation: cov-flow 3.4s linear infinite;
      }
      @keyframes cov-flow {
        from { stroke-dashoffset: 240; }
        to   { stroke-dashoffset: 0;   }
      }

      /* ── Layout grid ── */
      .cov-grid {
        position: relative;
        transform-style: preserve-3d;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px 0;
        padding: 14px 6px 28px;
      }
      .cov-panel {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px 4px 12px;
        transform-style: preserve-3d;
      }
      .cov-panel:nth-child(-n+2) { transform: translateZ(-20px); }
      .cov-panel:nth-child(n+3)  { transform: translateZ(6px);   }
      /* Quadrant dividers — subtle rules using the border token */
      .cov-panel:nth-child(odd)::after,
      .cov-panel:nth-child(-n+2)::before {
        content: '';
        position: absolute;
        pointer-events: none;
      }
      .cov-panel:nth-child(odd)::after {
        top: 8%; bottom: 8%; right: 0; width: 1px;
        background: linear-gradient(180deg,
          transparent 0%, var(--border-visible) 50%, transparent 100%);
        opacity: 0.5;
      }
      .cov-panel:nth-child(-n+2)::before {
        left: 6%; right: 6%; bottom: 0; height: 1px;
        background: linear-gradient(90deg,
          transparent 0%, var(--border-visible) 50%, transparent 100%);
        opacity: 0.5;
      }
      .cov-panel-title {
        font-family: var(--font-space-mono, monospace);
        font-size: 9px;
        font-weight: 400;
        letter-spacing: 0.12em;
        color: var(--text-disabled);
        text-align: center;
        user-select: none;
        transform: translateZ(4px);
      }
      .cov-panel-nodes {
        display: grid;
        grid-template-columns: 1fr 1fr;
        transform-style: preserve-3d;
      }

      /* ── Node ── */
      .cov-node {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 7px;
        padding: 12px 4px 10px;
        min-height: 86px;
        background: none;
        border: 0;
        cursor: pointer;
        transform-style: preserve-3d;
        transform: translateY(var(--cov-lift)) translateZ(0);
        transition: transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1);
      }
      .cov-node:hover,
      .cov-node:focus-visible {
        transform: translateY(calc(var(--cov-lift) - 3px)) translateZ(18px);
        outline: none;
      }

      .cov-orb-wrap {
        position: relative;
        width: 28px;
        height: 28px;
        transform-style: preserve-3d;
        display: block;
      }
      .cov-orb {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        transform: translateZ(16px);
        background:
          radial-gradient(circle at 50% 116%,
            rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 42%),
          radial-gradient(circle at 34% 27%,
            var(--cov-core) 0%,
            var(--cov-core) 18%,
            var(--cov-rim) 82%);
        box-shadow:
          inset 0 -2px 5px rgba(0,0,0,0.40),
          inset 0 2px 3px rgba(255,255,255,0.14),
          0 0 0 1px rgba(255,255,255,0.06),
          0 0 12px var(--cov-glow),
          0 0 24px var(--cov-glow);
        animation: cov-bob 6.5s ease-in-out infinite;
        animation-delay: var(--cov-delay);
        transition: box-shadow 300ms ease, background 300ms ease;
      }
      .cov-orb::after {
        content: '';
        position: absolute;
        left: 24%; top: 17%;
        width: 30%; height: 24%;
        border-radius: 50%;
        background: radial-gradient(circle,
          rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.28) 45%, rgba(255,255,255,0) 72%);
        filter: blur(0.4px);
      }
      .cov-node:not([data-lit]) .cov-orb {
        box-shadow:
          inset 0 -2px 5px rgba(0,0,0,0.50),
          inset 0 2px 3px rgba(255,255,255,0.08),
          0 0 0 1px rgba(255,255,255,0.07);
        transform: translateZ(6px) scale(0.88);
      }
      .cov-node[data-lit] .cov-orb-wrap::after {
        content: '';
        position: absolute;
        inset: -6px;
        border-radius: 50%;
        border: 1px solid var(--cov-ring);
        opacity: 0.18;
        transform: translateZ(10px);
        animation: cov-halo 4.2s ease-in-out infinite;
        animation-delay: var(--cov-delay);
      }
      @keyframes cov-halo {
        0%, 100% { opacity: 0.12; transform: translateZ(10px) scale(1);    }
        50%      { opacity: 0.26; transform: translateZ(10px) scale(1.08); }
      }
      @keyframes cov-bob {
        0%, 100% { translate: 0 -1.5px; }
        50%      { translate: 0  1.5px; }
      }
      .cov-orb-shadow {
        position: absolute;
        left: 50%;
        bottom: -10px;
        width: 22px;
        height: 6px;
        transform: translateX(-50%) translateZ(-4px) rotateX(72deg);
        border-radius: 50%;
        background: radial-gradient(circle, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0) 72%);
        pointer-events: none;
      }

      .cov-node[data-selected] .cov-orb {
        box-shadow:
          inset 0 -2px 5px rgba(0,0,0,0.38),
          inset 0 2px 3px rgba(255,255,255,0.20),
          0 0 0 2px var(--cov-ring),
          0 0 18px var(--cov-glow),
          0 0 36px var(--cov-glow);
      }
      .cov-node[data-selected] { transform: translateY(calc(var(--cov-lift) - 3px)) translateZ(22px); }

      /* ── Label ── */
      .cov-label {
        display: block;
        max-width: 15ch;
        font-family: var(--font-space-mono, monospace);
        font-size: 10px;
        line-height: 1.25;
        font-weight: 400;
        letter-spacing: 0.04em;
        text-align: center;
        color: var(--cov-label);
        overflow-wrap: break-word;
        transform: translateZ(12px);
        transition: color 240ms ease;
        user-select: none;
      }
      .cov-node:hover .cov-label,
      .cov-node[data-selected] .cov-label { color: var(--text-primary); }

      @container cov (max-width: 430px) {
        .cov-label       { font-size: 10px; max-width: 14ch; }
        .cov-node        { min-height: 80px; padding-left: 2px; padding-right: 2px; }
        .cov-panel-title { font-size: 8px; letter-spacing: 0.12em; }
      }
      @container cov (min-width: 600px) {
        .cov-label { font-size: 12px; max-width: 17ch; }
        .cov-node  { min-height: 92px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .cov-scene { transition: none; }
        .cov-orb, .cov-wire-flow,
        .cov-node[data-lit] .cov-orb-wrap::after { animation: none; }
      }
    `}</style>
  );
}

// ── Node detail panel ─────────────────────────────────────────────────────────

function NodePanel({
  config,
  data,
  onClose,
  onTrain,
}: {
  config: CoverageNodeConfig;
  data: NodeData;
  onClose: () => void;
  onTrain: () => void;
}) {
  const t = usePlatformT();
  const node = t.nodes[config.key];
  const vis = NODE_VISUAL[data.state];
  const questions = node.questions;

  const isDark = data.state === 'dark';
  const agentText = isDark
    ? node.darkRefusal
    : (t[AGENT_TEXT_KEY[data.state as Exclude<NodeState, 'dark'>]] as string);

  return (
    <div
      data-theme="day"
      className="rounded-[var(--radius-md)] border bg-[var(--surface)] overflow-hidden"
      style={{ borderColor: `${vis.stateColor}40` }}
    >
      {/* Colour bleed from the node state — mirrors the orb glow */}
      <div
        className="h-px w-full"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${vis.stateColor}60 50%, transparent 100%)` }}
        aria-hidden
      />

      <div className="px-4 py-4 flex flex-col gap-4">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="font-mono text-[12px] font-medium text-[var(--text-display)] leading-none tracking-[0.02em]">
              {node.label}
            </span>
            <span
              className="self-start font-mono text-[9px] uppercase tracking-[0.10em] px-2 py-0.5 rounded-[var(--radius-sm)]"
              style={{
                color:      vis.stateColor,
                background: `${vis.stateColor}18`,
                border:     `1px solid ${vis.stateColor}35`,
              }}
            >
              {t[STATE_LABEL_KEY[data.state]] as string}
            </span>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors duration-[180ms] text-lg leading-none mt-0.5"
            aria-label={t.conv_close}
          >
            ×
          </button>
        </div>

        {/* ── What this node covers ───────────────────────────────────────── */}
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.10em] text-[var(--text-disabled)] mb-1.5">
            {t.cov_what_covers}
          </p>
          <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
            {node.description}
          </p>
        </div>

        {/* ── Recruiter questions ─────────────────────────────────────────── */}
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.10em] text-[var(--text-disabled)] mb-1.5">
            {t.cov_unlocks}
          </p>
          <ul className="flex flex-col gap-1">
            {questions.map(q => (
              <li key={q} className="flex items-start gap-2">
                <span
                  className="shrink-0 mt-px select-none text-[10px]"
                  style={{ color: `${vis.stateColor}80` }}
                >
                  ·
                </span>
                <span className="text-[12px] text-[var(--text-secondary)] leading-snug">{q}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── What the agent says right now ──────────────────────────────── */}
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.10em] text-[var(--text-disabled)] mb-1.5">
            {t.cov_agent_says_now}
          </p>

          {isDark ? (
            <div className="flex flex-col gap-2">
              <blockquote
                className="pl-3"
                style={{ borderLeft: `2px solid ${vis.stateColor}40` }}
              >
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed italic">
                  "{agentText}"
                </p>
              </blockquote>
              <p className="text-[11px] text-[var(--text-disabled)]">
                {t.cov_no_data_recruiters}
              </p>
            </div>
          ) : (
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
              {agentText}
            </p>
          )}
        </div>

        {/* ── Train this button ───────────────────────────────────────────── */}
        <button
          onClick={onTrain}
          className="self-start flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] font-mono text-[11px] uppercase tracking-[0.06em] transition-colors duration-[180ms]"
          style={{
            color:      vis.stateColor,
            background: `${vis.stateColor}14`,
            border:     `1px solid ${vis.stateColor}35`,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = `${vis.stateColor}22`;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = `${vis.stateColor}14`;
          }}
        >
          {t.cov_train_this}
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
            <path d="M2 9L9 2M9 2H4M9 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

      </div>
    </div>
  );
}
