// ──────────────────────────────────────────────────────────────────
// COMPANIES KNOWLEDGE BASE — InterviewMind v2
// Target companies. Deep context for Mews/HubOS/Axel. Compact for others.
// Loaded dynamically by retrieval based on recruiter company.
// Updated: May 15, 2026
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
  // MEWS — DEEP CONTEXT (Pablo had active SDR process)
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

Pablo's history with Mews:
- Active SDR process (GenMews Program) in Sep–Oct 2025
- Phone interview with Jordan Pitts (02 Oct 2025) for International Business Development Representative role
- Video interview with Kathi Rudolf & Xabier Garcés (07 Oct 2025) for same role
- Received candidate survey feedback (Sep 2025)
- **Critical recruiter feedback received:** Pablo's answers were "too general." Recruiters explicitly asked for STAR framework + measurable results. The original feedback noted: "we are looking for structure and purpose behind your story. This will give your experience depth and makes it easy for us to follow how you think, how you solve problems, and what kind of results you generate."

How to handle Mews conversations:
- Always use STAR framework with measurable results
- Lead with specific examples where possible
- Show systems thinking — how PMS connects to broader stack
- Demonstrate genuine product curiosity, not generic sales pitch
- If asked about previous feedback: be honest and reflective. "I took that feedback seriously — it's one of the reasons I've sharpened how I tell stories. I now always lead with situation and result, not just description."

Smart questions Pablo can ask in a Mews interview:
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
- Dates: Early 2026, ~4 months
- Setting: Hybrid + travel (on-site implementations)
- Tools daily: Jira, Monday.com, ReadAI, Notion, OKticket, Excel, Google Meet, Calendar

Specific implementations:
- Gran Hotel Vienna — property transitioning from IHG brand to Eurostars; HubOS platform deployment. This is where the Vienna AI feedback aggregation story took place.
- Multiple other property onboardings

Why Pablo left:
- Short-term role aligned with strategic move toward commercial / SDR / AE roles
- HubOS gave him exactly what he needed: SaaS implementation credibility, hands-on experience with hotel SaaS adoption, exposure to the consultative side
- Frame: "HubOS was the bridge I needed — direct SaaS implementation exposure that confirmed I want to move earlier into the customer journey."

How to discuss HubOS:
- Most recent and relevant role — use richly
- The Vienna AI story and general onboarding story both belong here
- Discuss as the inflection point that confirmed the commercial direction
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
- Dates: March 2025 – May 2025 (3 months, short-term operational role)
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
- Short-term operational return after London (Soho House ended Feb 2024)
- Frame honestly: Pablo took FOM role at Axel while exploring his next strategic move into hospitality tech
- Reinforced operational credibility + fresh Spanish-market exposure
- Reference is strong, available on request

If asked "Why only 3 months?":
- "It was a defined short-term role. I took it while positioning toward hospitality SaaS — which crystallized into the HubOS opportunity in early 2026. Axel gave me fresh Spanish-market exposure and a clean reference, and the months after let me focus on the transition I really wanted."`,
  },

  // ────────────────────────────────────────────────────────────
  // OTHER TARGET COMPANIES — COMPACT
  // ────────────────────────────────────────────────────────────
  {
    id: 'COMPANY_CLOUDBEDS',
    name: 'Cloudbeds',
    aliases: ['cloudbeds'],
    depth: 'compact',
    content: `**CLOUDBEDS** — All-in-one PMS. Cloud-native, targets independent and small chain hotels globally. Direct Mews competitor. Pablo applied for Sales Manager role.`,
  },
  {
    id: 'COMPANY_SHIJI',
    name: 'Shiji Group',
    aliases: ['shiji', 'shiji group'],
    depth: 'compact',
    content: `**SHIJI GROUP** — Hospitality tech platform, PMS implementation. Pablo interviewed for PMS Implementation Consultant role (Jul 2025, contact: Milla Moiseitseva).`,
  },
  {
    id: 'COMPANY_SU',
    name: 'SU / The Access Group',
    aliases: ['su', 'staah', 'the access group', 'access group'],
    depth: 'compact',
    content: `**SU (STAAH / The Access Group)** — Hospitality connectivity infrastructure. White-label API connectivity, OTA integrations. Competes with SiteMinder, D-EDGE, DerbySoft. Pablo was in active process.`,
  },
  {
    id: 'COMPANY_LIGHTHOUSE',
    name: 'Lighthouse',
    aliases: ['lighthouse'],
    depth: 'compact',
    content: `**LIGHTHOUSE** — Revenue intelligence platform for hospitality. Pablo reached out to AE contact (Andrés Benito, May 2026).`,
  },
  {
    id: 'COMPANY_HUBSPOT',
    name: 'HubSpot',
    aliases: ['hubspot', 'hub spot'],
    depth: 'compact',
    content: `**HUBSPOT** — CRM/inbound sales platform. Mid-Market AE role in Spain explored. Requires Spanish + English (Portuguese valued). Pablo's multilingual profile fits well.`,
  },
  {
    id: 'COMPANY_VENUU',
    name: 'Venuu',
    aliases: ['venuu'],
    depth: 'compact',
    content: `**VENUU** — Event venue marketplace. B2B Sales & Onboarding Specialist (Spanish-speaking), Barcelona. Pablo interviewed Sep 2025 with Jaakko Salonen (COO).`,
  },
  {
    id: 'COMPANY_GUESTY',
    name: 'Guesty',
    aliases: ['guesty'],
    depth: 'compact',
    content: `**GUESTY** — Property management + guest experience. Pablo applied for Sales Growth Specialist role.`,
  },
  {
    id: 'COMPANY_EISI',
    name: 'EISI HOTEL',
    aliases: ['eisi', 'eisi hotel'],
    depth: 'compact',
    content: `**EISI HOTEL** — Operational compliance SaaS for hotels (housekeeping, maintenance, health & safety). Junior Implementation Consultant role explored.`,
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
