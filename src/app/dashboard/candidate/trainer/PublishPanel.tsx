'use client';

// Publish panel: the bridge between "how ready am I?" and "what gaps remain?"
//
// Three states:
//   locked     — readiness < 30 (below Basic threshold)
//   ready      — readiness >= 30, agent not yet published
//   live       — agent is published; show dark-node refusals as motivation to keep training

import {
  COVERAGE_NODES,
  PUBLISH_THRESHOLDS,
  type CoverageNodeKey,
  type NodeState,
  type PublishLevel,
} from '@/lib/coverage-nodes';

interface Props {
  readiness:    number;
  publishLevel: PublishLevel;
  nodeStates:   Record<CoverageNodeKey, NodeState>;
  publishedAt:  string | null;  // ISO string if published, null if not
  isPublishing: boolean;
  onPublish:    () => void;
  onTrainNode:  (key: CoverageNodeKey) => void;
}

// Level colours — matches TrainerShell LEVEL_COLOR
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

export default function PublishPanel({
  readiness,
  publishLevel,
  nodeStates,
  publishedAt,
  isPublishing,
  onPublish,
  onTrainNode,
}: Props) {
  const levelColor = LEVEL_COLOR[publishLevel];
  const darkNodes  = COVERAGE_NODES.filter(n => nodeStates[n.key] === 'dark');
  const isLive     = publishedAt !== null;
  const canPublish = readiness >= PUBLISH_THRESHOLDS.basic;

  // ── State 1: locked ──────────────────────────────────────────────────────────
  if (!canPublish) {
    const needed = PUBLISH_THRESHOLDS.basic - readiness;
    const pct    = Math.round((readiness / PUBLISH_THRESHOLDS.basic) * 100);

    return (
      <div className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/60">Publish agent</span>
          <span className="text-[10px] text-white/25">
            {readiness}/{PUBLISH_THRESHOLDS.basic} to Basic
          </span>
        </div>
        {/* Progress toward Basic */}
        <div className="h-1 rounded-full bg-white/[0.07] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: LEVEL_COLOR.basic }}
          />
        </div>
        <p className="text-[11px] text-white/35 leading-relaxed">
          {needed} more point{needed !== 1 ? 's' : ''} to reach Basic.
          Add your CV and two stories to get there in ~10 minutes.
        </p>
        <button
          disabled
          className="w-full py-2 rounded-lg text-xs font-semibold text-white/25 bg-white/[0.04] border border-white/[0.07] cursor-not-allowed"
        >
          Publish agent
        </button>
      </div>
    );
  }

  // ── State 2: ready (not yet published) ───────────────────────────────────────
  if (!isLive) {
    return (
      <div className="w-full rounded-xl border px-4 py-4 flex flex-col gap-3"
        style={{ borderColor: `${levelColor}30`, background: `${levelColor}08` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white/80">Ready to publish</span>
          <LevelBadge publishLevel={publishLevel} />
        </div>
        <p className="text-[11px] text-white/45 leading-relaxed">
          Recruiters will see you in the candidate directory.
          {darkNodes.length > 0
            ? ` ${darkNodes.length} dark node${darkNodes.length !== 1 ? 's' : ''} will cause refusals — visible to any recruiter who asks.`
            : ' Your agent can answer every topic.'
          }
        </p>
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="w-full py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          style={{ background: levelColor, color: '#0d0f14' }}
        >
          {isPublishing ? 'Publishing…' : 'Publish agent'}
        </button>
      </div>
    );
  }

  // ── State 3: live ────────────────────────────────────────────────────────────
  return (
    <div className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-4 flex flex-col gap-4">
      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: levelColor, boxShadow: `0 0 6px ${levelColor}80` }}
        />
        <span className="text-xs font-semibold text-white/80">Live</span>
        <LevelBadge publishLevel={publishLevel} />
        <div className="flex-1 min-w-0" />
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="text-[10px] font-medium text-white/35 hover:text-white/70 transition-colors disabled:opacity-40"
        >
          {isPublishing ? 'Updating…' : 'Update ↑'}
        </button>
      </div>

      {/* Dark node refusal list — the argument to keep training */}
      {darkNodes.length === 0 ? (
        <p className="text-[11px] text-white/40">
          Your agent answers every topic. No refusals.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">
            What recruiters hear on dark topics
          </p>
          <div className="flex flex-col gap-2.5 mt-0.5">
            {darkNodes.map(node => (
              <RefusalRow
                key={node.key}
                label={node.label}
                refusal={node.darkRefusal}
                nodeKey={node.key}
                onTrain={onTrainNode}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function LevelBadge({ publishLevel }: { publishLevel: PublishLevel }) {
  const color = LEVEL_COLOR[publishLevel];
  if (publishLevel === 'unpublished') return null;
  return (
    <span
      className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded uppercase"
      style={{ color, background: `${color}1a` }}
    >
      {LEVEL_LABEL[publishLevel]}
    </span>
  );
}

function RefusalRow({
  label,
  refusal,
  nodeKey,
  onTrain,
}: {
  label:    string;
  refusal:  string;
  nodeKey:  CoverageNodeKey;
  onTrain:  (key: CoverageNodeKey) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold text-white/50">{label}</span>
        <button
          onClick={() => onTrain(nodeKey)}
          className="shrink-0 text-[10px] font-medium text-[#5080f0] hover:opacity-80 transition-opacity"
        >
          Train ↗
        </button>
      </div>
      <blockquote className="pl-2 border-l border-white/[0.12] text-[10px] text-white/35 leading-relaxed italic">
        "{refusal}"
      </blockquote>
    </div>
  );
}
