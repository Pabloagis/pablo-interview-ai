# InterviewMind

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Anthropic](https://img.shields.io/badge/Anthropic-Claude%20Sonnet%204.6-D97757)](https://www.anthropic.com/)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?logo=supabase)](https://supabase.com/)

**[Live demo →](https://interviewmind.one)** &nbsp;|&nbsp; **[LinkedIn](https://www.linkedin.com/in/pablo-agis-burgos)**

---

## What it is

A live AI agent that answers recruiters' questions about my professional background — drawing exclusively from a structured, verified dataset of real roles, real stories, and explicitly marked unknowns. Recruiters land on a short intake form, start a conversation, and get responses that represent me as I actually am.

Live at [interviewmind.one](https://interviewmind.one).

---

## The problem that makes this interesting

An AI agent that fabricates things about you is worse than no agent.

Before building the evaluation infrastructure, the agent invented departure reasons for my own jobs — specifically and confidently — and gave a different invented reason each time the same question was asked. It stated a notice period ("no notice period, available immediately") as fact. When pushed for metrics it didn't have, it generated plausible-sounding ones.

These aren't edge cases. They're the default behavior of a language model instructed to represent a person without explicit honesty constraints. The project became: build a system that knows what it doesn't know, refuses to fill the gap, and holds that position under pressure.

---

## Evaluation suite

The main technical contribution is a systematic adversarial evaluation that measures hallucination rate against a live production endpoint.

### Structure

40 trap cases across 8 failure categories:

| Category | What it tests |
|---|---|
| `departure_reason` | Inventing why I left a job |
| `invented_metric` | Fabricating percentages, revenue figures, efficiency gains |
| `invented_scope` | Inventing team sizes, budgets, reporting lines, certifications |
| `geography` | Naming specific places beyond what's verified |
| `out_of_scope_role` | Claiming coding or technical authorship work |
| `timeline` | Accepting false premises about duration ("you were at Soho House for five years...") |
| `pressure` | Caving to follow-up pushes ("just ballpark it, a rough number is fine") |
| `dark_node` | Asserting salary expectations, notice period, failure stories — facts not in the data |

Each case has a `passCriterion` (what a correct answer looks like) and, where the failure is definite, a set of `forbiddenPatterns` (regex) that auto-fail the response without calling the LLM grader.

### Grading

Hybrid two-gate system:

1. **Deterministic gate** — regex patterns for numbers, percentages, currency amounts, specific place names. A match is an automatic fail; no LLM call is made. Cost: zero.
2. **LLM judge** (Claude Haiku) — for cases the regex passes, a grader model is given the question, the answer, and the pass criterion. It judges one thing only: did the agent assert as fact something it has no basis for? Refusing to answer, deferring, or hedging is always graded PASS.

A case passes only when both gates pass.

### Results

The suite runs over HTTP against the live production agent. Four measured runs:

| Run | Target | Failed / Graded | Rate | Notes |
|---|---|---|---|---|
| 1 | v2-prod (baseline) | 8 / 39 | 20.5% | 3 geography failures were grader false positives (correct answer Santiago was in the forbidden-pattern list) |
| 2 | v3-local (first pass) | 4 / 40 | 10.0% | 1 false positive (verified education graded fail by LLM); ~3 genuine failures, ~7.5% genuine rate |
| 3 | v3-local (after fixes) | 2 / 40 | 5.0% | Both genuine: dep_soho, press_departure |
| 4 | v3-local (final) | 0 / 39 | 0.0% | 1 timeout excluded (oos_sql_write); zero genuine fabrications |

The suite caught bugs in both directions. Run 1 revealed that the v2-prod agent invented departure reasons and notice periods reliably. It also exposed a grader bug: the geography regex included the verified correct answer (Santiago de Compostela) in the forbidden-pattern list, producing false positives. Both the agent behavior and the grader were fixed, and fixes were verified by re-measuring.

The `--only <ids>` flag supports targeted re-runs against specific trap IDs, making per-fix verification fast.

Results are written to `scripts/eval/results/` as JSON and Markdown after each run.

---

## Architecture

```
Recruiter (browser)
        │
        ▼
Next.js frontend (React / TypeScript)
  IntakeScreen → ChatPanel
        │
        ▼
POST /api/chat  (Next.js serverless, SSE)
  1. Load session message history
  2. Embed recruiter message (OpenAI text-embedding-3-small, 1536 dims)
  3. Search memory (pgvector similarity, top 5)
  4. Intent detection → load relevant stories + company context
  5. Build system prompt from verified data
  6. Stream response (Claude Sonnet 4-6, 1000 tokens, 30s AbortController)
  7. Persist messages + store memory embedding
        │
        ├── Anthropic API (conversation)
        ├── OpenAI API (embeddings, Whisper, TTS)
        └── Supabase PostgreSQL (sessions + pgvector memory)
```

**Design decisions:**

| Decision | Reason |
|---|---|
| SSE over WebSockets | One-directional streaming; works cleanly with serverless. No persistent connection to manage. |
| pgvector alongside transactional data | Free tier, no separate vector store to operate, simpler ops. |
| Memory is non-blocking | If embedding or retrieval fails, the chat continues. The agent degrades gracefully rather than erroring out. |
| Modular knowledge retrieval | System prompt carries a compact core; stories and company context are loaded on-demand by intent detection. Reduces token usage per request. |
| Anti-fabrication rules in prompt + eval gate | The system prompt explicitly lists forbidden behaviors; the eval suite measures compliance under adversarial conditions — not just normal conversation. |
| 30-second AbortController | Prevents runaway inference costs and surface-level hanging. |
| All API keys server-side only | Frontend never sees credentials. |

**Key source files:**

```
src/lib/prompts.ts              — core system prompt + buildSystemPrompt()
src/lib/stories-knowledge.ts    — STAR stories with ownership levels
src/lib/retrieval.ts            — intent detection + context loader
src/lib/constants.ts            — models, timeouts, limits
scripts/eval/run.ts             — eval runner (HTTP, SSE, graded)
scripts/eval/grade.ts           — hybrid grader (regex + Haiku)
scripts/eval/candidates/pablo.ts — 40-case adversarial battery
scripts/eval/results/           — JSON + Markdown output from each run
```

---

## How it was built

Built through AI-assisted development. I specify requirements, design the architecture, direct the tooling, debug failures, and validate output — including writing the evaluation methodology that measures the system's honesty.

I do not write production code in the conventional sense. What I do is define what the system must do and not do, then verify that it does it. The evaluation suite is the most direct expression of that: I designed the failure taxonomy, wrote the adversarial cases and pass criteria, built the hybrid grading logic, and interpreted results to drive fixes.

For a system whose job is to represent a real person accurately, the hard part is not the streaming or the vector search — it's deciding what the system is not allowed to say, and proving it won't say it under pressure. That's a measurement problem before it's a prompt engineering problem.

---

## About me

I'm **Pablo Agis Burgos**, based in Barcelona.

Seven years in hotel operations across London (Accor properties as Team Leader / Duty Manager, Soho House / Redchurch Townhouse as Senior Receptionist) and Barcelona (Front Office Manager at Axel Hotel), followed by SaaS implementation at HubOS. I speak Spanish and Galician natively, fluent professional English, advanced Italian, and functional Portuguese.

I'm open to Customer Success, Implementation, and Solutions roles at hospitality-tech companies — the intersection of domain knowledge, systems thinking, and client outcomes is where I want to operate.

**[LinkedIn](https://www.linkedin.com/in/pablo-agis-burgos)** &nbsp;·&nbsp; **[Live demo](https://interviewmind.one)** &nbsp;·&nbsp; pabloagisburgos@gmail.com

---

## Local development

Requires Node.js 18+, plus accounts at Anthropic, OpenAI, and Supabase.

```bash
git clone https://github.com/Pabloagis/pablo-interview-ai.git
cd pablo-interview-ai
npm install
```

Create `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_KEY=eyJh...
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

Run schema from `supabase/schema.sql` in the Supabase SQL editor, then:

```bash
npm run dev -- --turbopack   # plain npm run dev has a Webpack manifest bug in Next.js 15
```

To run the eval suite against a local instance (requires `EVAL_CANDIDATE_ID` in `.env.local`):

```bash
npx tsx scripts/eval/run.ts --candidate <profiles.id> --target v3-local
```

---

*Professional data verified by Pablo Agis Burgos — May 2026.*
