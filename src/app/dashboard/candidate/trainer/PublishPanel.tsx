'use client';

// Publish panel: the bridge between "how ready am I?" and "what gaps remain?"
//
// The public link lives in its own card (SlugManager, rendered by
// DashboardContent) — this panel is only about readiness and what recruiters
// hear, which is a different subject from the address you hand them.
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
import { usePlatformT, type PlatformStrings } from '@/context/platform-i18n';

const LEVEL_LABEL_KEY: Record<Exclude<PublishLevel, 'unpublished'>, keyof PlatformStrings> = {
  sharp: 'level_sharp',
  solid: 'level_solid',
  basic: 'level_basic',
};

interface Props {
  readiness:    number;
  publishLevel: PublishLevel;
  nodeStates:   Record<CoverageNodeKey, NodeState>;
  publishedAt:  string | null;  // ISO string if published, null if not
  isPublishing: boolean;
  publishFailed?: boolean;      // last publish attempt returned an error
  onPublish:    () => void;
  onTrainNode:  (key: CoverageNodeKey) => void;
}

// Level colours — matches TrainerShell LEVEL_COLOR
const LEVEL_COLOR: Record<PublishLevel, string> = {
  sharp:       '#4A9E5C', // --success
  solid:       '#5B9BF6', // --interactive
  basic:       '#999999', // --text-secondary
  unpublished: '#767676', // --text-disabled
};

export default function PublishPanel({
  readiness,
  publishLevel,
  nodeStates,
  publishedAt,
  isPublishing,
  publishFailed = false,
  onPublish,
  onTrainNode,
}: Props) {
  const t = usePlatformT();
  const levelColor = LEVEL_COLOR[publishLevel];
  const darkNodes  = COVERAGE_NODES.filter(n => nodeStates[n.key] === 'dark');
  const isLive     = publishedAt !== null;
  const canPublish = readiness >= PUBLISH_THRESHOLDS.basic;

  // ── State 1: locked ──────────────────────────────────────────────────────────
  if (!canPublish) {
    const needed = PUBLISH_THRESHOLDS.basic - readiness;
    const pct    = Math.round((readiness / PUBLISH_THRESHOLDS.basic) * 100);

    return (
      <div className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-primary)]">{t.pub_publish_agent}</span>
          <span className="font-mono text-[10px] text-[var(--text-disabled)]">
            {t.pub_to_basic(readiness, PUBLISH_THRESHOLDS.basic)}
          </span>
        </div>
        {/* Progress toward Basic */}
        <div className="h-0.5 rounded-full bg-[var(--border-visible)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: LEVEL_COLOR.basic }}
          />
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
          {t.pub_points_to_basic(needed)}
        </p>
        <button
          disabled
          className="w-full py-2 rounded-full font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--text-disabled)] bg-[var(--surface-raised)] border border-[var(--border)] cursor-not-allowed opacity-40"
        >
          {t.pub_publish_agent}
        </button>
      </div>
    );
  }

  // ── State 2: ready (not yet published) ───────────────────────────────────────
  if (!isLive) {
    return (
      <div className="w-full rounded-[var(--radius-md)] border px-4 py-4 flex flex-col gap-3"
        style={{ borderColor: `${levelColor}40`, background: `${levelColor}0a` }}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-primary)]">{t.pub_ready}</span>
          <LevelBadge publishLevel={publishLevel} />
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
          {t.pub_recruiters_see}
          {darkNodes.length > 0 ? t.pub_dark_refusals(darkNodes.length) : t.pub_answer_every}
        </p>
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="w-full py-2 rounded-full font-mono text-[12px] uppercase tracking-[0.06em] transition-colors disabled:opacity-50"
          style={{ background: 'var(--text-display)', color: 'var(--black)' }}
        >
          {isPublishing ? t.pub_publishing : t.pub_publish_agent}
        </button>
        {/* Inside the card, not a corner toast: on mobile this panel is a
            full-screen sheet, so the message has to sit where the click was. */}
        {publishFailed && !isPublishing && <PublishError />}
      </div>
    );
  }

  // ── State 3: live ────────────────────────────────────────────────────────────
  return (
    <div className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 flex flex-col gap-4">
      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: levelColor }}
        />
        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-primary)]">{t.pub_live}</span>
        <LevelBadge publishLevel={publishLevel} />
        <div className="flex-1 min-w-0" />
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40"
        >
          {isPublishing ? t.pub_updating : t.pub_update}
        </button>
      </div>

      {publishFailed && !isPublishing && <PublishError />}

      {/* Dark node refusal list — the argument to keep training */}
      {darkNodes.length === 0 ? (
        <p className="text-[11px] text-[var(--text-secondary)]">
          {t.pub_no_refusals}
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-[10px] text-[var(--text-disabled)] uppercase tracking-wider">
            {t.pub_what_recruiters_hear}
          </p>
          <div className="flex flex-col gap-2.5 mt-0.5">
            {darkNodes.map(node => (
              <RefusalRow
                key={node.key}
                label={t.nodes[node.key].label}
                refusal={t.nodes[node.key].darkRefusal}
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

function PublishError() {
  const t = usePlatformT();
  return (
    <p role="alert" className="text-[11px] text-[rgba(220,120,120,0.9)] leading-relaxed">
      {t.pub_publish_failed}
    </p>
  );
}

function LevelBadge({ publishLevel }: { publishLevel: PublishLevel }) {
  const t = usePlatformT();
  const color = LEVEL_COLOR[publishLevel];
  if (publishLevel === 'unpublished') return null;
  return (
    <span
      className="font-mono text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded"
      style={{ color, background: `${color}1a` }}
    >
      {t[LEVEL_LABEL_KEY[publishLevel]] as string}
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
  const t = usePlatformT();
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--text-secondary)]">{label}</span>
        <button
          onClick={() => onTrain(nodeKey)}
          className="shrink-0 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--interactive)] hover:opacity-80 transition-opacity"
        >
          {t.pub_train}
        </button>
      </div>
      <blockquote className="pl-2 border-l border-[var(--border-visible)] text-[10px] text-[var(--text-disabled)] leading-relaxed italic">
        "{refusal}"
      </blockquote>
    </div>
  );
}
