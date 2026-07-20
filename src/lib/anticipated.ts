// ─────────────────────────────────────────────────────────────────────────────
// Anticipated-questions gap detection.
//
// LOAD-BEARING RULE: the AI detects the gap and asks the QUESTION. The user
// supplies the FACT. Nothing in this module ever authors an answer. The proposed
// gap shape has no answer field by construction, and the Haiku pass is instructed
// to emit questions + rationale only, with any answer-like content stripped.
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkHistoryEntry {
  company: string;
  role: string;
  start_date: string;
  end_date: string;
  description?: string;
}

export interface ProposedGap {
  topic: string;         // short label, e.g. "Axel Hotel Barcelona — short tenure"
  rationale: string;     // why a recruiter will ask — NEVER an answer
  trigger_hint: string;  // when it applies
  kind: 'short_tenure' | 'employment_gap' | 'departure_reason' | 'pivot';
}

// ── Lenient CV date parsing → absolute month index (year*12 + month) ───────────
const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9,
  september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

// Returns absolute months, or null if unparseable. "present"/"current" → null (ongoing).
export function parseCvDate(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();
  if (/present|current|now|ongoing/.test(s)) return null;
  const yearMatch = s.match(/\b(19|20)\d{2}\b/);
  if (!yearMatch) return null;
  const year = parseInt(yearMatch[0], 10);
  let month: number | null = null;
  for (const [name, m] of Object.entries(MONTHS)) {
    if (new RegExp(`\\b${name}\\b`).test(s)) { month = m; break; }
  }
  if (month === null) {
    if (/early/.test(s)) month = 2;
    else if (/mid/.test(s)) month = 6;
    else if (/late|end of/.test(s)) month = 11;
    else month = 6; // bare year → mid-year estimate
  }
  return year * 12 + month;
}

const SHORT_TENURE_MONTHS = 6;
const GAP_MONTHS = 3;

// Deterministic structural gaps from CV dates. Fully mechanical — no invention.
export function computeStructuralGaps(workHistory: WorkHistoryEntry[]): ProposedGap[] {
  const gaps: ProposedGap[] = [];

  // Sort chronologically by start date (ascending); unparseable dates go last.
  const jobs = [...workHistory]
    .map(j => ({ j, start: parseCvDate(j.start_date), end: parseCvDate(j.end_date) }))
    .sort((a, b) => (a.start ?? Infinity) - (b.start ?? Infinity));

  for (const { j, start, end } of jobs) {
    // Short tenure — needs both dates and a real (non-ongoing) end.
    if (start !== null && end !== null && end - start < SHORT_TENURE_MONTHS && end - start >= 0) {
      const months = end - start;
      gaps.push({
        kind: 'short_tenure',
        topic: `${j.company} — short tenure`,
        rationale: `Your ${j.role} role at ${j.company} lasted about ${months} month${months === 1 ? '' : 's'}. A recruiter will ask why it was short — a gap like this reads as a red flag unless you own the reason.`,
        trigger_hint: `asked why the ${j.company} role was short`,
      });
    }
    // Departure reason — every past (non-ongoing) role invites "why did you leave?"
    if (end !== null) {
      gaps.push({
        kind: 'departure_reason',
        topic: `${j.company} — reason for leaving`,
        rationale: `Recruiters routinely ask why you left ${j.company}. If you don't have a grounded answer, the agent will either decline or (worse) improvise one.`,
        trigger_hint: `asked why you left ${j.company}`,
      });
    }
  }

  // Employment gaps between consecutive roles.
  for (let i = 0; i < jobs.length - 1; i++) {
    const prevEnd = jobs[i].end;
    const nextStart = jobs[i + 1].start;
    if (prevEnd !== null && nextStart !== null && nextStart - prevEnd > GAP_MONTHS) {
      const months = nextStart - prevEnd;
      gaps.push({
        kind: 'employment_gap',
        topic: `Gap between ${jobs[i].j.company} and ${jobs[i + 1].j.company}`,
        rationale: `There's roughly a ${months}-month gap between leaving ${jobs[i].j.company} and starting ${jobs[i + 1].j.company}. Recruiters probe gaps; a clear account of what you were doing defuses it.`,
        trigger_hint: `asked about the gap between ${jobs[i].j.company} and ${jobs[i + 1].j.company}`,
      });
    }
  }

  return gaps;
}

// ── Haiku prompt strings (single source of truth; imported by routes + eval) ──

// Pivot detector: QUESTIONS ONLY. The load-bearing rule made literal.
export const PIVOT_PROMPT = `You spot CAREER PIVOTS a recruiter will question — an industry change, a function change (e.g. operations → sales/tech), or a level change that looks unusual.

You output QUESTIONS and RATIONALES ONLY. You are STRICTLY FORBIDDEN from:
- drafting an example answer,
- suggesting what the candidate "probably" did or felt,
- filling in any plausible reason or fact about their experience.
You do not know why they made any move. Never write the candidate's answer. If you catch yourself about to state a fact about their experience, stop — output only the question a recruiter would ask and why they would ask it.

Given the work history, identify at most 3 genuine pivots. Return ONLY valid JSON, no markdown:
{"gaps":[{"topic":"<short label>","rationale":"<why a recruiter asks — no answer>","trigger_hint":"<when it applies>"}]}
Return {"gaps":[]} if there are no clear pivots.`;

// Answer quality assessor: judges the user's answer, never rewrites or invents it.
export const ASSESS_PROMPT = `You assess whether a candidate's answer to an anticipated interview question is SUBSTANTIATED enough to put in front of a recruiter. You judge the answer as written — you do NOT rewrite, improve, or add to it.

Quality tiers:
- "verified": specific and concrete — names, dates, systems, outcomes the candidate could defend.
- "solid": concrete and specific, though not every detail is independently verifiable.
- "vague": a general claim with no supporting specifics.
- "missing_detail": dodges the question or cannot substantiate it.

If the tier is "vague" or "missing_detail", write ONE targeted follow-up question asking for the specific missing detail. Never draft or suggest an answer. Never invent content.

Return ONLY valid JSON, no markdown:
{"quality":"verified|solid|vague|missing_detail","followUpQuestion":"<question or null>"}`;

// De-duplicate proposed gaps against topics the candidate has ALREADY answered
// (rows in anticipated_questions). Fuzzy: compares on the leading company token.
// Topics are written "<Company> — <what it's about>" (or "Gap between A and B").
// Matching on raw strings is unreliable: a stored "Axel — short tenure & departure"
// and a proposed "Axel — reason for leaving" are the SAME question in different words.
// So compare on (company, intent) instead.
type TopicKey = { company: string; intent: 'departure' | 'gap' | 'other' };

const CORP_NOISE = /\b(hotels?|and|co|the|group|ltd|limited|inc|sa|sl|bv|gmbh)\b/g;

function topicKey(topic: string): TopicKey {
  const lower = topic.toLowerCase();
  // Company is the part before the em-dash separator; "Gap between …" has none.
  const head = lower.split('—')[0];
  const company = head.replace(CORP_NOISE, ' ').replace(/[^a-z0-9]+/g, '');

  // "Why did the role end?" is one question however it is phrased — short tenure and
  // reason-for-leaving collapse to the same intent so we never ask it twice.
  const intent: TopicKey['intent'] =
    /\bgap\b|between/.test(lower)                                  ? 'gap'
    : /leav|depart|exit|resign|left|short tenure|tenure|ended/.test(lower) ? 'departure'
    : 'other';

  return { company, intent };
}

function sameTopic(a: TopicKey, b: TopicKey): boolean {
  if (a.intent !== b.intent) return false;
  if (!a.company || !b.company) return a.company === b.company;
  // One company label may be a fuller version of the other
  // ("Soho House" vs "Soho House and Co. - Redchurch Townhouse").
  return a.company === b.company || a.company.includes(b.company) || b.company.includes(a.company);
}

export function dropAlreadyAnswered(proposed: ProposedGap[], existingTopics: string[]): ProposedGap[] {
  const existing = existingTopics.map(topicKey);
  return proposed.filter(p => {
    const pk = topicKey(p.topic);
    return !existing.some(e => sameTopic(e, pk));
  });
}
