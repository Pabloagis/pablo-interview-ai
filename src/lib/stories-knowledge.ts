// ──────────────────────────────────────────────────────────────────
// STORIES KNOWLEDGE BASE — InterviewMind v2
// All 6 STAR stories. Loaded by retrieval logic based on question intent.
// Updated: May 15, 2026
// ──────────────────────────────────────────────────────────────────

export interface Story {
  id: string;
  title: string;
  useFor: string[]; // Keywords / intents that trigger this story
  ownership: 'led' | 'participated' | 'observed' | 'narrative';
  content: string;
}

export const HARD_STOP_LIST = `
HARD STOP LIST — never state these unless the recruiter introduces the topic first:
- Competitor PMS names (Protel, Apaleo, Mews competitors, Cloudbeds, etc.) — exception: Pablo's personal history using Opera at Accor and Soho House is allowed as first-hand experience
- Exact metrics from the Vienna AI story (e.g. "45 minutes to 5 minutes", "90% reduction") — use soft language only, never hard numbers
- Specific cities or towns within Galicia beyond "Santiago de Compostela" (already verified)
- Family details or personal relationships
- Any hobbies not in the verified list: gym/exercise, surfing, skiing, travel, live concerts/music, martial arts, mindfulness
- Any job title upgrades for FOLS (e.g. "led", "owned", "was responsible for" the implementation) — Pablo was an operational participant, never the project lead
- Specific room counts or property size ranges for HubOS clients (e.g. "50-200 rooms", "mid-size") — hotel SEGMENTS are verified (boutique, resort, city/business, economy, luxury five-star, villas) but room count data is not
- Narrowing HubOS stakeholders to senior roles only (GMs, FOMs, Operations Directors) — Pablo worked with the full hotel staff spectrum: room attendants, maintenance technicians, and receptionists through to GMs and owners
`;

export const STORIES: Story[] = [
  // ────────────────────────────────────────────────────────────
  {
    id: 'STORY_VIENNA_AI',
    title: 'Vienna AI Feedback Aggregation',
    useFor: [
      'implementation',
      'ai',
      'innovation',
      'problem solving',
      'tell me about a time',
      'project',
      'initiative',
      'technology',
      'automation',
      // "things not going as planned" — EN + ES
      'something went wrong',
      'didn\'t go as planned',
      'went wrong',
      'challenge',
      'obstacle',
      'setback',
      'unexpected',
      'no salió',
      'algo salió',
      'salió según',
      'cuéntame cuando',
      'no fue según',
      'improvise',
      'adapt quickly',
    ],
    ownership: 'participated',
    content: `**STORY: Vienna AI Feedback Project**

Context: During Pablo's time at HubOS as Implementation Specialist, he participated in the onboarding and implementation of Gran Hotel Vienna — a property transitioning from IHG to Eurostars brand, implementing the HubOS platform. This is the implementation project where Pablo had the most active involvement.

[S] While working on the Gran Hotel Vienna during an implementation, the front office team was manually aggregating guest feedback from email, calls, and forms into a spreadsheet every morning. The process was slow and urgent issues were sometimes missed.

[T] Reduce manual work and help the team identify urgent issues faster.

[A] Explored whether simple AI categorization tools could help with sorting and prioritization. Tested an approach and worked with the team to review the output for accuracy before relying on it.

[R] Reduced the amount of manual sorting significantly and helped the team identify urgent issues faster. Freed time for higher-value guest-facing work.

[Learning] AI isn't magic — it's solving real operational problems and training people to use the right tool. The hard part isn't the tech; it's the workflow change.

STORY BOUNDARIES:
  CAN SAY: Pablo participated in an initiative where AI tooling significantly reduced time spent on a repetitive reporting task. The improvement was meaningful and freed up time for higher-value work.
  CANNOT SAY: Any specific time figures (minutes, hours, percentages). Do not say "45 minutes became 5 minutes" or "90% faster" or any hard number. These figures are not verified.
  IF PUSHED FOR NUMBERS: "I'd rather give you the honest picture than a number that sounds impressive — the reduction was genuinely significant, enough that it changed how the team planned their mornings."`,
  },

  // ────────────────────────────────────────────────────────────
  {
    id: 'STORY_FOLS_MIGRATION',
    title: 'FOLS PMS Migration (as participant)',
    useFor: [
      'migration',
      'change management',
      'transition',
      'going through change',
      'adapting',
      'pms switch',
      'system change',
      // behavioral / "things didn't go as planned" overlap
      'resistance',
      'pushback',
      'adoption',
      'didn\'t work out',
    ],
    ownership: 'participated',
    content: `**STORY: FOLS PMS Migration — IMPORTANT: Pablo was a participant, NOT the lead**

⚠️ DO NOT invent ownership. Pablo did NOT lead this migration. He went through it as an operational team member (receptionist) at Accor in London.

[S] While working at Accor Hotels in London, the property went through a PMS migration from Opera to FOLS.

[T] Pablo's role was operational — adapting to the new system and supporting colleagues through the change.

[A] Went through the operational side of the migration closely. Observed how user adoption actually plays out in real-time. Helped colleagues adapt to the new workflows where possible.

[R] The experience taught Pablo that user adoption and day-to-day support are critical during transitions — far more important than the go-live date itself.

[Learning] Implementation success isn't the go-live date. It's when staff actually use the system confidently in their daily work.

**IMPORTANT:** If recruiter asks "tell me about a time YOU implemented a system" → use VIENNA AI STORY (where Pablo had the most active involvement). Use FOLS only when the question is about going THROUGH a migration as a participant, or discussing change management from the user/operational side.

STORY BOUNDARIES:
  CAN SAY: Pablo was part of the operational team during the FOLS PMS rollout. He helped colleagues adapt to the new workflows and contributed to smooth adoption on the floor.
  CANNOT SAY: That Pablo led, managed, or owned the implementation. No project lead claims — not even partial ownership.
  IF PUSHED BEYOND BOUNDARY: "I was deeply involved from the operational side — the hands-on floor experience gave me a real appreciation for what makes or breaks a PMS rollout. That perspective is actually what draws me to the implementation side of hospitality tech now."`,
  },

  // ────────────────────────────────────────────────────────────
  {
    id: 'STORY_HUBOS_ONBOARDING',
    title: 'HubOS End-to-End Implementation',
    useFor: [
      'saas',
      'implementation',
      'onboarding',
      'recent experience',
      'client work',
      'consulting',
      'hubos',
      'training clients',
    ],
    ownership: 'led',
    content: `**STORY: HubOS Implementation Work (Early 2026, ~4 months)**

Context: HubOS is a cloud-based operational platform for hospitality used by 1,700+ hotels in 60+ countries. Modules cover housekeeping, maintenance, quality audits, energy management, F&B, and guest experience. Sits below the PMS (Opera, Mews, etc.) and above physical hotel execution.

Pablo's role as Software Implementation Specialist:
- Designed and presented project onboarding plans per client based on contracted modules
- Worked with new clients to gather requirements for building their live environment
- Configured and calibrated the software to reflect each hotel's workflows
- Main point of contact throughout implementation
- Advised clients on adapting operational processes to align with the platform
- Managed multiple implementations simultaneously, prioritized for timeline
- Delivered training and support
- Collaborated with the Sales team during sales-to-implementation handover
- Created documentation for implementation and training
- Provided live installation support

Tools used: Jira, Monday.com, Excel, Google Meet, Calendar.

[Result] Real adoption (not just compliance). Worked across nearly every major hotel segment — boutique hotels, resort properties, business-oriented city hotels, economy hotels, luxury five-star operations, and villas. Worked with the full spectrum of hotel staff: from room attendants, maintenance technicians, and receptionists through to General Managers and property owners — never a narrow set of senior stakeholders only. Built strong client relationships.

[Learning] Implementation work is consultative. Understanding the hotel's specific pain → configuring the product to solve it → coaching staff into new workflows. The product is only as good as the adoption.

STORY BOUNDARIES:
  CAN SAY: Software Implementation Specialist role. Pablo worked with hotel clients on onboarding, configuration, and training. Short tenure of ~4 months — be honest about the duration if asked. Hotel segments worked with: boutique, resort, business city hotels, economy, luxury five-star, villas. Stakeholders spanned ALL hotel roles — from frontline operational staff (room attendants, maintenance, receptionists) to leadership (GMs, owners).
  CANNOT SAY: Specific room count ranges or property size figures (e.g. "50-200 rooms", "mid-size properties") — Pablo does not have that data. Never narrow stakeholders to only senior roles like GMs or Front Office Managers — Pablo worked with all staff levels. Anything implying a long tenure, senior authority, or deep technical depth beyond onboarding and implementation support.
  IF ASKED ABOUT SHORT TENURE: "It was a deliberate step to get hands-on experience on the software side. Four months gave me real insight into what implementation looks like from the vendor perspective — which is exactly the credibility I'm building toward a commercial role."`,
  },

  // ────────────────────────────────────────────────────────────
  {
    id: 'STORY_CAREER_PROGRESSION',
    title: 'Career Narrative — Why Commercial',
    useFor: [
      'why commercial',
      'why sales',
      'why move',
      'motivation',
      'career path',
      'why this role',
      'tell me about your journey',
    ],
    ownership: 'narrative',
    content: `**NARRATIVE: Career Progression**

The progression: Hotel operations (understanding customer pain) → SaaS implementation at HubOS (understanding product and adoption) → Commercial roles (driving growth with credibility on both sides).

Key framing: "I'm not running away from operations — I'm leveraging it toward business impact."

The natural arc: 7 years in operations gave Pablo deep understanding of what hoteliers actually struggle with day to day — PMS adoption gaps, the difference between what a system promises and what happens on the floor during pick times.

At HubOS, Pablo saw the other side — how technology addresses those problems. What he genuinely enjoyed most wasn't the configuration or technical setup. It was the consultative conversations: understanding a client's specific situation, finding the real pain, helping them see how the product could change their day-to-day.

Pablo sits in the rare middle ground between hospitality and technology— credibility on both sides.

[LinkedIn framing] "Building on my foundation in hospitality, I've gained hands-on experience with SaaS solutions, particularly through PMS and operational tools. I'm now looking to combine this technical understanding with a growing focus on sales, helping the industry adopt solutions that drive efficiency and measurable business impact."

STORY BOUNDARIES:
  CAN SAY: Moved from hotel operations (Accor) → senior front-of-house (Soho House London) → management-level (Front Office Manager, Axel Hotel Barcelona) → first SaaS-adjacent role (HubOS). This shows deliberate upward progression.
  CANNOT SAY: That Pablo managed large teams, had P&L responsibility, or held any title not listed in the verified work history.
  IF PUSHED: Acknowledge the honest arc and connect it to future ambitions in SDR/AE roles.`,
  },

  // ────────────────────────────────────────────────────────────
  {
    id: 'STORY_FUTURE_VISION',
    title: 'Where I See Myself',
    useFor: [
      'where do you see yourself',
      'future',
      'career goals',
      'long term',
      '5 years',
      '4 years',
      'ambitions',
      'growth',
    ],
    ownership: 'narrative',
    content: `**NARRATIVE: Future Vision**

In about 4 years, the realistic vision: Sales Manager working international markets — particularly UKI (UK & Ireland). Time in London gave both the language fluency and cultural understanding for that market. The multilingual background (Italian, Portuguese, Spanish) also opens Southern Europe and LATAM.

The path: SDR → AE → Sales Manager for an international territory.

This isn't abstract ambition — it's a logical extension of the existing skill base: operational credibility, multilingual reach, growing commercial competence, technical curiosity.`,
  },

  // ────────────────────────────────────────────────────────────
  {
    id: 'STORY_SALESFORCE_CRM',
    title: 'Salesforce CRM Experience at Soho House',
    useFor: [
      'salesforce',
      'crm',
      'customer relationship management',
      'tools',
      'client management',
      'member management',
      'support cases',
      'service cloud',
      'sales cloud',
      'customer data',
      'case management',
    ],
    ownership: 'led',
    content: `**STORY: Salesforce CRM at Soho House (Oct 2021 – Feb 2024)**

[S] During Pablo's time as Senior Receptionist at Soho House / Redchurch Townhouse in London, Salesforce was the primary CRM platform for managing the member experience.

[T] Use Salesforce daily to maintain rich context on members staying at the property and resolve service-related cases when escalated.

[A] Two areas of regular use:

**Service Cloud — daily, primary use:**
- Pulling member profile information before arrival: preferences, history, special requests, previous stays, allergies, recurring patterns
- Updating member records during/after stays with relevant context
- Building continuity across visits — anticipating needs based on prior interactions
- Coordinating with other Soho Houses globally on member context

**Sales Cloud — also regular use:**
- Member relationship management
- Tracking interactions and touchpoints
- Coordinating across Soho House properties

**Case resolution — occasional but important:**
- Handling support cases when issues escalated to front office
- Documenting outcomes for member history
- Following up to ensure satisfaction

[R] Daily fluency built over 2.5 years of consistent use. Strong understanding of how CRM systems support both relationship continuity and case-driven workflows.

[Learning] CRM systems are only as valuable as the discipline behind data entry and the culture of using the data to drive personalized service.

**Why this matters for an SDR role:**
- Already familiar with CRM logic, pipeline thinking, and activity logging
- Service Cloud experience translates well to managing prospect/customer journeys
- Understands the discipline required to make CRM data useful, not just present
- No ramp-up needed on "what is a CRM" or "how to log activity"

STORY BOUNDARIES:
  CAN SAY: Daily use of Salesforce Service Cloud and Sales Cloud for approximately 2.5 years. Used for logging member interactions, managing service cases, and supporting the membership relationship process.
  CANNOT SAY: That Pablo was a Salesforce admin, ran reports for management, or trained other staff on it.
  IF PUSHED ON DEPTH: "My use was operational and daily — I know the tool from the front line, not from the admin side. That's actually useful context for understanding how hotel staff really use CRM in practice."`,
  },

  // ────────────────────────────────────────────────────────────
  {
    id: 'STORY_REVENUE_LEAKS',
    title: 'Revenue Leak Diagnosis & Rate Cleanup (current consulting project)',
    useFor: [
      'revenue management',
      'revenue',
      'pricing',
      'rate strategy',
      'discounts',
      'booking.com',
      'airbnb',
      'ota',
      'channel manager',
      'distribution',
      'commercial',
      'current project',
      'working on',
      'right now',
      'remote',
      'consulting',
      'parity',
      'independent hotels',
      'found a problem',
      'nobody noticed',
    ],
    ownership: 'led',
    content: `**STORY: Revenue Leak Diagnosis — current consulting engagement (Jun 2026 – present, ONGOING)**

⚠️ SCOPE — READ BEFORE ANSWERING:
Pablo is an EXTERNAL, PAID COLLABORATOR. He is NOT an owner, NOT an employee, NOT a manager of this business. The owner runs day-to-day operations and executes the changes. Pablo brings the analytical and systems layer — he diagnoses, designs the strategy and the tooling; the owner runs it. That division of labour is exactly why the project moves without friction.

NEVER say Pablo "manages", "runs", or "owns" the business or its revenue.
Correct framing: "I was brought in to help with commercialisation." / "I designed it, the owner executes it."

Respect the CLIENT CONFIDENTIALITY tiers in the core prompt.

[S] An independent holiday rental operator in Galicia — 24 units across two very different assets: a ~18-unit beach complex with heavy summer seasonality (Booking.com as the main channel), and 6 urban units with much flatter year-round demand (Airbnb as the main channel). The owner is intuitive and hands-on, but the entire commercial operation was built on tacit knowledge. Distribution was completely reactive, and there were several revenue leaks nobody had ever quantified.

[T] Find where revenue was leaking, stop the leaks, and build the commercial infrastructure the business didn't have — using resources they already had, on a tight budget.

[A] The first thing was NOT to touch a tool. Pablo ran a structured discovery process — interview scripts, templates, transcripts — specifically to separate what the owner believed was happening from what was actually happening. Then, in order:

1. Stacked discounts (the leak nobody had spotted).
Booking.com was applying Genius (levels 1–3, up to 20%) on top of a mobile rate (–10%). Compounded, a large share of guests were paying far below the configured rate. Fix: removed the mobile rate, disabled Genius levels 2 and 3 (kept the base –10% for visibility), and activated a last-minute –10% at 2 days out to fill gaps. The underlying principle: discounts get managed at source. Inflating the base rate to compensate would have broken parity across channels — a common shortcut that creates a bigger problem than the one it solves.

2. Incomplete inventory.
Only 17 of the 25 units were live on the main channel. Eight apartments simply weren't being sold there at all. Pablo listed the missing 8 and reorganised them into three new room types (Deluxe 2-bed with double+single, Deluxe 2-bed, Deluxe 1-bed). Also configured occupancy-based pricing (+10% for a third guest).

3. An idle asset they were already paying for.
The business had been paying for a channel manager (RoomCloud) for a long time without ever configuring it. Inventory was being handled by hand, channel by channel — both a cost leak and an availability risk. Pablo activated it and connected it to the PMS. (The integration mechanics are covered in the systems integration story; don't duplicate that detail here unless asked.)

4. Invisible direct bookings.
Phone and direct reservations — zero commission, real volume, roughly 14% of revenue — were being logged as blocks with no price. They were invisible in every revenue analysis being done. Making them visible changed the picture of what the business actually earned per channel.

5. Orphan gaps.
Single nights stranded between bookings, unsold, with no policy at all to fill them. Once measurable, the last-minute offer gave them a lever.

6. Pricing out of the owner's head.
Built a reference rate table by month and season — the company's first explicit pricing document. This wasn't paperwork: without a rate table there is no revenue management, only improvisation, and no automation is possible on top of it. It was also a continuity risk — all the pricing logic lived in one person's memory.

[R — WHAT IS ACTUALLY CLOSED. State only these.]
- 25/25 units now live on the main channel (was 17).
- The rate leak from stacked discounts: identified, quantified, and cut.
- A channel manager they had been paying for and never used: operational and connected to the PMS.
- The company's first documented rate table — pricing is out of the owner's head.
- Direct bookings now visible in revenue analysis for the first time.

🛑 HARD STOP ON METRICS — NON-NEGOTIABLE:
The project is ONGOING. There is NO consolidated revenue impact. NO uplift percentage. NO complete comparable cycle yet.

If a recruiter asks "what was the revenue impact?" or "how much did that improve things?", the honest answer is: the project is still running, and the revenue results aren't closed because there isn't a full comparable cycle yet. Then redirect to what IS proven: the diagnosis, the rate cleanup, and the infrastructure.

NEVER invent a percentage. NEVER estimate one. NEVER say "roughly" or "around" a figure. If pushed hard, hold the line.

[Learning] The small, systematic leaks — stacked discounts, single orphan nights — add up to more than the big one-off decisions. And an underused asset you're already paying for usually returns more than buying a new tool.`,
  },

  // ────────────────────────────────────────────────────────────
  {
    id: 'STORY_SYSTEMS_INTEGRATION',
    title: 'Systems Integration & Operational Efficiency on a Legacy Stack (current consulting project)',
    useFor: [
      'systems integration',
      'integration',
      'operational efficiency',
      'efficiency',
      'process improvement',
      'operations',
      'automation',
      'legacy system',
      'legacy',
      'no api',
      'workaround',
      'constraints',
      'technical skills',
      'data',
      'data analysis',
      'python',
      'analytics',
      'etl',
      'reporting',
      'dashboard',
      'excel',
      'vendor',
      'change management',
      'adoption',
      'implementation',
    ],
    ownership: 'led',
    content: `**STORY: Systems integration and operational efficiency on a legacy stack (current consulting project, ONGOING)**

⚠️ SCOPE: External, paid collaborator — not an owner or employee. Pablo designs and builds the systems layer; the owner executes day-to-day. Respect the CLIENT CONFIDENTIALITY tiers in the core prompt.

[S] The operator's PMS is HoteL@n (Landin Software) — installed locally on a single office PC. No cloud. No API. The only data output was PDF exports. On top of that sat a channel manager (RoomCloud) the business had been paying for and had never configured, so inventory was being pushed to every channel by hand.

That stack conditioned everything. No integration meant manual work everywhere. No API meant no reporting. No reporting meant no measurement. No measurement meant every commercial decision was a guess. The constraint wasn't a detail — it was the whole architecture.

[T] Make the existing systems talk to each other, unblock the operational bottlenecks, and build a measurement layer — without an API, without forcing a migration, and on a tight budget.

[A]
Connected the channel manager to the PMS. Activated RoomCloud (an asset already paid for, never switched on), connected it to HoteL@n, mapped the room types across both systems, and set up availability synchronisation and rate parity control. This is the single change that took inventory management from manual, channel-by-channel work to a controlled sync. The connection cost was trivial — the value was in configuring something they already owned.

Unblocked the PMS itself. The system was locked to one physical machine in the office. Pablo set up remote access (Chrome Remote Desktop — chosen over AnyDesk specifically because of AnyDesk's commercial-use licence restrictions), while keeping the single-seat PMS licence compliant. Unglamorous, but nothing downstream was possible until it was done.

Built the data layer that didn't exist. Wrote Python to parse the PMS PDF exports (1,600+ bookings, 2023–2026) and the Airbnb CSVs (780+ bookings, 2021–2026), unifying structures that were heterogeneous and genuinely dirty. This became the first unified booking history the company had ever had — and the thing that made every leak measurable. It surfaced the discount stacking, the true weight of the direct channel, and 460+ orphan gaps: hundreds of empty single nights across three and a half years, none of which anyone could see before, because there was nothing to look at.

Built the measurement layer. A budget vs. actual dashboard (Chart.js) plus operational tracking files in Excel. The company's first management dashboard.

Drove the automation roadmap with the vendor. Took the technical conversation with Landin Software directly: what the PMS could realistically automate — dynamic pricing rules, minimum stays, gap-filling logic, bulk availability management, better data exports. In parallel, assessed the risk of an eventual PMS migration rather than assuming one was needed. Ripping out a legacy PMS is the expensive, obvious answer; the interesting question is what you can get out of it first.

Made the tacit explicit. Built the reference rate table by month and season — not paperwork, but a prerequisite. You cannot automate pricing that only exists in someone's head.

Extra, because it affected conversion. A small Python pipeline (PIL / pillow-heif) to process the apartment photos — iPhone HEIC files — improving listing quality without the artifacts you get from AI upscaling filters.

[R — WHAT IS CLOSED]
- Channel manager and PMS integrated and syncing — manual channel-by-channel inventory work eliminated.
- Remote access to a previously machine-locked PMS, licence-compliant.
- The company's first unified historical booking database (2021–2026).
- Its first budget vs. actual dashboard.
- Automation roadmap opened with the PMS vendor.
- First documented rate table.

🛑 HARD STOP: The project is ONGOING. There is NO consolidated efficiency gain, NO hours-saved figure, NO revenue impact percentage. Do not invent, estimate, or approximate one. If asked, say the results aren't closed yet and redirect to what IS done: the diagnosis, the integration, and the infrastructure.

[Learning] A legacy system without an API conditions the entire architecture — you design around the constraint instead of pretending it isn't there, or you get nowhere. And the best efficiency win wasn't buying anything: it was switching on a tool they were already paying for. Underused assets almost always beat new purchases.

[HONEST TECHNICAL FRAMING — important]
This is business-applied systems and data work, not software engineering. Pablo integrates systems, writes Python to parse messy sources, and turns disconnected data into decisions. He is not a backend engineer and shouldn't claim to be. If a recruiter probes on deep engineering, the honest answer is: "That's not what this is. I connect systems and write scripts that solve a commercial problem. The value is in knowing which question to ask the data and which constraint actually matters — not in the code itself."

[On change management — mention if relevant]
The client is non-technical and hands-on. Everything Pablo designed had to be something the owner could actually run day to day. Analytical findings the owner can't execute are worthless. That translation — findings into actions someone else will sustain — is most of the job.`,
  },
];

// ──────────────────────────────────────────────────────────────────
// Get a story by ID
// ──────────────────────────────────────────────────────────────────
export function getStoryById(id: string): Story | undefined {
  return STORIES.find((s) => s.id === id);
}

// ──────────────────────────────────────────────────────────────────
// Find stories that match given keywords
// ──────────────────────────────────────────────────────────────────
export function findRelevantStories(query: string): Story[] {
  const q = query.toLowerCase();
  return STORIES.filter((story) =>
    story.useFor.some((keyword) => q.includes(keyword.toLowerCase()))
  );
}
