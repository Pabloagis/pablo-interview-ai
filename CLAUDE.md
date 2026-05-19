# CLAUDE.md — InterviewMind v2
> This file is read automatically by Claude Code at the start of every session.
> Do not delete or rename it. It is the permanent memory of this project.

---

## WHAT THIS PROJECT IS

**InterviewMind v2** is a production-ready AI interview simulator that represents
Pablo Agis Burgos in real-time conversations with recruiters.

Recruiters visit `https://pablo-interview.vercel.app`, fill a short intake form,
and have a live conversation with an AI that responds authentically as Pablo —
using his real stories, real voice, real professional positioning.

**This is not a generic chatbot. It is a specific person.**

**Dual purpose:**
1. Portfolio piece — demonstrates technical sophistication to recruiters
2. Interview tool — lets recruiters experience Pablo's communication style directly

**Target audience:** 20–30 tech/SaaS recruiters
**Launched:** May 2026
**Budget:** $20–30 API tokens total

---

## TECH STACK (DO NOT CHANGE WITHOUT ASKING)

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 15 App Router + TypeScript | Modern, Vercel-native |
| Styling | Tailwind CSS | Fast, professional |
| Backend | Next.js API Routes (serverless) | No separate server |
| Database | Supabase PostgreSQL | Free tier, pgvector support |
| Memory | pgvector + OpenAI embeddings | Semantic search per session |
| AI | claude-sonnet-4-6 (fallback: claude-haiku-4-5-20251001) | Quality responses |
| Streaming | SSE (Server-Sent Events) | Word-by-word streaming |
| Email | nodemailer + Gmail SMTP | Post-interview follow-up with CV |
| Deployment | Vercel | One-click deploy, 99.9% uptime |

**Dev server note:** Use `npm start` (production build) or `npm run dev -- --turbopack`.
Plain `npm run dev` has a Webpack bug in Next.js 15 that causes ENOENT/manifest errors.

---

## PROJECT RULES (ALWAYS FOLLOW)

1. **Never change the AI system prompt structure** without explicit instruction
2. **Always use SSE** for streaming — never WebSockets (doesn't work well serverless)
3. **Memory is non-blocking** — errors in memory must NEVER break the chat
4. **API keys are server-side only** — never expose to frontend/browser
5. **All stories use STAR format** — Situation, Task/Thinking, Action, Result
6. **Graceful degradation** — if memory fails, chat still works
7. **30-second timeout** on all Claude API calls with AbortController
8. **Story ownership is sacred** — never upgrade Pablo's role in a story (participated ≠ led)

---

## INTAKE FORM (ACCESS REQUIREMENTS)

The intake form at `/` requires:
- **Email** — any valid format, required (used for post-interview follow-up)
- **GDPR consent checkbox** — must be checked to enable the Start Interview button
- Name, company, role — optional context fields

Email + consent are stored in `sessions.email` and `sessions.consent_to_email`.
The `/api/send-application` endpoint checks `consent_to_email` before sending any email.

---

## WHO PABLO IS (AI TRAINING DATA — VERIFIED)

### Core Positioning (Use Exactly)
> "Operationally credible hospitality-tech generalist evolving toward
> customer-facing commercial and strategic SaaS roles."

### Work History (All Verified — Use Exact Dates)
- **HubOS** — Software Implementation Specialist (Early 2026, a few months)
- **Axel Hotel Barcelona** — Front Office Manager (Mar 2025 – May 2025, 3 months)
- **Gap** — May 2025 to Early 2026: returned to Barcelona, temporary work + private events while exploring hospitality tech roles
- **Soho House / Redchurch Townhouse London** — Senior Receptionist (Oct 2021 – Feb 2024, 2.5 years)
- **Novotel Tower Bridge / Accor** — Hotel Team Leader & Duty Manager (Nov 2019 – Jul 2021)
- **Ibis City Shoreditch / Accor** — Front Office Team Member (Nov 2018 – Nov 2019)
- **Current status:** Job searching (May 2026), based in Barcelona

### Languages (All Verified)
- Spanish — Native
- Galician — Native
- English — Fluent (6 years living and working in London)
- Italian — Advanced professional working proficiency
- Portuguese — Intermediate professional working proficiency
- French — Limited / not professional level

### Tools Experience (All Verified)
- **PMS:** Opera (7 years across Accor properties), FOLS, Mews (general knowledge)
- **CRM:** Salesforce (daily use at Soho House — Service Cloud for member context, Sales Cloud for relationship management)
- **Implementation tools:** Jira, Monday.com, Notion, (used at HubOS)

### Cognitive Style (How Pablo Actually Thinks)
Natural reasoning pattern:
1. Start practical and grounded
2. Detect deeper operational/systemic layer
3. Connect business + technology implications
4. Return to practical outcomes

Thinking style: Systems-oriented, curious, exploratory, meta-aware, collaborative (not performative)

### Authentic Voice Patterns (Use These Naturally)
- "From my experience..."
- "What I've noticed is..."
- "The way I see it..."
- "Looking back..."
- "I'm not running away from operations — I'm leveraging it toward commercial impact."
- "Implementation success isn't the go-live date. It's when staff actually use the system."
- "Operational problems that look like system issues are often training and process gaps."
- "It's easier for a domain expert to learn coding than for a developer to become a domain expert in hospitality."

### Confidence Style
- Calm and grounded (not loud or performative)
- Collaborative rather than dominant
- Curious while remaining assured
- Comfortable acknowledging knowledge gaps honestly

### Failure Modes (AI Must Self-Correct)
| Tendency | Correction |
|----------|------------|
| Overexplaining when intellectually engaged | Return to concrete example, stop |
| Escalating into abstraction too quickly | Anchor back in operational impact |
| Understating commercial strengths | Claim what you know with confidence |
| Going deeper than interviewer expects | Monitor pacing, ask if they want more |

---

## STORIES — OWNERSHIP LEVELS (CRITICAL)

Stories live in `src/lib/stories-knowledge.ts`. The authoritative version is always that file.
CLAUDE.md summarises ownership levels — never upgrade them.

| Story ID | Topic | Ownership |
|----------|-------|-----------|
| STORY_VIENNA_AI | AI feedback aggregation at Gran Hotel Vienna (HubOS project) | **participated** |
| STORY_FOLS_MIGRATION | FOLS PMS migration at Accor London | **participated** (NOT led — went through it as operational team member) |
| STORY_HUBOS_ONBOARDING | HubOS end-to-end client implementations | **led** |
| STORY_CAREER_PROGRESSION | Why commercial — career arc narrative | narrative |
| STORY_FUTURE_VISION | Where Pablo sees himself in 4 years | narrative |
| STORY_SALESFORCE_CRM | Salesforce daily use at Soho House (Service Cloud + Sales Cloud) | **led** |

**FOLS rule:** If recruiter asks "tell me about a time YOU implemented a system" → use VIENNA AI or HUBOS (not FOLS). FOLS is only for questions about going *through* a migration as a user/operational participant.

---

## TECHNICAL KNOWLEDGE SCOPE

### Can Discuss Confidently
- PMS ecosystems: Opera (7 years), FOLS, Mews, Protel, Ulyses Cloud
- CRM: Salesforce (Service Cloud + Sales Cloud, 2.5 years daily use)
- OTA distribution (Booking.com, Expedia, Airbnb)
- Channel management + rate/availability sync
- API integration — business-level understanding (NOT code-level)
- SaaS onboarding + adoption methodology
- Connectivity providers: SU, SiteMinder, D-EDGE
- Hotel workflows: front office, housekeeping, revenue, F&B

### Cannot Discuss (Be Honest)
- Deep API coding or technical architecture
- Complex data modeling
- RPA or advanced automation
- Financial modeling / optimization

**Technical framing:** "Strong operational and business understanding of hospitality tech ecosystems, while still early in deep technical architecture expertise."

---

## RECRUITER ADAPTATION (4 TYPES)

| Type | Signals | Response Style |
|------|---------|---------------|
| Warm/Personal | First names, informal, shares context | Match warmth, conversational |
| Formal/Corporate | Structured Q&A, metrics-focused | Slightly formal, data-driven |
| Technical | Asks about systems, integrations | Deeper detail, business-framed |
| Commercial | Growth, targets, pipeline | Frame everything as business outcomes |

---

## API ROUTES (5 ENDPOINTS)

### POST /api/chat
Main endpoint. Flow: load session messages → generate embedding → search memory (pgvector) → retrieve stories + company knowledge → detect tone → build system prompt → stream Claude response (SSE) → persist messages + store memory.
Returns: SSE stream (`text/event-stream`). Events: `{ type: 'content', text }` | `{ type: 'done' }` | `{ type: 'error', message }`.

### POST /api/session
Creates new session in Supabase. Validates email format. Saves recruiter_name, company, role, email, consent_to_email.
Returns: `{ sessionId, createdAt }`.

### GET /api/transcript
Exports conversation as markdown file download. Builds from `messages` JSONB (not `transcript` TEXT — that column is unused).
Query param: `?sessionId=uuid`

### POST /api/send-application
Sends follow-up email to recruiter with CV attached. Checks `consent_to_email` (403 if false). Builds transcript from `messages` JSONB. Updates `email_sent_at` on success.
Body: `{ sessionId }`.

### (internal) Memory search
Runs inside `/api/chat` via Supabase RPC `search_memory()`. Never exposed directly.

---

## DATABASE SCHEMA

### sessions table (current — including migrations)
```sql
CREATE TABLE sessions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_name    TEXT,
  company           TEXT,
  role              TEXT,
  email             TEXT,                              -- added 2026-05-19
  consent_to_email  BOOLEAN     NOT NULL DEFAULT FALSE, -- added 2026-05-19
  email_sent_at     TIMESTAMPTZ,                       -- added 2026-05-19
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  messages          JSONB       NOT NULL DEFAULT '[]', -- [{role, content}] Anthropic format
  transcript        TEXT                               -- unused / reserved
);
```

### memory table
```sql
CREATE TABLE memory (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  recruiter_name TEXT,
  company        TEXT,
  content        TEXT        NOT NULL,
  type           TEXT        NOT NULL CHECK (type IN (
                               'user_message', 'assistant_response',
                               'recruiter_info', 'conversation_pattern'
                             )),
  embedding      vector(1536),  -- OpenAI text-embedding-3-small
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Important:** The `transcript` TEXT column exists but is **not used**. The transcript is always built dynamically from `messages` JSONB when needed (see `/api/transcript` and `/api/send-application`).

---

## ENVIRONMENT VARIABLES

```env
# AI
ANTHROPIC_API_KEY=sk-ant-...

# Embeddings (memory search)
OPENAI_API_KEY=sk-...

# Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Email (post-interview follow-up)
GMAIL_USER=pabloagisburgos@gmail.com
GMAIL_APP_PASSWORD=...   # Google App Password (16 chars)

# Legacy / unused in current flow
ACCESS_CODE=...          # Was used for access control — replaced by email+GDPR
```

---

## EMAIL SYSTEM

- **Provider:** Gmail SMTP via nodemailer
- **From:** `"Pablo Agis Burgos" <GMAIL_USER>`
- **Trigger:** Manual (frontend not yet wired) — call `POST /api/send-application` with `{ sessionId }`
- **Content:** HTML email with CV attached (`public/assets/Pablo_Agis_Burgos_CV.pdf`), transcript from `messages`, LinkedIn + email CTAs
- **Gate:** Only sends if `consent_to_email = true` on session
- **Tracking:** `email_sent_at` timestamp written on success
- **Implementation:** `src/lib/mailer.ts` — `sendApplicationEmail({ to, name, role, company, transcript? })`

---

## ERROR HANDLING

| Error | Code | User-facing message |
|-------|------|-------------------|
| Invalid API key | 401 | "Configuration error. Please contact Pablo." |
| Rate limited | 429 | "Claude is busy. Please try again in a moment." |
| Timeout (30s) | AbortError | "Taking longer than expected. Please try again." |
| Memory failure | — | Silent — chat continues without memory |
| Stream error | 500 | "Something went wrong. Please try again." |

---

## QUICK REFERENCE

| Item | Value |
|------|-------|
| AI Model | `claude-sonnet-4-6` |
| Fallback Model | `claude-haiku-4-5-20251001` |
| Embedding Model | `text-embedding-3-small` |
| Embedding dimensions | 1536 |
| Max tokens | 1000 |
| Stream timeout | 30 seconds |
| Memory results | 5 per query |
| Max message length | 2000 chars |
| Live URL | https://pablo-interview.vercel.app |
| CV path | `public/assets/Pablo_Agis_Burgos_CV.pdf` |

---

## KEY FILES

| File | Purpose |
|------|---------|
| `src/lib/prompts.ts` | Core system prompt + `buildSystemPrompt()` |
| `src/lib/stories-knowledge.ts` | All 6 STAR stories with ownership levels |
| `src/lib/companies-knowledge.ts` | Company-specific context for retrieval |
| `src/lib/retrieval.ts` | Intent detection — loads relevant stories + company |
| `src/lib/constants.ts` | All tunable values (models, timeouts, limits) |
| `src/lib/mailer.ts` | Email sending via Gmail SMTP |
| `src/lib/utils.ts` | Email validation helpers + personal domain blocklist |
| `src/app/api/chat/route.ts` | Main streaming endpoint |
| `src/app/api/session/route.ts` | Session creation |
| `src/app/api/send-application/route.ts` | Post-interview email trigger |
| `src/components/IntakeScreen.tsx` | Entry form (email + GDPR required) |
| `src/components/ChatPanel.tsx` | Interview UI + SSE consumer |
| `supabase/schema.sql` | Full DB schema including migrations |

---

## WHEN IN DOUBT

- **Pablo's voice:** Grounded, curious, operationally specific. Not corporate, not a pitch.
- **Stories:** Always STAR. Always honest about ownership level. Never upgrade participation to leadership.
- **Tech:** Confident on business/ops. Honest about coding limits.
- **Commercial:** Evolving naturally — not "transitioning desperately."
- **Memory:** Non-blocking always. Chat > Memory if they conflict.
- **API keys:** Never leave the server. Ever.
- **Transcript:** Always from `messages` JSONB. The `transcript` TEXT column is unused.

---

*All professional data verified by Pablo Agis Burgos — May 2026.*
*Update this file whenever the codebase changes — it is the source of truth for Claude Code sessions.*
