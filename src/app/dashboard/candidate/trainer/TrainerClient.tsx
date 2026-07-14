'use client';

import { useState, useCallback } from 'react';
import {
  COVERAGE_NODES,
  type CoverageNodeKey,
  type NodeState,
  type EvidenceItem,
  type PublishLevel,
} from '@/lib/coverage-nodes';
import TrainerShell from './TrainerShell';
import ConversationPanel, { type TrainerMessage } from './ConversationPanel';
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
    } catch (err) {
      console.error('[TrainerClient] extraction error (non-fatal):', err);
    } finally {
      setIsExtracting(false);
    }
  }, [isStreaming, messages, nodeStates]);

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
