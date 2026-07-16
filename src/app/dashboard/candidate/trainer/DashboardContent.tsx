'use client';

import AgentCore from './AgentCore';
import CoverageMap from './CoverageMap';
import EvidenceCard, { EvidenceCardStyles } from './EvidenceCard';
import PublishPanel from './PublishPanel';
import AnticipatedQuestions from './AnticipatedQuestions';
import {
  COVERAGE_NODES,
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
  // Publishing
  publishedAt?: string | null;
  isPublishing?: boolean;
  onPublish?: () => void;
}

export default function DashboardContent({
  readiness,
  publishLevel,
  nodes,
  evidenceCards = [],
  newCardIds = new Set(),
  onTrainNode,
  onFollowUp,
  publishedAt = null,
  isPublishing = false,
  onPublish,
}: Props) {
  const nodeStates = Object.fromEntries(
    Object.entries(nodes).map(([k, v]) => [k, v.state])
  ) as Record<CoverageNodeKey, NodeState>;

  return (
    <div className="flex flex-col items-center gap-8 pb-8">
      <EvidenceCardStyles />

      {/* Agent Core — centrepiece, springs on readiness increase */}
      <AgentCore readiness={readiness} publishLevel={publishLevel} size={200} />

      {/* Publish panel — between AgentCore and Coverage Map */}
      {onPublish && (
        <div className="w-full">
          <PublishPanel
            readiness={readiness}
            publishLevel={publishLevel}
            nodeStates={nodeStates}
            publishedAt={publishedAt}
            isPublishing={isPublishing}
            onPublish={onPublish}
            onTrainNode={onTrainNode ?? (() => {})}
          />
        </div>
      )}

      {/* Coverage Map — 12 nodes in constellation */}
      <div className="w-full">
        <CoverageMap nodes={nodes} onTrainNode={onTrainNode} />
      </div>

      {/* Anticipated questions — AI proposes the gap, the user authors the answer */}
      <AnticipatedQuestions />

      {/* Evidence log — appears as extraction runs */}
      {evidenceCards.length > 0 && (
        <div className="w-full flex flex-col gap-2">
          <p className="text-[10px] font-semibold text-[rgba(255,255,255,0.25)] uppercase tracking-wider">
            Evidence log
          </p>
          {evidenceCards.map(item => (
            <EvidenceCard
              key={item.id}
              item={item}
              isNew={newCardIds.has(item.id)}
              onFollowUp={onFollowUp ?? (() => {})}
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
