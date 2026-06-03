export interface StoryOption {
  label: string;
  text: string;
}

export interface StoryFieldOptions {
  situation: StoryOption[];
  task: StoryOption[];
  action: StoryOption[];
  result: StoryOption[];
}

export const STORY_TYPES: { id: string; label: string }[] = [
  { id: 'biggest_success',              label: 'Biggest professional success' },
  { id: 'biggest_failure',              label: 'Biggest failure or mistake' },
  { id: 'conflict',                     label: 'Time you handled conflict' },
  { id: 'stakeholder_disagreement',     label: 'Stakeholder disagreement' },
  { id: 'difficult_client',             label: 'Difficult client or customer challenge' },
  { id: 'lesson_learned',               label: 'Something you learned that changed how you work' },
  { id: 'leadership_without_authority', label: 'Leadership or influence without authority' },
  { id: 'managing_change',              label: 'Managing or leading change' },
  { id: 'commercial_example',           label: 'Commercial or revenue-related example' },
];

export const STORY_OPTIONS: Record<string, StoryFieldOptions> = {
  biggest_success: {
    situation: [
      { label: 'Underperforming team', text: 'The team was underperforming and results were needed quickly. Morale was low and the process wasn\'t working.' },
      { label: 'New launch, no roadmap', text: 'We were launching something new with no clear precedent. Nobody had done it before in this context.' },
      { label: 'Client at risk', text: 'A key client relationship was deteriorating and risked being lost. The situation needed to be turned around fast.' },
      { label: 'Unsolved problem', text: 'I inherited a problem that had been unresolved for a long time and previous attempts had failed.' },
    ],
    task: [
      { label: 'Turn it around', text: 'My role was to reverse the situation within a specific timeframe. The outcome was visible and measurable.' },
      { label: 'Align across teams', text: 'I needed to coordinate people who didn\'t naturally work together and had different priorities.' },
      { label: 'Solve independently', text: 'I had to figure this out without much support or authority over the people involved.' },
      { label: 'Deliver under pressure', text: 'I had to hit the target despite constraints — limited time, limited resource, high visibility.' },
    ],
    action: [
      { label: 'Mapped root cause first', text: 'Before doing anything, I spent time understanding the actual root cause rather than reacting to symptoms.' },
      { label: 'Changed the approach', text: 'I recognised the existing approach wasn\'t working and changed direction mid-way, which others were reluctant to do.' },
      { label: 'Brought the right people in', text: 'I identified who needed to be involved — including outside my direct team — and made that happen.' },
      { label: 'Simplified the problem', text: 'I broke the problem into smaller pieces and focused everyone on what would actually move the needle.' },
    ],
    result: [
      { label: 'Hit target early', text: 'We hit the target ahead of schedule. The outcome was clear and directly linked to the change in approach.' },
      { label: 'Client retained', text: 'The client renewed or extended the engagement. The relationship recovered stronger than before.' },
      { label: 'Used as a case study', text: 'My manager used this as an example for the wider team. It became a reference point for how to handle similar situations.' },
      { label: 'Process outlasted me', text: 'The process or change I put in place was still being used long after I moved on.' },
    ],
  },

  biggest_failure: {
    situation: [
      { label: 'Overconfident assumption', text: 'I assumed I understood what was needed without verifying it properly. I moved too quickly on incomplete information.' },
      { label: 'Scope grew uncontrolled', text: 'The project grew beyond what was originally agreed and I didn\'t flag it early enough.' },
      { label: 'Stakeholder misalignment', text: 'I didn\'t get the right people aligned before acting. They had a different understanding of the goal.' },
      { label: 'Underestimated complexity', text: 'What looked like a straightforward task turned out to be significantly more complex than I anticipated.' },
    ],
    task: [
      { label: 'Deliver on commitment', text: 'I had committed to a specific outcome. When it became clear I wouldn\'t deliver, I had to manage the consequences.' },
      { label: 'Fix it in real time', text: 'I had to correct course while the situation was already live, with limited room to manoeuvre.' },
      { label: 'Limit the damage', text: 'The mistake had already happened. My task was to minimise the impact and prevent it from getting worse.' },
    ],
    action: [
      { label: 'Acknowledged it early', text: 'I surfaced the problem before it became unavoidable. I didn\'t wait until I had all the answers.' },
      { label: 'Took responsibility', text: 'I owned the mistake clearly — no deflecting, no over-explaining. I told the people who needed to know.' },
      { label: 'Proposed a path forward', text: 'Rather than just flagging the problem, I came with a concrete proposal for what to do next.' },
      { label: 'Changed my process', text: 'I put a specific check in place so I wouldn\'t make the same mistake again. I can name what it is.' },
    ],
    result: [
      { label: 'Relationship survived', text: 'The relationship with the affected person or team survived. It was actually stronger because of how I handled it.' },
      { label: 'Process changed', text: 'A new process or check was put in place as a result. The team benefited from the lesson.' },
      { label: 'Clear lesson applied', text: 'I can point to a specific decision I made differently the next time because of this experience.' },
    ],
  },

  conflict: {
    situation: [
      { label: 'Disagreement on approach', text: 'Two team members or departments had a genuine disagreement about how something should be done. Both sides had valid points.' },
      { label: 'Personality clash', text: 'There was an ongoing tension between two people that was starting to affect the work and the team dynamic.' },
      { label: 'Competing priorities', text: 'Two teams needed the same resource at the same time. Neither was willing to deprioritise without a good reason.' },
      { label: 'I was in the conflict', text: 'I was directly involved in a conflict — not just mediating. Someone had a problem with me or my decisions.' },
    ],
    task: [
      { label: 'Mediate between others', text: 'I wasn\'t directly involved but I was the person in the best position to bring the parties together.' },
      { label: 'Defend my position', text: 'I needed to make my case clearly without escalating the situation or losing the relationship.' },
      { label: 'Find a workable solution', text: 'Neither side would get everything they wanted. My task was to find something both could live with.' },
    ],
    action: [
      { label: 'Listened before responding', text: 'I made sure I understood both sides fully before trying to resolve anything. I didn\'t assume I knew who was right.' },
      { label: 'Moved conversation to facts', text: 'I moved the conversation from positions to the underlying problem. What are we actually trying to achieve here?' },
      { label: 'Named the tension explicitly', text: 'I named what was happening rather than working around it. That changed the energy in the room.' },
      { label: 'Escalated when needed', text: 'I recognised I couldn\'t resolve it alone and brought in someone with the authority to make a decision.' },
    ],
    result: [
      { label: 'Issue resolved', text: 'The conflict was resolved and the working relationship continued. We moved forward with a clear agreement.' },
      { label: 'Relationship improved', text: 'The relationship was actually better after we worked through it than before. We understood each other differently.' },
      { label: 'Clear decision made', text: 'Even if not everyone was happy, we had a clear decision and everyone knew the rationale.' },
    ],
  },

  stakeholder_disagreement: {
    situation: [
      { label: 'Senior stakeholder opposed', text: 'A senior stakeholder disagreed with the direction I was recommending. They had influence over the outcome.' },
      { label: 'Cross-department conflict', text: 'Two departments had opposing views on what should happen. I was caught in the middle.' },
      { label: 'Client vs internal', text: 'What the client wanted was in tension with what our team knew was the right approach.' },
      { label: 'Data vs opinion', text: 'The evidence pointed one way but the senior opinion pointed another. I had to navigate that gap.' },
    ],
    task: [
      { label: 'Win them over', text: 'I needed to change the stakeholder\'s position without causing damage to the relationship.' },
      { label: 'Find the compromise', text: 'Neither position was fully right. I needed to find a version that worked for the business.' },
      { label: 'Escalate appropriately', text: 'I needed to raise this to someone who had the authority to make the final call.' },
    ],
    action: [
      { label: 'Understood their real concern', text: 'I spent time understanding what was actually driving their position — not just the surface disagreement.' },
      { label: 'Reframed the question', text: 'I reframed what we were deciding so both sides could see a path to agreeing.' },
      { label: 'Used data to depersonalise', text: 'I brought in evidence that moved the conversation away from opinions to facts.' },
      { label: 'Gave them a win within the compromise', text: 'I found something in the compromise that the stakeholder could present as a success for their priorities.' },
    ],
    result: [
      { label: 'Alignment reached', text: 'We reached alignment. The project moved forward with everyone committed to the same direction.' },
      { label: 'Decision accepted', text: 'Even without full agreement, the stakeholder accepted the decision and supported it publicly.' },
      { label: 'Relationship preserved', text: 'The relationship survived the disagreement. We worked together effectively afterwards.' },
    ],
  },

  difficult_client: {
    situation: [
      { label: 'Unrealistic expectations', text: 'The client had expectations that were not achievable within the agreed scope or timeline.' },
      { label: 'Frustrated and escalating', text: 'The client was frustrated — with valid reason — and was starting to escalate.' },
      { label: 'Change of mind mid-project', text: 'The client changed what they wanted mid-way through. It affected everything we had agreed.' },
      { label: 'Resistant to the solution', text: 'The client was resistant to adopting or implementing what we had delivered. They weren\'t using it properly.' },
    ],
    task: [
      { label: 'De-escalate and rebuild trust', text: 'My immediate task was to de-escalate the situation and stop it getting worse.' },
      { label: 'Reset expectations', text: 'I needed to have an honest conversation about what was realistic without losing the relationship.' },
      { label: 'Deliver the outcome anyway', text: 'Despite the difficulty, I still needed to deliver the agreed outcome. The relationship couldn\'t get in the way.' },
    ],
    action: [
      { label: 'Got in front of them quickly', text: 'I didn\'t let it sit in email. I got in front of them — in person or on a call — as quickly as possible.' },
      { label: 'Acknowledged the problem first', text: 'Before explaining, defending or solving, I acknowledged their experience. That changed the tone.' },
      { label: 'Gave them a clear next step', text: 'I told them exactly what was going to happen next and by when. I removed the uncertainty.' },
      { label: 'Involved the right people', text: 'I brought in whoever was needed — internally or externally — to actually fix the problem rather than just manage it.' },
    ],
    result: [
      { label: 'Client retained', text: 'The client stayed. The relationship recovered and we continued working together.' },
      { label: 'Referral or renewal', text: 'The client renewed the contract or referred us to someone else as a result of how we handled it.' },
      { label: 'Clear process improvement', text: 'Something changed in how we handled similar situations going forward because of what I learned from this.' },
    ],
  },

  lesson_learned: {
    situation: [
      { label: 'Approach stopped working', text: 'Something I had always done a certain way stopped working. I had to question my own assumptions.' },
      { label: 'Feedback that surprised me', text: 'I received feedback — positive or critical — that genuinely changed how I saw something.' },
      { label: 'Watched someone do it differently', text: 'I worked with someone who approached a problem in a way I hadn\'t considered. It worked better.' },
      { label: 'Mistake that taught me something', text: 'A specific mistake or failure led me to understand something I hadn\'t appreciated before.' },
    ],
    task: [
      { label: 'Unlearn and relearn', text: 'I had to let go of something I thought I knew and genuinely reconsider it from scratch.' },
      { label: 'Apply it to current situation', text: 'I had to take what I was learning and apply it to a live situation, often in real time.' },
      { label: 'Change a habit or process', text: 'I needed to build a new habit or change an ingrained process — which was harder than the insight itself.' },
    ],
    action: [
      { label: 'Asked more questions', text: 'I started asking questions I had previously assumed I knew the answer to.' },
      { label: 'Changed one specific behaviour', text: 'I identified one concrete thing I would do differently. Not a vague commitment — a specific change.' },
      { label: 'Sought out feedback actively', text: 'I started proactively asking for feedback rather than waiting for it to come to me.' },
    ],
    result: [
      { label: 'Measurable improvement', text: 'The change had a visible impact. I can point to what was different after.' },
      { label: 'Changed how I work generally', text: 'This is now part of how I approach things generally, not just in that one context.' },
      { label: 'Others noticed', text: 'Someone else observed or commented on the change. It wasn\'t just internal.' },
    ],
  },

  leadership_without_authority: {
    situation: [
      { label: 'Cross-functional coordination', text: 'I needed to get things done through people who didn\'t report to me and had their own priorities.' },
      { label: 'Filled a vacuum', text: 'Nobody was taking responsibility for something that needed to happen. I stepped into that gap.' },
      { label: 'Senior stakeholder buy-in', text: 'I needed someone more senior to change direction or take action. I had no formal authority to make that happen.' },
      { label: 'Led the team informally', text: 'I was the unofficial lead — not the manager — but the team naturally looked to me to coordinate things.' },
    ],
    task: [
      { label: 'Get alignment without leverage', text: 'I had to get people to move in the same direction without being able to make them do it.' },
      { label: 'Create momentum', text: 'I needed to generate energy and momentum around something others were resistant to or neutral about.' },
      { label: 'Deliver through others', text: 'The outcome depended entirely on other people taking action. My job was to make that happen.' },
    ],
    action: [
      { label: 'Connected to their motivation', text: 'I spent time understanding what mattered to each person and framed the ask in those terms.' },
      { label: 'Made it easy to say yes', text: 'I removed the friction from participating. I did the groundwork so others didn\'t have to.' },
      { label: 'Led by example first', text: 'I demonstrated what I was asking of others before asking it. That made the ask harder to refuse.' },
      { label: 'Created small visible wins', text: 'I found a way to show early progress. That built credibility and made people more willing to follow.' },
    ],
    result: [
      { label: 'Outcome delivered', text: 'The thing got done. Without formal authority, I moved the right people in the right direction.' },
      { label: 'Recognised by senior people', text: 'Someone senior noticed and acknowledged what I had done. The impact was visible beyond my immediate team.' },
      { label: 'Promoted or given more responsibility', text: 'This led to being given more formal responsibility as a result of demonstrating it informally first.' },
    ],
  },

  managing_change: {
    situation: [
      { label: 'System or process change', text: 'A new system or process was being introduced. People were resistant or uncertain about it.' },
      { label: 'Restructure or team change', text: 'The team structure was changing. People were anxious about what it meant for them.' },
      { label: 'Strategy shift', text: 'The company or department changed direction. People didn\'t understand or trust the new direction.' },
      { label: 'I was implementing change I didn\'t choose', text: 'I was asked to implement a change that came from above. I had to carry it even if I had reservations.' },
    ],
    task: [
      { label: 'Bring people with you', text: 'The change wouldn\'t work without people genuinely embracing it — not just complying with it.' },
      { label: 'Manage uncertainty', text: 'People had questions I couldn\'t always answer. I had to navigate that without losing their trust.' },
      { label: 'Deliver the change and keep performance', text: 'I had to make the change happen without allowing performance to drop during the transition.' },
    ],
    action: [
      { label: 'Communicated the why clearly', text: 'I made sure people understood why the change was happening — not just what was changing.' },
      { label: 'Named the loss explicitly', text: 'I acknowledged what people were losing, not just what they were gaining. That helped them trust the process.' },
      { label: 'Involved people in the how', text: 'Even if the what was fixed, I gave people influence over how we implemented it. That reduced resistance.' },
      { label: 'Identified the influencers first', text: 'I worked on the people who could either accelerate or block the change. Converting one key person changed the dynamic.' },
    ],
    result: [
      { label: 'Change adopted on schedule', text: 'The change was implemented within the planned timeframe and people were actually using it.' },
      { label: 'Team performance maintained', text: 'Performance didn\'t drop during the transition. We managed the change without losing ground.' },
      { label: 'Team became advocates', text: 'People who were initially resistant became advocates for the change once they experienced it.' },
    ],
  },

  commercial_example: {
    situation: [
      { label: 'Revenue target at risk', text: 'A commercial target was at risk. Something needed to change to recover the position.' },
      { label: 'New revenue opportunity', text: 'I identified a commercial opportunity that wasn\'t being captured. It required me to take initiative.' },
      { label: 'Client retention risk', text: 'A client was at risk of leaving. The commercial relationship needed to be recovered or renegotiated.' },
      { label: 'Cost reduction needed', text: 'The business needed to reduce costs while maintaining quality. I was involved in finding a way.' },
    ],
    task: [
      { label: 'Hit a specific number', text: 'I had a specific commercial target — revenue, retention rate, or cost figure — that I was responsible for.' },
      { label: 'Build a commercial case', text: 'I needed to present a business case that justified investment or a change in commercial approach.' },
      { label: 'Recover the relationship and the revenue', text: 'I had to fix the relationship and the commercial outcome at the same time.' },
    ],
    action: [
      { label: 'Understood the commercial drivers first', text: 'Before acting, I made sure I understood what was actually driving the commercial problem or opportunity.' },
      { label: 'Prioritised high-impact activities', text: 'I focused on the things that would have the biggest commercial impact, not the easiest ones.' },
      { label: 'Built the internal case', text: 'I had to convince my own organisation before I could act externally. I built a clear argument for what we should do.' },
      { label: 'Negotiated effectively', text: 'I got a better commercial outcome than the initial position — for the client and for us.' },
    ],
    result: [
      { label: 'Quantified outcome', text: 'I can name a specific number — revenue retained, deals closed, cost reduced. I won\'t make it up, but I have a real one.' },
      { label: 'Above target', text: 'The commercial result was above the target or expectation. I can explain why.' },
      { label: 'Long-term relationship built', text: 'The commercial result was the beginning of a longer relationship, not just a transaction.' },
    ],
  },
};
