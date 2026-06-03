export const STORY_TYPES = [
  'biggest_success',
  'biggest_failure',
  'conflict',
  'stakeholder_disagreement',
  'difficult_client',
  'lesson_learned',
  'leadership_without_authority',
  'managing_change',
  'commercial_example',
];

export const REAL_INTERVIEW_QUESTIONS = [
  'Tell me about yourself.',
  'Why are you looking for a new role?',
  'Tell me about a time you failed.',
  "What's your biggest weakness?",
  'Where do you see yourself in three years?',
  'Why do you want to work in this industry?',
  'What makes you different from other candidates?',
];

export const RECRUITER_CHALLENGE_QUESTIONS = [
  'Your CV shows only a few months in SaaS. Why are you qualified for this role?',
  'Why should we hire you over someone with more direct experience?',
  "You've moved roles quite frequently. How do we know you'll stay?",
  'Your background is operations, not sales. Why do you think you can sell?',
  "What's the gap between where you are now and where this role needs you to be?",
];

export const OBJECTION_QUESTIONS = [
  "The client says your solution is too expensive.",
  "The GM refuses to change the current process.",
  "The client is happy with their existing vendor.",
  "The implementation is taking longer than expected and the client is frustrated.",
  "The client asks for a feature you don't have.",
];

export function scoreLabel(total: number): string {
  if (total <= 30) return 'Your AI knows the basics';
  if (total <= 60) return 'Your AI can represent you in simple conversations';
  if (total <= 85) return 'Your AI understands how you think';
  return 'Your AI is ready for real hiring conversations ⭐';
}
