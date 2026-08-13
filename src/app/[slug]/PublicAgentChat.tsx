'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { generateId } from '@/lib/utils';
import Toast from '@/components/Toast';
import type { ToastMessage } from '@/lib/types';
import { useLanguage, type Lang } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { usePlatformT, type PlatformStrings } from '@/context/platform-i18n';
import AgentChatSurface, { type ChatMessage, type ChatTopic } from '@/components/chat/AgentChatSurface';
import { useSuggestedTopics } from '@/components/chat/useSuggestedTopics';
import { useSpeech } from '@/components/chat/speech';
import { INTRO_DELAY_MS } from '@/lib/proactive';

// The recruiter-facing chat. This is the product: everything the candidate
// builds in the trainer is judged here, by someone who arrived from a link and
// will give it about a minute before deciding whether it is worth their time.
//
// The conversation surface — chips, transcript, composer — lives in
// AgentChatSurface, shared with the trainer's agent-test sandbox so the two can
// never drift. Its comment header carries the mobile and streaming rules. What
// stays here is everything specific to a real visitor: the session, the
// proactive turns, and the end-of-conversation capture.
//
// One rule worth repeating because it is easy to undo: platform errors are
// toasts, never assistant bubbles. A bubble is the candidate's voice, and a
// rate-limit notice rendered there attributes words to them they never said.

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2500;

// Proactive turns. Both cost a model call, so both are additionally gated on the
// server — see the comment in /api/public/chat. Here they are also gated on the
// tab being visible, so a page left open in a background tab never spends a
// single token.
const CHECKIN_IDLE_MS = 90_000;
const IDLE_TICK_MS    = 10_000;


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
export default function PublicAgentChat({ candidate, enabled }: Props) {
  const { lang } = useLanguage();
  const t = usePlatformT();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [ended, setEnded] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [endingSubmitting, setEndingSubmitting] = useState(false);

  const { available: ttsAvailable, speakingId, speak, cancel: cancelSpeech } = useSpeech(lang);
  const { suggestions, consume, refresh, openers } = useSuggestedTopics(t);

  const sessionRef       = useRef<string | null>(null);
  const endedRef         = useRef(false);
  const streamingRef     = useRef(false);
  const messagesRef      = useRef<ChatMessage[]>([]);
  const inputRef         = useRef('');
  const langRef          = useRef<Lang>(lang);
  const lastActivityRef  = useRef(Date.now());
  const checkinAtRef     = useRef(-1);       // messages.length the last check-in was fired for
  const introFiredRef    = useRef(false);    // StrictMode double-invokes effects
  const startedRef       = useRef(false);

  const storageKey = `im_pub_${candidate.slug}`;

  useEffect(() => { sessionRef.current   = sessionId;         }, [sessionId]);
  useEffect(() => { endedRef.current     = ended;             }, [ended]);
  useEffect(() => { streamingRef.current = isStreaming;       }, [isStreaming]);
  useEffect(() => { langRef.current      = lang;              }, [lang]);
  useEffect(() => { messagesRef.current  = messages; lastActivityRef.current = Date.now(); }, [messages]);

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'error') => {
    setToasts(prev => [...prev, { id: generateId(), message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);

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

  // ── Lock page scroll while chat is mounted ────────────────────────────────
  // overflow:hidden on body breaks position:fixed on iOS Safari; apply it to
  // the html element instead, scoped via a class so other pages are unaffected.
  useEffect(() => {
    document.documentElement.classList.add('chat-page');
    return () => document.documentElement.classList.remove('chat-page');
  }, []);

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
  }, [t, addToast, storageKey]);

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

  // The draft is mirrored out of the surface for one reason: the opening must
  // not fire while the visitor is mid-sentence.
  function onDraftChange(value: string) {
    inputRef.current = value;
    lastActivityRef.current = Date.now();
  }

  function handleTopic(topic: ChatTopic) {
    consume(topic);
    void runTurn(topic.question);
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
    cancelSpeech();
    setEndingSubmitting(false);
    setShowEnd(false);
    setEnded(true);
  }, [sessionId, recruiterName, recruiterEmail, storageKey, cancelSpeech]);

  const initials  = candidate.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const firstName = candidate.name.split(' ')[0];

  const langBar = <LanguageSwitcher />;

  // ── Unavailable (kill switch) ──────────────────────────────────────────────
  if (!enabled || startError === 'unavailable') {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center px-4 text-center chat-bg"
      >
        <Header candidate={candidate} initials={initials} />
        <p className="mt-6 text-sm text-[rgba(0,0,0,0.55)] max-w-sm">{t.pub_unavailable}</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 flex flex-col overflow-hidden chat-bg"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="shrink-0 px-5 pt-6 pb-4 border-b border-black/[0.07]">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex-1 min-w-0"><Header candidate={candidate} initials={initials} /></div>
            {langBar}
            {/* Ending the conversation belongs beside the person you are talking
                to, not under the keyboard next to Send. */}
            {!ended && (
              <button
                onClick={() => setShowEnd(true)}
                disabled={messages.length === 0}
                className="shrink-0 px-3 py-1.5 rounded-lg border border-black/[0.14] text-[rgba(0,0,0,0.50)] hover:text-black hover:border-black/[0.28] text-xs transition-colors disabled:opacity-30"
              >
                {t.pub_end}
              </button>
            )}
          </div>
          <p className="mt-2 text-[11px] text-[rgba(0,0,0,0.40)]">{t.pub_recorded}</p>
        </div>

        <AgentChatSurface
          messages={messages}
          isStreaming={isStreaming}
          streamingText={streamingText}
          thinkingLabels={t.pub_thinking}
          ready={!!sessionId && !ended}
          onSend={text => void runTurn(text)}
          onDraftChange={onDraftChange}
          placeholder={t.pub_placeholder}
          startingPlaceholder={t.pub_starting}
          sendLabel={t.pub_send}
          inputAriaLabel={t.pub_your_question}
          topics={ended ? [] : suggestions}
          topicsLabel={t.pub_ask_about}
          onTopic={handleTopic}
          onRefreshTopics={refresh}
          refreshLabel={t.pub_other_topics}
          errorText={startError && startError !== 'unavailable' ? startError : null}
          voice
          onVoiceError={message => addToast(message)}
          emptyState={
            <div className="flex flex-col items-center w-full px-2 py-8">
              <h2 className="text-lg font-semibold text-[#0d0f14] text-center">
                {t.pub_empty_title.replace('{name}', firstName)}
              </h2>
              <p className="mt-2 max-w-xs text-center text-xs leading-relaxed text-[rgba(0,0,0,0.50)]">
                {t.pub_empty_body.replace(/\{name\}/g, firstName)}
              </p>
              <div className="w-10 h-px my-6 bg-black/[0.12]" />
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[rgba(0,0,0,0.38)]">
                {t.pub_try_asking}
              </p>
              <div className="w-full max-w-sm flex flex-col gap-2">
                {openers.map(topic => (
                  <button
                    key={topic.label}
                    onClick={() => void runTurn(topic.question)}
                    disabled={isStreaming || !sessionId}
                    className="w-full min-w-0 flex items-center justify-between gap-3 rounded-xl border border-black/[0.10] bg-black/[0.03] px-4 py-3 text-left transition-colors hover:bg-black/[0.05] hover:border-black/[0.18] disabled:opacity-40"
                  >
                    <span className="min-w-0 text-[13px] leading-snug text-[rgba(0,0,0,0.72)]">
                      {topic.question}
                    </span>
                    <span className="shrink-0 text-[rgba(0,0,0,0.35)]">↗</span>
                  </button>
                ))}
              </div>
            </div>
          }
          onSpeak={ttsAvailable ? speak : undefined}
          speakingId={speakingId}
          speakLabel={t.pub_speak_on}
          stopSpeakLabel={t.pub_speak_off}
          agentAvatarUrl={candidate.avatarUrl}
          agentInitials={initials}
          footer={ended ? (
            <div className="shrink-0 border-t border-black/[0.07] px-5 py-5 text-center">
              <p className="text-sm text-[rgba(0,0,0,0.55)]">{t.pub_ended}</p>
            </div>
          ) : undefined}
        />

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
        <div className="rounded-2xl bg-white border border-black/[0.08] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.15)]">
          <h2 className="text-[#0d0f14] font-semibold text-base mb-1">{t.pub_modal_title}</h2>
          <p className="text-xs text-[rgba(0,0,0,0.55)] mb-4">{t.pub_modal_body}</p>
          <input
            value={name}
            onChange={e => onName(e.target.value)}
            placeholder={t.pub_modal_name}
            aria-label={t.pub_modal_name}
            disabled={submitting}
            className="w-full mb-2 rounded-lg bg-black/[0.04] border border-black/[0.12] px-3 py-2 text-[#0d0f14] placeholder-[rgba(0,0,0,0.30)] focus:outline-none focus:border-[rgba(64,96,208,0.5)] disabled:opacity-50"
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
            className="w-full mb-4 rounded-lg bg-black/[0.04] border border-black/[0.12] px-3 py-2 text-[#0d0f14] placeholder-[rgba(0,0,0,0.30)] focus:outline-none focus:border-[rgba(64,96,208,0.5)] disabled:opacity-50"
            style={{ fontSize: 16 }}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={onSkip}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm text-[rgba(0,0,0,0.50)] hover:text-black disabled:opacity-40"
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
        : <div className="w-11 h-11 shrink-0 rounded-full bg-[#4060d0]/15 border border-[#4060d0]/35 flex items-center justify-center text-sm font-semibold text-[#3050b0]">{initials}</div>}
      <div className="min-w-0">
        <h1 className="text-[#0d0f14] font-semibold text-base leading-tight truncate">{candidate.name}</h1>
        {candidate.headline && <p className="text-xs text-[rgba(0,0,0,0.50)] truncate">{candidate.headline}</p>}
      </div>
    </div>
  );
}
