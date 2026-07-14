'use client';

import { useState } from 'react';
import {
  COVERAGE_NODES,
  type CoverageNodeKey,
  type CoverageNodeConfig,
  type NodeState,
} from '@/lib/coverage-nodes';

// ── Recruiter questions per node (UI concern — kept local, not in data model) ──
const RECRUITER_QUESTIONS: Record<CoverageNodeKey, string[]> = {
  role_history:          ['Walk me through your career.', 'How long were you at [company]?', 'What does your progression look like?'],
  signature_stories:     ['Tell me about a time you…', 'Give me an example of handling [situation].', 'Walk me through a project you\'re proud of.'],
  metrics_impact:        ['What results did you drive?', 'Can you quantify that impact?', 'What improved because of your work?'],
  tools_systems:         ['What systems have you worked with?', 'Are you familiar with [tool]?', 'How do you learn a new platform quickly?'],
  failure_modes:         ['Tell me about a time you failed.', 'What\'s your biggest professional mistake?', 'Tell me about a lesson that changed how you work.'],
  conflict_disagreement: ['Tell me about a conflict with a colleague.', 'How do you handle disagreement with a manager?', 'Give me an example of managing a difficult stakeholder.'],
  decision_style:        ['How do you make decisions under pressure?', 'Describe your working style.', 'How do you prioritise when everything is urgent?'],
  limits_gaps:           ['What\'s your biggest weakness?', 'Where\'s the gap between your experience and this role?', 'Why should we pick you over someone with more direct experience?'],
  career_narrative:      ['Tell me about yourself.', 'Walk me through your background.', 'Why are you looking for this type of role?'],
  company_fit:           ['Why this company?', 'Where do you see yourself in 3 years?', 'What kind of environment do you thrive in?'],
  constraints:           ['When can you start?', 'Are you open to relocation?', 'Do you have any visa or work permit requirements?'],
  compensation:          ['What are your salary expectations?', 'What\'s your current package?', 'What range are you targeting?'],
};

// ── Node positions in SVG viewBox 0 0 360 238 ─────────────────────────────────
// Quadrant layout: Track record TL, Judgement TR, Motivation BL, Logistics BR.
// Separation: horizontal y=130, vertical x=181.
const NODE_POS: Record<CoverageNodeKey, { x: number; y: number }> = {
  // Track record (top-left)
  role_history:          { x: 44,  y: 42  },
  signature_stories:     { x: 142, y: 26  },
  metrics_impact:        { x: 158, y: 100 },
  tools_systems:         { x: 28,  y: 100 },
  // Judgement (top-right)
  failure_modes:         { x: 198, y: 30  },
  conflict_disagreement: { x: 330, y: 50  },
  decision_style:        { x: 205, y: 108 },
  limits_gaps:           { x: 328, y: 102 },
  // Motivation (bottom-left)
  career_narrative:      { x: 50,  y: 170 },
  company_fit:           { x: 155, y: 208 },
  // Logistics (bottom-right)
  constraints:           { x: 218, y: 173 },
  compensation:          { x: 322, y: 210 },
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
const NODE_VISUAL: Record<NodeState, {
  fill: string;
  stroke: string;
  strokeWidth: number;
  filterId: string | null;
  stateColor: string;
  stateLabel: string;
}> = {
  dark: {
    fill:        '#111420',
    stroke:      'rgba(255,255,255,0.13)',
    strokeWidth: 1,
    filterId:    null,
    stateColor:  'rgba(255,255,255,0.30)',
    stateLabel:  'No data',
  },
  weak: {
    fill:        'rgba(180,120,40,0.20)',
    stroke:      'rgba(210,155,60,0.65)',
    strokeWidth: 1.5,
    filterId:    'cov-glow-weak',
    stateColor:  '#c08840',
    stateLabel:  'Partial',
  },
  solid: {
    fill:        'rgba(60,100,210,0.28)',
    stroke:      'rgba(85,130,242,0.90)',
    strokeWidth: 1.5,
    filterId:    'cov-glow-solid',
    stateColor:  '#5580f0',
    stateLabel:  'Solid',
  },
  verified: {
    fill:        'rgba(45,165,95,0.28)',
    stroke:      'rgba(62,195,112,0.92)',
    strokeWidth: 2,
    filterId:    'cov-glow-verified',
    stateColor:  '#3ec870',
    stateLabel:  'Verified',
  },
};

// What the agent says for each state (non-dark — dark uses node.darkRefusal verbatim)
const AGENT_BEHAVIOR_TEXT: Record<Exclude<NodeState, 'dark'>, string> = {
  weak:     'Partial coverage — answers with caveats and limited specifics.',
  solid:    'Sufficient coverage — answers from verified data.',
  verified: 'Complete coverage — answers with specific, cited examples.',
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

const NODE_R = 8;   // visual node radius
const HIT_R  = 16;  // invisible hit area radius (touch-friendly)

// ── Component ─────────────────────────────────────────────────────────────────

export default function CoverageMap({ nodes, onTrainNode }: Props) {
  const [selected, setSelected] = useState<CoverageNodeKey | null>(null);

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

      {/* ── Constellation SVG ─────────────────────────────────────────── */}
      <svg
        viewBox="0 0 360 238"
        className="w-full"
        style={{ height: 'auto', display: 'block' }}
        aria-label="Coverage map constellation"
      >
        <defs>
          {/* Glow filters — one per lit state */}
          <filter id="cov-glow-weak" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="cov-glow-solid" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="cov-glow-verified" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── Quadrant dividers — barely visible ──────────────────────── */}
        <line x1={181} y1={4}   x2={181} y2={234} stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />
        <line x1={4}   y1={130} x2={356} y2={130} stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />

        {/* ── Cluster labels ───────────────────────────────────────────── */}
        {[
          { label: 'Track record', x: 8,   y: 10,  anchor: 'start' },
          { label: 'Judgement',    x: 352, y: 10,  anchor: 'end'   },
          { label: 'Motivation',   x: 8,   y: 140, anchor: 'start' },
          { label: 'Logistics',    x: 352, y: 140, anchor: 'end'   },
        ].map(({ label, x, y, anchor }) => (
          <text
            key={label}
            x={x} y={y}
            textAnchor={anchor as 'start' | 'end'}
            dominantBaseline="hanging"
            fill="rgba(255,255,255,0.20)"
            fontSize={8}
            fontFamily="system-ui, sans-serif"
            letterSpacing="0.08em"
            style={{ textTransform: 'uppercase', userSelect: 'none' }}
          >
            {label.toUpperCase()}
          </text>
        ))}

        {/* ── Constellation lines ──────────────────────────────────────── */}
        {CLUSTER_LINES.map(([a, b]) => {
          const pa = NODE_POS[a];
          const pb = NODE_POS[b];
          return (
            <line
              key={`${a}-${b}`}
              x1={pa.x} y1={pa.y}
              x2={pb.x} y2={pb.y}
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={0.75}
            />
          );
        })}

        {/* ── Nodes ───────────────────────────────────────────────────── */}
        {COVERAGE_NODES.map(node => {
          const { x, y } = NODE_POS[node.key];
          const data  = nodes[node.key];
          const vis   = NODE_VISUAL[data.state];
          const isSelected = selected === node.key;

          return (
            <g
              key={node.key}
              onClick={() => handleNodeClick(node.key)}
              style={{ cursor: 'pointer' }}
              role="button"
              aria-label={`${node.label} — ${vis.stateLabel}`}
              aria-pressed={isSelected}
            >
              {/* ── Selection indicator — outer ring ──────────────────── */}
              {isSelected && (
                <circle
                  cx={x} cy={y} r={NODE_R + 6}
                  fill="none"
                  stroke={vis.stateColor}
                  strokeWidth={1}
                  opacity={0.55}
                />
              )}

              {/* ── Invisible hit area for touch ──────────────────────── */}
              <circle cx={x} cy={y} r={HIT_R} fill="transparent" />

              {/* ── Node circle ───────────────────────────────────────── */}
              <circle
                cx={x} cy={y} r={NODE_R}
                fill={vis.fill}
                stroke={vis.stroke}
                strokeWidth={vis.strokeWidth}
                filter={vis.filterId ? `url(#${vis.filterId})` : undefined}
              />

              {/* ── Node label ────────────────────────────────────────── */}
              <text
                x={x} y={y + NODE_R + 10}
                textAnchor="middle"
                dominantBaseline="hanging"
                fill={data.state === 'dark' ? 'rgba(255,255,255,0.22)' : vis.stateColor}
                fontSize={7.5}
                fontFamily="system-ui, sans-serif"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ── Node detail panel ────────────────────────────────────────────── */}
      {selectedConfig && selectedData && (
        <NodePanel
          config={selectedConfig}
          data={selectedData}
          onClose={() => setSelected(null)}
          onTrain={handleTrain}
        />
      )}
    </div>
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
  const vis = NODE_VISUAL[data.state];
  const questions = RECRUITER_QUESTIONS[config.key];

  const isDark = data.state === 'dark';
  const agentText = isDark
    ? config.darkRefusal
    : AGENT_BEHAVIOR_TEXT[data.state as Exclude<NodeState, 'dark'>];

  return (
    <div className="border-t border-white/[0.07] mt-1 pt-5 flex flex-col gap-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-sm font-semibold text-white leading-none">
            {config.label}
          </span>
          <span
            className="self-start text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-sm"
            style={{
              color: vis.stateColor,
              background: `${vis.stateColor}18`,
              border: `1px solid ${vis.stateColor}28`,
            }}
          >
            {vis.stateLabel}
          </span>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 text-[rgba(255,255,255,0.30)] hover:text-white transition-colors text-lg leading-none mt-0.5"
          aria-label="Close node panel"
        >
          ×
        </button>
      </div>

      {/* ── What this node covers ───────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold text-[rgba(255,255,255,0.28)] uppercase tracking-wider mb-1.5">
          What this covers
        </p>
        <p className="text-xs text-[rgba(255,255,255,0.50)] leading-relaxed">
          {config.description}
        </p>
      </div>

      {/* ── Recruiter questions ─────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold text-[rgba(255,255,255,0.28)] uppercase tracking-wider mb-1.5">
          Unlocks answers to
        </p>
        <ul className="flex flex-col gap-1">
          {questions.map(q => (
            <li key={q} className="flex items-start gap-2">
              <span className="shrink-0 text-[rgba(255,255,255,0.18)] mt-px select-none">·</span>
              <span className="text-xs text-[rgba(255,255,255,0.45)] leading-snug">{q}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── What the agent says right now ──────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold text-[rgba(255,255,255,0.28)] uppercase tracking-wider mb-1.5">
          What the agent says right now
        </p>

        {isDark ? (
          <div className="flex flex-col gap-2">
            {/* Verbatim refusal — quoted */}
            <blockquote className="border-l-2 border-[rgba(255,255,255,0.12)] pl-3">
              <p className="text-xs text-[rgba(255,255,255,0.38)] leading-relaxed italic">
                "{agentText}"
              </p>
            </blockquote>
            <p className="text-[11px] text-[rgba(255,255,255,0.28)]">
              No data. This is what recruiters will hear.
            </p>
          </div>
        ) : (
          <p className="text-xs text-[rgba(255,255,255,0.50)] leading-relaxed">
            {agentText}
          </p>
        )}
      </div>

      {/* ── Train this button ───────────────────────────────────────────── */}
      <button
        onClick={onTrain}
        className="self-start flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
        style={{
          color: vis.stateColor,
          background: `${vis.stateColor}14`,
          border: `1px solid ${vis.stateColor}30`,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = `${vis.stateColor}22`;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = `${vis.stateColor}14`;
        }}
      >
        Train this
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
          <path d="M2 9L9 2M9 2H4M9 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

    </div>
  );
}
