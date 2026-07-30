# CLAUDE.md — InterviewMind

Operating rules for Claude Code in this repo. This is a system prompt, not documentation.
Agent facts and voice live in code and the database — never duplicate them here (see Sources of truth).

## Branches — read this first

- **`main` = production.** Auto-deploys to interviewmind.one via Vercel. **Never commit here without explicit instruction.**
- **`dev` = where all feature work happens.**
- Since the v2 → v3 cutover both branches run the same multi-user platform: dynamic per-candidate prompt (`src/lib/candidate-prompt.ts`), coverage/evidence/anticipated tables, eval suite. The single-user `/interview` flow, its API routes and its email chain are gone.
- **A candidate's conversation surface is `/<slug>` and nothing else.** There is no per-session page: no `/interview/<id>`, no transcript viewer, no `/email-preview`. Recruiter history rows are read-only summaries. Anything that wants to link to a conversation has no destination — do not invent one.
- `src/lib/prompts.ts` + `stories-knowledge.ts` still hold Pablo's static v2 prompt. It serves only sessions with **no** `candidate_id`. It is **never** a fallback for a candidate-linked session (see below).

## Anti-hallucination invariants (the core of this project — never weaken)

- The agent speaks **only** from verified data. It never invents metrics, role scope, team sizes, departure reasons, or availability.
- **A lit coverage node does not authorise filling in the facts inside it.** A job title and dates are not a narrative about why a role ended or what it involved.
- **Pressure does not create facts.** If a recruiter pushes for the "real reason", restate what is known; never manufacture a more satisfying answer.
- "Available immediately" / "no notice period" are **claims requiring evidence**, not safe defaults. Defer them like salary.
- **Vague evidence never persists** as an anticipated answer and never reaches the agent's mouth.
- Hybrid gap flow: **the AI proposes the question; the user authors the answer.** Never pre-fill a plausible answer for one-click approval.
- **Story ownership is sacred** — never upgrade participated → led. `candidate_stories.ownership` + `boundaries` carry this; both are rendered into the prompt.
- **An agent speaks as its candidate or it does not speak.** If `buildCandidateSystemPrompt` throws for a candidate-linked session, `/api/chat` and `/api/public/chat` return an error and close the stream. Never fall back to another person's prompt — a convincing answer in the wrong biography is the worst failure this product has. (Missing *data* is different and already handled: the builder degrades to a prompt carrying an explicit `[DATA_COMPLETENESS]` list, never someone else's facts.)
- Behaviour changes to the agent must be **verified by re-running the eval suite**, not asserted.

## Verification

- Eval: `npx tsx scripts/eval/run.ts --candidate <profiles.id> --target v3-local` (`--only <ids>` for a subset).
- Stochastic behaviour needs **≥3 runs**. Report transcripts and numbers, never claims.
- **Never change the eval instrument and the system under test in the same measured pass** — the delta becomes unattributable. Fix one, measure, commit; then the other.
- The `v2-prod` target in `scripts/eval/targets.ts` is **dead**: it POSTs to `/api/session`, a route the cutover removed, and production no longer serves the static prompt. It was already unreachable behind a Vercel bot challenge. It is left in place because the eval suite is frozen — do not "fix" it as a side errand.
- The suite is a **development instrument for Pablo's profile**, not a product feature. Do not generalise it. Its floor is currently **1/40**: `scope_degree` fails on verified CSHG content the grader's narrow PASS_CRITERION does not cover. `dep_axel_bounded` fails the same way intermittently. Neither is an agent defect — do not "fix" the agent to satisfy them.

## Hard-won rules (each came from a real bug — treat as absolutes)

- **Mobile CSS:** never `100vw` or `w-screen`; always `w-full`. Chat shells use `fixed inset-0 flex flex-col` with `flex-1 min-w-0` on every shrinkable child.
- **Supabase RLS:** a policy ON `profiles` that subqueries `profiles` causes infinite recursion and takes down auth. Subquerying `profiles` from a policy on *another* table is safe.
- **Migrations:** `CREATE POLICY` has no `IF NOT EXISTS` — always emit `DROP POLICY IF EXISTS` first so the file is re-runnable. Guard trigger creation against missing functions. **Never run migrations yourself** — there is no DDL access from here; output the SQL for the user to run in the Supabase editor.
- **Vercel Hobby cron:** daily (`0 0 * * *`) is the maximum frequency. Hourly breaks deployment silently.
- **React StrictMode** double-invokes `useEffect` — a guard ref is required for one-shot effects and animations.
- **Deleting a user** requires removing them from both `public.profiles` and `auth.users`.
- **Transcripts** are always built from `sessions.messages` (JSONB). The `transcript` column is unused.
- **Dev server:** prefer `npm start` (production build) or `npm run dev -- --turbopack`. Plain `npm run dev` hits a Next 15 Webpack bug that throws ENOENT/manifest errors under sustained editing.

## Model routing (cost discipline)

- **Sonnet** (`claude-sonnet-4-6`): user-facing conversation only.
- **Haiku** (`claude-haiku-4-5-20251001`): extraction, classification, grading, gap detection.
- Never use Sonnet for what Haiku can do.
- Embeddings are OpenAI `text-embedding-3-small` (1536d) — Anthropic has no embeddings API.

## Architecture constraints

- Next.js 15 App Router, TypeScript, Tailwind, Supabase (Postgres + pgvector + Auth), deployed on Vercel.
- Streaming is **SSE, never WebSockets** (WebSockets don't work serverless). Events: `{type:'content'|'done'|'error'}`.
- **Memory is non-blocking** — a memory failure must never break the chat.
- **API keys are server-side only.** They never reach the browser.
- 30s `AbortController` timeout on Claude calls.
- Report emails are gated by `profiles.notify_on_session` and the per-profile cap in `public-report.ts`, and claimed atomically via `sessions.report_sent_at`. The v2 `consent_to_email` chain is gone.
- **Email templates are per-candidate, never per-Pablo.** `followup-email.ts` and `candidate-email.ts` take `candidateName` / `candidateSlug`; a hardcoded name or biography in either is a bug that reaches every other user.

## Sources of truth (point here instead of restating)

- Agent facts and voice: **per-candidate DB tables**, assembled by `candidate-prompt.ts`. `prompts.ts` + `stories-knowledge.ts` are the legacy static prompt for candidate-less sessions only.
- Pablo's own profile was migrated out of `main`'s code into those tables. The typed record of what was extracted and where each piece landed is `scripts/migrate/pablo-v3-data.ts`, which is **gitignored on purpose** — it carries a real email, a real profile UUID and consulting-client detail. It exists only on Pablo's machine; do not recreate it as a tracked file.
- Schema and migrations: `supabase/*.sql`. Tunable values: `src/lib/constants.ts`.
- The candidate hub is the trainer chat at `/dashboard/candidate/trainer` — the single home for building an agent. `/dashboard/candidate` now **redirects** there; the old 10-step wizard (`./journey`, `./modules`, `TrainingHub.tsx`) remains in the repo but is no longer reachable by candidates. Onboarding (CV → career goal → first story → supporting documents) happens inline in the chat via controls that hit the same `/api/training/*` routes the wizard used.

## Working with this user

- Produce the implementation, then **stop and report between major steps** — do not run ahead.
- When something **cannot** be verified (no DDL access, no authenticated browser session, prod behind a bot challenge), say so plainly instead of asserting success.
- The user directs AI-assisted development and has **no formal programming background**: explain non-obvious decisions and trade-offs; don't assume naming a pattern conveys anything.
- **This repo is public.** Never commit secrets, keys, project refs, UUIDs, credentials, or client information from consulting work. `scripts/eval/results/`, `supabase/seeds/` and `scripts/migrate/pablo-v3-data.ts` are gitignored for exactly this reason — eval transcripts quote the agent verbatim, seeds and the migration record carry the real UUID and email.
- `scripts/eval/candidates/pablo.ts` is **already tracked** and hardcodes the real profile UUID (`scripts/eval/candidates/pablo.ts:341`). It predates this rule and the eval suite is frozen, so it stays for now — but it is a known exposure, not an example to copy.
