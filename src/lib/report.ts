import { getAnthropicClient } from './anthropic';
import { CLAUDE_FALLBACK_MODEL } from './constants';

export interface ReportData {
  language: string;
  intro: string;
  executiveSummary: {
    headline: string;
    chips: string[];
    points: string[];
  };
  coreExperience: {
    items: Array<{ label: string; detail: string }>;
  };
  conversationInsights: {
    items: Array<{ title: string; body: string }>;
  };
  recruiterTakeaways: {
    items: string[];
  };
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

Detect the language of the recruiter's messages and write ALL content fields in that language.

Return ONLY this exact JSON structure. No markdown fences. No extra text.

{
  "language": "en",
  "intro": "1-2 sentences: warm personal message from Pablo referencing something specific from this conversation",
  "executiveSummary": {
    "headline": "One bold sentence summarising Pablo's fit for this recruiter's context",
    "chips": ["3-5 short keyword tags: skills, traits, or strengths relevant to this role"],
    "points": ["3 concise bullet points — each max 15 words — on Pablo's positioning for this role"]
  },
  "coreExperience": {
    "items": [
      { "label": "Company · Role", "detail": "One sentence on what Pablo did and why it matters here" }
    ]
  },
  "conversationInsights": {
    "items": [
      { "title": "Short theme title (3-5 words)", "body": "1-2 sentences on this theme from the conversation" }
    ]
  },
  "recruiterTakeaways": {
    "items": ["4-5 short actionable takeaways — each max 12 words"]
  }
}

Rules:
- language: "es" if Spanish, "it" if Italian, "pt" if Portuguese, "en" otherwise
- Be specific to THIS conversation — reference actual topics, questions, and moments
- chips: short (1-3 words each), scannable, no duplicates
- points and items: concrete, not generic — no "Pablo has experience in X" unless tied to a real moment
- Return ONLY valid JSON`;

  const response = await anthropic.messages.create({
    model: CLAUDE_FALLBACK_MODEL,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';
  const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  return JSON.parse(cleaned) as ReportData;
}
