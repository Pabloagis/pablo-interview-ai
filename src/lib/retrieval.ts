// ──────────────────────────────────────────────────────────────────
// RETRIEVAL LOGIC — InterviewMind v2
// Smart context loader. Detects intent and loads only relevant knowledge.
// This is what makes the system token-efficient.
// Updated: May 15, 2026
// ──────────────────────────────────────────────────────────────────

import { findRelevantStories, type Story } from './stories-knowledge';
import { detectCompany, type CompanyContext } from './companies-knowledge';

export interface RetrievalContext {
  userMessage: string;
  recruiterCompany?: string;
  conversationHistory?: string[]; // Recent messages for context
}

export interface RetrievedKnowledge {
  stories: Story[];
  company: CompanyContext | undefined;
  formattedText: string;
  tokenEstimate: number;
}

// ──────────────────────────────────────────────────────────────────
// Main retrieval function
// Called from src/app/api/chat/route.ts before building system prompt
// ──────────────────────────────────────────────────────────────────
export function retrieveKnowledge(ctx: RetrievalContext): RetrievedKnowledge {
  const { userMessage, recruiterCompany, conversationHistory = [] } = ctx;

  // Step 1: Detect company context
  // Priority: explicit recruiterCompany > company mentioned in message
  let company: CompanyContext | undefined;

  if (recruiterCompany) {
    company = detectCompany(recruiterCompany);
  }

  if (!company) {
    company = detectCompany(userMessage);
  }

  // Also check recent conversation history (last 3 messages only)
  if (!company && conversationHistory.length > 0) {
    const recentText = conversationHistory.slice(-3).join(' ');
    company = detectCompany(recentText);
  }

  // Step 2: Detect relevant stories
  const relevantStories = findRelevantStories(userMessage);

  // Limit to top 2 stories to avoid token bloat
  const topStories = relevantStories.slice(0, 2);

  // Step 3: Format retrieved content
  let formattedText = '';

  if (company) {
    formattedText += company.content + '\n\n';
  }

  if (topStories.length > 0) {
    formattedText += topStories.map((s) => s.content).join('\n\n---\n\n');
  }

  // Rough token estimate (1 token ≈ 4 chars in English)
  const tokenEstimate = Math.ceil(formattedText.length / 4);

  return {
    stories: topStories,
    company,
    formattedText,
    tokenEstimate,
  };
}

// ──────────────────────────────────────────────────────────────────
// Detect tone from recruiter behavior (used by buildSystemPrompt)
// ──────────────────────────────────────────────────────────────────
export function detectTone(
  conversationHistory: string[] = []
): 'warm' | 'formal' | 'technical' | 'commercial' {
  if (conversationHistory.length === 0) return 'warm';

  const fullText = conversationHistory.join(' ').toLowerCase();

  const technicalSignals = [
    'api', 'integration', 'architecture', 'stack', 'endpoint',
    'webhook', 'schema', 'database', 'authentication',
  ];
  if (technicalSignals.some((s) => fullText.includes(s))) return 'technical';

  const commercialSignals = [
    'quota', 'pipeline', 'target', 'revenue', 'arr', 'mrr',
    'commission', 'commercial', 'sales cycle', 'closed won',
  ];
  if (commercialSignals.some((s) => fullText.includes(s))) return 'commercial';

  const formalSignals = [
    'please describe', 'kindly', 'could you elaborate',
    'walk me through', 'specifically',
  ];
  const formalCount = formalSignals.filter((s) => fullText.includes(s)).length;
  if (formalCount >= 2) return 'formal';

  return 'warm';
}

// ──────────────────────────────────────────────────────────────────
// Debug helper — logs retrieval results in dev mode only
// ──────────────────────────────────────────────────────────────────
export function logRetrieval(retrieved: RetrievedKnowledge): void {
  if (process.env.NODE_ENV !== 'development') return;
  console.log('[Retrieval]', {
    company: retrieved.company?.name || 'none',
    stories: retrieved.stories.map((s) => s.id),
    tokenEstimate: retrieved.tokenEstimate,
  });
}
