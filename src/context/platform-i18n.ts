'use client';

// ─────────────────────────────────────────────────────────────────────────────
// Platform i18n — translations for the candidate PLATFORM (trainer, dashboard,
// auth), separate from the production personal-agent dictionary in
// LanguageContext.tsx. It intentionally REUSES that context's `lang` state (so the
// LanguageSwitcher and persistence are shared, exactly like interviewmind.one) but
// keeps its own string table so the large production Translations type stays
// untouched.
//
// Usage in a client component:
//   const t = usePlatformT();
//   <button>{t.voice_record}</button>
//
// The map is exhaustive per language (TypeScript enforces every key in every lang),
// so a missing translation is a compile error, never a silent English fallback.
//
// Node labels/descriptions/refusals/questions live here (UI copy) rather than in
// coverage-nodes.ts, which stays English as the canonical source used in server
// prompts. The UI reads the translated version keyed by node.
// ─────────────────────────────────────────────────────────────────────────────

import { useLanguage, type Lang } from './LanguageContext';
import type { CoverageNodeKey } from '@/lib/coverage-nodes';

export interface PlatformNode {
  label: string;
  description: string;
  darkRefusal: string;
  questions: string[];
}

export interface PlatformStrings {
  // ── Trainer shell ──────────────────────────────────────────────
  level_sharp: string;
  level_solid: string;
  level_basic: string;
  level_unpublished: string;
  shell_test_agent: string;
  shell_coverage: string;
  shell_back: string;

  // ── Conversation panel ─────────────────────────────────────────
  conv_empty: string;
  conv_placeholder: string;
  conv_enter_to_send: string;
  conv_send: string;
  conv_extracting: string;
  conv_add_document: string;
  conv_close: string;
  conv_attach_document: string;

  // ── Voice recorder ─────────────────────────────────────────────
  voice_unsupported: string;
  voice_record: string;
  voice_record_again: string;
  voice_stop: string;
  voice_transcribing: string;
  voice_too_short: string;
  voice_no_transcript: string;
  voice_failed: string;
  voice_mic_blocked: string;

  // ── Document upload ────────────────────────────────────────────
  doc_intro: string;
  doc_what_is_it: string;
  doc_kind_work_sample: string;
  doc_kind_reference: string;
  doc_kind_review: string;
  doc_kind_transcript: string;
  doc_kind_other: string;
  doc_upload_button: string;
  doc_reading: string;
  doc_failed: string;
  doc_no_text: string;
  doc_saved: (fileName: string) => string;

  // ── Trainer guidance (canned assistant lines) ──────────────────
  g_needs_cv: (name: string) => string;
  g_needs_goal: (name: string) => string;
  g_needs_first_story: string;
  g_ack_cv: string;
  g_ack_goal: string;
  g_ack_story: string;
  // Follow-ups the trainer attaches after a confirmed correction, so the canonical
  // record catches up with what the agent now says.
  g_after_goal_change: string;
  g_after_role_change: string;
  // Inline "add a role" form (RoleUpdate)
  role_intro: string;
  role_company: string;
  role_title: string;
  role_start: string;
  role_end: string;
  role_current: string;
  role_prev_end: (company: string) => string;
  role_optional: string;
  role_save: string;
  role_saving: string;
  role_saved_msg: string;
  role_or_cv: string;
  role_failed: string;
  g_doc_invite: string;
  g_doc_ack: string;

  // ── Coverage map ───────────────────────────────────────────────
  cluster_track_record: string;
  cluster_judgement: string;
  cluster_motivation: string;
  cluster_logistics: string;
  cov_state_no_data: string;
  cov_state_partial: string;
  cov_state_solid: string;
  cov_state_verified: string;
  cov_agent_weak: string;
  cov_agent_solid: string;
  cov_agent_verified: string;
  cov_what_covers: string;
  cov_unlocks: string;
  cov_agent_says_now: string;
  cov_no_data_recruiters: string;
  cov_train_this: string;

  // ── Evidence card + log ────────────────────────────────────────
  ev_quality_verified: string;
  ev_quality_solid: string;
  ev_quality_vague: string;
  ev_quality_missing_detail: string;
  ev_probe: string;
  ev_followup_sent: string;
  ev_not_saved: string;
  // Supersession — the candidate confirms whether a new fact replaces an older one.
  ev_replaces_question: string;
  ev_replaces_confirm: string;
  ev_replaces_keep: string;
  ev_replaced_done: string;
  ev_replaced_kept: string;
  dash_evidence_log: string;

  // ── Publish panel ──────────────────────────────────────────────
  pub_publish_agent: string;
  pub_to_basic: (readiness: number, threshold: number) => string;
  pub_points_to_basic: (needed: number) => string;
  pub_ready: string;
  pub_recruiters_see: string;
  pub_dark_refusals: (n: number) => string;
  pub_answer_every: string;
  pub_publishing: string;
  pub_live: string;
  pub_updating: string;
  pub_update: string;
  pub_no_refusals: string;
  pub_what_recruiters_hear: string;
  pub_train: string;

  // ── Public link (its own card, below the publish panel) ────────
  slug_title: string;
  slug_intro: string;
  slug_locked_note: string;
  slug_edit: string;
  slug_available: string;
  slug_cancel: string;
  slug_save: string;
  slug_saving: string;
  slug_save_failed: string;

  // ── Anticipated questions ──────────────────────────────────────
  // The panel is a LIST — one row per question, answered and pending together.
  // Answering happens in the trainer chat, so the copy below is split between
  // row labels and the lines the trainer speaks.
  ant_section: string;
  ant_scanning: string;
  ant_intro: string;
  ant_progress: (answered: number, total: number) => string;
  ant_needs_answer: string;
  ant_priority: string;
  ant_answer_cta: string;
  ant_answer_now: string;
  ant_checking: string;
  ant_all_answered: string;
  ant_remove: string;
  // Question text, rendered from structured gap params so it follows the UI language.
  ant_q_short_tenure: (company: string) => string;
  ant_q_departure: (company: string) => string;
  ant_q_gap: (from: string, to: string) => string;
  // Why a recruiter asks it — shown under a pending row.
  ant_why_short_tenure: (company: string, role: string, months: number) => string;
  ant_why_departure: (company: string) => string;
  ant_why_gap: (from: string, to: string, months: number) => string;
  // Lines the trainer speaks in the conversation.
  ant_chat_ask: (question: string) => string;
  ant_chat_invite: (question: string) => string;
  ant_chat_reminder: (question: string) => string;
  ant_chat_stored: string;
  ant_answering: (question: string) => string;
  ant_answering_cancel: string;
  ant_needs_more: (probe: string) => string;
  ant_default_probe: string;
  ant_error: string;

  // ── Agent test overlay ─────────────────────────────────────────
  test_results_title: string;
  test_testing_title: string;
  test_subtitle: string;
  test_end: string;
  test_close: string;
  test_empty: string;
  test_placeholder: string;
  test_ask: string;
  test_analyzing: string;
  test_no_gaps: string;
  test_return: string;
  test_gaps: (n: number) => string;
  test_gap_refusal: string;
  test_gap_weak: string;
  test_train_this: string;
  test_you_recruiter: string;
  test_your_agent: string;

  // ── Career goal picker ─────────────────────────────────────────
  goal_analysing: string;
  goal_anything_else: string;
  goal_placeholder: string;
  goal_saving: string;
  goal_saved: string;
  goal_continue: string;
  goal_failed: string;

  // ── CV upload ──────────────────────────────────────────────────
  cv_intro: string;
  cv_click_upload: string;
  cv_replace: string;
  cv_extracting: string;
  cv_on_file: string;
  cv_failed: string;
  cv_saved_msg: string;

  // ── Auth (login + register) ────────────────────────────────────
  auth_back: string;
  auth_email: string;
  auth_password: string;
  auth_generic_error: string;
  login_title: string;
  login_subtitle: string;
  login_email_ph: string;
  login_password_ph: string;
  login_signing: string;
  login_signin: string;
  login_failed: string;
  login_no_account: string;
  login_get_started: string;
  reg_title: string;
  reg_subtitle: string;
  reg_full_name: string;
  reg_name_ph: string;
  reg_email_ph: string;
  reg_password_ph: string;
  reg_failed: string;
  reg_confirm_email: string;
  reg_profile_failed: string;
  reg_creating: string;
  reg_create: string;
  reg_have_account: string;
  reg_signin: string;

  // ── Coverage nodes (UI copy) ───────────────────────────────────
  nodes: Record<CoverageNodeKey, PlatformNode>;
}

// The language the trainer AGENT should write its live replies in. Passed to
// /api/trainer/chat and injected into the system prompt.
export const LANG_NAME: Record<Lang, string> = {
  en: 'English',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
};

// ── English ───────────────────────────────────────────────────────────────────

const EN_NODES: Record<CoverageNodeKey, PlatformNode> = {
  role_history: {
    label: 'Role history',
    description: 'Work history, tenures, and progression from CV',
    darkRefusal: "I'd rather walk you through my background properly than rattle off dates and titles — where would you like me to start?",
    questions: ['Walk me through your career.', 'How long were you at [company]?', 'What does your progression look like?'],
  },
  signature_stories: {
    label: 'Signature stories',
    description: 'STAR behavioural examples across story types',
    darkRefusal: "I'd rather give you a real example in context than reach for a rehearsed one — what kind of situation are you trying to get a read on?",
    questions: ['Tell me about a time you…', 'Give me an example of handling [situation].', "Walk me through a project you're proud of."],
  },
  metrics_impact: {
    label: 'Metrics & impact',
    description: 'Quantified results and verified professional artefacts',
    darkRefusal: "I'd rather not throw out numbers I can't stand behind — I can tell you concretely what changed and how I got there.",
    questions: ['What results did you drive?', 'Can you quantify that impact?', 'What improved because of your work?'],
  },
  tools_systems: {
    label: 'Tools & systems',
    description: 'Technical tools, platforms, and systems from CV',
    darkRefusal: "I'd rather walk you through the systems I've actually operated than hand you a list — what's relevant to the role?",
    questions: ['What systems have you worked with?', 'Are you familiar with [tool]?', 'How do you learn a new platform quickly?'],
  },
  failure_modes: {
    label: 'Failure modes',
    description: 'Biggest failure and lesson-learned stories',
    darkRefusal: "That's a conversation I'd rather have with you directly than reach for a tidy, rehearsed answer.",
    questions: ['Tell me about a time you failed.', "What's your biggest professional mistake?", 'Tell me about a lesson that changed how you work.'],
  },
  conflict_disagreement: {
    label: 'Conflict & disagreement',
    description: 'How I handle conflict and stakeholder disagreement',
    darkRefusal: "I'd rather talk through how I actually handle disagreement than pull one story out of context — happy to get into it.",
    questions: ['Tell me about a conflict with a colleague.', 'How do you handle disagreement with a manager?', 'Give me an example of managing a difficult stakeholder.'],
  },
  decision_style: {
    label: 'Decision style',
    description: 'Communication style self-assessment responses',
    darkRefusal: "You'll probably get a better feel for how I make decisions from how this conversation goes than from me describing it.",
    questions: ['How do you make decisions under pressure?', 'Describe your working style.', 'How do you prioritise when everything is urgent?'],
  },
  limits_gaps: {
    label: 'Limits & gaps',
    description: 'Recruiter challenge responses — honest self-awareness',
    darkRefusal: "I'd rather be straight with you about where I'm strong and where I'm still building — in the context of what the role actually needs.",
    questions: ["What's your biggest weakness?", "Where's the gap between your experience and this role?", 'Why should we pick you over someone with more direct experience?'],
  },
  career_narrative: {
    label: 'Career narrative',
    description: '"Tell me about yourself" answer and career goal',
    darkRefusal: "I'd rather walk you through where I've been and where I'm headed in my own words — want me to start there?",
    questions: ['Tell me about yourself.', 'Walk me through your background.', 'Why are you looking for this type of role?'],
  },
  company_fit: {
    label: 'Company fit',
    description: 'Career goals and interview readiness responses',
    darkRefusal: "What I'm looking for depends a lot on the specifics — tell me about the role and I'll be honest about the fit.",
    questions: ['Why this company?', 'Where do you see yourself in 3 years?', 'What kind of environment do you thrive in?'],
  },
  constraints: {
    label: 'Constraints',
    description: 'Location, availability, visa, notice period',
    darkRefusal: "My availability, notice period, and start date are things I'd rather work out with you directly — what's the timeline on your side?",
    questions: ['When can you start?', 'Are you open to relocation?', 'Do you have any visa or work permit requirements?'],
  },
  compensation: {
    label: 'Compensation',
    description: 'Salary expectations',
    darkRefusal: "I'd rather talk numbers once we both know there's a real fit — where are you on the range for the role?",
    questions: ['What are your salary expectations?', "What's your current package?", 'What range are you targeting?'],
  },
};

const EN: PlatformStrings = {
  level_sharp: 'Sharp',
  level_solid: 'Solid',
  level_basic: 'Basic',
  level_unpublished: 'Unpublished',
  shell_test_agent: 'Test agent',
  shell_coverage: 'Coverage',
  shell_back: 'Back',

  conv_empty: 'Your AI interview trainer is ready. It will push you for specifics — dates, numbers, named systems.',
  conv_placeholder: 'Answer the question…',
  conv_enter_to_send: 'Enter to send',
  conv_send: 'Send',
  conv_extracting: 'Extracting evidence…',
  conv_add_document: 'Add a supporting document',
  conv_close: 'Close',
  conv_attach_document: 'Attach a document',

  voice_unsupported: 'Voice recording isn’t supported in this browser.',
  voice_record: 'Record your answer',
  voice_record_again: 'Record again',
  voice_stop: 'Stop recording',
  voice_transcribing: 'Transcribing…',
  voice_too_short: 'That was too short to hear — try again.',
  voice_no_transcript: 'Could not transcribe that — try again.',
  voice_failed: 'Transcription failed — try again.',
  voice_mic_blocked: 'Microphone access was blocked. Allow it in your browser to record.',

  doc_intro: 'Add a supporting document — a work sample, a reference, a review, an interview transcript. Anything that backs up what you tell me becomes evidence your agent can stand behind.',
  doc_what_is_it: 'What is it?',
  doc_kind_work_sample: 'Project or work sample',
  doc_kind_reference: 'Reference or recommendation',
  doc_kind_review: 'Performance review / feedback',
  doc_kind_transcript: 'Interview transcript',
  doc_kind_other: 'Something else',
  doc_upload_button: 'Upload file (PDF, TXT, MD, JSON)',
  doc_reading: 'Reading document…',
  doc_failed: 'Upload failed. Please try again.',
  doc_no_text: 'No readable text found in this file.',
  doc_saved: (f) => `Got "${f}". Your agent can draw on that as evidence now.`,

  g_needs_cv: (name) => `Hi ${name} — before we can train anything, I need your career history. Upload your CV below and I'll read it; that gives your agent dates, roles and systems to work from.`,
  g_needs_goal: () => `Got your CV. Now — what are you actually aiming at? Pick what fits below. Everything I ask you from here is judged against that goal.`,
  g_needs_first_story: `Good. Last foundational piece: I need a couple of real examples from your work — the kind a recruiter probes. Let's do the first one now. Tell me about something you actually delivered: what the situation was, what you specifically did, and how it ended.`,
  g_ack_cv: "CV read — I've got your roles and dates.",
  g_ack_goal: 'Locked in.',
  g_ack_story: "That's the kind of detail that holds up. Your agent can use that.",
  g_after_goal_change: 'Your agent speaks to that now. One thing it does not change: the goal recruiters see on your profile card. Set that below so the two match.',
  g_after_role_change: "Your agent speaks to that now. Recruiters browsing profiles still see your old role, though — that comes from your CV. Add the role below, or re-upload your CV if it's already up to date.",
  role_intro: 'Add the role and your profile card updates for recruiters.',
  role_company: 'Company',
  role_title: 'Role',
  role_start: 'Start date',
  role_end: 'End date',
  role_current: "I'm still in this role",
  role_prev_end: (company: string) => `When did you leave ${company}?`,
  role_optional: 'optional',
  role_save: 'Save role',
  role_saving: 'Saving…',
  role_saved_msg: 'Role added. Recruiters now see it on your profile.',
  role_or_cv: 'Or upload an updated CV',
  role_failed: "Couldn't save that. Try again.",
  g_doc_invite: "Foundations are in. If you've got anything that backs up your work — a reference, a performance review, a project write-up — add it here and your agent can cite it. Or skip it and we'll keep talking.",
  g_doc_ack: "Got it — that's on file as evidence your agent can use.",

  cluster_track_record: 'Track record',
  cluster_judgement: 'Judgement',
  cluster_motivation: 'Motivation',
  cluster_logistics: 'Logistics',
  cov_state_no_data: 'No data',
  cov_state_partial: 'Partial',
  cov_state_solid: 'Solid',
  cov_state_verified: 'Verified',
  cov_agent_weak: 'Partial coverage — answers with caveats and limited specifics.',
  cov_agent_solid: 'Sufficient coverage — answers from verified data.',
  cov_agent_verified: 'Complete coverage — answers with specific, cited examples.',
  cov_what_covers: 'What this covers',
  cov_unlocks: 'Unlocks answers to',
  cov_agent_says_now: 'What the agent says right now',
  cov_no_data_recruiters: 'No data. This is what recruiters will hear.',
  cov_train_this: 'Train this',

  ev_quality_verified: 'Verified',
  ev_quality_solid: 'Solid',
  ev_quality_vague: 'Vague',
  ev_quality_missing_detail: 'Missing detail',
  ev_probe: 'Probe this',
  ev_followup_sent: 'Follow-up sent',
  ev_not_saved: 'Not saved — reload may lose this',
  ev_replaces_question: 'Does this replace what you said before?',
  ev_replaces_confirm: 'Yes, replace',
  ev_replaces_keep: 'Keep both',
  ev_replaced_done: 'Replaced — your agent no longer says the old version',
  ev_replaced_kept: 'Both kept',
  dash_evidence_log: 'Evidence log',

  pub_publish_agent: 'Publish agent',
  pub_to_basic: (r, th) => `${r}/${th} to Basic`,
  pub_points_to_basic: (n) => `${n} more point${n !== 1 ? 's' : ''} to reach Basic. Add your CV and two stories to get there in ~10 minutes.`,
  pub_ready: 'Ready to publish',
  pub_recruiters_see: 'Recruiters will see you in the candidate directory.',
  pub_dark_refusals: (n) => ` ${n} dark node${n !== 1 ? 's' : ''} will cause refusals — visible to any recruiter who asks.`,
  pub_answer_every: ' Your agent can answer every topic.',
  pub_publishing: 'Publishing…',
  pub_live: 'Live',
  pub_updating: 'Updating…',
  pub_update: 'Update ↑',
  pub_no_refusals: 'Your agent answers every topic. No refusals.',
  pub_what_recruiters_hear: 'What recruiters hear on dark topics',
  pub_train: 'Train ↗',

  slug_title: 'Your public link',
  slug_intro: 'This is the address recruiters open to talk to your agent.',
  slug_locked_note: 'Changing a shared link would break it. Editing comes later.',
  slug_edit: 'Edit link',
  slug_available: 'Available',
  slug_cancel: 'Cancel',
  slug_save: 'Save link',
  slug_saving: 'Saving…',
  slug_save_failed: 'Could not save.',

  ant_section: 'Anticipated questions',
  ant_scanning: 'Scanning your background for questions recruiters will ask…',
  ant_intro: 'Recruiters will ask these. Pick one and answer it in the chat — your agent speaks only what you say there, never a version it made up.',
  ant_progress: (answered, total) => `${answered} of ${total} answered`,
  ant_needs_answer: 'Pending',
  ant_priority: 'Priority',
  ant_answer_cta: 'Answer in the chat',
  ant_answer_now: 'Answer now',
  ant_checking: 'Checking your answer…',
  ant_all_answered: 'Every question we found has a grounded answer.',
  ant_remove: 'Remove',
  ant_q_short_tenure: (company) => `Why was your time at ${company} so short, and why did it end?`,
  ant_q_departure: (company) => `Why did you leave ${company}?`,
  ant_q_gap: (from, to) => `What were you doing between ${from} and ${to}?`,
  ant_why_short_tenure: (company, role, months) =>
    `Your ${role} role at ${company} lasted about ${months} month${months === 1 ? '' : 's'}. Unanswered, a short stay reads as a red flag.`,
  ant_why_departure: (company) =>
    `Without a grounded reason for leaving ${company}, your agent has to decline the question.`,
  ant_why_gap: (from, to, months) =>
    `About ${months} months between ${from} and ${to}. Recruiters probe gaps; a clear account defuses it.`,
  ant_chat_ask: (question) => `A recruiter will ask this: ${question} Answer in your own words — I'll store exactly what you say, nothing more.`,
  ant_chat_invite: (question) => `Your foundations are in place. The next thing that will trip your agent up is a question you haven't answered: ${question}`,
  ant_chat_reminder: (question) => `Still pending, and it's the one recruiters open with: ${question}`,
  ant_chat_stored: 'Stored. Your agent will answer that question with your words and nothing else.',
  ant_answering: (question) => `Answering: ${question}`,
  ant_answering_cancel: 'Not now',
  ant_needs_more: (probe) => `Needs more to be usable: ${probe}`,
  ant_default_probe: 'Add a specific detail — a date, a name, or a concrete outcome you can defend.',
  ant_error: 'Something went wrong — try again.',

  test_results_title: 'What a recruiter just experienced',
  test_testing_title: 'Testing your agent',
  test_subtitle: "Ask your agent anything. You're the recruiter.",
  test_end: 'End interview',
  test_close: 'Close',
  test_empty: 'Start with any question a recruiter might ask. The agent will respond exactly as it would in a live interview.',
  test_placeholder: 'Ask your agent a question…',
  test_ask: 'Ask',
  test_analyzing: 'Analysing what recruiters heard…',
  test_no_gaps: 'No gaps detected. Your agent handled every question.',
  test_return: 'Return to training',
  test_gaps: (n) => (n === 1
    ? 'One node where the agent failed or hedged.'
    : `${n} nodes where the agent failed or hedged.`) + ' Train them to close the gap before your next real interview.',
  test_gap_refusal: 'REFUSAL',
  test_gap_weak: 'WEAK',
  test_train_this: 'Train this ↗',
  test_you_recruiter: 'You (recruiter)',
  test_your_agent: 'Your agent',

  goal_analysing: 'Analysing your CV…',
  goal_anything_else: 'Anything else?',
  goal_placeholder: 'Add your own context if needed...',
  goal_saving: 'Saving…',
  goal_saved: 'Saved',
  goal_continue: 'Continue →',
  goal_failed: 'Failed to save. Please try again.',

  cv_intro: 'Upload your CV as a PDF or plain text file. Claude will extract your career history so your agent understands your background. (DOCX not supported — export as PDF from Word.)',
  cv_click_upload: 'Click to upload CV',
  cv_replace: 'Upload a new CV to replace the existing one',
  cv_extracting: 'Extracting with AI…',
  cv_on_file: 'CV on file — your agent knows your career history',
  cv_failed: 'Upload failed. Please try again.',
  cv_saved_msg: 'CV processed. Your agent knows your career history now.',

  auth_back: '← Back',
  auth_email: 'Email',
  auth_password: 'Password',
  auth_generic_error: 'Something went wrong. Please try again.',
  login_title: 'Sign in',
  login_subtitle: 'Welcome back to InterviewMind Platform.',
  login_email_ph: 'you@example.com',
  login_password_ph: 'Your password',
  login_signing: 'Signing in…',
  login_signin: 'Sign in',
  login_failed: 'Sign in failed. Please try again.',
  login_no_account: "Don't have an account?",
  login_get_started: 'Get started',
  reg_title: 'Create candidate account',
  reg_subtitle: 'Showcase your skills to recruiters.',
  reg_full_name: 'Full name',
  reg_name_ph: 'Jane Smith',
  reg_email_ph: 'jane@example.com',
  reg_password_ph: 'At least 6 characters',
  reg_failed: 'Registration failed. Please try again.',
  reg_confirm_email: 'Check your email to confirm your account, then sign in.',
  reg_profile_failed: 'Account created but profile setup failed. Please contact support.',
  reg_creating: 'Creating account…',
  reg_create: 'Create account',
  reg_have_account: 'Already have an account?',
  reg_signin: 'Sign in',

  nodes: EN_NODES,
};

// ── Spanish ───────────────────────────────────────────────────────────────────

const ES_NODES: Record<CoverageNodeKey, PlatformNode> = {
  role_history: {
    label: 'Historial de puestos',
    description: 'Experiencia laboral, permanencia y progresión según el CV',
    darkRefusal: 'Prefiero explicarte mi trayectoria como es debido antes que soltar fechas y cargos — ¿por dónde quieres que empiece?',
    questions: ['Cuéntame tu trayectoria profesional.', '¿Cuánto tiempo estuviste en [empresa]?', '¿Cómo ha sido tu progresión?'],
  },
  signature_stories: {
    label: 'Historias destacadas',
    description: 'Ejemplos de comportamiento (STAR) de distintos tipos',
    darkRefusal: 'Prefiero darte un ejemplo real en contexto antes que echar mano de uno ensayado — ¿qué tipo de situación quieres valorar?',
    questions: ['Háblame de una vez que…', 'Dame un ejemplo de cómo gestionaste [situación].', 'Cuéntame un proyecto del que estés orgulloso.'],
  },
  metrics_impact: {
    label: 'Métricas e impacto',
    description: 'Resultados cuantificados y evidencias profesionales verificadas',
    darkRefusal: 'Prefiero no soltar cifras que no pueda defender — puedo contarte en concreto qué cambió y cómo lo logré.',
    questions: ['¿Qué resultados conseguiste?', '¿Puedes cuantificar ese impacto?', '¿Qué mejoró gracias a tu trabajo?'],
  },
  tools_systems: {
    label: 'Herramientas y sistemas',
    description: 'Herramientas técnicas, plataformas y sistemas según el CV',
    darkRefusal: 'Prefiero explicarte los sistemas que he manejado de verdad antes que darte una lista — ¿qué es relevante para el puesto?',
    questions: ['¿Con qué sistemas has trabajado?', '¿Conoces [herramienta]?', '¿Cómo aprendes rápido una plataforma nueva?'],
  },
  failure_modes: {
    label: 'Errores y fracasos',
    description: 'Historias de mayor fracaso y lecciones aprendidas',
    darkRefusal: 'Es una conversación que prefiero tener contigo directamente antes que dar una respuesta pulida y ensayada.',
    questions: ['Háblame de una vez que fracasaste.', '¿Cuál ha sido tu mayor error profesional?', 'Cuéntame una lección que cambió tu forma de trabajar.'],
  },
  conflict_disagreement: {
    label: 'Conflicto y desacuerdo',
    description: 'Cómo gestiono el conflicto y el desacuerdo con las partes',
    darkRefusal: 'Prefiero explicarte cómo gestiono de verdad el desacuerdo antes que sacar una historia de contexto — encantado de entrar en ello.',
    questions: ['Háblame de un conflicto con un compañero.', '¿Cómo gestionas un desacuerdo con un jefe?', 'Dame un ejemplo de cómo manejaste a una parte difícil.'],
  },
  decision_style: {
    label: 'Estilo de decisión',
    description: 'Respuestas de autoevaluación sobre el estilo de comunicación',
    darkRefusal: 'Seguramente captarás mejor cómo tomo decisiones por cómo va esta conversación que por lo que yo describa.',
    questions: ['¿Cómo tomas decisiones bajo presión?', 'Describe tu forma de trabajar.', '¿Cómo priorizas cuando todo es urgente?'],
  },
  limits_gaps: {
    label: 'Límites y carencias',
    description: 'Respuestas a objeciones del reclutador — autoconciencia honesta',
    darkRefusal: 'Prefiero ser sincero contigo sobre dónde soy fuerte y dónde sigo creciendo — en función de lo que el puesto realmente necesita.',
    questions: ['¿Cuál es tu mayor debilidad?', '¿Dónde está la brecha entre tu experiencia y este puesto?', '¿Por qué elegirte a ti frente a alguien con más experiencia directa?'],
  },
  career_narrative: {
    label: 'Relato profesional',
    description: 'Respuesta a "háblame de ti" y objetivo profesional',
    darkRefusal: 'Prefiero contarte con mis propias palabras de dónde vengo y hacia dónde voy — ¿empiezo por ahí?',
    questions: ['Háblame de ti.', 'Cuéntame tu trayectoria.', '¿Por qué buscas este tipo de puesto?'],
  },
  company_fit: {
    label: 'Encaje con la empresa',
    description: 'Objetivos profesionales y respuestas de preparación para la entrevista',
    darkRefusal: 'Lo que busco depende mucho de los detalles — cuéntame sobre el puesto y te seré sincero sobre el encaje.',
    questions: ['¿Por qué esta empresa?', '¿Dónde te ves en 3 años?', '¿En qué tipo de entorno rindes mejor?'],
  },
  constraints: {
    label: 'Condicionantes',
    description: 'Ubicación, disponibilidad, visado, periodo de preaviso',
    darkRefusal: 'Mi disponibilidad, preaviso y fecha de incorporación prefiero acordarlos contigo directamente — ¿qué plazos manejáis?',
    questions: ['¿Cuándo puedes empezar?', '¿Estás abierto a mudarte?', '¿Necesitas visado o permiso de trabajo?'],
  },
  compensation: {
    label: 'Retribución',
    description: 'Expectativas salariales',
    darkRefusal: 'Prefiero hablar de cifras cuando ambos veamos que hay un encaje real — ¿en qué rango os movéis para el puesto?',
    questions: ['¿Cuáles son tus expectativas salariales?', '¿Cuál es tu paquete actual?', '¿Qué rango buscas?'],
  },
};

const ES: PlatformStrings = {
  level_sharp: 'Afilado',
  level_solid: 'Sólido',
  level_basic: 'Básico',
  level_unpublished: 'Sin publicar',
  shell_test_agent: 'Probar agente',
  shell_coverage: 'Cobertura',
  shell_back: 'Volver',

  conv_empty: 'Tu entrenador de entrevistas con IA está listo. Te exigirá concreción — fechas, números, sistemas concretos.',
  conv_placeholder: 'Responde a la pregunta…',
  conv_enter_to_send: 'Enter para enviar',
  conv_send: 'Enviar',
  conv_extracting: 'Extrayendo evidencia…',
  conv_add_document: 'Añadir un documento de apoyo',
  conv_close: 'Cerrar',
  conv_attach_document: 'Adjuntar un documento',

  voice_unsupported: 'La grabación de voz no es compatible con este navegador.',
  voice_record: 'Graba tu respuesta',
  voice_record_again: 'Grabar de nuevo',
  voice_stop: 'Detener grabación',
  voice_transcribing: 'Transcribiendo…',
  voice_too_short: 'Fue demasiado corto para oírlo — inténtalo de nuevo.',
  voice_no_transcript: 'No se pudo transcribir — inténtalo de nuevo.',
  voice_failed: 'La transcripción falló — inténtalo de nuevo.',
  voice_mic_blocked: 'Se bloqueó el acceso al micrófono. Permítelo en tu navegador para grabar.',

  doc_intro: 'Añade un documento de apoyo — una muestra de trabajo, una referencia, una evaluación, la transcripción de una entrevista. Cualquier cosa que respalde lo que me cuentas se convierte en evidencia que tu agente puede defender.',
  doc_what_is_it: '¿Qué es?',
  doc_kind_work_sample: 'Proyecto o muestra de trabajo',
  doc_kind_reference: 'Referencia o recomendación',
  doc_kind_review: 'Evaluación de desempeño / feedback',
  doc_kind_transcript: 'Transcripción de entrevista',
  doc_kind_other: 'Otra cosa',
  doc_upload_button: 'Subir archivo (PDF, TXT, MD, JSON)',
  doc_reading: 'Leyendo documento…',
  doc_failed: 'La subida falló. Inténtalo de nuevo.',
  doc_no_text: 'No se encontró texto legible en este archivo.',
  doc_saved: (f) => `Recibí "${f}". Tu agente ya puede usarlo como evidencia.`,

  g_needs_cv: (name) => `Hola ${name} — antes de entrenar nada, necesito tu trayectoria profesional. Sube tu CV abajo y lo leeré; eso le da a tu agente fechas, puestos y sistemas con los que trabajar.`,
  g_needs_goal: () => `Tengo tu CV. Ahora — ¿qué buscas realmente? Elige lo que encaje abajo. Todo lo que te pregunte a partir de aquí se juzga en función de ese objetivo.`,
  g_needs_first_story: `Bien. Última pieza fundamental: necesito un par de ejemplos reales de tu trabajo — del tipo que un reclutador indaga. Hagamos el primero ahora. Cuéntame algo que hayas logrado de verdad: cuál era la situación, qué hiciste tú concretamente y cómo terminó.`,
  g_ack_cv: 'CV leído — tengo tus puestos y fechas.',
  g_ack_goal: 'Fijado.',
  g_ack_story: 'Ese es el tipo de detalle que se sostiene. Tu agente puede usarlo.',
  g_after_goal_change: 'Tu agente ya lo cuenta así. Una cosa que eso no cambia: el objetivo que los reclutadores ven en tu ficha. Ajústalo abajo para que coincidan.',
  g_after_role_change: 'Tu agente ya lo cuenta así. Pero los reclutadores que miran perfiles siguen viendo tu puesto anterior — eso sale de tu CV. Añade el puesto abajo, o vuelve a subir el CV si ya está actualizado.',
  role_intro: 'Añade el puesto y tu ficha se actualiza para los reclutadores.',
  role_company: 'Empresa',
  role_title: 'Puesto',
  role_start: 'Fecha de inicio',
  role_end: 'Fecha de fin',
  role_current: 'Sigo en este puesto',
  role_prev_end: (company: string) => `¿Cuándo saliste de ${company}?`,
  role_optional: 'opcional',
  role_save: 'Guardar puesto',
  role_saving: 'Guardando…',
  role_saved_msg: 'Puesto añadido. Los reclutadores ya lo ven en tu perfil.',
  role_or_cv: 'O sube un CV actualizado',
  role_failed: 'No se pudo guardar. Inténtalo de nuevo.',
  g_doc_invite: 'Ya están los cimientos. Si tienes algo que respalde tu trabajo — una referencia, una evaluación de desempeño, la descripción de un proyecto — añádelo aquí y tu agente podrá citarlo. O sáltatelo y seguimos hablando.',
  g_doc_ack: 'Entendido — queda registrado como evidencia que tu agente puede usar.',

  cluster_track_record: 'Trayectoria',
  cluster_judgement: 'Criterio',
  cluster_motivation: 'Motivación',
  cluster_logistics: 'Logística',
  cov_state_no_data: 'Sin datos',
  cov_state_partial: 'Parcial',
  cov_state_solid: 'Sólido',
  cov_state_verified: 'Verificado',
  cov_agent_weak: 'Cobertura parcial — responde con matices y pocos detalles.',
  cov_agent_solid: 'Cobertura suficiente — responde con datos verificados.',
  cov_agent_verified: 'Cobertura completa — responde con ejemplos concretos y citados.',
  cov_what_covers: 'Qué cubre esto',
  cov_unlocks: 'Desbloquea respuestas a',
  cov_agent_says_now: 'Qué dice el agente ahora mismo',
  cov_no_data_recruiters: 'Sin datos. Esto es lo que oirán los reclutadores.',
  cov_train_this: 'Entrenar esto',

  ev_quality_verified: 'Verificado',
  ev_quality_solid: 'Sólido',
  ev_quality_vague: 'Vago',
  ev_quality_missing_detail: 'Falta detalle',
  ev_probe: 'Profundizar',
  ev_followup_sent: 'Seguimiento enviado',
  ev_not_saved: 'No guardado — al recargar podrías perderlo',
  ev_replaces_question: '¿Esto reemplaza lo que dijiste antes?',
  ev_replaces_confirm: 'Sí, reemplazar',
  ev_replaces_keep: 'Mantener ambas',
  ev_replaced_done: 'Reemplazado — tu agente ya no dice la versión anterior',
  ev_replaced_kept: 'Se mantienen ambas',
  dash_evidence_log: 'Registro de evidencia',

  pub_publish_agent: 'Publicar agente',
  pub_to_basic: (r, th) => `${r}/${th} para Básico`,
  pub_points_to_basic: (n) => `${n} punto${n !== 1 ? 's' : ''} más para alcanzar Básico. Añade tu CV y dos historias para llegar en ~10 minutos.`,
  pub_ready: 'Listo para publicar',
  pub_recruiters_see: 'Los reclutadores te verán en el directorio de candidatos.',
  pub_dark_refusals: (n) => ` ${n} nodo${n !== 1 ? 's' : ''} sin datos provocará${n !== 1 ? 'n' : ''} rechazos — visibles para cualquier reclutador que pregunte.`,
  pub_answer_every: ' Tu agente puede responder a cualquier tema.',
  pub_publishing: 'Publicando…',
  pub_live: 'En vivo',
  pub_updating: 'Actualizando…',
  pub_update: 'Actualizar ↑',
  pub_no_refusals: 'Tu agente responde a cualquier tema. Sin rechazos.',
  pub_what_recruiters_hear: 'Qué oyen los reclutadores en los temas sin datos',
  pub_train: 'Entrenar ↗',

  slug_title: 'Tu enlace público',
  slug_intro: 'Es la dirección que abren los reclutadores para hablar con tu agente.',
  slug_locked_note: 'Cambiar un enlace ya compartido lo rompería. La edición llegará más adelante.',
  slug_edit: 'Editar enlace',
  slug_available: 'Disponible',
  slug_cancel: 'Cancelar',
  slug_save: 'Guardar enlace',
  slug_saving: 'Guardando…',
  slug_save_failed: 'No se pudo guardar.',

  ant_section: 'Preguntas previstas',
  ant_scanning: 'Analizando tu perfil en busca de preguntas que harán los reclutadores…',
  ant_intro: 'Los reclutadores preguntarán esto. Elige una y respóndela en el chat — tu agente solo dice lo que cuentes ahí, nunca una versión inventada.',
  ant_progress: (answered, total) => `${answered} de ${total} respondidas`,
  ant_needs_answer: 'Pendiente',
  ant_priority: 'Prioritaria',
  ant_answer_cta: 'Responder en el chat',
  ant_answer_now: 'Responder ahora',
  ant_checking: 'Comprobando tu respuesta…',
  ant_all_answered: 'Todas las preguntas que hemos detectado tienen una respuesta sólida.',
  ant_remove: 'Eliminar',
  ant_q_short_tenure: (company) => `¿Por qué duró tan poco tu etapa en ${company} y por qué terminó?`,
  ant_q_departure: (company) => `¿Por qué dejaste ${company}?`,
  ant_q_gap: (from, to) => `¿Qué hiciste entre ${from} y ${to}?`,
  ant_why_short_tenure: (company, role, months) =>
    `Tu puesto de ${role} en ${company} duró unos ${months} mes${months === 1 ? '' : 'es'}. Sin respuesta, una etapa corta se lee como señal de alarma.`,
  ant_why_departure: (company) =>
    `Sin un motivo fundamentado para dejar ${company}, tu agente tiene que declinar la pregunta.`,
  ant_why_gap: (from, to, months) =>
    `Unos ${months} meses entre ${from} y ${to}. Los reclutadores hurgan en los huecos; una explicación clara lo desactiva.`,
  ant_chat_ask: (question) => `Un reclutador te preguntará esto: ${question} Respóndeme con tus palabras — guardaré exactamente lo que digas, nada más.`,
  ant_chat_invite: (question) => `Ya tienes la base montada. Lo siguiente que dejará a tu agente en evidencia es una pregunta sin responder: ${question}`,
  ant_chat_reminder: (question) => `Sigue pendiente, y es de las primeras que hacen los reclutadores: ${question}`,
  ant_chat_stored: 'Guardado. Tu agente responderá a esa pregunta con tus palabras y nada más.',
  ant_answering: (question) => `Respondiendo: ${question}`,
  ant_answering_cancel: 'Ahora no',
  ant_needs_more: (probe) => `Necesita más para ser útil: ${probe}`,
  ant_default_probe: 'Añade un detalle concreto — una fecha, un nombre o un resultado que puedas defender.',
  ant_error: 'Algo salió mal — inténtalo de nuevo.',

  test_results_title: 'Lo que acaba de vivir un reclutador',
  test_testing_title: 'Probando tu agente',
  test_subtitle: 'Pregúntale lo que quieras a tu agente. Tú eres el reclutador.',
  test_end: 'Terminar entrevista',
  test_close: 'Cerrar',
  test_empty: 'Empieza con cualquier pregunta que haría un reclutador. El agente responderá exactamente como lo haría en una entrevista real.',
  test_placeholder: 'Hazle una pregunta a tu agente…',
  test_ask: 'Preguntar',
  test_analyzing: 'Analizando lo que oyeron los reclutadores…',
  test_no_gaps: 'No se detectaron carencias. Tu agente respondió a todo.',
  test_return: 'Volver al entrenamiento',
  test_gaps: (n) => (n === 1
    ? 'Un nodo donde el agente falló o titubeó.'
    : `${n} nodos donde el agente falló o titubeó.`) + ' Entrénalos para cerrar la brecha antes de tu próxima entrevista real.',
  test_gap_refusal: 'RECHAZO',
  test_gap_weak: 'DÉBIL',
  test_train_this: 'Entrenar esto ↗',
  test_you_recruiter: 'Tú (reclutador)',
  test_your_agent: 'Tu agente',

  goal_analysing: 'Analizando tu CV…',
  goal_anything_else: '¿Algo más?',
  goal_placeholder: 'Añade tu propio contexto si hace falta...',
  goal_saving: 'Guardando…',
  goal_saved: 'Guardado',
  goal_continue: 'Continuar →',
  goal_failed: 'No se pudo guardar. Inténtalo de nuevo.',

  cv_intro: 'Sube tu CV en PDF o texto plano. Claude extraerá tu trayectoria para que tu agente entienda tu perfil. (DOCX no compatible — expórtalo como PDF desde Word.)',
  cv_click_upload: 'Haz clic para subir el CV',
  cv_replace: 'Sube un CV nuevo para reemplazar el actual',
  cv_extracting: 'Extrayendo con IA…',
  cv_on_file: 'CV registrado — tu agente conoce tu trayectoria',
  cv_failed: 'La subida falló. Inténtalo de nuevo.',
  cv_saved_msg: 'CV procesado. Tu agente ya conoce tu trayectoria profesional.',

  auth_back: '← Volver',
  auth_email: 'Correo',
  auth_password: 'Contraseña',
  auth_generic_error: 'Algo salió mal. Inténtalo de nuevo.',
  login_title: 'Iniciar sesión',
  login_subtitle: 'Bienvenido de nuevo a InterviewMind Platform.',
  login_email_ph: 'tu@ejemplo.com',
  login_password_ph: 'Tu contraseña',
  login_signing: 'Iniciando sesión…',
  login_signin: 'Iniciar sesión',
  login_failed: 'No se pudo iniciar sesión. Inténtalo de nuevo.',
  login_no_account: '¿No tienes cuenta?',
  login_get_started: 'Empezar',
  reg_title: 'Crear cuenta de candidato',
  reg_subtitle: 'Muestra tu talento a los reclutadores.',
  reg_full_name: 'Nombre completo',
  reg_name_ph: 'Ana García',
  reg_email_ph: 'ana@ejemplo.com',
  reg_password_ph: 'Al menos 6 caracteres',
  reg_failed: 'El registro falló. Inténtalo de nuevo.',
  reg_confirm_email: 'Revisa tu correo para confirmar la cuenta y luego inicia sesión.',
  reg_profile_failed: 'Cuenta creada pero falló la configuración del perfil. Contacta con soporte.',
  reg_creating: 'Creando cuenta…',
  reg_create: 'Crear cuenta',
  reg_have_account: '¿Ya tienes cuenta?',
  reg_signin: 'Iniciar sesión',

  nodes: ES_NODES,
};

// ── Italian ───────────────────────────────────────────────────────────────────

const IT_NODES: Record<CoverageNodeKey, PlatformNode> = {
  role_history: {
    label: 'Storia dei ruoli',
    description: 'Esperienza lavorativa, durata e progressione dal CV',
    darkRefusal: 'Preferisco raccontarti il mio percorso come si deve piuttosto che sciorinare date e titoli — da dove vuoi che inizi?',
    questions: ['Raccontami il tuo percorso professionale.', 'Quanto sei rimasto in [azienda]?', 'Com’è stata la tua progressione?'],
  },
  signature_stories: {
    label: 'Storie distintive',
    description: 'Esempi comportamentali (STAR) di vario tipo',
    darkRefusal: 'Preferisco darti un esempio reale nel contesto piuttosto che uno preconfezionato — che tipo di situazione vuoi valutare?',
    questions: ['Parlami di una volta in cui…', 'Fammi un esempio di come hai gestito [situazione].', 'Raccontami un progetto di cui vai fiero.'],
  },
  metrics_impact: {
    label: 'Metriche e impatto',
    description: 'Risultati quantificati ed evidenze professionali verificate',
    darkRefusal: 'Preferisco non buttare lì numeri che non posso sostenere — posso dirti concretamente cosa è cambiato e come.',
    questions: ['Quali risultati hai ottenuto?', 'Puoi quantificare quell’impatto?', 'Cosa è migliorato grazie al tuo lavoro?'],
  },
  tools_systems: {
    label: 'Strumenti e sistemi',
    description: 'Strumenti tecnici, piattaforme e sistemi dal CV',
    darkRefusal: 'Preferisco spiegarti i sistemi che ho davvero usato piuttosto che darti una lista — cosa è rilevante per il ruolo?',
    questions: ['Con quali sistemi hai lavorato?', 'Conosci [strumento]?', 'Come impari in fretta una nuova piattaforma?'],
  },
  failure_modes: {
    label: 'Errori e fallimenti',
    description: 'Storie del fallimento più grande e delle lezioni apprese',
    darkRefusal: 'È una conversazione che preferisco avere con te direttamente piuttosto che dare una risposta ordinata e preparata.',
    questions: ['Parlami di una volta in cui hai fallito.', 'Qual è stato il tuo errore professionale più grande?', 'Raccontami una lezione che ha cambiato il tuo modo di lavorare.'],
  },
  conflict_disagreement: {
    label: 'Conflitto e disaccordo',
    description: 'Come gestisco conflitti e disaccordi con gli interlocutori',
    darkRefusal: 'Preferisco spiegarti come gestisco davvero il disaccordo piuttosto che tirare fuori una storia dal contesto — volentieri.',
    questions: ['Parlami di un conflitto con un collega.', 'Come gestisci un disaccordo con un manager?', 'Fammi un esempio di gestione di un interlocutore difficile.'],
  },
  decision_style: {
    label: 'Stile decisionale',
    description: 'Risposte di autovalutazione sullo stile comunicativo',
    darkRefusal: 'Probabilmente capirai meglio come decido da come va questa conversazione che da una mia descrizione.',
    questions: ['Come prendi decisioni sotto pressione?', 'Descrivi il tuo modo di lavorare.', 'Come stabilisci le priorità quando è tutto urgente?'],
  },
  limits_gaps: {
    label: 'Limiti e lacune',
    description: 'Risposte alle obiezioni del recruiter — autoconsapevolezza onesta',
    darkRefusal: 'Preferisco essere sincero su dove sono forte e dove sto ancora crescendo — rispetto a ciò che il ruolo richiede davvero.',
    questions: ['Qual è il tuo limite più grande?', 'Dov’è il divario tra la tua esperienza e questo ruolo?', 'Perché scegliere te rispetto a chi ha più esperienza diretta?'],
  },
  career_narrative: {
    label: 'Racconto professionale',
    description: 'Risposta a "parlami di te" e obiettivo di carriera',
    darkRefusal: 'Preferisco raccontarti con parole mie da dove vengo e dove sto andando — inizio da lì?',
    questions: ['Parlami di te.', 'Raccontami il tuo percorso.', 'Perché cerchi questo tipo di ruolo?'],
  },
  company_fit: {
    label: 'Affinità con l’azienda',
    description: 'Obiettivi di carriera e risposte sulla preparazione al colloquio',
    darkRefusal: 'Ciò che cerco dipende molto dai dettagli — parlami del ruolo e sarò onesto sull’affinità.',
    questions: ['Perché questa azienda?', 'Dove ti vedi tra 3 anni?', 'In che tipo di ambiente rendi al meglio?'],
  },
  constraints: {
    label: 'Vincoli',
    description: 'Sede, disponibilità, visto, periodo di preavviso',
    darkRefusal: 'Disponibilità, preavviso e data d’inizio preferisco definirli con te direttamente — quali sono i vostri tempi?',
    questions: ['Quando puoi iniziare?', 'Sei disponibile a trasferirti?', 'Hai bisogno di visto o permesso di lavoro?'],
  },
  compensation: {
    label: 'Retribuzione',
    description: 'Aspettative salariali',
    darkRefusal: 'Preferisco parlare di cifre quando entrambi vediamo che c’è una reale affinità — su quale fascia siete per il ruolo?',
    questions: ['Quali sono le tue aspettative salariali?', 'Qual è il tuo pacchetto attuale?', 'Quale fascia stai puntando?'],
  },
};

const IT: PlatformStrings = {
  level_sharp: 'Affilato',
  level_solid: 'Solido',
  level_basic: 'Base',
  level_unpublished: 'Non pubblicato',
  shell_test_agent: 'Prova agente',
  shell_coverage: 'Copertura',
  shell_back: 'Indietro',

  conv_empty: 'Il tuo trainer per i colloqui con IA è pronto. Ti spingerà verso i dettagli — date, numeri, sistemi precisi.',
  conv_placeholder: 'Rispondi alla domanda…',
  conv_enter_to_send: 'Invio per inviare',
  conv_send: 'Invia',
  conv_extracting: 'Estrazione delle prove…',
  conv_add_document: 'Aggiungi un documento di supporto',
  conv_close: 'Chiudi',
  conv_attach_document: 'Allega un documento',

  voice_unsupported: 'La registrazione vocale non è supportata in questo browser.',
  voice_record: 'Registra la tua risposta',
  voice_record_again: 'Registra di nuovo',
  voice_stop: 'Ferma registrazione',
  voice_transcribing: 'Trascrizione…',
  voice_too_short: 'Troppo breve per sentirlo — riprova.',
  voice_no_transcript: 'Impossibile trascrivere — riprova.',
  voice_failed: 'Trascrizione fallita — riprova.',
  voice_mic_blocked: 'Accesso al microfono bloccato. Consentilo nel browser per registrare.',

  doc_intro: 'Aggiungi un documento di supporto — un esempio di lavoro, una referenza, una valutazione, la trascrizione di un colloquio. Qualsiasi cosa confermi ciò che mi dici diventa una prova che il tuo agente può sostenere.',
  doc_what_is_it: 'Di cosa si tratta?',
  doc_kind_work_sample: 'Progetto o esempio di lavoro',
  doc_kind_reference: 'Referenza o raccomandazione',
  doc_kind_review: 'Valutazione delle prestazioni / feedback',
  doc_kind_transcript: 'Trascrizione del colloquio',
  doc_kind_other: 'Qualcos’altro',
  doc_upload_button: 'Carica file (PDF, TXT, MD, JSON)',
  doc_reading: 'Lettura del documento…',
  doc_failed: 'Caricamento fallito. Riprova.',
  doc_no_text: 'Nessun testo leggibile trovato in questo file.',
  doc_saved: (f) => `Ricevuto "${f}". Il tuo agente ora può usarlo come prova.`,

  g_needs_cv: (name) => `Ciao ${name} — prima di addestrare qualsiasi cosa, mi serve la tua storia professionale. Carica il tuo CV qui sotto e lo leggerò; questo dà al tuo agente date, ruoli e sistemi da cui partire.`,
  g_needs_goal: () => `Ho il tuo CV. Ora — a cosa punti davvero? Scegli qui sotto ciò che fa per te. Tutto ciò che ti chiederò d’ora in poi sarà valutato rispetto a quell’obiettivo.`,
  g_needs_first_story: `Bene. Ultimo elemento fondamentale: mi servono un paio di esempi reali dal tuo lavoro — di quelli che un recruiter approfondisce. Facciamo il primo adesso. Raccontami qualcosa che hai davvero realizzato: qual era la situazione, cosa hai fatto tu nello specifico e come è andata a finire.`,
  g_ack_cv: 'CV letto — ho i tuoi ruoli e le date.',
  g_ack_goal: 'Fissato.',
  g_ack_story: 'Questo è il tipo di dettaglio che regge. Il tuo agente può usarlo.',
  g_after_goal_change: 'Il tuo agente ora lo racconta così. Una cosa che questo non cambia: l’obiettivo che i recruiter vedono sulla tua scheda. Sistemalo qui sotto perché coincidano.',
  g_after_role_change: 'Il tuo agente ora lo racconta così. Ma i recruiter che sfogliano i profili vedono ancora il tuo ruolo precedente — quello viene dal CV. Aggiungi il ruolo qui sotto, oppure ricarica il CV se è già aggiornato.',
  role_intro: 'Aggiungi il ruolo e la tua scheda si aggiorna per i recruiter.',
  role_company: 'Azienda',
  role_title: 'Ruolo',
  role_start: 'Data di inizio',
  role_end: 'Data di fine',
  role_current: 'Sono ancora in questo ruolo',
  role_prev_end: (company: string) => `Quando hai lasciato ${company}?`,
  role_optional: 'facoltativo',
  role_save: 'Salva ruolo',
  role_saving: 'Salvataggio…',
  role_saved_msg: 'Ruolo aggiunto. I recruiter ora lo vedono sul tuo profilo.',
  role_or_cv: 'Oppure carica un CV aggiornato',
  role_failed: 'Non è stato possibile salvare. Riprova.',
  g_doc_invite: 'Le fondamenta ci sono. Se hai qualcosa che conferma il tuo lavoro — una referenza, una valutazione, la descrizione di un progetto — aggiungilo qui e il tuo agente potrà citarlo. Oppure saltalo e continuiamo a parlare.',
  g_doc_ack: 'Ricevuto — è agli atti come prova che il tuo agente può usare.',

  cluster_track_record: 'Percorso',
  cluster_judgement: 'Giudizio',
  cluster_motivation: 'Motivazione',
  cluster_logistics: 'Logistica',
  cov_state_no_data: 'Nessun dato',
  cov_state_partial: 'Parziale',
  cov_state_solid: 'Solido',
  cov_state_verified: 'Verificato',
  cov_agent_weak: 'Copertura parziale — risponde con riserve e pochi dettagli.',
  cov_agent_solid: 'Copertura sufficiente — risponde con dati verificati.',
  cov_agent_verified: 'Copertura completa — risponde con esempi precisi e citati.',
  cov_what_covers: 'Cosa copre',
  cov_unlocks: 'Sblocca le risposte a',
  cov_agent_says_now: 'Cosa dice l’agente adesso',
  cov_no_data_recruiters: 'Nessun dato. È questo che sentiranno i recruiter.',
  cov_train_this: 'Allena questo',

  ev_quality_verified: 'Verificato',
  ev_quality_solid: 'Solido',
  ev_quality_vague: 'Vago',
  ev_quality_missing_detail: 'Dettaglio mancante',
  ev_probe: 'Approfondisci',
  ev_followup_sent: 'Domanda inviata',
  ev_not_saved: 'Non salvato — ricaricando potresti perderlo',
  ev_replaces_question: 'Questo sostituisce quello che avevi detto prima?',
  ev_replaces_confirm: 'Sì, sostituisci',
  ev_replaces_keep: 'Tieni entrambe',
  ev_replaced_done: 'Sostituito — il tuo agente non dice più la versione precedente',
  ev_replaced_kept: 'Mantenute entrambe',
  dash_evidence_log: 'Registro delle prove',

  pub_publish_agent: 'Pubblica agente',
  pub_to_basic: (r, th) => `${r}/${th} per Base`,
  pub_points_to_basic: (n) => `${n} punt${n !== 1 ? 'i' : 'o'} in più per raggiungere Base. Aggiungi il tuo CV e due storie per arrivarci in ~10 minuti.`,
  pub_ready: 'Pronto per la pubblicazione',
  pub_recruiters_see: 'I recruiter ti vedranno nella directory dei candidati.',
  pub_dark_refusals: (n) => ` ${n} nodo${n !== 1 ? 'i' : ''} senza dati causer${n !== 1 ? 'anno' : 'à'} dei rifiuti — visibili a qualsiasi recruiter che chiede.`,
  pub_answer_every: ' Il tuo agente può rispondere su ogni tema.',
  pub_publishing: 'Pubblicazione…',
  pub_live: 'Attivo',
  pub_updating: 'Aggiornamento…',
  pub_update: 'Aggiorna ↑',
  pub_no_refusals: 'Il tuo agente risponde su ogni tema. Nessun rifiuto.',
  pub_what_recruiters_hear: 'Cosa sentono i recruiter sui temi senza dati',
  pub_train: 'Allena ↗',

  slug_title: 'Il tuo link pubblico',
  slug_intro: 'È l’indirizzo che i recruiter aprono per parlare con il tuo agente.',
  slug_locked_note: 'Cambiare un link già condiviso lo romperebbe. La modifica arriverà più avanti.',
  slug_edit: 'Modifica link',
  slug_available: 'Disponibile',
  slug_cancel: 'Annulla',
  slug_save: 'Salva link',
  slug_saving: 'Salvataggio…',
  slug_save_failed: 'Impossibile salvare.',

  ant_section: 'Domande previste',
  ant_scanning: 'Analizzo il tuo profilo per le domande che faranno i recruiter…',
  ant_intro: 'I recruiter chiederanno questo. Scegline una e rispondi nella chat — il tuo agente dice solo ciò che racconti lì, mai una versione inventata.',
  ant_progress: (answered, total) => `${answered} di ${total} risposte`,
  ant_needs_answer: 'In sospeso',
  ant_priority: 'Prioritaria',
  ant_answer_cta: 'Rispondi nella chat',
  ant_answer_now: 'Rispondi ora',
  ant_checking: 'Verifico la tua risposta…',
  ant_all_answered: 'Ogni domanda che abbiamo trovato ha una risposta solida.',
  ant_remove: 'Rimuovi',
  ant_q_short_tenure: (company) => `Perché la tua esperienza in ${company} è durata così poco e perché è finita?`,
  ant_q_departure: (company) => `Perché hai lasciato ${company}?`,
  ant_q_gap: (from, to) => `Cosa hai fatto tra ${from} e ${to}?`,
  ant_why_short_tenure: (company, role, months) =>
    `Il tuo ruolo di ${role} in ${company} è durato circa ${months} mes${months === 1 ? 'e' : 'i'}. Senza risposta, un passaggio breve sembra un campanello d'allarme.`,
  ant_why_departure: (company) =>
    `Senza un motivo fondato per aver lasciato ${company}, il tuo agente deve rifiutare la domanda.`,
  ant_why_gap: (from, to, months) =>
    `Circa ${months} mesi tra ${from} e ${to}. I recruiter indagano sui buchi; un racconto chiaro li disinnesca.`,
  ant_chat_ask: (question) => `Un recruiter ti chiederà questo: ${question} Rispondi con parole tue — salverò esattamente ciò che dici, nulla di più.`,
  ant_chat_invite: (question) => `Le fondamenta ci sono. La prossima cosa che metterà in difficoltà il tuo agente è una domanda senza risposta: ${question}`,
  ant_chat_reminder: (question) => `È ancora in sospeso, ed è tra le prime che fanno i recruiter: ${question}`,
  ant_chat_stored: 'Salvato. Il tuo agente risponderà a quella domanda con le tue parole e nient\'altro.',
  ant_answering: (question) => `Stai rispondendo a: ${question}`,
  ant_answering_cancel: 'Non ora',
  ant_needs_more: (probe) => `Serve di più per essere utile: ${probe}`,
  ant_default_probe: 'Aggiungi un dettaglio preciso — una data, un nome o un risultato concreto che puoi difendere.',
  ant_error: 'Qualcosa è andato storto — riprova.',

  test_results_title: 'Cosa ha appena vissuto un recruiter',
  test_testing_title: 'Prova del tuo agente',
  test_subtitle: 'Chiedi al tuo agente qualsiasi cosa. Il recruiter sei tu.',
  test_end: 'Termina colloquio',
  test_close: 'Chiudi',
  test_empty: 'Inizia con una domanda qualsiasi che un recruiter potrebbe fare. L’agente risponderà esattamente come in un colloquio reale.',
  test_placeholder: 'Fai una domanda al tuo agente…',
  test_ask: 'Chiedi',
  test_analyzing: 'Analizzo cosa hanno sentito i recruiter…',
  test_no_gaps: 'Nessuna lacuna rilevata. Il tuo agente ha gestito ogni domanda.',
  test_return: 'Torna all’allenamento',
  test_gaps: (n) => (n === 1
    ? 'Un nodo in cui l’agente ha fallito o tentennato.'
    : `${n} nodi in cui l’agente ha fallito o tentennato.`) + ' Allenali per colmare la lacuna prima del tuo prossimo colloquio reale.',
  test_gap_refusal: 'RIFIUTO',
  test_gap_weak: 'DEBOLE',
  test_train_this: 'Allena questo ↗',
  test_you_recruiter: 'Tu (recruiter)',
  test_your_agent: 'Il tuo agente',

  goal_analysing: 'Analisi del tuo CV…',
  goal_anything_else: 'Altro?',
  goal_placeholder: 'Aggiungi il tuo contesto se serve...',
  goal_saving: 'Salvataggio…',
  goal_saved: 'Salvato',
  goal_continue: 'Continua →',
  goal_failed: 'Salvataggio non riuscito. Riprova.',

  cv_intro: 'Carica il tuo CV in PDF o testo semplice. Claude estrarrà il tuo percorso così che l’agente capisca il tuo profilo. (DOCX non supportato — esportalo come PDF da Word.)',
  cv_click_upload: 'Clicca per caricare il CV',
  cv_replace: 'Carica un nuovo CV per sostituire quello esistente',
  cv_extracting: 'Estrazione con IA…',
  cv_on_file: 'CV registrato — il tuo agente conosce il tuo percorso',
  cv_failed: 'Caricamento fallito. Riprova.',
  cv_saved_msg: 'CV elaborato. Il tuo agente ora conosce il tuo percorso professionale.',

  auth_back: '← Indietro',
  auth_email: 'Email',
  auth_password: 'Password',
  auth_generic_error: 'Qualcosa è andato storto. Riprova.',
  login_title: 'Accedi',
  login_subtitle: 'Bentornato su InterviewMind Platform.',
  login_email_ph: 'tu@esempio.com',
  login_password_ph: 'La tua password',
  login_signing: 'Accesso…',
  login_signin: 'Accedi',
  login_failed: 'Accesso non riuscito. Riprova.',
  login_no_account: 'Non hai un account?',
  login_get_started: 'Inizia',
  reg_title: 'Crea account candidato',
  reg_subtitle: 'Mostra il tuo talento ai recruiter.',
  reg_full_name: 'Nome completo',
  reg_name_ph: 'Marco Rossi',
  reg_email_ph: 'marco@esempio.com',
  reg_password_ph: 'Almeno 6 caratteri',
  reg_failed: 'Registrazione non riuscita. Riprova.',
  reg_confirm_email: 'Controlla la tua email per confermare l’account, poi accedi.',
  reg_profile_failed: 'Account creato ma configurazione del profilo non riuscita. Contatta il supporto.',
  reg_creating: 'Creazione account…',
  reg_create: 'Crea account',
  reg_have_account: 'Hai già un account?',
  reg_signin: 'Accedi',

  nodes: IT_NODES,
};

// ── Portuguese ────────────────────────────────────────────────────────────────

const PT_NODES: Record<CoverageNodeKey, PlatformNode> = {
  role_history: {
    label: 'Histórico de funções',
    description: 'Experiência profissional, permanência e progressão do CV',
    darkRefusal: 'Prefiro explicar-te o meu percurso como deve ser do que despejar datas e cargos — por onde queres que comece?',
    questions: ['Fala-me do teu percurso profissional.', 'Quanto tempo estiveste na [empresa]?', 'Como foi a tua progressão?'],
  },
  signature_stories: {
    label: 'Histórias marcantes',
    description: 'Exemplos comportamentais (STAR) de vários tipos',
    darkRefusal: 'Prefiro dar-te um exemplo real em contexto do que recorrer a um ensaiado — que tipo de situação queres avaliar?',
    questions: ['Fala-me de uma vez em que…', 'Dá-me um exemplo de como lidaste com [situação].', 'Fala-me de um projeto de que te orgulhas.'],
  },
  metrics_impact: {
    label: 'Métricas e impacto',
    description: 'Resultados quantificados e evidências profissionais verificadas',
    darkRefusal: 'Prefiro não atirar números que não consigo defender — posso dizer-te concretamente o que mudou e como.',
    questions: ['Que resultados alcançaste?', 'Consegues quantificar esse impacto?', 'O que melhorou graças ao teu trabalho?'],
  },
  tools_systems: {
    label: 'Ferramentas e sistemas',
    description: 'Ferramentas técnicas, plataformas e sistemas do CV',
    darkRefusal: 'Prefiro explicar-te os sistemas que realmente operei do que dar-te uma lista — o que é relevante para a função?',
    questions: ['Com que sistemas trabalhaste?', 'Conheces [ferramenta]?', 'Como aprendes depressa uma plataforma nova?'],
  },
  failure_modes: {
    label: 'Erros e fracassos',
    description: 'Histórias do maior fracasso e lições aprendidas',
    darkRefusal: 'É uma conversa que prefiro ter contigo diretamente do que dar uma resposta arrumada e ensaiada.',
    questions: ['Fala-me de uma vez em que falhaste.', 'Qual foi o teu maior erro profissional?', 'Fala-me de uma lição que mudou a tua forma de trabalhar.'],
  },
  conflict_disagreement: {
    label: 'Conflito e desacordo',
    description: 'Como lido com conflitos e desacordos com as partes',
    darkRefusal: 'Prefiro explicar como lido de facto com o desacordo do que tirar uma história do contexto — com todo o gosto.',
    questions: ['Fala-me de um conflito com um colega.', 'Como lidas com um desacordo com um gestor?', 'Dá-me um exemplo de como geriste uma parte difícil.'],
  },
  decision_style: {
    label: 'Estilo de decisão',
    description: 'Respostas de autoavaliação sobre o estilo de comunicação',
    darkRefusal: 'Provavelmente perceberás melhor como decido pela forma como esta conversa corre do que por eu descrever.',
    questions: ['Como tomas decisões sob pressão?', 'Descreve a tua forma de trabalhar.', 'Como defines prioridades quando tudo é urgente?'],
  },
  limits_gaps: {
    label: 'Limites e lacunas',
    description: 'Respostas a objeções do recrutador — autoconsciência honesta',
    darkRefusal: 'Prefiro ser franco sobre onde sou forte e onde ainda estou a crescer — em função do que a função realmente exige.',
    questions: ['Qual é a tua maior fraqueza?', 'Onde está a lacuna entre a tua experiência e esta função?', 'Porquê escolher-te a ti em vez de alguém com mais experiência direta?'],
  },
  career_narrative: {
    label: 'Narrativa profissional',
    description: 'Resposta a "fala-me de ti" e objetivo de carreira',
    darkRefusal: 'Prefiro contar-te por palavras minhas de onde venho e para onde vou — começo por aí?',
    questions: ['Fala-me de ti.', 'Fala-me do teu percurso.', 'Porque procuras este tipo de função?'],
  },
  company_fit: {
    label: 'Adequação à empresa',
    description: 'Objetivos de carreira e respostas de preparação para a entrevista',
    darkRefusal: 'O que procuro depende muito dos detalhes — fala-me da função e serei honesto sobre a adequação.',
    questions: ['Porquê esta empresa?', 'Onde te vês daqui a 3 anos?', 'Em que tipo de ambiente rendes melhor?'],
  },
  constraints: {
    label: 'Condicionantes',
    description: 'Localização, disponibilidade, visto, período de aviso prévio',
    darkRefusal: 'A minha disponibilidade, aviso prévio e data de início prefiro combinar contigo diretamente — quais são os vossos prazos?',
    questions: ['Quando podes começar?', 'Estás aberto a mudar de cidade?', 'Precisas de visto ou autorização de trabalho?'],
  },
  compensation: {
    label: 'Remuneração',
    description: 'Expectativas salariais',
    darkRefusal: 'Prefiro falar de números quando ambos virmos que há uma adequação real — em que intervalo estão para a função?',
    questions: ['Quais são as tuas expectativas salariais?', 'Qual é o teu pacote atual?', 'Que intervalo procuras?'],
  },
};

const PT: PlatformStrings = {
  level_sharp: 'Afiado',
  level_solid: 'Sólido',
  level_basic: 'Básico',
  level_unpublished: 'Não publicado',
  shell_test_agent: 'Testar agente',
  shell_coverage: 'Cobertura',
  shell_back: 'Voltar',

  conv_empty: 'O teu treinador de entrevistas com IA está pronto. Vai exigir concretude — datas, números, sistemas específicos.',
  conv_placeholder: 'Responde à pergunta…',
  conv_enter_to_send: 'Enter para enviar',
  conv_send: 'Enviar',
  conv_extracting: 'A extrair evidência…',
  conv_add_document: 'Adicionar um documento de apoio',
  conv_close: 'Fechar',
  conv_attach_document: 'Anexar um documento',

  voice_unsupported: 'A gravação de voz não é suportada neste navegador.',
  voice_record: 'Grava a tua resposta',
  voice_record_again: 'Gravar novamente',
  voice_stop: 'Parar gravação',
  voice_transcribing: 'A transcrever…',
  voice_too_short: 'Demasiado curto para ouvir — tenta de novo.',
  voice_no_transcript: 'Não foi possível transcrever — tenta de novo.',
  voice_failed: 'A transcrição falhou — tenta de novo.',
  voice_mic_blocked: 'O acesso ao microfone foi bloqueado. Permite-o no navegador para gravar.',

  doc_intro: 'Adiciona um documento de apoio — uma amostra de trabalho, uma referência, uma avaliação, a transcrição de uma entrevista. Tudo o que sustente o que me dizes torna-se evidência que o teu agente pode defender.',
  doc_what_is_it: 'O que é?',
  doc_kind_work_sample: 'Projeto ou amostra de trabalho',
  doc_kind_reference: 'Referência ou recomendação',
  doc_kind_review: 'Avaliação de desempenho / feedback',
  doc_kind_transcript: 'Transcrição de entrevista',
  doc_kind_other: 'Outra coisa',
  doc_upload_button: 'Carregar ficheiro (PDF, TXT, MD, JSON)',
  doc_reading: 'A ler documento…',
  doc_failed: 'O carregamento falhou. Tenta de novo.',
  doc_no_text: 'Nenhum texto legível encontrado neste ficheiro.',
  doc_saved: (f) => `Recebi "${f}". O teu agente já pode usá-lo como evidência.`,

  g_needs_cv: (name) => `Olá ${name} — antes de treinar seja o que for, preciso do teu percurso profissional. Carrega o teu CV abaixo e eu leio-o; isso dá ao teu agente datas, funções e sistemas para trabalhar.`,
  g_needs_goal: () => `Tenho o teu CV. Agora — o que procuras realmente? Escolhe abaixo o que se aplica. Tudo o que te perguntar daqui para a frente é avaliado face a esse objetivo.`,
  g_needs_first_story: `Bom. Última peça fundamental: preciso de um par de exemplos reais do teu trabalho — do tipo que um recrutador investiga. Vamos ao primeiro agora. Conta-me algo que tenhas mesmo concretizado: qual era a situação, o que fizeste tu especificamente e como terminou.`,
  g_ack_cv: 'CV lido — tenho as tuas funções e datas.',
  g_ack_goal: 'Fixado.',
  g_ack_story: 'É este o tipo de detalhe que se aguenta. O teu agente pode usá-lo.',
  g_after_goal_change: 'O teu agente já o conta assim. Uma coisa que isso não muda: o objetivo que os recrutadores veem na tua ficha. Ajusta-o abaixo para que coincidam.',
  g_after_role_change: 'O teu agente já o conta assim. Mas os recrutadores que veem perfis continuam a ver o teu cargo anterior — isso vem do teu CV. Adiciona o cargo abaixo, ou carrega de novo o CV se já estiver atualizado.',
  role_intro: 'Adiciona o cargo e a tua ficha atualiza-se para os recrutadores.',
  role_company: 'Empresa',
  role_title: 'Cargo',
  role_start: 'Data de início',
  role_end: 'Data de fim',
  role_current: 'Continuo neste cargo',
  role_prev_end: (company: string) => `Quando saíste de ${company}?`,
  role_optional: 'opcional',
  role_save: 'Guardar cargo',
  role_saving: 'A guardar…',
  role_saved_msg: 'Cargo adicionado. Os recrutadores já o veem no teu perfil.',
  role_or_cv: 'Ou carrega um CV atualizado',
  role_failed: 'Não foi possível guardar. Tenta de novo.',
  g_doc_invite: 'As fundações estão feitas. Se tens algo que sustente o teu trabalho — uma referência, uma avaliação de desempenho, a descrição de um projeto — adiciona-o aqui e o teu agente poderá citá-lo. Ou salta e continuamos a conversar.',
  g_doc_ack: 'Recebido — fica registado como evidência que o teu agente pode usar.',

  cluster_track_record: 'Percurso',
  cluster_judgement: 'Discernimento',
  cluster_motivation: 'Motivação',
  cluster_logistics: 'Logística',
  cov_state_no_data: 'Sem dados',
  cov_state_partial: 'Parcial',
  cov_state_solid: 'Sólido',
  cov_state_verified: 'Verificado',
  cov_agent_weak: 'Cobertura parcial — responde com ressalvas e poucos detalhes.',
  cov_agent_solid: 'Cobertura suficiente — responde com dados verificados.',
  cov_agent_verified: 'Cobertura completa — responde com exemplos concretos e citados.',
  cov_what_covers: 'O que isto cobre',
  cov_unlocks: 'Desbloqueia respostas a',
  cov_agent_says_now: 'O que o agente diz agora',
  cov_no_data_recruiters: 'Sem dados. É isto que os recrutadores vão ouvir.',
  cov_train_this: 'Treinar isto',

  ev_quality_verified: 'Verificado',
  ev_quality_solid: 'Sólido',
  ev_quality_vague: 'Vago',
  ev_quality_missing_detail: 'Falta detalhe',
  ev_probe: 'Aprofundar',
  ev_followup_sent: 'Seguimento enviado',
  ev_not_saved: 'Não guardado — ao recarregar podes perdê-lo',
  ev_replaces_question: 'Isto substitui o que disseste antes?',
  ev_replaces_confirm: 'Sim, substituir',
  ev_replaces_keep: 'Manter ambas',
  ev_replaced_done: 'Substituído — o teu agente já não diz a versão anterior',
  ev_replaced_kept: 'Ambas mantidas',
  dash_evidence_log: 'Registo de evidência',

  pub_publish_agent: 'Publicar agente',
  pub_to_basic: (r, th) => `${r}/${th} para Básico`,
  pub_points_to_basic: (n) => `Mais ${n} ponto${n !== 1 ? 's' : ''} para chegar a Básico. Adiciona o teu CV e duas histórias para lá chegar em ~10 minutos.`,
  pub_ready: 'Pronto para publicar',
  pub_recruiters_see: 'Os recrutadores vão ver-te no diretório de candidatos.',
  pub_dark_refusals: (n) => ` ${n} nó${n !== 1 ? 's' : ''} sem dados vai${n !== 1 ? 'o' : ''} causar recusas — visíveis a qualquer recrutador que pergunte.`,
  pub_answer_every: ' O teu agente consegue responder a qualquer tema.',
  pub_publishing: 'A publicar…',
  pub_live: 'Ativo',
  pub_updating: 'A atualizar…',
  pub_update: 'Atualizar ↑',
  pub_no_refusals: 'O teu agente responde a qualquer tema. Sem recusas.',
  pub_what_recruiters_hear: 'O que os recrutadores ouvem nos temas sem dados',
  pub_train: 'Treinar ↗',

  slug_title: 'O teu link público',
  slug_intro: 'É o endereço que os recrutadores abrem para falar com o teu agente.',
  slug_locked_note: 'Mudar um link já partilhado iria quebrá-lo. A edição chega mais tarde.',
  slug_edit: 'Editar link',
  slug_available: 'Disponível',
  slug_cancel: 'Cancelar',
  slug_save: 'Guardar link',
  slug_saving: 'A guardar…',
  slug_save_failed: 'Não foi possível guardar.',

  ant_section: 'Perguntas previstas',
  ant_scanning: 'A analisar o teu perfil à procura de perguntas que os recrutadores farão…',
  ant_intro: 'Os recrutadores vão perguntar isto. Escolhe uma e responde no chat — o teu agente só diz o que contares aí, nunca uma versão inventada.',
  ant_progress: (answered, total) => `${answered} de ${total} respondidas`,
  ant_needs_answer: 'Pendente',
  ant_priority: 'Prioritária',
  ant_answer_cta: 'Responder no chat',
  ant_answer_now: 'Responder agora',
  ant_checking: 'A verificar a tua resposta…',
  ant_all_answered: 'Todas as perguntas que encontrámos têm uma resposta sólida.',
  ant_remove: 'Remover',
  ant_q_short_tenure: (company) => `Porque é que a tua passagem pela ${company} foi tão curta e porque terminou?`,
  ant_q_departure: (company) => `Porque saíste da ${company}?`,
  ant_q_gap: (from, to) => `O que fizeste entre ${from} e ${to}?`,
  ant_why_short_tenure: (company, role, months) =>
    `O teu cargo de ${role} na ${company} durou cerca de ${months} mes${months === 1 ? '' : 'es'}. Sem resposta, uma passagem curta lê-se como sinal de alerta.`,
  ant_why_departure: (company) =>
    `Sem um motivo fundamentado para teres saído da ${company}, o teu agente tem de recusar a pergunta.`,
  ant_why_gap: (from, to, months) =>
    `Cerca de ${months} meses entre ${from} e ${to}. Os recrutadores insistem nos intervalos; um relato claro desarma-o.`,
  ant_chat_ask: (question) => `Um recrutador vai perguntar isto: ${question} Responde por palavras tuas — vou guardar exactamente o que disseres, nada mais.`,
  ant_chat_invite: (question) => `Já tens a base montada. O que a seguir vai deixar o teu agente em apuros é uma pergunta por responder: ${question}`,
  ant_chat_reminder: (question) => `Continua pendente, e é das primeiras que os recrutadores fazem: ${question}`,
  ant_chat_stored: 'Guardado. O teu agente responde a essa pergunta com as tuas palavras e nada mais.',
  ant_answering: (question) => `A responder: ${question}`,
  ant_answering_cancel: 'Agora não',
  ant_needs_more: (probe) => `Precisa de mais para ser útil: ${probe}`,
  ant_default_probe: 'Adiciona um detalhe concreto — uma data, um nome ou um resultado que consigas defender.',
  ant_error: 'Algo correu mal — tenta de novo.',

  test_results_title: 'O que um recrutador acabou de viver',
  test_testing_title: 'A testar o teu agente',
  test_subtitle: 'Pergunta o que quiseres ao teu agente. O recrutador és tu.',
  test_end: 'Terminar entrevista',
  test_close: 'Fechar',
  test_empty: 'Começa com qualquer pergunta que um recrutador faria. O agente responderá exatamente como numa entrevista real.',
  test_placeholder: 'Faz uma pergunta ao teu agente…',
  test_ask: 'Perguntar',
  test_analyzing: 'A analisar o que os recrutadores ouviram…',
  test_no_gaps: 'Nenhuma lacuna detetada. O teu agente respondeu a tudo.',
  test_return: 'Voltar ao treino',
  test_gaps: (n) => (n === 1
    ? 'Um nó onde o agente falhou ou hesitou.'
    : `${n} nós onde o agente falhou ou hesitou.`) + ' Treina-os para fechar a lacuna antes da tua próxima entrevista real.',
  test_gap_refusal: 'RECUSA',
  test_gap_weak: 'FRACO',
  test_train_this: 'Treinar isto ↗',
  test_you_recruiter: 'Tu (recrutador)',
  test_your_agent: 'O teu agente',

  goal_analysing: 'A analisar o teu CV…',
  goal_anything_else: 'Mais alguma coisa?',
  goal_placeholder: 'Adiciona o teu contexto se for preciso...',
  goal_saving: 'A guardar…',
  goal_saved: 'Guardado',
  goal_continue: 'Continuar →',
  goal_failed: 'Não foi possível guardar. Tenta de novo.',

  cv_intro: 'Carrega o teu CV em PDF ou texto simples. O Claude extrai o teu percurso para que o agente entenda o teu perfil. (DOCX não suportado — exporta como PDF a partir do Word.)',
  cv_click_upload: 'Clica para carregar o CV',
  cv_replace: 'Carrega um novo CV para substituir o existente',
  cv_extracting: 'A extrair com IA…',
  cv_on_file: 'CV registado — o teu agente conhece o teu percurso',
  cv_failed: 'O carregamento falhou. Tenta de novo.',
  cv_saved_msg: 'CV processado. O teu agente já conhece o teu percurso profissional.',

  auth_back: '← Voltar',
  auth_email: 'Email',
  auth_password: 'Palavra-passe',
  auth_generic_error: 'Algo correu mal. Tenta de novo.',
  login_title: 'Entrar',
  login_subtitle: 'Bem-vindo de volta ao InterviewMind Platform.',
  login_email_ph: 'tu@exemplo.com',
  login_password_ph: 'A tua palavra-passe',
  login_signing: 'A entrar…',
  login_signin: 'Entrar',
  login_failed: 'Não foi possível entrar. Tenta de novo.',
  login_no_account: 'Não tens conta?',
  login_get_started: 'Começar',
  reg_title: 'Criar conta de candidato',
  reg_subtitle: 'Mostra o teu talento aos recrutadores.',
  reg_full_name: 'Nome completo',
  reg_name_ph: 'João Silva',
  reg_email_ph: 'joao@exemplo.com',
  reg_password_ph: 'Pelo menos 6 caracteres',
  reg_failed: 'O registo falhou. Tenta de novo.',
  reg_confirm_email: 'Verifica o teu email para confirmar a conta e depois entra.',
  reg_profile_failed: 'Conta criada mas a configuração do perfil falhou. Contacta o suporte.',
  reg_creating: 'A criar conta…',
  reg_create: 'Criar conta',
  reg_have_account: 'Já tens conta?',
  reg_signin: 'Entrar',

  nodes: PT_NODES,
};

export const PLATFORM_TRANSLATIONS: Record<Lang, PlatformStrings> = {
  en: EN,
  es: ES,
  it: IT,
  pt: PT,
};

export function usePlatformT(): PlatformStrings {
  const { lang } = useLanguage();
  return PLATFORM_TRANSLATIONS[lang];
}
