import { getAnthropicClient } from './anthropic';
import { CLAUDE_FALLBACK_MODEL } from './constants';

export interface ReportData {
  language: string;
  intro: string;
  executiveSummary: string;
  coreExperience: string;
  conversationInsights: string;
  recruiterTakeaways: string;
}

export async function generateReport(params: {
  messages: Array<{ role: string; content: string }>;
  recruiterName: string | null;
  company: string | null;
}): Promise<ReportData> {
  const { messages, recruiterName, company } = params;

  const transcript = messages
    .map(m => `${m.role === 'user' ? (recruiterName || 'Recruiter') : 'Pablo'}: ${m.content}`)
    .join('\n\n');

  const anthropic = getAnthropicClient();

  const prompt = `You are generating a structured insights report for a recruiter who just interviewed Pablo Agis Burgos via AI.

Context:
- Recruiter: ${recruiterName || 'the recruiter'}
- Company: ${company || 'their company'}
- Transcript:
${transcript}

Return a JSON object. Detect the language of the recruiter's messages and write all content in that language:

{
  "language": "en",
  "intro": "1-2 sentences: warm personal message from Pablo, referencing something specific from this conversation",
  "executiveSummary": "<p>...</p><p>...</p> — 2-3 HTML paragraphs on Pablo's positioning and fit for this recruiter's context",
  "coreExperience": "<p>...</p><p>...</p> — 2-3 HTML paragraphs on Pablo's most relevant experience from what was discussed",
  "conversationInsights": "<p>...</p><p>...</p> — key themes and observations from this specific conversation",
  "recruiterTakeaways": "<ul><li>...</li></ul> — 4-5 HTML list items: concrete things to remember about Pablo"
}

Rules:
- language: "es" if Spanish, "it" if Italian, "pt" if Portuguese, "en" otherwise
- Write all fields except language in the detected language
- Be specific to THIS conversation — reference actual topics, questions, and moments
- Use Pablo's authentic voice: grounded, honest, operationally specific, not corporate
- Return ONLY valid JSON. No markdown fences. No extra text.`;

  const response = await anthropic.messages.create({
    model: CLAUDE_FALLBACK_MODEL,
    max_tokens: 1600,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';
  const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  return JSON.parse(cleaned) as ReportData;
}
