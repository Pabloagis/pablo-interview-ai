'use client';

import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from 'react';
import { MAX_MESSAGE_LENGTH } from '@/lib/constants';
import { generateId } from '@/lib/utils';
import Toast from '@/components/Toast';
import type { ToastMessage } from '@/lib/types';
import { useLanguage, LANG_FLAGS, type Lang } from '@/context/LanguageContext';
import { usePlatformT, type PlatformStrings } from '@/context/platform-i18n';
import type { CoverageNodeKey } from '@/lib/coverage-nodes';
import VoiceRecorder from '@/app/dashboard/candidate/components/VoiceRecorder';

// The recruiter-facing chat. This is the product: everything the candidate
// builds in the trainer is judged here, by someone who arrived from a link and
// will give it about a minute before deciding whether it is worth their time.
//
// The interaction rules below were paid for once already in the v2 interview
// chat and are carried over deliberately — each one existed because the naive
// version of it failed on a real device or with a real user:
//
//   - the shell is `fixed inset-0` at 100dvh, never 100vh: mobile browser
//     chrome resizes the viewport and 100vh puts the composer under it
//   - every shrinkable child carries min-w-0, or a long unbroken string
//     (a URL, a German compound) widens the flex row and the page scrolls
//     sideways
//   - message text is whitespace-pre-wrap break-words: the agent writes in
//     paragraphs, and without it they collapse into a wall
//   - the composer's font-size is 16px, because iOS Safari zooms the whole
//     page on focus for anything smaller
//   - while streaming, the scroll pins the TOP of the answer, not the bottom:
//     chasing the last token drags the text out from under the reader
//   - platform errors are toasts, never assistant bubbles. A bubble is the
//     candidate's voice; a rate-limit notice rendered there attributes words
//     to them that they never said

// ── Suggested topics ─────────────────────────────────────────────────────────
// Built from the same twelve coverage nodes the candidate trains against, using
// the translations already in platform-i18n. That means the strip is an honest
// map of what the agent was built to cover, and it needs no separate string
// table to keep in sync with the trainer.
interface Topic { label: string; question: string }

const TOPIC_KEYS: CoverageNodeKey[] = [
  'career_narrative', 'metrics_impact', 'failure_modes',
  'role_history', 'limits_gaps', 'conflict_disagreement',
  'decision_style', 'tools_systems', 'company_fit',
  'constraints', 'compensation', 'signature_stories',
];

function buildTopics(t: PlatformStrings): Topic[] {
  const out: Topic[] = [];
  for (const key of TOPIC_KEYS) {
    const node = t.nodes[key];
    // The node question lists mix complete questions with templates a recruiter
    // is expected to fill in ("Are you familiar with [tool]?") and openers that
    // trail off ("Tell me about a time you…"). Only a complete one can be sent
    // by a single click, so anything else is skipped.
    const q = node.questions.find(s => !s.includes('[') && !s.includes('…') && !s.includes('...'));
    if (q) out.push({ label: node.label, question: q });
  }
  return out;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2500;

// Proactive turns. Both cost a model call, so both are additionally gated on the
// server — see the comment in /api/public/chat. Here they are also gated on the
// tab being visible, so a page left open in a background tab never spends a
// single token.
const INTRO_DELAY_MS  = 30_000;
const CHECKIN_IDLE_MS = 90_000;
const IDLE_TICK_MS    = 10_000;

const SPEECH_LOCALE: Record<Lang, string> = {
  en: 'en-GB', es: 'es-ES', it: 'it-IT', pt: 'pt-PT',
};
const LANG_ORDER: Lang[] = ['en', 'es', 'it', 'pt'];

function pickRandom<T>(pool: T[], n: number): T[] {
  return [...pool].sort(() => Math.random() - 0.5).slice(0, n);
}

interface Candidate {
  slug: string;
  name: string;
  headline: string | null;
  avatarUrl: string | null;
}
interface Props {
  candidate: Candidate;
  enabled: boolean;
}
interface ChatMsg { id: string; role: 'user' | 'assistant'; content: string }

export default function PublicAgentChat({ candidate, enabled }: Props) {
  const { lang, setLang } = useLanguage();
  const t = usePlatformT();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<Topic[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [ended, setEnded] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [endingSubmitting, setEndingSubmitting] = useState(false);
  const [speakAloud, setSpeakAloud] = useState(false);
  const [ttsAvailable, setTtsAvailable] = useState(false);

  const sessionRef       = useRef<string | null>(null);
  const endedRef         = useRef(false);
  const streamingRef     = useRef(false);
  const messagesRef      = useRef<ChatMsg[]>([]);
  const inputRef         = useRef('');
  const langRef          = useRef<Lang>(lang);
  const speakRef         = useRef(false);
  const lastActivityRef  = useRef(Date.now());
  const checkinAtRef     = useRef(-1);       // messages.length the last check-in was fired for
  const introFiredRef    = useRef(false);    // StrictMode double-invokes effects
  const bottomRef        = useRef<HTMLDivElement>(null);
  const streamingTopRef  = useRef<HTMLDivElement>(null);
  const textareaRef      = useRef<HTMLTextAreaElement>(null);
  const startedRef       = useRef(false);
  const usedTopicsRef    = useRef<Set<string>>(new Set());

  const storageKey = `im_pub_${candidate.slug}`;

  useEffect(() => { sessionRef.current   = sessionId;         }, [sessionId]);
  useEffect(() => { endedRef.current     = ended;             }, [ended]);
  useEffect(() => { streamingRef.current = isStreaming;       }, [isStreaming]);
  useEffect(() => { inputRef.current     = input;             }, [input]);
  useEffect(() => { langRef.current      = lang;              }, [lang]);
  useEffect(() => { speakRef.current     = speakAloud;        }, [speakAloud]);
  useEffect(() => { messagesRef.current  = messages; lastActivityRef.current = Date.now(); }, [messages]);

  // ── Scroll ─────────────────────────────────────────────────────────────────
  // Note the dependency list: messages.length and isStreaming, never
  // streamingText. Reacting to every token scrolls the answer out from under
  // the reader as it arrives. While streaming we pin the top of the incoming
  // message so it fills downward from where their eyes already are.
  useEffect(() => {
    if (isStreaming) streamingTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isStreaming]);

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'error') => {
    setToasts(prev => [...prev, { id: generateId(), message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);

  // ── Read aloud ─────────────────────────────────────────────────────────────
  // The browser's own speech synthesis, not a TTS API: it is free, needs no
  // server round-trip, and the voice follows whatever the visitor has installed.
  // Feature detection runs in an effect so the server and client first render
  // agree.
  useEffect(() => {
    setTtsAvailable(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); };
  }, []);

  const speak = useCallback((text: string) => {
    if (!speakRef.current || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LOCALE[langRef.current];
    window.speechSynthesis.speak(utterance);
  }, []);

  function toggleSpeak() {
    setSpeakAloud(prev => {
      if (prev && typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      return !prev;
    });
  }

  // ── Suggestions ────────────────────────────────────────────────────────────
  // Rebuilt when the language changes so the chips are never left in the
  // previous language.
  useEffect(() => {
    const pool = buildTopics(t);
    usedTopicsRef.current = new Set();
    const initial = pickRandom(pool, 3);
    initial.forEach(tp => usedTopicsRef.current.add(tp.label));
    setSuggestions(initial);
  }, [t]);

  useEffect(() => {
    if (!isStreaming) return;
    setThinkingIndex(0);
    const id = setInterval(() => setThinkingIndex(i => i + 1), 1800);
    return () => clearInterval(id);
  }, [isStreaming]);

  // ── Session: resume the visitor's own conversation, or start a new one ─────
  // The browser stores only the session id. The transcript comes back from the
  // server, so what is on screen always matches the history the agent will
  // actually be given — a locally cached transcript could drift from it.
  useEffect(() => {
    if (!enabled || startedRef.current) return;
    startedRef.current = true;
    (async () => {
      let prior: string | null = null;
      try { prior = localStorage.getItem(storageKey); } catch { /* private mode */ }
      try {
        const res = await fetch('/api/public/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: candidate.slug, resume: prior ?? undefined }),
        });
        if (res.status === 503) { setStartError('unavailable'); return; }
        if (res.status === 429) { setStartError(t.pub_too_many); return; }
        if (!res.ok) { setStartError(t.pub_start_failed); return; }

        const data = await res.json() as {
          sessionId: string;
          messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
          resumed?: boolean;
        };
        setSessionId(data.sessionId);
        try { localStorage.setItem(storageKey, data.sessionId); } catch { /* private mode */ }

        if (data.resumed && data.messages?.length) {
          setMessages(data.messages.map(m => ({ id: generateId(), role: m.role, content: m.content })));
          introFiredRef.current = true;   // there is a conversation already; nothing to open
          addToast(t.pub_resumed, 'info');
        }
      } catch {
        setStartError(t.pub_start_failed);
      }
    })();
    // The strings are read once at start-up; re-running this on a language
    // change would create a second session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, candidate.slug]);

  // ── Best-effort end on tab close ───────────────────────────────────────────
  useEffect(() => {
    const fire = () => {
      const id = sessionRef.current;
      if (!id || endedRef.current || messagesRef.current.length === 0) return;
      const blob = new Blob([JSON.stringify({ sessionId: id })], { type: 'application/json' });
      navigator.sendBeacon('/api/public/session/end', blob);
    };
    const onVis = () => { if (document.visibilityState === 'hidden') fire(); };
    window.addEventListener('pagehide', fire);
    document.addEventListener('visibilitychange', onVis);
    return () => { window.removeEventListener('pagehide', fire); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  // ── One streaming turn ─────────────────────────────────────────────────────
  // `mode` is set for the two turns the agent takes on its own. Those show no
  // user bubble, are never retried (an unprompted message that fails is not
  // worth a second model call), and swallow a 409 in silence — a 409 means the
  // server decided the turn was not warranted, which is not the visitor's
  // problem.
  const runTurn = useCallback(async (text: string | null, mode?: 'intro' | 'checkin') => {
    const sid = sessionRef.current;
    if (!sid || streamingRef.current || endedRef.current) return;
    if (!mode && !text) return;
    // Set synchronously, not via the state effect: the idle timer and a click can
    // land in the same tick, and `isStreaming` would not be true yet for either.
    streamingRef.current = true;

    if (!mode && text) {
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      setMessages(prev => [...prev, { id: generateId(), role: 'user', content: text }]);
    }
    setIsStreaming(true);
    setStreamingText('');

    let assistant = '';
    let failure: string | null = null;
    let conversationEnded = false;
    const attempts = mode ? 0 : MAX_RETRIES;

    for (let attempt = 0; attempt <= attempts; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      failure = null;

      try {
        const res = await fetch('/api/public/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid, message: text ?? undefined, mode, lang: langRef.current }),
        });

        if (res.status === 409) { if (!mode) conversationEnded = true; break; }
        if (res.status === 429) {
          // A toast, not a bubble: this is the platform speaking, not the agent,
          // and a bubble would put these words in the candidate's mouth.
          if (!mode) failure = t.pub_slow_down;
          break;
        }
        if (!res.ok || !res.body) {
          // A 5xx is worth another attempt; a 4xx will fail the same way twice.
          if (res.status >= 500 && attempt < attempts) { failure = t.pub_failed; continue; }
          const body = await res.json().catch(() => null) as { error?: string } | null;
          failure = body?.error || t.pub_failed;
          break;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const evt = JSON.parse(line.slice(6)) as { type: string; text?: string; message?: string };
              if (evt.type === 'content' && evt.text) { assistant += evt.text; setStreamingText(assistant); }
              else if (evt.type === 'error') { failure = evt.message || t.pub_failed; break outer; }
              else if (evt.type === 'done') break outer;
            } catch { /* a partial line — the next chunk completes it */ }
          }
        }
        break;
      } catch {
        // Only retry while nothing has been shown yet: retrying mid-answer
        // restarts the response and duplicates text already on screen.
        if (assistant === '' && attempt < attempts) { failure = t.pub_failed; continue; }
        failure = t.pub_failed;
        break;
      }
    }

    streamingRef.current = false;
    setIsStreaming(false);
    setStreamingText('');
    if (assistant) {
      setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: assistant }]);
      speak(assistant);
    }
    if (conversationEnded) {
      setEnded(true);
      try { localStorage.removeItem(storageKey); } catch { /* private mode */ }
    } else if (mode) {
      // Silent by design: the visitor never asked for this turn.
    } else if (failure) {
      // Silence reads as a broken page, so a failure that produced no text
      // always says something; one that produced partial text says it quietly.
      addToast(failure, assistant ? 'info' : 'error');
    } else if (!assistant) {
      addToast(t.pub_no_answer);
    }
  }, [t, addToast, speak, storageKey]);

  // ── Proactive opening ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || ended) return;
    const timer = setTimeout(() => {
      if (introFiredRef.current) return;                       // StrictMode / already opened
      if (messagesRef.current.length > 0) return;
      if (streamingRef.current || inputRef.current.trim()) return;
      if (document.visibilityState !== 'visible') return;      // never spend a call on a background tab
      introFiredRef.current = true;
      void runTurn(null, 'intro');
    }, INTRO_DELAY_MS);
    return () => clearTimeout(timer);
  }, [sessionId, ended, runTurn]);

  // ── Check-in after a silence ───────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || ended) return;
    const id = setInterval(() => {
      const msgs = messagesRef.current;
      // Needs a real exchange behind it — the server rejects a check-in whose
      // previous turn is not a visitor message, so after a bare opening there is
      // nothing to check in on and no request worth sending.
      if (msgs.length < 2 || msgs[msgs.length - 1].role !== 'assistant') return;
      if (msgs[msgs.length - 2].role !== 'user') return;
      if (checkinAtRef.current === msgs.length) return;        // already checked in on this answer
      if (streamingRef.current || endedRef.current) return;
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastActivityRef.current < CHECKIN_IDLE_MS) return;
      checkinAtRef.current = msgs.length;
      void runTurn(null, 'checkin');
    }, IDLE_TICK_MS);
    return () => clearInterval(id);
  }, [sessionId, ended, runTurn]);

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void runTurn(input.trim() || null); }
  }

  // Auto-grow to a ceiling, the way every messaging app behaves. Without the
  // reset to 'auto' first, the box only ever grows and never shrinks back.
  function onInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH));
    lastActivityRef.current = Date.now();
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function onTranscript(text: string) {
    setInput(prev => (prev ? `${prev} ${text}` : text).slice(0, MAX_MESSAGE_LENGTH));
    lastActivityRef.current = Date.now();
    textareaRef.current?.focus();
  }

  function useTopic(topic: Topic) {
    const pool = buildTopics(t);
    usedTopicsRef.current.add(topic.label);
    const unused = pool.filter(tp => !usedTopicsRef.current.has(tp.label));
    const replacement = unused.length > 0 ? pickRandom(unused, 1) : [];
    replacement.forEach(tp => usedTopicsRef.current.add(tp.label));
    setSuggestions(prev => [...prev.filter(s => s.label !== topic.label), ...replacement]);
    void runTurn(topic.question);
  }

  function refreshSuggestions() {
    const pool = buildTopics(t);
    usedTopicsRef.current = new Set();
    const next = pickRandom(pool, 3);
    next.forEach(tp => usedTopicsRef.current.add(tp.label));
    setSuggestions(next);
  }

  // `share` false = Skip. The two buttons used to run identical code, so a
  // recruiter who typed their name and then chose Skip had it sent anyway.
  const submitEnd = useCallback(async (share: boolean) => {
    setEndingSubmitting(true);
    try {
      await fetch('/api/public/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          recruiterName:  share ? (recruiterName.trim()  || undefined) : undefined,
          recruiterEmail: share ? (recruiterEmail.trim() || undefined) : undefined,
        }),
      });
    } catch { /* non-fatal */ }
    try { localStorage.removeItem(storageKey); } catch { /* private mode */ }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setEndingSubmitting(false);
    setShowEnd(false);
    setEnded(true);
  }, [sessionId, recruiterName, recruiterEmail, storageKey]);

  const initials  = candidate.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const firstName = candidate.name.split(' ')[0];
  const openers   = buildTopics(t).slice(0, 3);

  const langBar = (
    <div className="flex items-center gap-0.5 shrink-0">
      {LANG_ORDER.map(code => (
        <button
          key={code}
          onClick={() => setLang(code)}
          aria-label={code}
          aria-pressed={lang === code}
          className="w-7 h-7 rounded-lg text-sm leading-none transition-opacity"
          style={{ opacity: lang === code ? 1 : 0.35, background: lang === code ? 'rgba(255,255,255,0.07)' : 'transparent' }}
        >
          {LANG_FLAGS[code]}
        </button>
      ))}
    </div>
  );

  // ── Unavailable (kill switch) ──────────────────────────────────────────────
  if (!enabled || startError === 'unavailable') {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center px-4 text-center bg-[#0d0f14]"
        style={{ height: '100dvh' }}
      >
        <Header candidate={candidate} initials={initials} />
        <p className="mt-6 text-sm text-[rgba(255,255,255,0.5)] max-w-sm">{t.pub_unavailable}</p>
      </div>
    );
  }

  const showChips = suggestions.length > 0 && !ended;

  return (
    <>
      <div
        className="fixed inset-0 flex flex-col overflow-hidden bg-[#0d0f14]"
        style={{ height: '100dvh', contain: 'layout' }}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="shrink-0 px-5 pt-6 pb-4 border-b border-white/[0.07]">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex-1 min-w-0"><Header candidate={candidate} initials={initials} /></div>
            {langBar}
            {ttsAvailable && (
              <button
                onClick={toggleSpeak}
                aria-label={speakAloud ? t.pub_speak_off : t.pub_speak_on}
                aria-pressed={speakAloud}
                title={speakAloud ? t.pub_speak_off : t.pub_speak_on}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border transition-colors"
                style={{
                  borderColor: speakAloud ? 'rgba(96,128,240,0.5)' : 'rgba(255,255,255,0.12)',
                  color: speakAloud ? 'rgba(140,165,250,0.95)' : 'rgba(255,255,255,0.45)',
                  background: speakAloud ? 'rgba(64,96,208,0.14)' : 'transparent',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 5 6 9H2v6h4l5 4V5z" />
                  {speakAloud
                    ? <><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></>
                    : <><path d="m17 9 4 6" /><path d="m21 9-4 6" /></>}
                </svg>
              </button>
            )}
          </div>
          <p className="mt-2 text-[11px] text-[rgba(255,255,255,0.32)]">{t.pub_recorded}</p>
        </div>

        {/* ── Suggested topics ───────────────────────────────────────── */}
        {showChips && (
          <div className="shrink-0 px-3 py-2 border-b border-white/[0.05] bg-white/[0.015]">
            <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <span className="shrink-0 pr-1 text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.28)] select-none">
                {t.pub_ask_about}
              </span>
              {suggestions.map(topic => (
                <button
                  key={topic.label}
                  onClick={() => useTopic(topic)}
                  disabled={isStreaming || !sessionId}
                  className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium border border-white/[0.1] bg-white/[0.04] text-[rgba(255,255,255,0.7)] transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
                >
                  {topic.label}
                </button>
              ))}
              <button
                onClick={refreshSuggestions}
                disabled={isStreaming}
                aria-label={t.pub_other_topics}
                title={t.pub_other_topics}
                className="shrink-0 ml-0.5 w-7 h-7 flex items-center justify-center rounded-full border border-white/[0.1] text-[rgba(255,255,255,0.45)] transition-colors hover:text-white disabled:opacity-40"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Messages ───────────────────────────────────────────────── */}
        <div
          className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-5 py-5 flex flex-col gap-3"
          role="log"
          aria-live="polite"
          aria-atomic="false"
        >
          {messages.length === 0 && !isStreaming && !startError && (
            <div className="flex flex-col items-center w-full px-2 py-8">
              <h2 className="text-lg font-semibold text-white text-center">
                {t.pub_empty_title.replace('{name}', firstName)}
              </h2>
              <p className="mt-2 max-w-xs text-center text-xs leading-relaxed text-[rgba(255,255,255,0.4)]">
                {t.pub_empty_body.replace(/\{name\}/g, firstName)}
              </p>
              <div className="w-10 h-px my-6 bg-white/[0.1]" />
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.3)]">
                {t.pub_try_asking}
              </p>
              <div className="w-full max-w-sm flex flex-col gap-2">
                {openers.map(topic => (
                  <button
                    key={topic.label}
                    onClick={() => void runTurn(topic.question)}
                    disabled={isStreaming || !sessionId}
                    className="w-full min-w-0 flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-left transition-colors hover:bg-white/[0.05] hover:border-white/[0.14] disabled:opacity-40"
                  >
                    <span className="min-w-0 text-[13px] leading-snug text-[rgba(255,255,255,0.75)]">
                      {topic.question}
                    </span>
                    <span className="shrink-0 text-[rgba(255,255,255,0.3)]">↗</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {startError && startError !== 'unavailable' && (
            <p className="text-sm text-[rgba(220,120,120,0.8)] text-center mt-10">{startError}</p>
          )}

          {messages.map(m => <Bubble key={m.id} msg={m} />)}

          {isStreaming && (
            <>
              <div ref={streamingTopRef} />
              <div className="flex justify-start min-w-0">
                <div className="max-w-[82%] min-w-0 px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words bg-white/[0.04] border border-white/[0.08] text-[rgba(255,255,255,0.82)]">
                  {streamingText ? (
                    <>
                      {streamingText}
                      <span className="inline-block w-0.5 h-3.5 align-middle ml-0.5 bg-[rgba(255,255,255,0.5)] animate-pulse" />
                    </>
                  ) : (
                    <span className="italic text-[rgba(255,255,255,0.4)]">
                      {t.pub_thinking[thinkingIndex % t.pub_thinking.length]}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Composer / ended state ─────────────────────────────────── */}
        {ended ? (
          <div className="shrink-0 border-t border-white/[0.07] px-5 py-5 text-center">
            <p className="text-sm text-[rgba(255,255,255,0.6)]">{t.pub_ended}</p>
          </div>
        ) : (
          <div className="shrink-0 border-t border-white/[0.07] px-4 py-3">
            <div className="flex items-end gap-2 min-w-0">
              <button
                onClick={() => setShowEnd(true)}
                disabled={messages.length === 0}
                className="shrink-0 h-11 px-3 rounded-xl border border-white/[0.12] text-[rgba(255,255,255,0.5)] hover:text-white text-xs transition-colors disabled:opacity-30"
              >
                {t.pub_end}
              </button>

              <VoiceRecorder
                compact
                onTranscript={onTranscript}
                onError={message => addToast(message)}
                disabled={!sessionId || isStreaming}
              />

              {/* The focus state lives on this wrapper, so the ring surrounds
                  the whole pill rather than the bare textarea. */}
              <div
                className="flex-1 min-w-0 flex items-end rounded-xl px-4 py-2.5 bg-white/[0.05] transition-[border-color,box-shadow] duration-200"
                style={{
                  border: `1px solid ${inputFocused ? 'rgba(96,128,240,0.55)' : 'rgba(255,255,255,0.09)'}`,
                  boxShadow: inputFocused ? '0 0 0 3px rgba(64,96,208,0.18)' : 'none',
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={onInputChange}
                  onKeyDown={onKeyDown}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  rows={1}
                  placeholder={sessionId ? t.pub_placeholder : t.pub_starting}
                  disabled={!sessionId || isStreaming}
                  aria-label={t.pub_your_question}
                  className="flex-1 min-w-0 resize-none bg-transparent text-white leading-relaxed focus:outline-none placeholder-[rgba(255,255,255,0.25)] disabled:opacity-50"
                  /* 16px exactly: anything smaller and iOS Safari zooms the
                     page in when the field takes focus, and never zooms back. */
                  style={{ fontSize: 16, maxHeight: 120 }}
                />
              </div>

              <button
                onClick={() => void runTurn(input.trim() || null)}
                disabled={!input.trim() || !sessionId || isStreaming}
                aria-label={t.pub_send}
                className="shrink-0 h-11 px-5 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-30"
                style={{ background: '#4060d0' }}
              >
                {t.pub_send}
              </button>
            </div>

            <div className="h-4 mt-1 px-1 text-right">
              {input.length > 0 && (
                <span className="text-[11px] text-[rgba(255,255,255,0.3)] tabular-nums">
                  {input.length} / {MAX_MESSAGE_LENGTH}
                </span>
              )}
            </div>
          </div>
        )}

        <Toast toasts={toasts} onDismiss={dismissToast} />
      </div>

      {showEnd && (
        <EndModal
          t={t}
          name={recruiterName}
          email={recruiterEmail}
          onName={setRecruiterName}
          onEmail={setRecruiterEmail}
          onSkip={() => submitEnd(false)}
          onConfirm={() => submitEnd(true)}
          onDismiss={() => setShowEnd(false)}
          submitting={endingSubmitting}
        />
      )}
    </>
  );
}

// ── End modal ────────────────────────────────────────────────────────────────
// Bottom sheet on phones, centred card on desktop — the v2 rule, because a
// centred dialog on a phone sits under the thumb's reach and over the keyboard.
// The entrance is animated from a double rAF so the browser has committed the
// initial style before the transition target is set; a single frame is not
// enough and the panel appears with no motion at all.
function EndModal({
  t, name, email, onName, onEmail, onSkip, onConfirm, onDismiss, submitting,
}: {
  t: PlatformStrings;
  name: string;
  email: string;
  onName: (v: string) => void;
  onEmail: (v: string) => void;
  onSkip: () => void;
  onConfirm: () => void;
  onDismiss: () => void;
  submitting: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape' && !submitting) onDismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss, submitting]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{
        background: visible ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
        backdropFilter: visible ? 'blur(6px)' : 'none',
        WebkitBackdropFilter: visible ? 'blur(6px)' : 'none',
        transition: 'background 280ms ease, backdrop-filter 280ms ease',
      }}
      onClick={e => { if (e.target === e.currentTarget && !submitting) onDismiss(); }}
      role="dialog"
      aria-modal="true"
      aria-label={t.pub_end_confirm}
    >
      <div
        className="w-full sm:max-w-sm px-3 pb-3 sm:pb-0"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(32px)',
          transition: 'opacity 280ms cubic-bezier(0.16,1,0.3,1), transform 280ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div className="rounded-2xl bg-[#12151d] border border-white/[0.1] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
          <h2 className="text-white font-semibold text-base mb-1">{t.pub_modal_title}</h2>
          <p className="text-xs text-[rgba(255,255,255,0.5)] mb-4">{t.pub_modal_body}</p>
          <input
            value={name}
            onChange={e => onName(e.target.value)}
            placeholder={t.pub_modal_name}
            aria-label={t.pub_modal_name}
            disabled={submitting}
            className="w-full mb-2 rounded-lg bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-white placeholder-[rgba(255,255,255,0.25)] focus:outline-none focus:border-[rgba(96,128,240,0.5)] disabled:opacity-50"
            style={{ fontSize: 16 }}
          />
          <input
            value={email}
            onChange={e => onEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder={t.pub_modal_email}
            aria-label={t.pub_modal_email}
            disabled={submitting}
            className="w-full mb-4 rounded-lg bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-white placeholder-[rgba(255,255,255,0.25)] focus:outline-none focus:border-[rgba(96,128,240,0.5)] disabled:opacity-50"
            style={{ fontSize: 16 }}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={onSkip}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm text-[rgba(255,255,255,0.55)] hover:text-white disabled:opacity-40"
            >
              {t.pub_skip}
            </button>
            <button
              onClick={onConfirm}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
              style={{ background: '#4060d0' }}
            >
              {submitting ? t.pub_ending : t.pub_end_confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ candidate, initials }: { candidate: Candidate; initials: string }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      {candidate.avatarUrl
        ? /* eslint-disable-next-line @next/next/no-img-element */
          <img src={candidate.avatarUrl} alt={candidate.name} className="w-11 h-11 shrink-0 rounded-full object-cover" />
        : <div className="w-11 h-11 shrink-0 rounded-full bg-[#4060d0]/30 border border-[#4060d0]/40 flex items-center justify-center text-sm font-semibold text-white">{initials}</div>}
      <div className="min-w-0">
        <h1 className="text-white font-semibold text-base leading-tight truncate">{candidate.name}</h1>
        {candidate.headline && <p className="text-xs text-[rgba(255,255,255,0.5)] truncate">{candidate.headline}</p>}
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex min-w-0 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={[
        // whitespace-pre-wrap keeps the agent's paragraph breaks; break-words
        // stops a pasted URL from widening the row and scrolling the page.
        'max-w-[82%] min-w-0 px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words',
        isUser ? 'bg-[#4060d0]/25 border border-[#4060d0]/35 text-white'
               : 'bg-white/[0.04] border border-white/[0.08] text-[rgba(255,255,255,0.82)]',
      ].join(' ')}>{msg.content}</div>
    </div>
  );
}
