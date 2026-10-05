// ──────────────────────────────────────────────────────────────────
// COMPANIES KNOWLEDGE BASE — InterviewMind v2
// Hospitality-tech company context. Deep for Mews/HubOS/Axel. Compact for others.
// Loaded dynamically by retrieval based on recruiter company.
// Updated: Oct 5, 2026
// ──────────────────────────────────────────────────────────────────

export interface CompanyContext {
  id: string;
  name: string;
  aliases: string[]; // Alternative spellings/names
  depth: 'deep' | 'standard' | 'compact';
  content: string;
}

export const COMPANIES: CompanyContext[] = [
  // ────────────────────────────────────────────────────────────
  // MEWS — DEEP CONTEXT
  // ────────────────────────────────────────────────────────────
  {
    id: 'COMPANY_MEWS',
    name: 'Mews',
    aliases: ['mews', 'mews systems', 'genmews'],
    depth: 'deep',
    content: `**MEWS — DEEP CONTEXT**

What Mews is:
- AI-driven, cloud-native, API-first PMS
- ~$2.5B valuation, one of the most highly valued hotel-tech companies
- 15,000+ properties globally
- Founded in Prague (2012), strong European presence, expanding US
- Leading "modern" PMS challenger to Oracle Opera

Where Mews sits in the stack:
- Layer: Core PMS / system of record
- Architecture: Cloud-native, API-first, open marketplace of integrations
- Positioning: "All-on-one" platform — central PMS + ecosystem of best-in-class connected tools
- Direct competitors: Oracle OPERA Cloud, Cloudbeds, Protel (Planet), SiteMinder Little Hotelier
- Strategic narrative: Replacing legacy on-prem PMS with modern API-first architecture; building "the hospitality cloud"

Why this matters for Pablo:
- Opera (legacy) + HubOS (modern cloud SaaS) gives him direct credibility on both sides of the migration narrative
- He understands operational pain of legacy PMS — can speak to the value of Mews authentically
- Multilingual coverage (ES, EN, IT, PT) aligns with pan-European + LATAM expansion

Pablo and Mews:
- ⛔ Pablo has NO hands-on operational experience with Mews PMS — general knowledge only. Never claim he has used it.
- ⛔ Never mention any past or current hiring process, interview, application or contact at Mews (see NO HIRING PROCESSES).

How to handle Mews conversations:
- Always use STAR structure — situation, task, action, result — and lead with the result where one is verified
- Lead with specific examples where possible
- Show systems thinking — how PMS connects to broader stack
- Demonstrate genuine product curiosity, not generic sales pitch

Smart questions Pablo can ask a Mews recruiter:
- "What does the typical SDR-to-AE path look like at Mews?"
- "How is the SDR team segmented — by geography, segment, or product?"
- "What's the typical prospect profile in the territories you're hiring for?"
- "What does success look like in the first 90 days?"
- "How does Mews differentiate against Opera Cloud in the modern PMS conversation?"`,
  },

  // ────────────────────────────────────────────────────────────
  // HUBOS — DEEP CONTEXT (Former employer)
  // ────────────────────────────────────────────────────────────
  {
    id: 'COMPANY_HUBOS',
    name: 'HubOS',
    aliases: ['hubos', 'hub os', 'hub-os'],
    depth: 'deep',
    content: `**HUBOS — DEEP CONTEXT (Pablo's most recent employer)**

What HubOS is:
- Cloud-based operational platform for hospitality
- Headquartered in Spain, founded ~2015
- Used by 1,500–1,700+ hotels in 60+ countries with 30,000+ active users
- Marquee clients: NH Hotels, IHG, Hesperia, Eurostars, Nobu, Accor
- Team: ~35 employees, 10 nationalities

Where HubOS sits in the stack:
- Layer: Operational management & compliance — NOT a PMS
- Sits below: Core PMS (Opera, Mews, etc.)
- Sits above: Physical hotel execution (staff, rooms, maintenance)
- Function: Bridges software to real-world hotel operations

Modules:
- Housekeeping management
- Maintenance (preventive and corrective)
- Quality audits
- Energy management
- F&B operations
- Guest experience
- Guest in Touch (contactless guest reporting)
- Offline-enabled mobile app

Pablo's role:
- Title: Software Implementation Specialist
- Dates: Jan–Apr 2026, 4 months (fixed-term contract, completed)
- Setting: Hybrid + travel (on-site implementations)
- Tools daily: Jira, Monday.com, ReadAI, Notion, OKticket, Excel, Google Meet, Calendar

Specific implementations:
- Meliá Madeira Mare — housekeeping and maintenance modules; 5 days on-site, 2 weeks hands-on support, then handover to support. See the Meliá story.
- Gran Hotel Vienna — property transitioning from IHG brand to Eurostars; HubOS platform deployment. This is where the Vienna AI feedback aggregation story took place.
- 6–7 go-lives in 4 months in total, mostly on-site, while keeping configuration and onboarding moving for other accounts in parallel

Why Pablo left (fixed answer — say only this): "It was a fixed-term contract, and I completed it." No other reason, no strategic framing, no elaboration.

How to discuss HubOS:
- Most recent and relevant role — use richly
- The Vienna AI story and general onboarding story both belong here
- Reference real tools (Jira, Monday, Notion) when asked about workflow`,
  },

  // ────────────────────────────────────────────────────────────
  // AXEL — DEEP CONTEXT (Reference letter, short tenure)
  // ────────────────────────────────────────────────────────────
  {
    id: 'COMPANY_AXEL',
    name: 'Axel Hotels',
    aliases: ['axel', 'axel hotels', 'axel hotel barcelona'],
    depth: 'deep',
    content: `**AXEL HOTELS — DEEP CONTEXT**

What Axel Hotels is:
- Spanish hotel chain (founded in Barcelona, 2003)
- Pioneer of the "hetero-friendly" concept — inclusive luxury hospitality
- Properties in Barcelona, Madrid, Berlin, Buenos Aires, Ibiza, Maspalomas, Miami
- Strong brand identity built on inclusivity, design, and experience

The specific property:
- Axel Hotel Barcelona — flagship property, Carrer d'Aribau 33, Eixample
- 4-star, design-forward, central Barcelona
- Director during Pablo's tenure: Fernando Alcalá Rico

Pablo's role:
- Title: Front Office Manager
- Dates: March 2025 – May 2025 (3 months)
- Responsibilities:
  - Led front office operations, focus on guest satisfaction and revenue
  - Handled guest requests, negotiated solutions for satisfaction and commercial outcomes
  - Led and coordinated teams to ensure service quality
  - Key user of hotel software — understood system limitations firsthand

Reference letter (dated 25 June 2025, signed by Fernando Alcalá Rico):
- Confirms Front Office Manager role, March–May 2025
- Highlights "high level of professionalism, responsibility, and commitment"
- Specifically praises: leadership of reception team, efficient incident resolution, fluid cross-department communication

How to handle Axel-related questions:
- Operational role back in Spain after London (Soho House ended Feb 2024)
- Frame honestly: Pablo took FOM role at Axel while exploring his next strategic move into hospitality tech
- Reinforced operational credibility + fresh Spanish-market exposure
- Reference is strong, available on request

If asked "Why only 3 months?": use the verified Axel answer in the core prompt (WHO PABLO IS). ⛔ Never say it was a "defined short-term role" or planned as short-term.`,
  },

  // ────────────────────────────────────────────────────────────
  // OTHER COMPANIES — COMPACT
  // ────────────────────────────────────────────────────────────
  {
    id: 'COMPANY_CLOUDBEDS',
    name: 'Cloudbeds',
    aliases: ['cloudbeds'],
    depth: 'compact',
    content: `**CLOUDBEDS** — All-in-one PMS. Cloud-native, targets independent and small chain hotels globally. Direct Mews competitor.`,
  },
  {
    id: 'COMPANY_SHIJI',
    name: 'Shiji Group',
    aliases: ['shiji', 'shiji group'],
    depth: 'compact',
    content: `**SHIJI GROUP** — Hospitality tech platform, PMS implementation.`,
  },
  {
    id: 'COMPANY_SU',
    name: 'SU / The Access Group',
    aliases: [' su ', ' su,', ' su.', ' su?', 'staah', 'the access group', 'access group'], // bare 'su' matched inside 'results', 'summer'
    depth: 'compact',
    content: `**SU (STAAH / The Access Group)** — Hospitality connectivity infrastructure. White-label API connectivity, OTA integrations. Competes with SiteMinder, D-EDGE, DerbySoft.`,
  },
  {
    id: 'COMPANY_LIGHTHOUSE',
    name: 'Lighthouse',
    aliases: ['lighthouse'],
    depth: 'compact',
    content: `**LIGHTHOUSE** — Revenue intelligence platform for hospitality.`,
  },
  {
    id: 'COMPANY_HUBSPOT',
    name: 'HubSpot',
    aliases: ['hubspot', 'hub spot'],
    depth: 'compact',
    content: `**HUBSPOT** — CRM/inbound sales platform.`,
  },
  {
    id: 'COMPANY_VENUU',
    name: 'Venuu',
    aliases: ['venuu'],
    depth: 'compact',
    content: `**VENUU** — Event venue marketplace.`,
  },
  {
    id: 'COMPANY_GUESTY',
    name: 'Guesty',
    aliases: ['guesty'],
    depth: 'compact',
    content: `**GUESTY** — Property management + guest experience.`,
  },
  {
    id: 'COMPANY_EISI',
    name: 'EISI HOTEL',
    aliases: ['eisi', 'eisi hotel'],
    depth: 'compact',
    content: `**EISI HOTEL** — Operational compliance SaaS for hotels (housekeeping, maintenance, health & safety).`,
  },
  {
    id: 'COMPANY_CANARY',
    name: 'Canary Technologies',
    aliases: ['canary', 'canary technologies'],
    depth: 'compact',
    content: `**CANARY TECHNOLOGIES** — Guest journey tech, contactless check-in, upsells, communication.`,
  },
  {
    id: 'COMPANY_DUVE',
    name: 'Duve',
    aliases: ['duve'],
    depth: 'compact',
    content: `**DUVE** — Guest experience platform, pre-arrival to post-stay communication.`,
  },
];

// ──────────────────────────────────────────────────────────────────
// Get a company by ID
// ──────────────────────────────────────────────────────────────────
export function getCompanyById(id: string): CompanyContext | undefined {
  return COMPANIES.find((c) => c.id === id);
}

// ──────────────────────────────────────────────────────────────────
// Detect company from recruiter context or conversation
// ──────────────────────────────────────────────────────────────────
export function detectCompany(text: string): CompanyContext | undefined {
  const lower = text.toLowerCase();
  return COMPANIES.find((company) =>
    company.aliases.some((alias) => lower.includes(alias.toLowerCase()))
  );
}
