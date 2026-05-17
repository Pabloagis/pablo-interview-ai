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
    ],
    ownership: 'participated',
    content: `**STORY: Vienna AI Feedback Project**

Context: During Pablo's time at HubOS as Implementation Specialist, he participated in the onboarding of Gran Hotel Vienna — a property transitioning from IHG to Eurostars brand, implementing the HubOS platform. This is the implementation project where Pablo had the most active involvement.

[S] While working on the Gran Hotel Vienna implementation, the front office team was manually aggregating guest feedback from email, calls, and forms into a spreadsheet every morning. The process was slow and urgent issues were sometimes missed.

[T] Reduce manual work and help the team identify urgent issues faster.

[A] Explored whether simple AI categorization tools could help with sorting and prioritization. Tested an approach and worked with the team to review the output for accuracy before relying on it.

[R] Reduced the amount of manual sorting significantly and helped the team identify urgent issues faster. Freed time for higher-value guest-facing work.

[Learning] AI isn't magic — it's solving real operational problems and training people to use the right tool. The hard part isn't the tech; it's the workflow change.`,
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
    ],
    ownership: 'participated',
    content: `**STORY: FOLS PMS Migration — IMPORTANT: Pablo was a participant, NOT the lead**

⚠️ DO NOT invent ownership. Pablo did NOT lead this migration. He went through it as an operational team member (receptionist) at Accor in London.

[S] While working at Accor Hotels in London, the property went through a PMS migration from Opera to FOLS.

[T] Pablo's role was operational — adapting to the new system and supporting colleagues through the change.

[A] Went through the operational side of the migration closely. Observed how user adoption actually plays out in real-time. Helped colleagues adapt to the new workflows where possible.

[R] The experience taught Pablo that user adoption and day-to-day support are critical during transitions — far more important than the go-live date itself.

[Learning] Implementation success isn't the go-live date. It's when staff actually use the system confidently in their daily work.

**IMPORTANT:** If recruiter asks "tell me about a time YOU implemented a system" → use VIENNA AI STORY (where Pablo had the most active involvement). Use FOLS only when the question is about going THROUGH a migration as a participant, or discussing change management from the user/operational side.`,
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

Tools used: Jira, Monday.com, Notion, Excel, Google Meet, Calendar.

[Result] Real adoption (not just compliance). Worked across multiple property types. Built strong client relationships.

[Learning] Implementation work is consultative. Understanding the hotel's specific pain → configuring the product to solve it → coaching staff into new workflows. The product is only as good as the adoption.`,
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

Key framing: "I'm not running away from operations — I'm leveraging it toward commercial impact."

The natural arc: 7 years in operations gave Pablo deep understanding of what hoteliers actually struggle with day to day — OTA pressure, PMS adoption gaps, the difference between what a system promises and what happens on the floor at 7am during a busy check-in.

At HubOS, Pablo saw the other side — how technology addresses those problems. What he genuinely enjoyed most wasn't the configuration or technical setup. It was the consultative conversations: understanding a client's specific situation, finding the real pain, helping them see how the product could change their day-to-day.

Most SDRs in hospitality tech are either ex-hotel people who understand the pain but struggle with the commercial side, or pure sales people who know the pitch but can't speak a hotelier's language. Pablo sits in the rare middle ground — credibility on both sides.

[LinkedIn framing] "Building on my foundation in hospitality, I've gained hands-on experience with SaaS solutions, particularly through PMS and operational tools. I'm now looking to combine this technical understanding with a growing focus on sales, helping the industry adopt solutions that drive efficiency and measurable business impact."`,
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
