'use client';

import CoverageMap from './CoverageMap';
import EvidenceCard, { EvidenceCardStyles } from './EvidenceCard';
import PublishPanel from './PublishPanel';
import SlugManager from './SlugManager';
import AnticipatedQuestions, { type StoredAnticipated } from './AnticipatedQuestions';
import { usePlatformT } from '@/context/platform-i18n';
import type { ProposedGap } from '@/lib/anticipated';
import {
  COVERAGE_NODES,
  PUBLISH_THRESHOLDS,
  type CoverageNodeKey,
  type NodeState,
  type PublishLevel,
  type EvidenceItem,
} from '@/lib/coverage-nodes';

interface NodeData {
  state: NodeState;
  score: number;
}

interface Props {
  readiness: number;
  publishLevel: PublishLevel;
  nodes: Record<CoverageNodeKey, NodeData>;
  evidenceCards?: EvidenceItem[];
  newCardIds?: Set<string>;        // IDs getting the entrance animation
  onTrainNode?: (key: CoverageNodeKey) => void;
  onFollowUp?: (item: EvidenceItem) => void;
  onSupersede?: (item: EvidenceItem, replace: boolean) => void;
  // Publishing
  publishedAt?: string | null;
  isPublishing?: boolean;
  publishFailed?: boolean;
  onPublish?: () => void;
  // Anticipated questions — state lives in TrainerClient, because answering them
  // happens in the conversation and the trainer also raises them unprompted.
  anticipatedLoading?: boolean;
  anticipatedProposed?: ProposedGap[];
  anticipatedStored?: StoredAnticipated[];
  answeringTopic?: string | null;
  onAnswerAnticipated?: (gap: ProposedGap) => void;
  onRemoveAnticipated?: (item: StoredAnticipated) => void;
}

export default function DashboardContent({
  readiness,
  publishLevel,
  nodes,
  evidenceCards = [],
  newCardIds = new Set(),
  onTrainNode,
  onFollowUp,
  onSupersede,
  publishedAt = null,
  isPublishing = false,
  publishFailed = false,
  onPublish,
  anticipatedLoading = false,
  anticipatedProposed = [],
  anticipatedStored = [],
  answeringTopic = null,
  onAnswerAnticipated,
  onRemoveAnticipated,
}: Props) {
  const t = usePlatformT();
  const nodeStates = Object.fromEntries(
    Object.entries(nodes).map(([k, v]) => [k, v.state])
  ) as Record<CoverageNodeKey, NodeState>;

  return (
    <div className="flex flex-col items-center gap-6 pb-6">
      <EvidenceCardStyles />

      {/* Publish panel — between AgentCore and Coverage Map */}
      {onPublish && (
        <div className="w-full">
          <PublishPanel
            readiness={readiness}
            publishLevel={publishLevel}
            nodeStates={nodeStates}
            publishedAt={publishedAt}
            isPublishing={isPublishing}
            publishFailed={publishFailed}
            onPublish={onPublish}
            onTrainNode={onTrainNode ?? (() => {})}
          />
        </div>
      )}

      {/* Public link — its own card. Shown from the Basic threshold up, the
          point at which publishing (and so the link) becomes real. */}
      {onPublish && readiness >= PUBLISH_THRESHOLDS.basic && (
        <div className="w-full">
          <SlugManager locked={publishedAt !== null} />
        </div>
      )}

      {/* Coverage Map — 12 nodes in constellation */}
      <div className="w-full">
        <CoverageMap nodes={nodes} onTrainNode={onTrainNode} />
      </div>

      {/* Anticipated questions — AI proposes the gap, the user authors the answer
          (in the chat; this list is the way in and the record of what's done) */}
      <AnticipatedQuestions
        loading={anticipatedLoading}
        proposed={anticipatedProposed}
        stored={anticipatedStored}
        answeringTopic={answeringTopic}
        onAnswer={onAnswerAnticipated ?? (() => {})}
        onRemove={onRemoveAnticipated ?? (() => {})}
      />

      {/* Evidence log — appears as extraction runs */}
      {evidenceCards.length > 0 && (
        <div className="w-full flex flex-col gap-2">
          <p className="text-[10px] font-semibold text-[var(--text-disabled)] uppercase tracking-wider">
            {t.dash_evidence_log}
          </p>
          {evidenceCards.map(item => (
            <EvidenceCard
              key={item.id}
              item={item}
              isNew={newCardIds.has(item.id)}
              onFollowUp={onFollowUp ?? (() => {})}
              onSupersede={onSupersede}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Helper: build an all-dark node map (test / empty state) ──────────────────
export function buildEmptyNodes(): Record<CoverageNodeKey, NodeData> {
  return Object.fromEntries(
    COVERAGE_NODES.map(n => [n.key, { state: 'dark' as NodeState, score: 0 }])
  ) as Record<CoverageNodeKey, NodeData>;
}
