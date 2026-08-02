// Turns the agent takes without being asked, and the transcript repair they force.
//
// These live here rather than in /api/public/chat because the trainer's
// agent-test sandbox has to produce the same opening the recruiter gets. A
// candidate who tests their agent and never sees it introduce itself is not
// testing the product they published — and a second copy of these directives
// would drift from the first the moment either is edited.

export type ProactiveMode = 'intro' | 'checkin';

/** How long a visitor may sit on the page before the agent opens by itself. */
export const INTRO_DELAY_MS = 30_000;

export type ProactiveMsg = { role: 'user' | 'assistant'; content: string };

export const PROACTIVE_LANG: Record<string, string> = {
  en: 'English', es: 'Spanish', it: 'Italian', pt: 'Portuguese',
};

export function langName(lang: string | undefined): string {
  return PROACTIVE_LANG[lang ?? 'en'] ?? 'English';
}

export function introDirective(langName: string): string {
  return `PROACTIVE OPENING — the visitor has had this page open for a while without typing.
Open the conversation yourself: one brief line introducing who you are, then ask who you are speaking with — their name, role and company — as a single natural question, the way an interview opens.
Use ONLY facts already given above. State no metric, employer, date, title or achievement that is not verified there; if something is missing, leave it out rather than approximating it.
Two sentences at most. Write in ${langName}.`;
}

export const CHECKIN_DIRECTIVE = `PROACTIVE CHECK-IN — the visitor has read your last answer and gone quiet.
Say one short sentence offering to go deeper on what you just covered, or to move on to something else.
Introduce NO new information of any kind: no metric, employer, date, title or claim. This turn adds nothing to the record.
Do not repeat your previous answer, do not apologise, and do not remark on how long they have taken.
Write in the language the conversation has been using.`;

// Claude requires a transcript that starts with a user turn and alternates.
// A proactive turn is stored with no matching user message, so a raw slice of
// history can legitimately begin with — or contain two consecutive — assistant
// turns. Dropping the leading one and merging neighbours keeps the request valid
// without losing anything the model needs.
export function normalizeTranscript(msgs: ProactiveMsg[]): ProactiveMsg[] {
  const out: ProactiveMsg[] = [];
  for (const m of msgs) {
    if (out.length === 0 && m.role === 'assistant') continue;
    const last = out[out.length - 1];
    if (last && last.role === m.role) last.content = `${last.content}\n\n${m.content}`;
    else out.push({ ...m });
  }
  return out;
}
