// Anticipated questions — display copy.
//
// The DB and the agent's system prompt keep the English canonical `topic`
// ("Axel — reason for leaving"), exactly like coverage-nodes.ts. The UI must not
// show that string to a Spanish, Italian or Portuguese user, so structural gaps
// travel with `params` and the question is rendered here from the translation
// table instead.
//
// Nothing in this file authors an ANSWER — it only phrases the question and the
// reason a recruiter asks it.

import type { PlatformStrings } from '@/context/platform-i18n';
import type { ProposedGap } from '@/lib/anticipated';

// The question the trainer speaks, for a freshly proposed gap.
export function gapQuestion(gap: ProposedGap, t: PlatformStrings): string {
  const p = gap.params;
  if (p?.company) {
    if (gap.kind === 'short_tenure')    return t.ant_q_short_tenure(p.company);
    if (gap.kind === 'departure_reason') return t.ant_q_departure(p.company);
    if (gap.kind === 'employment_gap' && p.company2) return t.ant_q_gap(p.company, p.company2);
  }
  // Pivot gaps are model prose, already written in the UI language by /detect.
  return gap.topic;
}

// Why a recruiter asks it. Same fallback rule.
export function gapRationale(gap: ProposedGap, t: PlatformStrings): string {
  const p = gap.params;
  if (p?.company) {
    if (gap.kind === 'short_tenure' && p.role && typeof p.months === 'number') {
      return t.ant_why_short_tenure(p.company, p.role, p.months);
    }
    if (gap.kind === 'departure_reason') return t.ant_why_departure(p.company);
    if (gap.kind === 'employment_gap' && p.company2 && typeof p.months === 'number') {
      return t.ant_why_gap(p.company, p.company2, p.months);
    }
  }
  return gap.rationale;
}

// Stored rows only carry the canonical English topic — there is no `params` column
// and adding one would need a migration. The topics are strings THIS codebase
// generated, so re-deriving the question from them is reliable; anything that
// doesn't match (older or hand-written topics) falls back to the raw string.
const GAP_TOPIC = /^gap between (.+?) and (.+?)$/i;

export function topicQuestion(topic: string, t: PlatformStrings): string {
  const gapMatch = topic.match(GAP_TOPIC);
  if (gapMatch) return t.ant_q_gap(gapMatch[1].trim(), gapMatch[2].trim());

  // Split on the LAST em dash: company names legitimately contain hyphens and
  // dashes ("Soho House and Co. - Redchurch Townhouse"), the separator we emit is
  // always the em dash, and it is always the last one.
  const sep = topic.lastIndexOf('—');
  if (sep > 0) {
    const company = topic.slice(0, sep).trim();
    const suffix  = topic.slice(sep + 1).toLowerCase();
    if (/short tenure/.test(suffix))            return t.ant_q_short_tenure(company);
    if (/leav|depart|resign|exit/.test(suffix)) return t.ant_q_departure(company);
  }
  return topic;
}
