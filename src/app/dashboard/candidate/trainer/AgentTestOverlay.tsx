'use client';

// Candidate interviews their own agent as if they were a recruiter.
// After they end the test, a Haiku pass surfaces which nodes caused refusals or weak answers.
//
// The conversation itself is AgentChatSurface — the same component the public
// chat at /<slug> renders, with the same chips, voice input, read-aloud and
// streaming behaviour, driven by the same system prompt and model. That is the
// point of this screen: the candidate is deciding whether the agent is fit to
// send to a recruiter, and a sandbox that looks or behaves differently makes
// that decision on the wrong evidence.
//
// What is deliberately NOT reproduced here, and why:
//   - the end-of-conversation capture (recruiter name and email) — ending a test
//     runs gap analysis instead, which is the whole reason this screen exists
//   - the 90s inactivity check-in — its job is to re-engage a distracted
//     visitor; against oneself it only spends a Sonnet call while the candidate
//     is reading
//   - session resume and the per-IP limits — this is an authenticated sandbox
//     and nothing it produces is persisted

import { useState, useCallback, useRef, useEffect } from 'react';
import { COVERAGE_NODES, type CoverageNodeKey } from '@/lib/coverage-nodes';
import type { Gap } from '@/app/api/trainer/analyze-gaps/route';
import { usePlatformT } from '@/context/platform-i18n';
import { useLanguage, type Lang } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import AgentChatSurface, { type ChatMessage, type ChatTopic } from '@/components/chat/AgentChatSurface';
import { useSuggestedTopics } from '@/components/chat/useSuggestedTopics';
import SpeakToggle, { useSpeech } from '@/components/chat/SpeakToggle';
import { INTRO_DELAY_MS } from '@/lib/proactive';

interface Props {
  onClose:     () => void;
  onTrainNode: (key: CoverageNodeKey) => void;
}

type Phase = 'interviewing' | 'analyzing' | 'results';

const GAP_TYPE_STYLE: Record<'refusal' | 'weak', { color: string; bg: string }> = {
  refusal: { color: '#c04040', bg: 'rgba(192,64,64,0.12)'  },
  weak:    { color: '#b07030', bg: 'rgba(176,112,48,0.12)' },
};

export default function AgentTestOverlay({ onClose, onTrainNode }: Props) {
  const t = usePlatformT();
  const { lang } = useLanguage();
  const [phase,       setPhase]       = useState<Phase>('interviewing');
  const [messages,    setMessages]    = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText,  setStreamText]  = useState('');
  const [gaps,        setGaps]        = useState<Gap[]>([]);
  const [error,       setError]       = useState<string | null>(null);

  const { available: ttsAvailable, enabled: speakAloud, toggle: toggleSpeak, speak, cancel: cancelSpeech } = useSpeech(lang);
  const { suggestions, consume, refresh, openers } = useSuggestedTopics(t);

  const messagesRef   = useRef<ChatMessage[]>([]);
  const streamingRef  = useRef(false);
  const draftRef      = useRef('');
  const langRef       = useRef<Lang>(lang);
  const introFiredRef = useRef(false);   // StrictMode double-invokes effects

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { langRef.current = lang; }, [lang]);

  // Block body scroll while overlay is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Escape closes (only during interviewing)
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape' && phase === 'interviewing') { cancelSpeech(); onClose(); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [phase, onClose, cancelSpeech]);

  // ── One streaming turn ─────────────────────────────────────────────────────
  // `intro` is the turn the agent takes on its own. It shows no user bubble and
  // is never retried; a 409 means the server judged the opening unwarranted,
  // which is not worth telling the candidate about.
  const runTurn = useCallback(async (text: string | null, intro = false) => {
    if (streamingRef.current) return;
    if (!intro && !text) return;
    // Set synchronously: the intro timer and a click can land in the same tick,
    // and `isStreaming` would not be true yet for either.
    streamingRef.current = true;

    const history = messagesRef.current.map(({ role, content }) => ({ role, content }));
    if (!intro && text) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: text }]);
      history.push({ role: 'user', content: text });
    }
    setIsStreaming(true);
    setStreamText('');
    setError(null);

    let assistantText = '';
    try {
      const res = await fetch('/api/trainer/agent-test', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          messages: intro ? [] : history,
          mode:     intro ? 'intro' : undefined,
          lang:     langRef.current,
        }),
      });

      if (res.status === 409 && intro) { /* already opened — silent by design */ }
      else if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      else {
        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let   buffer  = '';

        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const evt = JSON.parse(line.slice(6)) as
                | { type: 'content'; text: string }
                | { type: 'done' }
                | { type: 'error'; message: string };

              if (evt.type === 'content') {
                assistantText += evt.text;
                setStreamText(assistantText);
              } else if (evt.type === 'error') {
                if (!intro) setError(evt.message);
                break outer;
              } else if (evt.type === 'done') {
                break outer;
              }
            } catch { /* a partial line — the next chunk completes it */ }
          }
        }
      }
    } catch (err) {
      console.error('[AgentTestOverlay] stream error:', err);
      if (!intro && !assistantText) setError(t.pub_failed);
    } finally {
      streamingRef.current = false;
      setIsStreaming(false);
      setStreamText('');
    }

    if (assistantText) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: assistantText }]);
      speak(assistantText);
    }
  }, [speak, t]);

  // ── Proactive opening ──────────────────────────────────────────────────────
  // Same delay as the public chat: the candidate should see the line a recruiter
  // gets if they land on the page and hesitate.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (introFiredRef.current) return;
      if (messagesRef.current.length > 0) return;
      if (streamingRef.current || draftRef.current.trim()) return;
      if (document.visibilityState !== 'visible') return;
      introFiredRef.current = true;
      void runTurn(null, true);
    }, INTRO_DELAY_MS);
    return () => clearTimeout(timer);
  }, [runTurn]);

  function handleTopic(topic: ChatTopic) {
    consume(topic);
    void runTurn(topic.question);
  }

  const endInterview = useCallback(async () => {
    const agentTurns = messagesRef.current.filter(m => m.role === 'assistant');
    cancelSpeech();
    if (agentTurns.length === 0) {
      // Nothing to analyse
      onClose();
      return;
    }

    setPhase('analyzing');

    try {
      const res = await fetch('/api/trainer/analyze-gaps', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          messages: messagesRef.current.map(({ role, content }) => ({ role, content })),
        }),
      });
      const { gaps: found = [] } = res.ok ? await res.json() as { gaps: Gap[] } : {};
      setGaps(found);
    } catch (err) {
      console.error('[AgentTestOverlay] analyze-gaps error (non-fatal):', err);
      setGaps([]);
    }

    setPhase('results');
  }, [onClose, cancelSpeech]);

  const handleTrainNode = useCallback((key: CoverageNodeKey) => {
    cancelSpeech();
    onTrainNode(key);
    onClose();
  }, [onTrainNode, onClose, cancelSpeech]);

  return (
    // z-[100] — sits above the mobile sheet (z-50)
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0a0c10]">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 min-h-14 flex items-center px-5 py-2 gap-3 border-b border-white/[0.08]">
        {/* Always available. The End button is disabled until the agent has spoken,
            so without this the candidate has no way out of the test but Escape. */}
        <button
          onClick={() => { cancelSpeech(); onClose(); }}
          aria-label={t.test_return}
          className="shrink-0 flex items-center gap-1.5 -ml-2 px-2 py-1.5 rounded-lg
                     text-white/45 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="hidden sm:inline text-xs font-medium leading-none">{t.shell_back}</span>
        </button>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-white/90 leading-tight">
            {phase === 'results' ? t.test_results_title : t.test_testing_title}
          </span>
          {phase === 'interviewing' && (
            <span className="text-[10px] text-white/35 leading-tight mt-0.5 truncate">
              {t.test_subtitle}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0" />

        {phase === 'interviewing' && (
          <>
            {/* The overlay covers the trainer's own switcher, so it carries one too */}
            <LanguageSwitcher />
            {ttsAvailable && (
              <SpeakToggle
                enabled={speakAloud}
                onToggle={toggleSpeak}
                labelOn={t.pub_speak_on}
                labelOff={t.pub_speak_off}
              />
            )}
            <button
              onClick={endInterview}
              disabled={messages.filter(m => m.role === 'assistant').length === 0}
              className="shrink-0 px-4 py-1.5 rounded-lg text-xs font-medium border transition-colors
                         border-white/20 text-white/60 hover:text-white hover:border-white/40
                         disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {t.test_end}
            </button>
          </>
        )}
        {phase === 'analyzing' && (
          <div className="shrink-0 w-4 h-4 rounded-full border-2 border-t-white/50 border-white/10 animate-spin" />
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      {phase === 'interviewing' && (
        <AgentChatSurface
          messages={messages}
          isStreaming={isStreaming}
          streamingText={streamText}
          thinkingLabels={t.pub_thinking}
          ready
          onSend={text => void runTurn(text)}
          onDraftChange={value => { draftRef.current = value; }}
          placeholder={t.test_placeholder}
          startingPlaceholder={t.test_placeholder}
          sendLabel={t.test_ask}
          inputAriaLabel={t.pub_your_question}
          topics={suggestions}
          topicsLabel={t.pub_ask_about}
          onTopic={handleTopic}
          onRefreshTopics={refresh}
          refreshLabel={t.pub_other_topics}
          errorText={error}
          voice
          onVoiceError={message => setError(message)}
          emptyState={
            <div className="flex flex-col items-center w-full px-2 py-8">
              <p className="max-w-xs text-center text-sm leading-relaxed text-white/40">
                {t.test_empty}
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
                    disabled={isStreaming}
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
          }
        />
      )}

      {phase === 'analyzing' && (
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center gap-4">
          <div className="w-7 h-7 rounded-full border-2 border-t-white/60 border-white/10 animate-spin" />
          <p className="text-sm text-white/40">{t.test_analyzing}</p>
        </div>
      )}

      {phase === 'results' && (
        <div className="flex-1 min-w-0 overflow-y-auto px-5 py-6 flex flex-col gap-5">

          {gaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-sm text-white/60 text-center">
                {t.test_no_gaps}
              </p>
              <button
                onClick={onClose}
                className="mt-2 text-xs text-white/35 hover:text-white/70 transition-colors underline underline-offset-2"
              >
                {t.test_return}
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-white/35 max-w-sm leading-relaxed">
                {t.test_gaps(gaps.length)}
              </p>

              <div className="flex flex-col gap-3">
                {gaps.map(gap => {
                  const node   = COVERAGE_NODES.find(n => n.key === gap.nodeKey);
                  const style  = GAP_TYPE_STYLE[gap.type];
                  return (
                    <div
                      key={gap.nodeKey}
                      className="rounded-xl border border-white/[0.09] bg-white/[0.03] overflow-hidden"
                    >
                      {/* Gap header */}
                      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                        <span
                          className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded"
                          style={{ color: style.color, background: style.bg }}
                        >
                          {gap.type === 'refusal' ? t.test_gap_refusal : t.test_gap_weak}
                        </span>
                        <span className="text-sm text-white/80 font-medium">
                          {node ? t.nodes[gap.nodeKey].label : gap.nodeKey}
                        </span>
                      </div>

                      {/* Excerpt — verbatim agent text */}
                      <blockquote className="mx-4 mb-3 pl-3 border-l-2 text-xs text-white/45 leading-relaxed italic"
                        style={{ borderColor: style.color + '60' }}
                      >
                        "{gap.excerpt}"
                      </blockquote>

                      {/* Train link */}
                      <div className="px-4 pb-4">
                        <button
                          onClick={() => handleTrainNode(gap.nodeKey)}
                          className="text-xs font-medium transition-colors hover:opacity-80"
                          style={{ color: '#5080f0' }}
                        >
                          {t.test_train_this}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
