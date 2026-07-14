// ─────────────────────────────────────────────────────────────────────────────
// Coverage Nodes — single source of truth for the 12-node coverage map.
//
// Dependency direction: this file imports NOTHING from candidate-prompt.ts.
// candidate-prompt.ts imports FROM this file. No circular dependency.
//
// The CoverageInput interface is a structural subset of CandidateTrainingData —
// intentionally kept minimal to avoid coupling to candidate-prompt's internals.
// ─────────────────────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────────────────────

export type NodeState = 'dark' | 'weak' | 'solid' | 'verified';

export type NodeScore = 0 | 1 | 2 | 3;

export type PublishLevel = 'unpublished' | 'basic' | 'solid' | 'sharp';

export type CoverageCluster =
  | 'track_record'
  | 'judgement'
  | 'motivation'
  | 'logistics';

export type CoverageNodeKey =
  | 'role_history'
  | 'signature_stories'
  | 'metrics_impact'
  | 'tools_systems'
  | 'failure_modes'
  | 'conflict_disagreement'
  | 'decision_style'
  | 'limits_gaps'
  | 'career_narrative'
  | 'company_fit'
  | 'constraints'
  | 'compensation';

export interface CoverageNodeConfig {
  key: CoverageNodeKey;
  label: string;
  cluster: CoverageCluster;
  description: string;
  darkRefusal: string;
}

export interface CoverageNodeRow {
  key: CoverageNodeKey;
  state: NodeState;
  score: NodeScore;
  evidenceIds: string[];
}

export interface CoverageResult {
  nodes: Record<CoverageNodeKey, CoverageNodeRow>;
  readiness: number;
  publishLevel: PublishLevel;
}

// ── Input interface ───────────────────────────────────────────────────────────
// Structural subset — NOT imported from candidate-prompt.ts (no circular dep).

export interface CoverageInput {
  cvData: {
    work_history?: Array<{ company: string; role: string; start_date?: string; end_date?: string; description?: string }>;
    skills?: string[];
  } | null;
  stories: Array<{
    id?: string;
    story_type: string;
    situation: string | null;
    task: string | null;
    action: string | null;
    result: string | null;
  }>;
  responses: Array<{
    id?: string;
    module: string;
    question: string;
    answer_text: string | null;
    answer_audio_transcript: string | null;
  }>;
  context: {
    career_narrative?: string;
    [key: string]: unknown;
  } | null;
  profile: {
    career_goal: string | null;
  };
  rawDataSourceTypes: string[];
  // Facts confirmed during trainer conversations (persisted in evidence_items).
  // Union'd with the legacy-derived state per node — never downgrades it.
  evidenceItems: Array<{ node_key: string; quality: EvidenceQuality }>;
}

// ── Node taxonomy — single source of truth ────────────────────────────────────

export const COVERAGE_NODES: CoverageNodeConfig[] = [
  // ── Track record ─────────────────────────────────────────────────
  {
    key: 'role_history',
    cluster: 'track_record',
    label: 'Role history',
    description: 'Work history, tenures, and progression from CV',
    darkRefusal: "I haven't uploaded my CV yet, so I can't speak to specific dates or company names right now.",
  },
  {
    key: 'signature_stories',
    cluster: 'track_record',
    label: 'Signature stories',
    description: 'STAR behavioral examples across story types',
    darkRefusal: "I haven't added behavioral examples to my profile yet — happy to discuss one directly.",
  },
  {
    key: 'metrics_impact',
    cluster: 'track_record',
    label: 'Metrics & impact',
    description: 'Quantified results and verified professional artefacts',
    darkRefusal: "I don't have specific metrics captured in my profile yet — happy to speak to the impact qualitatively.",
  },
  {
    key: 'tools_systems',
    cluster: 'track_record',
    label: 'Tools & systems',
    description: 'Technical tools, platforms, and systems from CV',
    darkRefusal: "My specific tools and systems aren't captured in my profile yet.",
  },
  // ── Judgement ─────────────────────────────────────────────────────
  {
    key: 'failure_modes',
    cluster: 'judgement',
    label: 'Failure modes',
    description: 'Biggest failure and lesson-learned stories',
    darkRefusal: "I haven't added a failure or lesson-learned example to my profile yet — happy to discuss one directly.",
  },
  {
    key: 'conflict_disagreement',
    cluster: 'judgement',
    label: 'Conflict & disagreement',
    description: 'How I handle conflict and stakeholder disagreement',
    darkRefusal: "I don't have a conflict or disagreement story captured yet.",
  },
  {
    key: 'decision_style',
    cluster: 'judgement',
    label: 'Decision style',
    description: 'Communication style self-assessment responses',
    darkRefusal: "My communication and decision-making style responses aren't in my profile yet.",
  },
  {
    key: 'limits_gaps',
    cluster: 'judgement',
    label: 'Limits & gaps',
    description: 'Recruiter challenge question responses — honest self-awareness',
    darkRefusal: "I haven't recorded my responses to challenge questions yet.",
  },
  // ── Motivation ────────────────────────────────────────────────────
  {
    key: 'career_narrative',
    cluster: 'motivation',
    label: 'Career narrative',
    description: '"Tell me about yourself" answer and career goal',
    darkRefusal: "I haven't set up my career narrative yet — happy to walk you through it directly.",
  },
  {
    key: 'company_fit',
    cluster: 'motivation',
    label: 'Company fit',
    description: 'Career goals and interview readiness responses',
    darkRefusal: "I haven't articulated my specific company fit criteria in detail yet.",
  },
  // ── Logistics ─────────────────────────────────────────────────────
  {
    key: 'constraints',
    cluster: 'logistics',
    label: 'Constraints',
    description: 'Location, availability, visa, notice period — no collection mechanism yet',
    darkRefusal: "My availability and constraints are a conversation I'd prefer to have directly.",
  },
  {
    key: 'compensation',
    cluster: 'logistics',
    label: 'Compensation',
    description: 'Salary expectations — no collection mechanism yet',
    darkRefusal: "Compensation expectations are something I'd prefer to discuss directly.",
  },
];

export const COVERAGE_NODE_MAP = new Map(
  COVERAGE_NODES.map(n => [n.key, n])
);

// Publish thresholds (config constant — not magic numbers)
export const PUBLISH_THRESHOLDS = {
  basic: 30,
  solid: 55,
  sharp: 80,
} as const;

// Cluster weights for readiness formula
const CLUSTER_WEIGHTS: Record<CoverageCluster, number> = {
  track_record: 0.40,
  judgement:    0.30,
  motivation:   0.20,
  logistics:    0.10,
};

// ── State → score mapping ─────────────────────────────────────────────────────

export function stateToScore(state: NodeState): NodeScore {
  const map: Record<NodeState, NodeScore> = {
    dark: 0, weak: 1, solid: 2, verified: 3,
  };
  return map[state];
}

// ── Individual node derivation ────────────────────────────────────────────────

function hasAnswer(r: { answer_text: string | null; answer_audio_transcript: string | null }): boolean {
  return !!(r.answer_text?.trim() || r.answer_audio_transcript?.trim());
}

function starFieldCount(s: { situation: string | null; task: string | null; action: string | null; result: string | null }): number {
  return [s.situation, s.task, s.action, s.result].filter(Boolean).length;
}

function deriveRoleHistory(input: CoverageInput): NodeState {
  const wh = input.cvData?.work_history ?? [];
  if (!input.cvData) return 'dark';
  if (wh.length === 0) return 'weak';
  if (wh.length >= 4) return 'verified';
  return 'solid';
}

function deriveSignatureStories(input: CoverageInput): NodeState {
  const filled = input.stories.filter(s => starFieldCount(s) >= 1);
  if (filled.length === 0) return 'dark';
  if (filled.length === 1) return 'weak';
  const complete = filled.filter(s => starFieldCount(s) === 4);
  if (complete.length >= 3) return 'verified';
  const nearComplete = filled.filter(s => starFieldCount(s) >= 3);
  if (nearComplete.length >= 2) return 'solid';
  return 'weak';
}

function deriveMetricsImpact(input: CoverageInput): NodeState {
  const withResult = input.stories.filter(s => s.result?.trim());
  if (withResult.length === 0) return 'dark';
  if (withResult.length === 1) return 'weak';
  const hasArtifact = input.rawDataSourceTypes.includes('professional_artifact');
  if (withResult.length >= 2 && hasArtifact) return 'verified';
  if (withResult.length >= 2) return 'solid';
  return 'weak';
}

function deriveToolsSystems(input: CoverageInput): NodeState {
  const skills = input.cvData?.skills ?? [];
  if (!input.cvData) return 'dark';
  if (skills.length === 0) return 'weak';
  if (skills.length >= 6) return 'verified';
  if (skills.length >= 3) return 'solid';
  return 'weak';
}

function deriveFailureModes(input: CoverageInput): NodeState {
  const targets = ['biggest_failure', 'lesson_learned'];
  const found = input.stories.filter(s => targets.includes(s.story_type));
  if (found.length === 0) return 'dark';
  const complete = found.filter(s => starFieldCount(s) === 4);
  if (complete.length >= 2) return 'verified';
  const solid = found.filter(s => starFieldCount(s) >= 3);
  if (solid.length >= 1) return 'solid';
  return 'weak';
}

function deriveConflictDisagreement(input: CoverageInput): NodeState {
  const targets = ['conflict', 'stakeholder_disagreement'];
  const found = input.stories.filter(s => targets.includes(s.story_type));
  if (found.length === 0) return 'dark';
  const complete = found.filter(s => starFieldCount(s) === 4);
  if (complete.length >= 2) return 'verified';
  if (found.filter(s => starFieldCount(s) >= 3).length >= 1) return 'solid';
  return 'weak';
}

function deriveDecisionStyle(input: CoverageInput): NodeState {
  const answered = input.responses.filter(r => r.module === 'communication_style' && hasAnswer(r));
  if (answered.length === 0) return 'dark';
  if (answered.length >= 4) return 'verified';
  if (answered.length >= 2) return 'solid';
  return 'weak';
}

function deriveLimitsGaps(input: CoverageInput): NodeState {
  const answered = input.responses.filter(r => r.module === 'recruiter_challenge' && hasAnswer(r));
  if (answered.length === 0) return 'dark';
  if (answered.length >= 5) return 'verified';
  if (answered.length >= 2) return 'solid';
  return 'weak';
}

function deriveCareerNarrative(input: CoverageInput): NodeState {
  const hasGoal = !!input.profile.career_goal?.trim();
  const narrativeFromContext = input.context?.career_narrative?.trim();
  const narrativeFromResponses = input.responses.find(
    r => r.module === 'real_interview' && r.question === 'Tell me about yourself.' && hasAnswer(r)
  );
  const hasNarrative = !!(narrativeFromContext || narrativeFromResponses);

  if (!hasGoal && !hasNarrative) return 'dark';
  if (hasGoal !== hasNarrative) return 'weak'; // only one of two
  if (narrativeFromContext) return 'verified'; // polished narrative saved
  return 'solid';
}

function deriveCompanyFit(input: CoverageInput): NodeState {
  const hasGoal = !!input.profile.career_goal?.trim();
  const readinessAnswers = input.responses.filter(
    r => r.module === 'interview_readiness' && hasAnswer(r)
  );

  if (!hasGoal && readinessAnswers.length === 0) return 'dark';
  if (!hasGoal || readinessAnswers.length === 0) return 'weak';
  if (readinessAnswers.length >= 5) return 'verified';
  if (readinessAnswers.length >= 2) return 'solid';
  return 'weak';
}

// constraints & compensation have no legacy journey collection mechanism, so the
// legacy signal is always dark. They are NO LONGER hardcoded permanently dark —
// conversational evidence can now light them, via the union in deriveNodeStates.
function deriveNoLegacyData(): NodeState { return 'dark'; }

// ── Public API ────────────────────────────────────────────────────────────────

const DERIVERS: Record<CoverageNodeKey, (input: CoverageInput) => NodeState> = {
  role_history:           deriveRoleHistory,
  signature_stories:      deriveSignatureStories,
  metrics_impact:         deriveMetricsImpact,
  tools_systems:          deriveToolsSystems,
  failure_modes:          deriveFailureModes,
  conflict_disagreement:  deriveConflictDisagreement,
  decision_style:         deriveDecisionStyle,
  limits_gaps:            deriveLimitsGaps,
  career_narrative:       deriveCareerNarrative,
  company_fit:            deriveCompanyFit,
  constraints:            deriveNoLegacyData,
  compensation:           deriveNoLegacyData,
};

// Best (highest) state implied by conversational evidence for a single node.
// verified → verified, solid → solid, vague/missing_detail → weak, none → dark.
function evidenceStateForNode(
  evidenceItems: CoverageInput['evidenceItems'],
  nodeKey: CoverageNodeKey
): NodeState {
  let best: NodeState = 'dark';
  for (const item of evidenceItems) {
    if (item.node_key !== nodeKey) continue;
    const implied = QUALITY_TO_STATE[item.quality];
    if (STATE_ORDER.indexOf(implied) > STATE_ORDER.indexOf(best)) best = implied;
  }
  return best;
}

// Higher of two states (never downgrades).
function maxState(a: NodeState, b: NodeState): NodeState {
  return STATE_ORDER.indexOf(b) > STATE_ORDER.indexOf(a) ? b : a;
}

export function deriveNodeStates(
  input: CoverageInput
): Record<CoverageNodeKey, NodeState> {
  const evidenceItems = input.evidenceItems ?? [];
  const result = {} as Record<CoverageNodeKey, NodeState>;
  for (const node of COVERAGE_NODES) {
    // Union: the HIGHER of the legacy journey state and the evidence state.
    // A node that is solid from the journey never drops to weak because a vague
    // conversational fragment arrived.
    const legacyState   = DERIVERS[node.key](input);
    const evidenceState = evidenceStateForNode(evidenceItems, node.key);
    result[node.key]    = maxState(legacyState, evidenceState);
  }
  return result;
}

export function computeReadiness(states: Record<CoverageNodeKey, NodeState>): number {
  const clusters = ['track_record', 'judgement', 'motivation', 'logistics'] as CoverageCluster[];

  let total = 0;
  for (const cluster of clusters) {
    const clusterNodes = COVERAGE_NODES.filter(n => n.cluster === cluster);
    const maxScore = clusterNodes.length * 3;
    const actualScore = clusterNodes.reduce(
      (sum, n) => sum + stateToScore(states[n.key]),
      0
    );
    total += (actualScore / maxScore) * CLUSTER_WEIGHTS[cluster] * 100;
  }

  return Math.round(total);
}

export function derivePublishLevel(readiness: number): PublishLevel {
  if (readiness >= PUBLISH_THRESHOLDS.sharp) return 'sharp';
  if (readiness >= PUBLISH_THRESHOLDS.solid) return 'solid';
  if (readiness >= PUBLISH_THRESHOLDS.basic) return 'basic';
  return 'unpublished';
}

export function computeCoverage(input: CoverageInput): CoverageResult {
  const states = deriveNodeStates(input);
  const readiness = computeReadiness(states);
  const publishLevel = derivePublishLevel(readiness);

  const nodes = {} as Record<CoverageNodeKey, CoverageNodeRow>;
  for (const node of COVERAGE_NODES) {
    const state = states[node.key];
    nodes[node.key] = {
      key: node.key,
      state,
      score: stateToScore(state),
      evidenceIds: [],
    };
  }

  return { nodes, readiness, publishLevel };
}

// ── Evidence quality types ────────────────────────────────────────────────────
// Per-item quality from Haiku extraction pass — NOT the aggregate EQS (0-100).

export type EvidenceQuality = 'verified' | 'solid' | 'vague' | 'missing_detail';

export interface EvidenceItem {
  id: string;
  nodeKey: CoverageNodeKey;
  content: string;              // extracted claim, verbatim or very close
  quality: EvidenceQuality;
  followUpQuestion?: string;    // populated for vague / missing_detail
  followUpSent?: boolean;       // true once injected into conversation
  persisted?: boolean;          // false → extracted but DB insert failed (show "not saved")
}

// Quality → node state upgrade mapping.
// "vague" and "missing_detail" only raise dark→weak (topic surfaced, not substantiated).
const QUALITY_TO_STATE: Record<EvidenceQuality, NodeState> = {
  verified:       'verified',
  solid:          'solid',
  vague:          'weak',
  missing_detail: 'weak',
};

const STATE_ORDER: NodeState[] = ['dark', 'weak', 'solid', 'verified'];

// Apply a single evidence item to current node states.
// Monotonically upgrades — never downgrades.
export function applyEvidenceToNodeState(
  currentStates: Record<CoverageNodeKey, NodeState>,
  nodeKey: CoverageNodeKey,
  quality: EvidenceQuality
): Record<CoverageNodeKey, NodeState> {
  const current     = currentStates[nodeKey];
  const proposed    = QUALITY_TO_STATE[quality];
  const currentIdx  = STATE_ORDER.indexOf(current);
  const proposedIdx = STATE_ORDER.indexOf(proposed);
  if (proposedIdx <= currentIdx) return currentStates;
  return { ...currentStates, [nodeKey]: proposed };
}

// ── System prompt section ─────────────────────────────────────────────────────
// Dark nodes produce explicit decline instructions — replacing hand-curated
// HARD_STOP_LIST from v2 with a data-driven mechanism.

export function buildCoverageMapSection(
  states: Record<CoverageNodeKey, NodeState>
): string {
  const darkNodes = COVERAGE_NODES.filter(n => states[n.key] === 'dark');

  if (darkNodes.length === 0) {
    return `## [COVERAGE_MAP]\n\nAll coverage nodes have some evidence. Use the training data above freely.`;
  }

  const refusals = darkNodes
    .map(n => `- ${n.label}: "${n.darkRefusal}"`)
    .join('\n');

  const readiness = computeReadiness(states);
  const publishLevel = derivePublishLevel(readiness);

  return `## [COVERAGE_MAP]

Readiness: ${readiness}/100 — Publish level: ${publishLevel.toUpperCase()}

The following topics have NO evidence in this candidate's profile. When these topics arise, use the exact refusal phrase provided — do not improvise, do not guess, do not construct plausible-sounding answers.

${refusals}

For all other topics (non-dark nodes), draw from the training data above freely and honestly.`;
}
