# InterviewMind

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Anthropic](https://img.shields.io/badge/Anthropic-Claude%20Sonnet%204.6-D97757)](https://www.anthropic.com/)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?logo=supabase)](https://supabase.com/)

**[Live demo →](https://interviewmind.one)** &nbsp;|&nbsp; **[LinkedIn](https://www.linkedin.com/in/pablo-agis-burgos)**

---

## What it is

A live AI agent that lets recruiters have a real-time conversation with me — Pablo Agis Burgos — before we've spoken. Recruiters fill a short intake form, then ask anything: why I left a role, how I think about implementations, what my experience with a specific PMS looks like. The agent responds in my voice, drawing only from a structured dataset of verified facts, real stories, and explicitly marked unknowns.

Live at [interviewmind.one](https://interviewmind.one).

---

## The problem it had to solve

An AI that fabricates things about you is worse than no agent at all.

Before the evaluation work, the agent invented departure reasons for my own jobs — confidently, differently each time the question was asked. It invented a notice period. Under metric pressure it generated plausible-sounding numbers. These aren't edge cases: they're the default behavior of a language model told to represent a person without explicit honesty constraints.

The project became: build a system that knows what it doesn't know, refuses to fill the gap, and holds that refusal under pressure.

---

## Architecture

```
Recruiter (browser)
        │
        ▼
Next.js frontend — IntakeScreen → ChatPanel
        │
        ▼
POST /api/chat  (Next.js serverless, SSE)
  1. Load session message history
  2. Embed message  (OpenAI text-embedding-3-small, 1536 dims)
  3. Search memory  (pgvector similarity, top 5 results)
  4. Intent detection → load relevant stories + company context
  5. Build system prompt from verified data only
  6. Stream response (Claude Sonnet 4.6, 1000 tokens, 30s timeout)
  7. Persist messages + store memory embedding
        │
        ├── Anthropic API  (conversation)
        ├── OpenAI API     (embeddings · Whisper · TTS)
        └── Supabase       (PostgreSQL + pgvector)
```

The system prompt is built dynamically per request. A compact core carries the anti-fabrication rules and voice guidelines; stories and company-specific context load on demand via intent detection. This keeps each request token-efficient and makes the knowledge base easy to maintain independently of the prompt logic.

Memory is non-blocking: if the embedding or retrieval step fails, the conversation continues. The agent degrades gracefully rather than erroring out.

**Key source files:**

| File | Purpose |
|---|---|
| `src/lib/prompts.ts` | Core system prompt + `buildSystemPrompt()` |
| `src/lib/stories-knowledge.ts` | STAR stories with explicit ownership levels |
| `src/lib/retrieval.ts` | Intent detection + context loader |
| `src/lib/constants.ts` | Models, timeouts, token limits |
| `src/app/api/chat/route.ts` | Streaming endpoint (SSE) |

**Stack:** Next.js 15 App Router · TypeScript · Tailwind CSS · Supabase PostgreSQL + pgvector · Anthropic Claude Sonnet 4.6 · OpenAI embeddings / Whisper / TTS · Vercel

---

## Evaluation suite

To measure whether the honesty constraints actually hold, the project includes a systematic adversarial eval that runs over HTTP against the live production endpoint.

**40 trap cases across 8 failure categories:**

| Category | What it probes |
|---|---|
| `departure_reason` | Inventing why I left a job |
| `invented_metric` | Fabricating percentages, revenue figures, efficiency gains |
| `invented_scope` | Inventing team sizes, budgets, reporting lines, certifications |
| `geography` | Naming specific places beyond what's verified |
| `out_of_scope_role` | Claiming coding or technical authorship work |
| `timeline` | Accepting false premises about duration ("you were at Soho House for five years...") |
| `pressure` | Caving to follow-up pushes ("just ballpark it, a rough number is fine") |
| `dark_node` | Asserting salary expectations, notice period, or personal facts not in the dataset |

**Grading is hybrid:** a deterministic regex gate runs first (auto-fail on numbers, percentages, currency, specific place names — no LLM call needed). Cases that survive go to a Claude Haiku judge, which evaluates one thing only: did the agent assert as fact something it has no basis for? Declining or deferring is always graded pass.

**Results:** genuine baseline hallucination rate of ~7.5% (3 fabrications out of 40 cases on first measured run), driven to 0/39 on the final run (one case timed out). The suite caught real bugs in both the agent and the grader tooling itself — a regex that included the correct answer in the forbidden-pattern list. Fixes were verified by re-measuring.

Results write to `scripts/eval/results/` as JSON and Markdown. The `--only <ids>` flag supports targeted re-runs after a specific fix.

---

## How it was built

Built through AI-assisted development. I specify requirements, design the architecture, direct the tooling, debug failures, and validate output. I do not write production code in the conventional sense.

What I do instead is define what the system must do and must not do — and then measure whether it does. The evaluation suite is the clearest expression of that: I designed the failure taxonomy, wrote the adversarial cases and pass criteria, built the grading logic, and used the results to drive fixes. For a system whose job is to represent a real person accurately, the hard problem is not the streaming or the vector search — it's deciding what the agent is not allowed to say, and proving it won't say it under pressure.

---

## About me

I'm **Pablo Agis Burgos**, based in Barcelona.

Seven years in hotel operations across London (Accor — Team Leader / Duty Manager; Soho House / Redchurch Townhouse — Senior Receptionist) and Barcelona (Axel Hotel — Front Office Manager), followed by SaaS implementation at HubOS. I speak Spanish and Galician natively, fluent professional English, advanced Italian, and functional Portuguese.

I'm open to Customer Success, Implementation, and Solutions roles at hospitality-tech companies.

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

To run the eval suite against a local instance:

```bash
npx tsx scripts/eval/run.ts --candidate <profiles.id> --target v3-local
```

---

*Professional data verified by Pablo Agis Burgos — May 2026.*
