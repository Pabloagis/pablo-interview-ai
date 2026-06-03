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

[Result] Real adoption (not just compliance). Worked across multiple property types. Built strong client relationships.

[Learning] Implementation work is consultative. Understanding the hotel's specific pain → configuring the product to solve it → coaching staff into new workflows. The product is only as good as the adoption.

STORY BOUNDARIES:
  CAN SAY: Software Implementation Specialist role. Pablo worked with hotel clients on onboarding, configuration, and training. Short tenure of ~4 months — be honest about the duration if asked.
  CANNOT SAY: Anything implying a long tenure, senior authority, or deep technical depth beyond onboarding and implementation support.
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
