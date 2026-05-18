# InterviewMind v2 🎙️

> An AI-powered interview simulator that lets recruiters have authentic, real-time conversations with an AI representation of me — built from scratch with no prior programming background.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?logo=supabase)](https://supabase.com/)
[![Anthropic](https://img.shields.io/badge/Anthropic-Claude%20Sonnet%204.6-D97757)](https://www.anthropic.com/)
[![Vercel](https://img.shields.io/badge/Vercel-deployed-black?logo=vercel)](https://vercel.com/)

🔗 **[Live Demo →](https://pablo-interview.vercel.app)** &nbsp;|&nbsp; 💼 **[LinkedIn](https://www.linkedin.com/in/pablo-agis-burgos)** &nbsp;|&nbsp; 📧 **pabloagisburgos@gmail.com**

---

## 📖 What is this?

**InterviewMind v2** is a production-grade web application that simulates an interview conversation with me — Pablo Agis Burgos, a hospitality-tech professional transitioning into commercial SaaS roles.

Recruiters land on a simple intake form, enter their name and company, and immediately start a live conversation with an AI assistant that knows my background deeply — my work history, my stories, my voice, and my limits (it never invents facts).

But this isn't just a chatbot. It's a **portfolio piece** that demonstrates:

- 🧠 **Production prompt engineering** — anti-hallucination rules, modular knowledge retrieval, contextual adaptation
- ⚡ **Real-time SSE streaming** — text appears word-by-word, just like ChatGPT
- 🗄️ **Vector-based semantic memory** — every conversation builds context using pgvector + OpenAI embeddings
- 🏗️ **Modular architecture** — smart retrieval loads only relevant knowledge per query (token-efficient)
- 🚀 **Full-stack execution** — Next.js 15 App Router + TypeScript + Supabase + Vercel

---

## 🎯 Why I built this

I'm a hospitality operations professional with 7 years of hotel experience (Accor, Soho House, Axel Hotel Barcelona) who recently moved into SaaS implementation at HubOS. I'm now actively pursuing SDR and commercial roles in hospitality tech.

Standard CVs and LinkedIn profiles tell recruiters *what* I've done. This tool lets them experience *how* I think and communicate — which matters far more for sales roles.

It also lets me demonstrate something most candidates can't: that I can ship a real, deployed, technically credible product. **I had zero prior programming experience before this project.**

---

## ✨ Key Features

### 1. Authentic conversational AI
The system prompt is heavily engineered to represent me accurately — my real work history, real stories (STAR-formatted), real limitations. It refuses to invent personal details (a common LLM failure mode) and acknowledges what it doesn't know.

### 2. Streaming responses (SSE)
Built using Server-Sent Events for word-by-word streaming. No spinner-and-wait — responses appear in real time, exactly like modern AI products.

### 3. Semantic memory across the conversation
Every message is embedded using OpenAI's `text-embedding-3-small` and stored in Supabase with `pgvector`. When a new message arrives, the system retrieves the most contextually relevant prior turns to inform the response.

### 4. Modular knowledge retrieval
Rather than stuffing everything into one massive prompt (expensive, slow, lower quality), the system loads only relevant context per query:
- Recruiter mentions Mews → loads deep Mews context
- Recruiter asks about implementation → loads the Vienna story
- Recruiter asks about hobbies → loads only verified personal interests

This reduced token usage by ~50% per request.

### 5. Conversation transcript
After each session, the conversation is saved and can be exported as Markdown for the recruiter's records.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          User (Recruiter)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (React)                      │
│              IntakeScreen → ChatPanel → Streaming UI             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Next.js API Routes (Serverless)                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  POST /api/chat                                          │   │
│  │   1. Store user message (with embedding)                 │   │
│  │   2. Search memory (pgvector similarity)                 │   │
│  │   3. Retrieve relevant knowledge (stories, companies)    │   │
│  │   4. Build dynamic system prompt                         │   │
│  │   5. Stream response from Claude (SSE)                   │   │
│  │   6. Store assistant response                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────┬──────────────────┬──────────────────┬────────────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│  Anthropic  │  │     OpenAI      │  │      Supabase       │
│  Claude     │  │  Embeddings     │  │  PostgreSQL +       │
│  Sonnet 4.6 │  │  (1536 dims)    │  │  pgvector + RLS     │
└─────────────┘  └─────────────────┘  └─────────────────────┘
```

### Design decisions worth flagging

| Decision | Why |
|----------|-----|
| **SSE over WebSockets** | Streaming is one-directional. SSE works seamlessly with serverless. No connection state to manage. |
| **pgvector over Pinecone/Weaviate** | Free tier, runs alongside transactional data, simpler ops. |
| **Memory non-blocking** | If embedding/memory fails, the chat still works. Graceful degradation. |
| **Modular knowledge over monolithic prompt** | ~50% token reduction. Better response quality. Easier to maintain. |
| **Anti-confabulation rules in prompt** | Prevents the AI from inventing personal details — a critical safety requirement. |
| **No prompt secrets exposed** | All API calls are server-side. Frontend never sees keys. |

---

## 🛠️ Tech Stack

**Frontend**
- [Next.js 15](https://nextjs.org/) (App Router)
- [TypeScript 5](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- React 18 with hooks and context

**Backend**
- Next.js API Routes (serverless)
- Server-Sent Events for streaming
- AbortController for graceful timeouts

**AI & Memory**
- [Anthropic Claude Sonnet 4.6](https://www.anthropic.com/) — conversational AI
- [OpenAI `text-embedding-3-small`](https://platform.openai.com/) — embeddings (1536 dims)
- Semantic similarity search via pgvector

**Database**
- [Supabase](https://supabase.com/) (PostgreSQL + pgvector extension)
- Row Level Security (RLS)
- Service role isolation for backend writes

**Deployment**
- [Vercel](https://vercel.com/) (serverless, global edge)
- Environment-based configuration

**Development**
- VS Code with Claude Code extension (AI pair programming)
- Git + GitHub for version control

---

## 🧪 Local Development

> Requires Node.js 18+, npm, and accounts at Anthropic, OpenAI, and Supabase.

### 1. Clone the repository

```bash
git clone https://github.com/Pabloagis/pablo-interview-ai.git
cd pablo-interview-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root:

```env
# Anthropic API
ANTHROPIC_API_KEY=sk-ant-api03-...

# OpenAI API (for embeddings)
OPENAI_API_KEY=sk-proj-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_KEY=eyJh...
```

### 4. Set up Supabase schema

In Supabase SQL Editor, run the schema in `supabase/schema.sql`:

- Creates `sessions` and `memory` tables
- Enables `pgvector` extension
- Creates the `search_memory()` semantic search function

### 5. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Structure

```
pablo-interview-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts          # Main streaming endpoint
│   │   │   ├── session/route.ts       # Session creation
│   │   │   └── transcript/route.ts    # Export transcript
│   │   ├── interview/[sessionId]/     # Per-session chat page
│   │   ├── layout.tsx
│   │   └── page.tsx                   # Intake screen
│   ├── components/
│   │   ├── ChatPanel.tsx              # Chat UI with SSE handling
│   │   ├── IntakeScreen.tsx           # Recruiter intake form
│   │   ├── MessageBubble.tsx
│   │   ├── StreamingResponse.tsx      # Real-time text rendering
│   │   ├── Header.tsx
│   │   └── Toast.tsx
│   ├── lib/
│   │   ├── prompts.ts                 # Core system prompt
│   │   ├── stories-knowledge.ts       # STAR stories (retrieval)
│   │   ├── companies-knowledge.ts     # Target companies context
│   │   ├── retrieval.ts               # Smart context loader
│   │   ├── anthropic.ts               # Claude API client
│   │   ├── supabase.ts                # Database client
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── utils.ts
│   └── context/
│       └── SessionContext.tsx
├── supabase/
│   └── schema.sql                     # Database schema
├── CLAUDE.md                          # AI assistant context
├── .env.local.example
└── package.json
```

---

## 🎓 What I learned building this

Going from zero programming experience to a deployed full-stack application in roughly a week taught me more than I expected. Some honest observations:

**Prompt engineering is its own discipline.**
The first version of the AI invented personal details ("I'm from Vigo" — I'm not). The second version learned to refuse to invent cities but invented hobbies instead ("I love football and skiing" — only one of those is true). Building robust anti-hallucination rules required several iterations and explicit forbidden-fact lists.

**Architecture matters more than features.**
The initial system prompt was a single 5,000-token block. After feedback from two technical reviewers, I refactored it into a modular retrieval system: a compact core prompt plus on-demand loading of stories and company contexts. This reduced costs by ~50% and improved response quality measurably.

**Streaming is harder than it looks.**
SSE works great in theory. In practice, you need careful error handling, timeout management, and graceful degradation when embeddings fail. The chat must keep working even if memory does not.

**The hardest part wasn't the code.**
The hardest part was deciding *what the AI should refuse to say* — and getting it to say "I don't know" instead of inventing plausible answers under pressure. That's a behavioral problem disguised as a technical one.

**AI pair programming changes the game.**
Using VS Code + Claude Code as an AI pair-programming partner meant I could focus on product decisions, architecture, and quality — rather than fighting syntax. The bottleneck shifted from "how do I write this" to "what should this do, and is it correct?"

---

## 🚧 What I'd do differently

If I were starting over (or extending this further):

- **Add tests.** End-to-end tests for the streaming endpoint and unit tests for retrieval logic.
- **Add analytics.** Anonymous usage tracking to see which questions recruiters actually ask most.
- **Add a recruiter feedback mechanism.** Lightweight thumbs-up / thumbs-down to learn from real interactions.
- **Internationalization.** A Spanish version would help with Iberian recruiters.
- **Voice mode.** Whisper for input, ElevenLabs for output, would make it a much richer experience.

---

## 👤 About the author

I'm **Pablo Agis Burgos** — based in Barcelona, originally from Galicia.

I spent seven years in hospitality operations across London (Accor, Soho House) and Barcelona (Axel Hotel) before moving into SaaS implementation at HubOS. I'm now actively exploring SDR and commercial roles in hospitality tech, ideally at companies building the future of how hotels operate.

I speak Spanish and Galician natively, fluent professional English, and advanced professional Italian and Portuguese.

This project is one part of how I'm answering the question every transitioning candidate gets asked: *"Can you actually do the new thing, or do you just want to?"*

**Connect with me:**
- 💼 [LinkedIn](https://www.linkedin.com/in/pablo-agis-burgos)
- 📧 [pabloagisburgos@gmail.com](mailto:pabloagisburgos@gmail.com)
- 📍 Barcelona, Spain

---

## 📄 License

This project is provided as-is for portfolio and educational purposes. The code is yours to learn from; the personal content (work history, stories, prompts about Pablo) is, well, personal.

---

<div align="center">

**Built with curiosity, coffee, and Claude Code ☕🤖**

*If this project resonates with what you're hiring for, [let's talk](mailto:pabloagisburgos@gmail.com).*

</div>
