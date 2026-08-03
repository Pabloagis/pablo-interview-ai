'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PlatformStrings } from '@/context/platform-i18n';
import type { CoverageNodeKey } from '@/lib/coverage-nodes';
import type { ChatTopic } from './AgentChatSurface';

// Suggested questions, built from the same twelve coverage nodes the candidate
// trains against, using the translations already in platform-i18n. The strip is
// therefore an honest map of what the agent was built to cover, and it needs no
// separate string table to keep in sync with the trainer.

const TOPIC_KEYS: CoverageNodeKey[] = [
  'career_narrative', 'metrics_impact', 'failure_modes',
  'role_history', 'limits_gaps', 'conflict_disagreement',
  'decision_style', 'tools_systems', 'company_fit',
  'constraints', 'compensation', 'signature_stories',
];

export function buildTopics(t: PlatformStrings): ChatTopic[] {
  const out: ChatTopic[] = [];
  for (const key of TOPIC_KEYS) {
    const node = t.nodes[key];
    // The node question lists mix complete questions with templates a recruiter
    // is expected to fill in ("Are you familiar with [tool]?") and openers that
    // trail off ("Tell me about a time you…"). Only a complete one can be sent
    // by a single click, so anything else is skipped.
    const q = node.questions.find(s => !s.includes('[') && !s.includes('…') && !s.includes('...'));
    if (q) out.push({ label: node.label, question: q });
  }
  return out;
}

// Openers are exclusively classic interview-opening questions from career_narrative,
// not a random slice of coverage topics. Using the question as the label keeps
// React keys unique without needing a separate ID field.
function buildOpeners(t: PlatformStrings): ChatTopic[] {
  const node = t.nodes.career_narrative;
  return node.questions
    .filter(q => !q.includes('[') && !q.includes('…') && !q.includes('...'))
    .map(q => ({ label: q, question: q }));
}

function pickRandom<T>(pool: T[], n: number): T[] {
  return [...pool].sort(() => Math.random() - 0.5).slice(0, n);
}

export function useSuggestedTopics(t: PlatformStrings, count = 3) {
  const [suggestions, setSuggestions] = useState<ChatTopic[]>([]);
  const usedRef = useRef<Set<string>>(new Set());

  const refresh = useCallback(() => {
    const next = pickRandom(buildTopics(t), count);
    usedRef.current = new Set(next.map(tp => tp.label));
    setSuggestions(next);
  }, [t, count]);

  // Rebuilt when the language changes, so the chips are never left behind in the
  // previous language.
  useEffect(() => { refresh(); }, [refresh]);

  // A used chip is replaced by one that has not been shown yet, so working
  // through the strip walks the whole coverage map instead of looping.
  const consume = useCallback((topic: ChatTopic) => {
    const pool = buildTopics(t);
    usedRef.current.add(topic.label);
    const unused = pool.filter(tp => !usedRef.current.has(tp.label));
    const replacement = unused.length > 0 ? pickRandom(unused, 1) : [];
    replacement.forEach(tp => usedRef.current.add(tp.label));
    setSuggestions(prev => [...prev.filter(s => s.label !== topic.label), ...replacement]);
  }, [t]);

  return { suggestions, consume, refresh, openers: buildOpeners(t) };
}
