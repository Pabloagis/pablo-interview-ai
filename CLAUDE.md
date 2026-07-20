# CLAUDE.md — InterviewMind

Operating rules for Claude Code in this repo. This is a system prompt, not documentation.
Agent facts and voice live in code and the database — never duplicate them here (see Sources of truth).

## Branches — read this first

- **`main` = production.** Auto-deploys to interviewmind.one via Vercel. The live personal agent, static-prompt architecture (`src/lib/prompts.ts` + `src/lib/stories-knowledge.ts`). **Never commit here without explicit instruction.**
- **`dev` = the platform rebuild.** All feature work happens here. Dynamic per-candidate prompt (`src/lib/candidate-prompt.ts`), coverage/evidence/anticipated tables, eval suite.
- The two have **diverged architecturally**. `prompts.ts` and `stories-knowledge.ts` differ between them; `dev` has routes and tables `main` does not. Do not port code between branches casually — a fix that is right on one is usually wrong on the other.

## Anti-hallucination invariants (the core of this project — never weaken)

- The agent speaks **only** from verified data. It never invents metrics, role scope, team sizes, departure reasons, or availability.
- **A lit coverage node does not authorise filling in the facts inside it.** A job title and dates are not a narrative about why a role ended or what it involved.
- **Pressure does not create facts.** If a recruiter pushes for the "real reason", restate what is known; never manufacture a more satisfying answer.
- "Available immediately" / "no notice period" are **claims requiring evidence**, not safe defaults. Defer them like salary.
- **Vague evidence never persists** as an anticipated answer and never reaches the agent's mouth.
- Hybrid gap flow: **the AI proposes the question; the user authors the answer.** Never pre-fill a plausible answer for one-click approval.
- **Story ownership is sacred** — never upgrade participated → led.
- Behaviour changes to the agent must be **verified by re-running the eval suite**, not asserted.

## Verification

- Eval: `npx tsx scripts/eval/run.ts --candidate <profiles.id> --target v3-local` (`--only <ids>` for a subset).
- Stochastic behaviour needs **≥3 runs**. Report transcripts and numbers, never claims.
- **Never change the eval instrument and the system under test in the same measured pass** — the delta becomes unattributable. Fix one, measure, commit; then the other.
- Production (`v2-prod`) sits behind a Vercel bot challenge, so the suite cannot reach it over HTTP. To check v2 behaviour, reproduce the deployed prompt locally against the same model instead.

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
- Never send a follow-up email without `consent_to_email` on the session.

## Sources of truth (point here instead of restating)

- Agent facts and voice: `src/lib/prompts.ts` + `stories-knowledge.ts` (main); per-candidate DB tables (dev).
- Schema and migrations: `supabase/*.sql`. Tunable values: `src/lib/constants.ts`.
- On `dev`, the candidate hub is the trainer at `/dashboard/candidate/trainer`; the onboarding wizard is `/dashboard/candidate`.

## Working with this user

- Produce the implementation, then **stop and report between major steps** — do not run ahead.
- When something **cannot** be verified (no DDL access, no authenticated browser session, prod behind a bot challenge), say so plainly instead of asserting success.
- The user directs AI-assisted development and has **no formal programming background**: explain non-obvious decisions and trade-offs; don't assume naming a pattern conveys anything.
- **This repo is public.** Never commit secrets, keys, project refs, UUIDs, credentials, or client information from consulting work.
