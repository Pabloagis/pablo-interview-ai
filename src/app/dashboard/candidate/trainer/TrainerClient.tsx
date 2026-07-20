'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  COVERAGE_NODES,
  type CoverageNodeKey,
  type NodeState,
  type EvidenceItem,
  type PublishLevel,
  type OnboardingStage,
} from '@/lib/coverage-nodes';
import TrainerShell from './TrainerShell';
import ConversationPanel, { type TrainerMessage, type OnboardingAction } from './ConversationPanel';
import DashboardContent from './DashboardContent';
import AgentTestOverlay from './AgentTestOverlay';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InitialTrainerData {
  candidateName: string;
  initialNodeStates: Record<CoverageNodeKey, NodeState>;
  initialReadiness: number;
  initialPublishLevel: PublishLevel;
  initialPublishedAt: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TrainerClient({
  candidateName,
  initialNodeStates,
  initialReadiness,
  initialPublishLevel,
  initialPublishedAt,
}: InitialTrainerData) {
  // ── Conversation state ───────────────────────────────────────────────
  const [messages,      setMessages]      = useState<TrainerMessage[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming,   setIsStreaming]   = useState(false);
  const [isExtracting,  setIsExtracting]  = useState(false);

  // ── Evidence + coverage state ────────────────────────────────────────
  const [evidenceCards,  setEvidenceCards]  = useState<EvidenceItem[]>([]);
  const [newCardIds,     setNewCardIds]     = useState<Set<string>>(new Set());
  const [nodeStates,     setNodeStates]     = useState<Record<CoverageNodeKey, NodeState>>(initialNodeStates);
  const [readiness,      setReadiness]      = useState(initialReadiness);
  const [publishLevel,   setPublishLevel]   = useState<PublishLevel>(initialPublishLevel);

  // ── Agent test overlay ───────────────────────────────────────────────
  const [agentTestOpen,  setAgentTestOpen]  = useState(false);

  // ── Publish state ────────────────────────────────────────────────────
  const [publishedAt,    setPublishedAt]    = useState<string | null>(initialPublishedAt);
  const [isPublishing,   setIsPublishing]   = useState(false);

  // ── Onboarding state ─────────────────────────────────────────────────
  // Derived on the SERVER (/api/training/onboarding) and never patched optimistically:
  // an inline write and a coverage recompute are separate paths, so the client always
  // re-reads derived state before advancing a stage.
  const [stage,      setStage]      = useState<OnboardingStage | null>(null);
  const [cvLoaded,   setCvLoaded]   = useState(false);
  const [careerGoal, setCareerGoal] = useState<string | null>(null);
  const seededRef = useRef(false);   // StrictMode double-invokes effects — seed once

  // What the trainer says at each onboarding stage, and which inline control it carries.
  const stagePrompt = useCallback((s: OnboardingStage, name: string): TrainerMessage | null => {
    const base = { id: crypto.randomUUID(), role: 'assistant' as const };
    switch (s) {
      case 'needs_cv':
        return { ...base,
          content: `Hi ${name} — before we can train anything, I need your career history. Upload your CV below and I'll read it; that gives your agent dates, roles and systems to work from.`,
          action: 'cv_upload' as OnboardingAction };
      case 'needs_career_goal':
        return { ...base,
          content: `Got your CV. Now — what are you actually aiming at? Pick what fits below. Everything I ask you from here is judged against that goal.`,
          action: 'career_goal' as OnboardingAction };
      case 'needs_first_stories':
        return { ...base,
          content: `Good. Last foundational piece: I need a couple of real examples from your work — the kind a recruiter probes. Let's do the first one now. Tell me about something you actually delivered: what the situation was, what you specifically did, and how it ended.` };
      default:
        return null;   // 'trained' — no onboarding messaging at all
    }
  }, []);

  // Single source of truth for onboarding + coverage. Called on mount and after every
  // inline write. Appends the next stage's prompt when the stage actually advances.
  const syncOnboarding = useCallback(async (opts?: { acknowledge?: string }) => {
    try {
      const res = await fetch('/api/training/onboarding');
      if (!res.ok) return;
      const data = await res.json() as {
        stage: OnboardingStage;
        nodeStates: Record<CoverageNodeKey, NodeState>;
        readiness: number;
        publishLevel: PublishLevel;
        hasCv: boolean;
      };

      // Adopt server-derived coverage wholesale (same rule as the extraction loop).
      setNodeStates(data.nodeStates);
      setReadiness(data.readiness);
      setPublishLevel(data.publishLevel);
      setCvLoaded(data.hasCv);

      setStage(prev => {
        if (prev === data.stage) return prev;          // no advance → no new messaging
        const next = stagePrompt(data.stage, candidateName);
        setMessages(m => [
          ...m,
          ...(opts?.acknowledge
            ? [{ id: crypto.randomUUID(), role: 'assistant' as const, content: opts.acknowledge }]
            : []),
          ...(next ? [next] : []),
        ]);
        return data.stage;
      });
    } catch {
      /* non-fatal — the trainer still works, it just won't guide */
    }
  }, [candidateName, stagePrompt]);

  // Mount: seed the guide only for a candidate who still needs foundations.
  // A trained candidate (e.g. Pablo) gets exactly the experience they had before.
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    (async () => {
      try {
        const res = await fetch('/api/training/onboarding');
        if (!res.ok) return;
        const data = await res.json() as {
          stage: OnboardingStage;
          nodeStates: Record<CoverageNodeKey, NodeState>;
          readiness: number;
          publishLevel: PublishLevel;
          hasCv: boolean;
        };
        setStage(data.stage);
        setCvLoaded(data.hasCv);
        setNodeStates(data.nodeStates);
        setReadiness(data.readiness);
        setPublishLevel(data.publishLevel);

        if (data.stage !== 'trained') {
          const first = stagePrompt(data.stage, candidateName);
          if (first) setMessages(m => (m.length === 0 ? [first] : m));
        }
      } catch { /* non-fatal */ }
    })();
  }, [candidateName, stagePrompt]);

  // Inline control callbacks — always re-read from the server, never patch locally.
  const handleCvUploaded = useCallback(async () => {
    await syncOnboarding({ acknowledge: "CV read — I've got your roles and dates." });
  }, [syncOnboarding]);

  const handleCareerGoalSaved = useCallback(async (goal?: string) => {
    if (typeof goal === 'string') setCareerGoal(goal);
    await syncOnboarding({ acknowledge: 'Locked in.' });
  }, [syncOnboarding]);

  // ── Send a candidate message ─────────────────────────────────────────
  const handleSend = useCallback(async (userText: string) => {
    if (isStreaming) return;

    const userMsg: TrainerMessage = {
      id:      crypto.randomUUID(),
      role:    'user',
      content: userText,
    };
    const prevQuestion = messages.length > 0
      ? messages[messages.length - 1].content
      : undefined;

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsStreaming(true);
    setStreamingText('');

    // ── Stream trainer response ──────────────────────────────────────
    let assistantText = '';
    try {
      const res = await fetch('/api/trainer/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          messages:   nextMessages.map(({ role, content }) => ({ role, content })),
          nodeStates,
          onboardingStage: stage ?? undefined,
        }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6)) as
              | { type: 'content'; text: string }
              | { type: 'done' }
              | { type: 'error'; message: string };

            if (evt.type === 'content') {
              assistantText += evt.text;
              setStreamingText(assistantText);
            } else if (evt.type === 'done' || evt.type === 'error') {
              break outer;
            }
          } catch { /* malformed SSE line — skip */ }
        }
      }
    } catch (err) {
      console.error('[TrainerClient] stream error:', err);
    } finally {
      setIsStreaming(false);
      setStreamingText('');
    }

    // Commit assistant message
    if (assistantText) {
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: assistantText },
      ]);
    }

    // ── Haiku extraction pass on the CANDIDATE'S answer ─────────────
    // The SERVER persists evidence, recomputes coverage, and returns the fresh
    // node states. The client renders exactly what the server says — no local
    // guessing, so the ring can never diverge from what the agent actually does.
    if (!userText.trim()) return;
    setIsExtracting(true);
    try {
      const extractRes = await fetch('/api/trainer/extract', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          candidateMessage: userText,
          previousMessage:  prevQuestion,
        }),
      });
      if (!extractRes.ok) return;

      const { evidence, persisted, coverage } = await extractRes.json() as {
        evidence?: Array<{
          id: string;
          nodeKey: CoverageNodeKey;
          content: string;
          quality: EvidenceItem['quality'];
          followUpQuestion: string | null;
        }>;
        persisted?: boolean;
        coverage?: {
          nodeStates: Record<CoverageNodeKey, NodeState>;
          readiness: number;
          publishLevel: string;
        };
      };

      // Render new evidence cards with the REAL DB ids from the server.
      if (evidence?.length) {
        const newCards: EvidenceItem[] = evidence.map(e => ({
          id:               e.id,
          nodeKey:          e.nodeKey,
          content:          e.content,
          quality:          e.quality,
          followUpQuestion: e.followUpQuestion ?? undefined,
          persisted:        persisted !== false, // false only when the insert failed
        }));
        const newIds = new Set(newCards.map(c => c.id));

        setEvidenceCards(prev => [...newCards, ...prev]);
        setNewCardIds(newIds);
        setTimeout(() => setNewCardIds(new Set()), 600);
      }

      // Adopt the server's authoritative coverage snapshot.
      if (coverage) {
        setNodeStates(coverage.nodeStates);
        setReadiness(coverage.readiness);
        setPublishLevel(coverage.publishLevel as PublishLevel);
      }

      // A candidate still finishing onboarding may have just cleared the "first
      // stories" gate with this answer — re-derive on the server and advance if so.
      if (stage && stage !== 'trained') {
        await syncOnboarding({ acknowledge: "That's the kind of detail that holds up. Your agent can use that." });
      }
    } catch (err) {
      console.error('[TrainerClient] extraction error (non-fatal):', err);
    } finally {
      setIsExtracting(false);
    }
  }, [isStreaming, messages, nodeStates, stage, syncOnboarding]);

  // ── Follow-up: inject the probe question as a trainer message ────────
  // No API call — the question is added as an assistant turn and the
  // candidate answers it, triggering another extraction pass.
  const handleFollowUp = useCallback((item: EvidenceItem) => {
    if (!item.followUpQuestion) return;

    setMessages(prev => [
      ...prev,
      { id: crypto.randomUUID(), role: 'assistant', content: item.followUpQuestion! },
    ]);

    // Mark card as sent so the button disappears
    setEvidenceCards(prev =>
      prev.map(c => c.id === item.id ? { ...c, followUpSent: true } : c)
    );
  }, []);

  // ── Publish the agent ────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    try {
      const res = await fetch('/api/candidate/publish', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        console.error('[TrainerClient] publish failed:', data.error);
        return;
      }
      const data = await res.json() as { publishedAt: string };
      setPublishedAt(data.publishedAt);
    } catch (err) {
      console.error('[TrainerClient] publish error:', err);
    } finally {
      setIsPublishing(false);
    }
  }, [isPublishing]);

  // ── Train a node from the agent-test results ─────────────────────────
  // Closes the overlay and kicks the trainer to focus on that node.
  const handleTrainFromTest = useCallback((key: CoverageNodeKey) => {
    const node = COVERAGE_NODES.find(n => n.key === key);
    if (!node) return;
    handleSend(`I'd like to practice questions about: ${node.label}`);
  }, [handleSend]);

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <>
      {agentTestOpen && (
        <AgentTestOverlay
          onClose={() => setAgentTestOpen(false)}
          onTrainNode={handleTrainFromTest}
        />
      )}
    <TrainerShell
      readiness={readiness}
      publishLevel={publishLevel}
      candidateName={candidateName}
      onTestAgent={() => setAgentTestOpen(true)}
      conversationSlot={
        <ConversationPanel
          messages={messages}
          streamingText={streamingText}
          isStreaming={isStreaming}
          isExtracting={isExtracting}
          onSend={handleSend}
          cvLoaded={cvLoaded}
          careerGoal={careerGoal}
          onCvUploaded={handleCvUploaded}
          onCareerGoalSaved={handleCareerGoalSaved}
        />
      }
      dashboardSlot={
        <DashboardContent
          readiness={readiness}
          publishLevel={publishLevel}
          nodes={Object.fromEntries(
            COVERAGE_NODES.map(n => [n.key, { state: nodeStates[n.key], score: 0 }])
          ) as Record<CoverageNodeKey, { state: NodeState; score: number }>}
          evidenceCards={evidenceCards}
          newCardIds={newCardIds}
          onTrainNode={(key) => {
            const node = COVERAGE_NODES.find(n => n.key === key);
            if (!node) return;
            handleSend(`I'd like to practice questions about: ${node.label}`);
          }}
          onFollowUp={handleFollowUp}
          publishedAt={publishedAt}
          isPublishing={isPublishing}
          onPublish={handlePublish}
        />
      }
    />
    </>
  );
}
