-- ═══════════════════════════════════════════════════════════════════════════
-- Remove the stale candidate_responses rows for Pablo
--
-- These 6 rows predate the v2→v3 extraction and are rendered into the prompt as
-- [INTERVIEW_RESPONSES], under the instruction "Use these as the basis — they
-- capture voice, framing, and emphasis. Don't rewrite them."
--
-- Four of them are placeholder text, and two contain claims the loaded, verified
-- data contradicts. Leaving them in means the agent has two conflicting accounts
-- of the same career and no rule for choosing between them.
--
-- Reviewed row by row below. Delete the ones you agree with; keep any you want.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── See them in full before deciding ───────────────────────────────────────
select module, question, answer_text
from public.candidate_responses
where candidate_id = 'a838e0a4-77e5-43b2-86ac-831bfdce959d'
order by module, question;


-- ═══════════════════════════════════════════════════════════════════════════
-- WHY EACH ONE GOES
--
-- 1. "Tell me about yourself." — the most dangerous of the six. It states
--    "Most recently I was Front Office Manager at Axel Hotel Barcelona", which
--    is false: Axel ended May 2025, and HubOS (early 2026) and the ongoing
--    consulting engagement (Jun 2026–present) came after. It also says
--    "Where I'm heading is a Rooms Division role", which directly contradicts
--    profiles.career_goal (commercial: SDR → AE → Sales Manager). And it claims
--    "I speak five languages" where the verified list is six at differing levels.
--    [CAREER_NARRATIVE] already carries the correct version, so nothing is lost.
--
-- 2. "What's your biggest weakness?" → "inconsistency". One word. Not an answer;
--    a recruiter-facing agent quoting it verbatim is worse than having nothing.
--
-- 3. "Why are you looking for a new role?" → a half-typed note about lifestyle and
--    remote working ("integratee"). Genuine input, but unverified as a stated
--    constraint and ungrammatical. CLAUDE.md: vague evidence never persists.
--
-- 4. "Tell me about a time you failed." → "i failed in maintaining a long term job
--    for the past 3 years". Self-critical, and not accurate against the verified
--    record — Soho House ran ~2.5 years to Feb 2024. It also undercuts the
--    verified framing of the short tenures as deliberate steps. Actively harmful.
--
-- 5. "Your CV shows only a few months in SaaS…" → "learned a lot through
--    curiosity". Five words against a real objection. The proper answer now lives
--    in candidate_objections and anticipated_questions.
--
-- 6. "Why should we hire you over someone with more direct experience?" → "test me".
--    Placeholder.
--
-- After this, [INTERVIEW_RESPONSES] disappears from the prompt entirely. That is
-- intended: [CAREER_NARRATIVE], [STAR_STORIES], [ANTICIPATED_QUESTIONS] and
-- [CONVERSATIONAL_EVIDENCE] cover everything these rows were covering, in the
-- verified version.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

delete from public.candidate_responses
where candidate_id = 'a838e0a4-77e5-43b2-86ac-831bfdce959d';

commit;

-- Expect 0.
select count(*) from public.candidate_responses
where candidate_id = 'a838e0a4-77e5-43b2-86ac-831bfdce959d';
