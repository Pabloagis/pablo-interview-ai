// ──────────────────────────────────────────────────────────────────
// STORIES KNOWLEDGE BASE — InterviewMind v2
// STAR stories. Loaded by retrieval logic based on question intent.
// Updated: Oct 5, 2026
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
- Any city or town within Galicia — Pablo is "from Galicia", region only. This includes the town of the holiday apartments.
- Any figure from the Galicia engagement: percentages, revenue, ADR, RevPAR, occupancy, cancellation rates, night counts, booking counts, multipliers
- Sources, providers, tools or infrastructure behind competitor rate tracking
- Names of companies Pablo is interviewing with or has applied to
- Family details or personal relationships
- Any hobbies not in the verified list: gym/exercise, surfing, skiing, travel, live concerts/music, martial arts, mindfulness
- Any job title upgrades for FOLS (e.g. "led", "owned", "was responsible for" the implementation) — Pablo was an operational participant, never the project lead
- Specific room counts or property size ranges for HubOS clients (e.g. "50-200 rooms", "mid-size") — hotel SEGMENTS are verified (boutique, resort, city/business, economy, luxury five-star, villas) but room count data is not
- Narrowing HubOS stakeholders to senior roles only (GMs, FOMs, Operations Directors) — Pablo worked with the full hotel staff spectrum: room attendants, maintenance technicians, and receptionists through to GMs and owners
`;

// ORDER MATTERS: retrieval loads only the first 2 matching stories, in this order.
export const STORIES: Story[] = [
  // ────────────────────────────────────────────────────────────
  {
    id: 'STORY_DORMANT_CHANNEL_MANAGER',
    title: 'Dormant Channel Manager — adoption first, then optimise (Galicia engagement, summer 2026 — completed)',
    useFor: [
      // adoption / customer success framing
      'adoption',
      'retention',
      'churn',
      'customer success',
      'not using',
      'wasn\'t using',
      'weren\'t using',
      'wasn\'t being used',
      'unused',
      'underused',
      'paying for',
      // revenue / channel framing
      'channel manager',
      'distribution',
      'ota',
      'inventory',
      'revenue',
      'integration',
      'integrate',
    ],
    ownership: 'led',
    content: `**STORY: The Dormant Channel Manager (Galicia engagement, summer 2026 — COMPLETED, always past tense)**

⚠️ SCOPE: External collaborator on a ~25-unit holiday apartment portfolio in Galicia — not owner, not employee. Respect the CLIENT CONFIDENTIALITY tiers and the GALICIA RESULTS hard rule. No figures of any kind. Never the town.

This story has TWO framings. Choose by the question:
- Questions about adoption, customer success, retention, churn, onboarding, "a customer not using the product", unused tools → use FRAMING A.
- Questions about revenue, distribution, channels, OTAs, inventory, results → use FRAMING B.
Use only one framing per answer unless the recruiter asks for both angles.

── FRAMING A: Adoption / Customer Success ──
[S] The client was paying for a channel manager (RoomCloud) that had never been configured or connected to the PMS. Availability was being updated by hand, channel by channel.
[T] Get value out of what they were already paying for, before adding anything new.
[A] Pablo ran discovery first: a conversation with the owner, a review of the systems in place, and a look at the historical booking data. Then, instead of adding new tools, he activated the channel manager and integrated it with the PMS via API.
[R] Availability went from manual to automatic and real-time.
[Learning] A contracted tool nobody uses is a value risk and a retention risk — for the client and for the vendor. Fix adoption first, then optimise.

── FRAMING B: Revenue / Channel ──
[S] Inventory was being distributed by hand and badly — apartments were sitting empty that could have been sold.
[T] Get the unsold inventory back on the market.
[A] Activated the dormant channel manager and integrated it with the PMS via API, so availability flowed to the channels automatically and in real time.
[R] The integration returned unsold inventory to the market. The season has closed and the owner's season target was met. Attribution is deliberately limited: what Pablo owns is the inventory recovery — the destination is highly seasonal, so he does not claim the whole season result.

STORY BOUNDARIES:
  CAN SAY: Everything above. The season target was met. The part he owns is putting unsold inventory back on the market.
  CANNOT SAY: Any percentage, revenue, ADR, RevPAR, occupancy, night count, booking count or multiplier. The town. The owner's name. That the engagement is ongoing.
  IF PUSHED FOR NUMBERS: "The season has closed and results are measured. The owner's season target was met. I don't share a client's figures, but the part I own is putting unsold inventory back on the market by connecting the channel manager to the PMS."`,
  },

  // ────────────────────────────────────────────────────────────
  {
    id: 'STORY_MELIA_MADEIRA_MARE',
    title: 'Meliá Madeira Mare Implementation (HubOS, 2026)',
    useFor: [
      'implementation',
      'implemented',
      'you led',
      'go-live',
      'go live',
      'rollout',
      'roll out',
      'training',
      'trained',
      'onboarding',
      'on-site',
      'onsite',
      'housekeeping',
      'maintenance',
      'meliá',
      'melia',
      'madeira',
      'stakeholder',
    ],
    ownership: 'led',
    content: `**STORY: Meliá Madeira Mare — HubOS implementation (as a HubOS employee, Jan–Apr 2026 contract)**

[S] Meliá Madeira Mare was implementing HubOS's housekeeping and maintenance modules. Pablo was the Software Implementation Specialist on the account.

[T] Configure the modules to match how the hotel actually runs, get every department using them, and hand over cleanly to support.

[A] Configured the housekeeping and maintenance modules: room workflows, areas, machinery, assets, and automated periodic checks. Worked directly with the deputy GM, the executive housekeeper and the head of maintenance to get the configuration right. Trained housekeeping, maintenance, front desk, PR and bars as separate groups, because each team uses the system differently. Format: 5 days on-site, then 2 weeks of hands-on support, then a handover to the support team.

[R] Each department was trained on its own workflows, and the account went through the full sequence — on-site week, hands-on support, then a structured handover to support.

[Learning] Training by department, not in one big session, is what makes adoption stick — each team needs to see its own day in the tool.

Context: this was one of 6–7 go-lives Pablo delivered in 4 months at HubOS, mostly on-site, while keeping configuration and onboarding moving for other accounts in parallel.

STORY BOUNDARIES:
  CAN SAY: Everything above.
  CANNOT SAY: Room counts or property size. Adoption percentages, time savings or any metric. Any incident or anecdote not written above. Any reason for leaving HubOS beyond "It was a fixed-term contract, and I completed it."`,
  },

  // ────────────────────────────────────────────────────────────
  {
    id: 'STORY_REVENUE_OPPORTUNITY_ENGINE',
    title: 'Revenue Opportunity Engine — how Pablo builds with AI',
    useFor: [
      'opportunity engine',
      'revenue intelligence',
      'forecast',
      'pricing',
      'python',
      'sql',
      'code',
      'coding',
      'programming',
      'engineer',
      'developer',
      'how you build',
      'how do you build',
      'how do you actually build',
      'build software',
      'built it',
      'technical skills',
      'technical background',
      'technical',
      ' ai ',
      ' ai?',
      ' ai,',
      ' ai.',
      'ai-assisted',
      'ai assisted',
      'artificial intelligence',
      'claude',
      ' api',
      'xml',
      'side project',
      'projects',
      'what else are you building',
    ],
    ownership: 'led',
    content: `**STORY: The Revenue Opportunity Engine**

NAMING: Always call it the "Revenue Opportunity Engine". "Opportunity Engine", "Revenue Intelligence" and "the forecasting model" are the SAME tool — never present them as separate projects.

What it is: an internal decision-support tool — NOT a revenue management system (RMS) — built for the Galicia engagement (summer 2026). It analyses booking data from the summers of 2022–2026 and ranks typed opportunities: orphan nights, stay extensions, minimum stays, channel inventory mismatches, and underpriced nights.

[S] The client had years of booking history and no way to turn it into pricing and distribution decisions.
[T] Build a tool that surfaces the specific, actionable opportunities — and keeps a human in charge of every decision.
[A — how it was built] Pablo set the rules and validated the outputs. Claude Code wrote the code under approval gates: one file per turn, the diff shown to him, and nothing moving until he approved it. Mutation testing confirmed the tests actually catch errors (deliberately breaking the code to check the tests notice). This is the best concrete example of HOW Pablo works with AI — use it when asked about technical skills, coding, or AI.
[A — integration] From August 2026 it had a live two-way connection with the RoomCloud channel manager's XML API: reading rates and inventory, then writing prices. Human in the loop: it recommends, and a price is only written when Pablo accepts it. It never executes a pricing decision on its own.
[A — product judgement] Long-range recommendations are limited to "hot dates" — Pablo defined and validated the hot-date criteria. He noticed holiday eves weren't being priced up, and the historical booking data confirmed it.
[A — demand signals] It uses weather and local demand/search signals. Don't name the specific APIs unless asked.
[Learning] The judgement is the product: which opportunities matter, which dates deserve attention, and when a human must say yes.

HOW TO EXPLAIN TO NON-TECHNICAL PEOPLE: no jargon, no figures. E.g. "It looks at past bookings and points out where nights are being left empty or sold too cheaply — then suggests a fix, and I decide whether it goes live."

STORY BOUNDARIES:
  CAN SAY: Everything above. Built through AI-assisted development with Claude Code; Pablo specifies, directs and validates.
  CANNOT SAY: That Pablo wrote the code, or knows Python, SQL, htmx or any language/framework. Any multiplier, uplift, occupancy or revenue figure. That it prices automatically. Do NOT bring up competitor rate tracking — only if asked specifically how competitor rates are obtained, and then only the fixed sentence in the core prompt.`,
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
      'go-live',
      'go live',
      'parallel',
      'multiple clients',
      'juggle',
      'prioritize',
      'prioritise',
    ],
    ownership: 'led',
    content: `**STORY: HubOS Implementation Work (Jan–Apr 2026, 4 months, fixed-term contract, completed)**

Context: HubOS is a cloud-based operational platform for hospitality used by 1,700+ hotels in 60+ countries. Modules cover housekeeping, maintenance, quality audits, energy management, F&B, and guest experience. Sits below the PMS (Opera, Mews, etc.) and above physical hotel execution.

Pablo's role as Software Implementation Specialist:
- Designed and presented project onboarding plans per client based on contracted modules
- Worked with new clients to gather requirements for building their live environment
- Configured and calibrated the software to reflect each hotel's workflows
- Main point of contact throughout implementation
- Advised clients on adapting operational processes to align with the platform
- Managed multiple implementations simultaneously, prioritized for timeline
- Parallel delivery: 6–7 go-lives in 4 months, mostly on-site, while keeping configuration and onboarding moving for other accounts in parallel
- Delivered training and support
- Collaborated with the Sales team during sales-to-implementation handover
- Created documentation for implementation and training
- Provided live installation support

Tools used: Jira, Monday.com, Excel, Google Meet, Calendar.

Example implementations: Meliá Madeira Mare (see that story for detail) and Gran Hotel Vienna.

[Result] 6–7 go-lives in 4 months, mostly on-site, with other onboardings kept moving in parallel. Real adoption (not just compliance). Worked across nearly every major hotel segment — boutique hotels, resort properties, business-oriented city hotels, economy hotels, luxury five-star operations, and villas. Worked with the full spectrum of hotel staff: from room attendants, maintenance technicians, and receptionists through to General Managers and property owners — never a narrow set of senior stakeholders only. Built strong client relationships.

[Learning] Implementation work is consultative. Understanding the hotel's specific pain → configuring the product to solve it → coaching staff into new workflows. The product is only as good as the adoption.

STORY BOUNDARIES:
  CAN SAY: Software Implementation Specialist role, Jan–Apr 2026. Pablo worked with hotel clients on onboarding, configuration, and training. 6–7 go-lives in 4 months, mostly on-site. Tenure of 4 months — be plain about the duration if asked. Hotel segments worked with: boutique, resort, business city hotels, economy, luxury five-star, villas. Stakeholders spanned ALL hotel roles — from frontline operational staff (room attendants, maintenance, receptionists) to leadership (GMs, owners).
  CANNOT SAY: Specific room count ranges or property size figures (e.g. "50-200 rooms", "mid-size properties") — Pablo does not have that data. Never narrow stakeholders to only senior roles like GMs or Front Office Managers — Pablo worked with all staff levels. Anything implying a long tenure, senior authority, or deep technical depth beyond onboarding and implementation support.
  IF ASKED WHY IT WAS SHORT / WHY HE LEFT: "It was a fixed-term contract, and I completed it." Nothing more — no reason for the term, no strategic framing, no elaboration even if pushed.`,
  },

  // ────────────────────────────────────────────────────────────
  {
    id: 'STORY_VIENNA_AI',
    title: 'Vienna AI Feedback Aggregation',
    useFor: [
      'implementation',
      // word-safe: a bare 'ai' substring also matched "training", "explain", "said"
      ' ai ',
      ' ai?',
      ' ai,',
      ' ai.',
      'ai tool',
      'artificial intelligence',
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

**IMPORTANT:** If recruiter asks "tell me about a time YOU implemented a system" or "an implementation you led" → use the MELIÁ MADEIRA MARE story and the HubOS implementation story. Use FOLS only when the question is about going THROUGH a migration as a participant, or discussing change management from the user/operational side.

STORY BOUNDARIES:
  CAN SAY: Pablo was part of the operational team during the FOLS PMS rollout. He helped colleagues adapt to the new workflows and contributed to smooth adoption on the floor.
  CANNOT SAY: That Pablo led, managed, or owned the implementation. No project lead claims — not even partial ownership.
  IF PUSHED BEYOND BOUNDARY: "I was deeply involved from the operational side — the hands-on floor experience gave me a real appreciation for what makes or breaks a PMS rollout. That perspective is actually what draws me to the implementation side of hospitality tech now."`,
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

The natural arc: years in hotel operations (over six years of professional experience in total) gave Pablo deep understanding of what hoteliers actually struggle with day to day — PMS adoption gaps, the difference between what a system promises and what happens on the floor during pick times.

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
- Logging guest preferences
- Tracking guest feedback
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
  CAN SAY: Daily use of Salesforce Service Cloud (member context) and Sales Cloud (relationship management) for approximately 2.5 years. Updating records, logging guest preferences, tracking feedback, managing service cases, and supporting the membership relationship process.
  CANNOT SAY: That Pablo was a Salesforce admin, ran reports for management, or trained other staff on it.
  IF PUSHED ON DEPTH: "My use was operational and daily — I know the tool from the front line, not from the admin side. That's actually useful context for understanding how hotel staff really use CRM in practice."`,
  },

  // ────────────────────────────────────────────────────────────
  {
    id: 'STORY_REVENUE_LEAKS',
    title: 'Revenue Leak Diagnosis & Rate Cleanup (Galicia engagement, summer 2026 — completed)',
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
      'consulting',
      'results',
      'apartment',
      'galicia',
      'still with',
      'parity',
      'independent hotels',
      'found a problem',
      'nobody noticed',
    ],
    ownership: 'led',
    content: `**STORY: Revenue Leak Diagnosis — Galicia engagement (summer 2026 season, from Jun 2026 — COMPLETED)**

⚠️ SCOPE — READ BEFORE ANSWERING:
Pablo was an EXTERNAL COLLABORATOR. He was NOT an owner, NOT an employee, NOT a manager of this business. It was a side engagement taken on alongside his search for a role at a tech company. The season has closed and he is NOT continuing with this client. ALWAYS past tense — never "currently managing". The owner ran day-to-day operations and executed the changes. Pablo brought the analytical and systems layer — he diagnosed, designed the strategy and the tooling; the owner ran it.

NEVER say Pablo "managed", "ran", or "owned" the business or its revenue.
Correct framing: "I was brought in to help with commercialisation." / "I designed it, the owner executed it."

Respect the CLIENT CONFIDENTIALITY tiers and the GALICIA RESULTS hard rule in the core prompt.

[S] A ~25-unit holiday apartment portfolio in Galicia across two very different assets: a beach complex with heavy summer seasonality (Booking.com as the main channel), and a smaller set of urban units with much flatter demand (Airbnb as the main channel). The owner is intuitive and hands-on, but the entire commercial operation was built on tacit knowledge. Distribution was completely reactive, and there were several revenue leaks nobody had ever quantified.

[T] Find where revenue was leaking, stop the leaks, and build the commercial infrastructure the business didn't have — using resources they already had, on a tight budget.

[A] The first thing was NOT to touch a tool. Pablo ran a structured discovery process — interview scripts, templates, transcripts — specifically to separate what the owner believed was happening from what was actually happening. Then, in order:

1. Stacked discounts (the leak nobody had spotted).
Booking.com was applying several Genius levels on top of a mobile rate. Compounded, a large share of guests were paying far below the configured rate. Fix: removed the mobile rate, disabled the higher Genius levels (kept the base level for visibility), and activated a short-notice last-minute offer to fill gaps. The underlying principle: discounts get managed at source. Inflating the base rate to compensate would have broken parity across channels — a common shortcut that creates a bigger problem than the one it solves.

2. Incomplete inventory.
Only some of the units were live on the channels. Some apartments simply weren't being sold there at all. Pablo listed the missing apartments and reorganised them into three new room types (Deluxe 2-bed with double+single, Deluxe 2-bed, Deluxe 1-bed). Also configured occupancy-based pricing for a third guest.

3. An idle asset they were already paying for.
The business had been paying for a channel manager (RoomCloud) without ever configuring it. Pablo activated it and connected it to the PMS. (Full detail is in the DORMANT CHANNEL MANAGER story; don't duplicate it here unless asked.)

4. Invisible direct bookings.
Phone and direct reservations — zero commission, real volume — were being logged as blocks with no price. They were invisible in every revenue analysis being done. Making them visible changed the picture of what the business actually earned per channel.

5. Orphan gaps.
Single nights stranded between bookings, unsold, with no policy at all to fill them. Once measurable, the last-minute offer gave them a lever.

6. Pricing out of the owner's head.
Built a reference rate table by month and season — the company's first explicit pricing document. This wasn't paperwork: without a rate table there is no revenue management, only improvisation, and no automation is possible on top of it. It was also a continuity risk — all the pricing logic lived in one person's memory.

[R — state only these]
- The season has closed and results are measured. The owner's season target was met.
- All units live on the main channels (several were missing before).
- The rate leak from stacked discounts: identified and cut.
- A channel manager they had been paying for and never used: operational and connected to the PMS — the part Pablo owns is putting unsold inventory back on the market.
- The company's first documented rate table — pricing out of the owner's head.
- Direct bookings visible in revenue analysis for the first time.

🛑 HARD STOP ON METRICS — NON-NEGOTIABLE (see GALICIA RESULTS in the core prompt):
If asked for the impact, give the fixed answer: "The season has closed and results are measured. The owner's season target was met. I don't share a client's figures, but the part I own is putting unsold inventory back on the market by connecting the channel manager to the PMS."
NEVER give percentages, revenue, ADR, RevPAR, occupancy, cancellation rates, night counts or multipliers. NEVER estimate one. NEVER say "roughly" or "around" a figure. If pushed hard, hold the line.
If asked whether he still works with them: "No. It was a summer-season engagement and it's complete. My focus now is joining a hospitality-tech company."

[Learning] The small, systematic leaks — stacked discounts, single orphan nights — add up to more than the big one-off decisions. And an underused asset you're already paying for usually returns more than buying a new tool.`,
  },

  // ────────────────────────────────────────────────────────────
  {
    id: 'STORY_SYSTEMS_INTEGRATION',
    title: 'Systems Integration & Operational Efficiency on a Legacy Stack (Galicia engagement, summer 2026 — completed)',
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
      'data pipeline',
      'do you code',
      'programming',
      'coding',
      'build things',
      'technical background',
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
    content: `**STORY: Systems integration and operational efficiency on a legacy stack (Galicia engagement, summer 2026 — COMPLETED)**

⚠️ SCOPE: External collaborator — not an owner or employee. Pablo designed and built the systems layer; the owner executed day-to-day. The engagement is complete; always past tense. Respect the CLIENT CONFIDENTIALITY tiers and the GALICIA RESULTS hard rule in the core prompt.

[S] The operator's stack had two very different problems, and telling them apart was the first piece of real analysis.

The data layer: genuinely closed. The PMS is HoteL@n (Landin Software) — a legacy local install on a single office PC. No cloud. No API for getting historical data out. The only way data came out was PDF exports. No reporting, no measurement, no way to quantify anything.

The distribution layer: open, and never used. HoteL@n DOES expose a channel manager API. And the business was already paying for a channel manager (RoomCloud) — which had never been configured. So the plumbing for distribution existed, was paid for, and had simply never been switched on. Inventory was being pushed to every channel by hand, one extranet at a time.

So: the distribution plumbing existed and nobody had turned it on. The data plumbing didn't exist at all. Two different problems. Two different solutions. Conflating them is exactly the mistake that leads people to recommend a full PMS migration when half the problem can be solved by configuring what's already there.

[T] Make the existing systems talk to each other, unblock the operational bottlenecks, and build a measurement layer — without a data API, without forcing a migration, and on a tight budget.

[A]
Connected the channel manager to the PMS — a real integration, via API. HoteL@n exposes a channel manager API. RoomCloud connects to it. Pablo activated RoomCloud (already paid for, never switched on), integrated it with HoteL@n via that API, mapped the room types across both systems, and set up availability synchronisation and rate parity control. This is automatic sync — not a manual workaround. It eliminated the manual, extranet-by-extranet inventory updates the business had been doing by hand. The connection cost was trivial; the value was entirely in configuring something they already owned.

Unblocked the PMS itself. The system was locked to one physical machine in the office. Pablo set up remote access (Chrome Remote Desktop — chosen over AnyDesk specifically because of AnyDesk's commercial-use licence restrictions), while keeping the single-seat PMS licence compliant. Unglamorous, but nothing downstream was possible until it was done.

Built the data layer that didn't exist. Using AI-assisted development, built a pipeline that parses the PMS PDF exports and the Airbnb CSVs, unifying structures that were heterogeneous and genuinely dirty. Pablo specified what the dataset needed to answer, directed the tooling to build it, and validated the output against the raw source records. This became the first unified booking history the company had ever had — and the thing that made every leak measurable. It surfaced the discount stacking, the true weight of the direct channel, and the orphan gaps: empty single nights stranded between bookings, none of which anyone could see before, because there was nothing to look at. (Pablo does not write the code from memory — see the AI-ASSISTED DEVELOPMENT rules in the core prompt.) This booking history is what the Revenue Opportunity Engine later analysed — see that story.

Built the measurement layer. A budget vs. actual view plus operational tracking files in Excel. The company's first management dashboard.

Drove the automation roadmap with the vendor. Took the technical conversation with Landin Software directly: what the PMS could realistically automate — dynamic pricing rules, minimum stays, gap-filling logic, bulk availability management, better data exports. In parallel, assessed the risk of an eventual PMS migration rather than assuming one was needed. Ripping out a legacy PMS is the expensive, obvious answer; the interesting question is what you can get out of it first.

Made the tacit explicit. Built the reference rate table by month and season — not paperwork, but a prerequisite. You cannot automate pricing that only exists in someone's head.

Extra, because it affected conversion. A small image-processing pipeline (again, AI-assisted) to convert the apartment photos from iPhone HEIC and improve listing quality — without the artifacts you get from AI upscaling filters.

[R]
- Channel manager and PMS integrated and syncing — manual channel-by-channel inventory work eliminated, unsold inventory back on the market.
- Remote access to a previously machine-locked PMS, licence-compliant.
- The company's first unified historical booking database.
- Its first budget vs. actual dashboard.
- Automation roadmap opened with the PMS vendor.
- First documented rate table.
- The season has closed and results are measured; the owner's season target was met.

🛑 HARD STOP: give NO efficiency gain, NO hours-saved figure, NO revenue, occupancy, ADR, RevPAR or percentage — those are the client's figures. If asked for impact, use the GALICIA RESULTS fixed answer from the core prompt.

[Learning] A legacy system without a data API conditions the entire architecture — you design around the constraint instead of pretending it isn't there, or you get nowhere. And the best efficiency win wasn't buying anything: it was switching on a tool they were already paying for. Underused assets almost always beat new purchases.

[HONEST TECHNICAL FRAMING — important]
This is business-applied systems and data work, not software engineering. Pablo integrates systems and turns disconnected data into decisions, using AI-assisted development to build the tooling he needs. He does not write code from memory. If a recruiter probes on deep engineering, the honest answer is: "That's not what this is, and I won't pretend otherwise. I'm not an engineer. I connect systems and I direct AI tooling to build what I need — then I debug it and check the output against the source data. The value is in knowing which question to ask the data and which constraint actually matters, not in the code itself."

[On change management — mention if relevant]
The client was non-technical and hands-on. Everything Pablo designed had to be something the owner could actually run day to day. Analytical findings the owner can't execute are worthless. That translation — findings into actions someone else will sustain — is most of the job.

[🛑 ANTICIPATED TECHNICAL CHALLENGE — memorise this, do NOT improvise]

A technically informed recruiter WILL ask some version of: "If the PMS had no way to get data out, how did you integrate the channel manager?"

It sounds like a contradiction. It isn't. This is the exact answer:

"Two different layers. HoteL@n has no API for pulling historical data out — the only output is PDF exports, which is why the only route to a dataset at all was building a parser on top of them. But it does expose a channel manager API, and that's how RoomCloud is integrated with it. So the distribution integration is real and automatic — availability syncs in real time, parity is controlled, no more manual extranet-by-extranet updates. What's genuinely closed is the data layer, not the distribution layer. Those get conflated a lot, and the distinction matters: it's the difference between 'you need to migrate your PMS' and 'you need to switch on the tool you're already paying for.'"

🛑 NEVER say the RoomCloud–HoteL@n connection was manual, a workaround, a bridge, or anything less than a real API integration. It is a real, automatic sync. Do not downgrade it under pressure. If you don't know a technical detail beyond this, say you'd have to check — do NOT invent a lesser version of the truth to make the story sound safer.`,
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
