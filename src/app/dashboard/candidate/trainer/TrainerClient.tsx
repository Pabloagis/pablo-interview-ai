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
import ConversationPanel, {
  type TrainerMessage,
  type OnboardingAction,
  type AnticipatedOffer,
} from './ConversationPanel';
import DashboardContent from './DashboardContent';
import AgentTestOverlay from './AgentTestOverlay';
import { type StoredAnticipated } from './AnticipatedQuestions';
import { gapQuestion } from './anticipated-copy';
import type { ProposedGap } from '@/lib/anticipated';
import { useLanguage } from '@/context/LanguageContext';
import { usePlatformT, LANG_NAME } from '@/context/platform-i18n';

// ── Types ─────────────────────────────────────────────────────────────────────

// Which confirmed corrections leave a canonical record behind, and what to offer.
// Only these three nodes have a counterpart the recruiter sees directly: work
// history and the goal on the profile card. Every other node reaches recruiters
// through the agent's own answers, which [RECENT_UPDATES] already corrects.
const CANONICAL_FOLLOW_UP: Partial<Record<CoverageNodeKey, {
  messageKey: 'g_after_role_change' | 'g_after_goal_change';
  action: OnboardingAction;
}>> = {
  role_history:     { messageKey: 'g_after_role_change', action: 'role_update' },
  career_narrative: { messageKey: 'g_after_goal_change', action: 'career_goal' },
  company_fit:      { messageKey: 'g_after_goal_change', action: 'career_goal' },
};

// Reminders: the trainer may re-raise a still-unanswered PRIORITY question, but it
// is a nudge, not nagging — it waits for a few exchanges, only ever raises priority-1
// questions, stops after two per session, and never repeats one the candidate declined.
const REMINDER_AFTER_TURNS = 4;
const MAX_REMINDERS_PER_SESSION = 2;

export interface InitialTrainerData {
  candidateName: string;
  initialNodeStates: Record<CoverageNodeKey, NodeState>;
  initialReadiness: number;
  initialPublishLevel: PublishLevel;
  initialPublishedAt: string | null;
  publicSlug: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TrainerClient({
  candidateName,
  initialNodeStates,
  initialReadiness,
  initialPublishLevel,
  initialPublishedAt,
  publicSlug,
}: InitialTrainerData) {
  const { lang } = useLanguage();
  const t = usePlatformT();

  // ── Conversation state ───────────────────────────────────────────────
  const [messages,      setMessages]      = useState<TrainerMessage[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming,   setIsStreaming]   = useState(false);
  const [isExtracting,  setIsExtracting]  = useState(false);
  const [isAssessing,   setIsAssessing]   = useState(false);

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
  // A failed publish used to be console-only: the button simply stopped spinning,
  // which looks identical to never having clicked it — and the candidate walks away
  // believing a link that still 404s is live.
  const [publishFailed,  setPublishFailed]  = useState(false);

  // ── Onboarding state ─────────────────────────────────────────────────
  // Derived on the SERVER (/api/training/onboarding) and never patched optimistically:
  // an inline write and a coverage recompute are separate paths, so the client always
  // re-reads derived state before advancing a stage.
  const [stage,      setStage]      = useState<OnboardingStage | null>(null);
  const [cvLoaded,   setCvLoaded]   = useState(false);
  const [careerGoal, setCareerGoal] = useState<string | null>(null);
  const seededRef = useRef(false);   // StrictMode double-invokes effects — seed once
  // Stage messaging is decided BEFORE the state update (a setState updater runs on
  // the next render, far too late to sequence follow-up fetches off).
  const stageRef  = useRef<OnboardingStage | null>(null);

  // ── Anticipated questions ────────────────────────────────────────────
  // The list lives here, not in the panel: the panel shows it, the conversation
  // answers it, and the trainer raises it unprompted. One owner, three consumers.
  const [antLoading,  setAntLoading]  = useState(true);
  const [antProposed, setAntProposed] = useState<ProposedGap[]>([]);
  const [antStored,   setAntStored]   = useState<StoredAnticipated[]>([]);
  const [answering,   setAnswering]   = useState<AnticipatedOffer | null>(null);
  const answeringRef  = useRef<AnticipatedOffer | null>(null);   // read inside handleSend
  const declinedRef   = useRef<Set<string>>(new Set());          // "not now", this session
  const remindersRef  = useRef(0);
  const turnsRef      = useRef(0);
  const invitedRef    = useRef(false);   // the post-onboarding invitation fires once

  // What the trainer says at each onboarding stage, and which inline control it carries.
  const stagePrompt = useCallback((s: OnboardingStage, name: string): TrainerMessage | null => {
    const base = { id: crypto.randomUUID(), role: 'assistant' as const };
    switch (s) {
      case 'needs_cv':
        return { ...base, content: t.g_needs_cv(name),   action: 'cv_upload'   as OnboardingAction };
      case 'needs_career_goal':
        return { ...base, content: t.g_needs_goal(name), action: 'career_goal' as OnboardingAction };
      case 'needs_first_stories':
        return { ...base, content: t.g_needs_first_story };
      default:
        return null;   // 'trained' — no onboarding messaging at all
    }
  }, [t]);

  // ── Anticipated questions: load, ask, answer ─────────────────────────
  // Keep refs in step with state — handleSend and the reminder check run inside
  // callbacks that would otherwise close over a stale value.
  useEffect(() => { answeringRef.current = answering; }, [answering]);
  const antProposedRef = useRef<ProposedGap[]>([]);
  useEffect(() => { antProposedRef.current = antProposed; }, [antProposed]);

  // Re-runs on language change: the pivot pass writes its questions in the UI
  // language, so switching languages must re-detect rather than show stale English.
  const loadAnticipated = useCallback(async (): Promise<ProposedGap[]> => {
    try {
      const [storedRes, detectRes] = await Promise.all([
        fetch('/api/training/anticipated'),
        fetch(`/api/training/anticipated/detect?language=${encodeURIComponent(LANG_NAME[lang])}`),
      ]);
      const s = storedRes.ok ? await storedRes.json() : { items: [] };
      const d = detectRes.ok ? await detectRes.json() : { gaps: [] };
      const proposed = (d.gaps ?? []) as ProposedGap[];
      setAntStored((s.items ?? []) as StoredAnticipated[]);
      setAntProposed(proposed);
      antProposedRef.current = proposed;
      return proposed;
    } catch {
      return [];   // non-fatal — the trainer works without the list
    } finally {
      setAntLoading(false);
    }
  }, [lang]);

  useEffect(() => { void loadAnticipated(); }, [loadAnticipated]);

  const offerFromGap = useCallback((gap: ProposedGap): AnticipatedOffer => ({
    topic:        gap.topic,          // canonical English — this is what gets persisted
    trigger_hint: gap.trigger_hint,
    question:     gapQuestion(gap, t),
  }), [t]);

  // Point the composer at one question. `speak` is false when the question is
  // already on screen (the candidate accepted an offer the trainer had made).
  const startAnswering = useCallback((offer: AnticipatedOffer, speak = true) => {
    answeringRef.current = offer;
    setAnswering(offer);
    if (speak) {
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: t.ant_chat_ask(offer.question) },
      ]);
    }
  }, [t]);

  // Trainer-initiated: the invitation once onboarding completes, and later reminders.
  // Only priority-1 questions, never one already declined this session.
  const offerAnticipated = useCallback((gaps: ProposedGap[], kind: 'invite' | 'reminder'): boolean => {
    const gap = gaps.find(g => g.priority === 1 && !declinedRef.current.has(g.topic));
    if (!gap) return false;
    const offer = offerFromGap(gap);
    setMessages(prev => [
      ...prev,
      {
        id:      crypto.randomUUID(),
        role:    'assistant',
        content: kind === 'invite' ? t.ant_chat_invite(offer.question) : t.ant_chat_reminder(offer.question),
        anticipated: offer,
      },
    ]);
    return true;
  }, [offerFromGap, t]);

  // Panel row → ask it in the conversation immediately (the click IS the consent).
  const handleAnswerAnticipated = useCallback((gap: ProposedGap) => {
    startAnswering(offerFromGap(gap));
  }, [offerFromGap, startAnswering]);

  const handleAcceptAnticipated = useCallback((messageId: string, offer: AnticipatedOffer) => {
    setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, anticipatedResolved: true } : m)));
    startAnswering(offer, false);
  }, [startAnswering]);

  // "Not now" — drops it for this session only. It stays in the panel, still pending.
  const handleDeclineAnticipated = useCallback((messageId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      if (m.anticipated) declinedRef.current.add(m.anticipated.topic);
      return { ...m, anticipatedResolved: true };
    }));
  }, []);

  const handleCancelAnswering = useCallback(() => {
    if (answeringRef.current) declinedRef.current.add(answeringRef.current.topic);
    answeringRef.current = null;
    setAnswering(null);
  }, []);

  const handleRemoveAnticipated = useCallback(async (item: StoredAnticipated) => {
    await fetch(`/api/training/anticipated?id=${item.id}`, { method: 'DELETE' });
    await loadAnticipated();
  }, [loadAnticipated]);

  // The candidate's message was an ANSWER to a specific question, so it goes to the
  // assessor instead of the trainer chat: solid/verified persists verbatim, vague
  // comes back as a probe and the composer stays pointed at the same question.
  const submitAnticipatedAnswer = useCallback(async (offer: AnticipatedOffer, answer: string) => {
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: answer }]);
    setIsAssessing(true);
    try {
      const res = await fetch('/api/training/anticipated/answer', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ topic: offer.topic, trigger_hint: offer.trigger_hint, answer }),
      });
      const data = await res.json() as { stored?: boolean; followUpQuestion?: string };

      if (data.stored) {
        answeringRef.current = null;
        setAnswering(null);
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: t.ant_chat_stored },
        ]);
        await loadAnticipated();
      } else {
        setMessages(prev => [
          ...prev,
          {
            id:      crypto.randomUUID(),
            role:    'assistant',
            content: t.ant_needs_more(data.followUpQuestion ?? t.ant_default_probe),
          },
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: t.ant_error },
      ]);
    } finally {
      setIsAssessing(false);
    }
  }, [loadAnticipated, t]);

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

      const prev = stageRef.current;
      if (prev === data.stage) return;                 // no advance → no new messaging

      const next = stagePrompt(data.stage, candidateName);

      // Crossing into 'trained' for the first time this session: foundations are
      // done, so invite (don't require) a supporting document. Only on the
      // transition — a candidate who loads in already trained never sees this.
      const crossedIntoTrained = prev != null && prev !== 'trained' && data.stage === 'trained';
      const docInvite = crossedIntoTrained
        ? [{
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: t.g_doc_invite,
            action: 'document_upload' as OnboardingAction,
          }]
        : [];

      stageRef.current = data.stage;
      setStage(data.stage);
      setMessages(m => [
        ...m,
        ...(opts?.acknowledge
          ? [{ id: crypto.randomUUID(), role: 'assistant' as const, content: opts.acknowledge }]
          : []),
        ...(next ? [next] : []),
        ...docInvite,
      ]);

      // …and then the first anticipated question. Not a gate — the candidate can say
      // "not now" — but this is where it belongs: the CV is in, so the gaps in it are
      // known, and an unanswered "why did you leave?" is the next thing that breaks
      // the agent in front of a recruiter.
      if (crossedIntoTrained && !invitedRef.current) {
        const gaps = await loadAnticipated();
        invitedRef.current = offerAnticipated(gaps, 'invite');
      }
    } catch {
      /* non-fatal — the trainer still works, it just won't guide */
    }
  }, [candidateName, stagePrompt, t, loadAnticipated, offerAnticipated]);

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
        stageRef.current = data.stage;
        setStage(data.stage);
        setCvLoaded(data.hasCv);
        setNodeStates(data.nodeStates);
        setReadiness(data.readiness);
        setPublishLevel(data.publishLevel);

        if (data.stage !== 'trained') {
          const first = stagePrompt(data.stage, candidateName);
          if (first) setMessages(m => (m.length === 0 ? [first] : m));
        }

        // A trained candidate already HAS a goal, and the picker can now reopen
        // mid-conversation to revise it. Without this it would open blank and they
        // would have to re-pick everything from scratch to change one thing.
        const goalRes = await fetch('/api/training/career-goal');
        if (goalRes.ok) {
          const { career_goal } = await goalRes.json() as { career_goal: string | null };
          setCareerGoal(career_goal ?? null);
        }
      } catch { /* non-fatal */ }
    })();
  }, [candidateName, stagePrompt]);

  // Inline control callbacks — always re-read from the server, never patch locally.
  const handleCvUploaded = useCallback(async () => {
    await syncOnboarding({ acknowledge: t.g_ack_cv });
  }, [syncOnboarding, t]);

  const handleCareerGoalSaved = useCallback(async (goal?: string) => {
    if (typeof goal === 'string') setCareerGoal(goal);
    await syncOnboarding({ acknowledge: t.g_ack_goal });
  }, [syncOnboarding, t]);

  // A supporting document (reference, work sample, transcript…) landed. Documents
  // feed candidate_raw_data, which the coverage model reads — so re-derive from the
  // server rather than patching locally, same rule as every other inline write.
  const handleDocumentUploaded = useCallback(async (message?: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: message ?? t.g_doc_ack,
      },
    ]);
    await syncOnboarding();
  }, [syncOnboarding, t]);

  // A role was added straight into cv_data, bypassing a CV re-upload. cv_data feeds
  // the coverage model AND the recruiter directory, so re-derive from the server.
  const handleRoleUpdated = useCallback(async (message?: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: message ?? t.role_saved_msg,
      },
    ]);
    await syncOnboarding();
  }, [syncOnboarding, t]);

  // ── Send a candidate message ─────────────────────────────────────────
  const handleSend = useCallback(async (userText: string) => {
    if (isStreaming) return;

    // Answering a specific anticipated question? That message is not conversation —
    // it is the answer of record, and goes straight to the assessor.
    const target = answeringRef.current;
    if (target) {
      await submitAnticipatedAnswer(target, userText);
      return;
    }

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
          language: LANG_NAME[lang],   // trainer replies in the user's chosen language
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

      const { evidence, persisted, coverage, supersessions } = await extractRes.json() as {
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
        // Older facts each new item appears to contradict. A PROPOSAL — the agent
        // keeps saying both versions until the candidate answers on the card.
        supersessions?: Array<{
          supersedingId: string;
          supersedes: Array<{ id: string; content: string }>;
        }>;
      };

      // Render new evidence cards with the REAL DB ids from the server.
      if (evidence?.length) {
        const proposalsById = new Map(
          (supersessions ?? []).map(s => [s.supersedingId, s.supersedes])
        );
        const newCards: EvidenceItem[] = evidence.map(e => ({
          id:               e.id,
          nodeKey:          e.nodeKey,
          content:          e.content,
          quality:          e.quality,
          followUpQuestion: e.followUpQuestion ?? undefined,
          persisted:        persisted !== false, // false only when the insert failed
          supersedes:       proposalsById.get(e.id),
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
        await syncOnboarding({ acknowledge: t.g_ack_story });
      }
    } catch (err) {
      console.error('[TrainerClient] extraction error (non-fatal):', err);
    } finally {
      setIsExtracting(false);
    }

    // ── Reminder ────────────────────────────────────────────────────
    // A priority question left unanswered is the gap most likely to embarrass the
    // agent, so the trainer re-raises it — but only between topics (never mid-answer),
    // only after a few exchanges, and at most twice a session.
    turnsRef.current += 1;
    if (
      !answeringRef.current &&
      stageRef.current === 'trained' &&
      turnsRef.current >= REMINDER_AFTER_TURNS &&
      remindersRef.current < MAX_REMINDERS_PER_SESSION &&
      offerAnticipated(antProposedRef.current, 'reminder')
    ) {
      remindersRef.current += 1;
      turnsRef.current = 0;
    }
  }, [isStreaming, messages, nodeStates, stage, syncOnboarding, t, lang, submitAnticipatedAnswer, offerAnticipated]);

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

  // ── Retire facts a new answer replaced ───────────────────────────────
  // "Keep both" is a real answer, not a dismissal: two facts can legitimately
  // coexist, so it resolves the card locally and touches nothing on the server.
  const handleSupersede = useCallback(async (item: EvidenceItem, replace: boolean) => {
    const ids = item.supersedes?.map(s => s.id) ?? [];

    if (!replace || ids.length === 0) {
      setEvidenceCards(prev =>
        prev.map(c => c.id === item.id ? { ...c, supersedeChoice: 'kept' } : c)
      );
      return;
    }

    try {
      const res = await fetch('/api/trainer/supersede', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ supersedingId: item.id, supersededIds: ids }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const { coverage } = await res.json() as {
        retired?: number;
        coverage?: {
          nodeStates: Record<CoverageNodeKey, NodeState>;
          readiness: number;
          publishLevel: string;
        } | null;
      };

      // Retiring a fact can take a node back down — adopt the server's snapshot
      // wholesale, exactly as the extraction path does.
      if (coverage) {
        setNodeStates(coverage.nodeStates);
        setReadiness(coverage.readiness);
        setPublishLevel(coverage.publishLevel as PublishLevel);
      }

      // Drop the retired cards from the log: they no longer describe the agent.
      const retiredIds = new Set(ids);
      setEvidenceCards(prev =>
        prev
          .filter(c => !retiredIds.has(c.id))
          .map(c => c.id === item.id ? { ...c, supersedeChoice: 'replaced' } : c)
      );

      // The agent is now correct, but the CANONICAL record the recruiter directory
      // reads is not: current_role and skills come from cv_data, the goal on the
      // profile card from profiles.career_goal, and a chat correction writes neither.
      // Offer the matching control so the two stop disagreeing.
      const followUp = CANONICAL_FOLLOW_UP[item.nodeKey];
      if (followUp) {
        setMessages(prev => [
          ...prev,
          {
            id:      crypto.randomUUID(),
            role:    'assistant',
            content: t[followUp.messageKey],
            action:  followUp.action,
          },
        ]);
      }
    } catch (err) {
      // Leave the card unresolved so the choice is still offered on the next try.
      console.error('[TrainerClient] supersede failed:', err);
    }
  }, [t]);

  // ── Publish the agent ────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    setPublishFailed(false);
    try {
      const res = await fetch('/api/candidate/publish', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        console.error('[TrainerClient] publish failed:', data.error);
        setPublishFailed(true);
        return;
      }
      const data = await res.json() as { publishedAt: string };
      setPublishedAt(data.publishedAt);
    } catch (err) {
      console.error('[TrainerClient] publish error:', err);
      setPublishFailed(true);
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
      publicSlug={publicSlug}
      published={publishedAt != null}
      onTestAgent={() => setAgentTestOpen(true)}
      conversationSlot={
        <ConversationPanel
          messages={messages}
          streamingText={streamingText}
          isStreaming={isStreaming}
          isExtracting={isExtracting}
          isAssessing={isAssessing}
          onSend={handleSend}
          cvLoaded={cvLoaded}
          careerGoal={careerGoal}
          onCvUploaded={handleCvUploaded}
          onCareerGoalSaved={handleCareerGoalSaved}
          onDocumentUploaded={handleDocumentUploaded}
          onRoleUpdated={handleRoleUpdated}
          answeringQuestion={answering?.question ?? null}
          onCancelAnswering={handleCancelAnswering}
          onAcceptAnticipated={handleAcceptAnticipated}
          onDeclineAnticipated={handleDeclineAnticipated}
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
          onSupersede={handleSupersede}
          publishedAt={publishedAt}
          isPublishing={isPublishing}
          publishFailed={publishFailed}
          onPublish={handlePublish}
          anticipatedLoading={antLoading}
          anticipatedProposed={antProposed}
          anticipatedStored={antStored}
          answeringTopic={answering?.topic ?? null}
          onAnswerAnticipated={handleAnswerAnticipated}
          onRemoveAnticipated={handleRemoveAnticipated}
        />
      }
    />
    </>
  );
}
