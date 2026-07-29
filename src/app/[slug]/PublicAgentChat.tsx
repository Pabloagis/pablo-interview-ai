'use client';

import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from 'react';
import Background from '@/components/Background';
import StreamingResponse from '@/components/StreamingResponse';

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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [ended, setEnded] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [endingSubmitting, setEndingSubmitting] = useState(false);

  const sessionRef = useRef<string | null>(null);
  const endedRef = useRef(false);
  const hasMessagesRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => { sessionRef.current = sessionId; }, [sessionId]);
  useEffect(() => { endedRef.current = ended; }, [ended]);
  useEffect(() => { hasMessagesRef.current = messages.length > 0; }, [messages.length]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, streamingText]);

  // ── Create the session once ────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || startedRef.current) return;
    startedRef.current = true;
    (async () => {
      try {
        const res = await fetch('/api/public/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: candidate.slug }),
        });
        if (res.status === 503) { setStartError('unavailable'); return; }
        if (res.status === 429) { setStartError('Too many conversations right now — try again shortly.'); return; }
        if (!res.ok) { setStartError('Could not start the conversation.'); return; }
        const { sessionId: id } = (await res.json()) as { sessionId: string };
        setSessionId(id);
      } catch {
        setStartError('Could not start the conversation.');
      }
    })();
  }, [enabled, candidate.slug]);

  // ── Best-effort end on tab close ───────────────────────────────────────────
  useEffect(() => {
    const fire = () => {
      const id = sessionRef.current;
      if (!id || endedRef.current || !hasMessagesRef.current) return;
      const blob = new Blob([JSON.stringify({ sessionId: id })], { type: 'application/json' });
      navigator.sendBeacon('/api/public/session/end', blob);
    };
    const onVis = () => { if (document.visibilityState === 'hidden') fire(); };
    window.addEventListener('pagehide', fire);
    document.addEventListener('visibilitychange', onVis);
    return () => { window.removeEventListener('pagehide', fire); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !sessionId || isStreaming || ended) return;
    setInput('');
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: text }]);
    setIsStreaming(true);
    setStreamingText('');

    let assistant = '';
    try {
      const res = await fetch('/api/public/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text }),
      });
      if (res.status === 409) { setEnded(true); setIsStreaming(false); return; }
      if (res.status === 429) {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'You are sending messages quickly — please slow down a moment.' }]);
        setIsStreaming(false); return;
      }
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

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
            const evt = JSON.parse(line.slice(6)) as { type: string; text?: string };
            if (evt.type === 'content' && evt.text) { assistant += evt.text; setStreamingText(assistant); }
            else if (evt.type === 'done' || evt.type === 'error') break outer;
          } catch { /* skip */ }
        }
      }
    } catch {
      /* fall through — show whatever streamed */
    } finally {
      setIsStreaming(false);
      setStreamingText('');
    }
    if (assistant) setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: assistant }]);
  }, [input, sessionId, isStreaming, ended]);

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const submitEnd = useCallback(async () => {
    setEndingSubmitting(true);
    try {
      await fetch('/api/public/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, recruiterName: recruiterName.trim() || undefined, recruiterEmail: recruiterEmail.trim() || undefined }),
      });
    } catch { /* non-fatal */ }
    setEndingSubmitting(false);
    setShowEnd(false);
    setEnded(true);
  }, [sessionId, recruiterName, recruiterEmail]);

  const initials = candidate.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  // ── Unavailable (kill switch) ──────────────────────────────────────────────
  if (!enabled || startError === 'unavailable') {
    return (
      <>
        <Background />
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <Header candidate={candidate} initials={initials} />
          <p className="mt-6 text-sm text-[rgba(255,255,255,0.5)] max-w-sm">
            This agent is temporarily unavailable. Please check back shortly.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Background />
      <div className="fixed inset-0 flex flex-col">
        {/* Header */}
        <div className="shrink-0 px-5 pt-6 pb-4 border-b border-white/[0.07]">
          <Header candidate={candidate} initials={initials} />
          <p className="mt-2 text-[11px] text-[rgba(255,255,255,0.32)]">
            This conversation is recorded and shared with the candidate.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 min-w-0 overflow-y-auto px-5 py-5 flex flex-col gap-3">
          {messages.length === 0 && !isStreaming && !startError && (
            <p className="text-sm text-[rgba(255,255,255,0.3)] text-center max-w-sm mx-auto mt-10">
              Ask {candidate.name.split(' ')[0]}&apos;s agent anything you would ask in a real interview.
            </p>
          )}
          {startError && startError !== 'unavailable' && (
            <p className="text-sm text-[rgba(220,120,120,0.8)] text-center mt-10">{startError}</p>
          )}
          {messages.map(m => <Bubble key={m.id} msg={m} />)}
          {isStreaming && streamingText && (
            <div className="self-start max-w-[82%]"><StreamingResponse text={streamingText} thinkingPhrase="" /></div>
          )}
          {isStreaming && !streamingText && (
            <div className="self-start text-xs text-[rgba(255,255,255,0.35)] italic px-2">Thinking…</div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer / ended state */}
        {ended ? (
          <div className="shrink-0 border-t border-white/[0.07] px-5 py-5 text-center">
            <p className="text-sm text-[rgba(255,255,255,0.6)]">Thanks — this conversation has ended.</p>
          </div>
        ) : (
          <div className="shrink-0 border-t border-white/[0.07] px-4 py-3 flex items-end gap-3">
            <button
              onClick={() => setShowEnd(true)}
              disabled={messages.length === 0}
              className="shrink-0 self-end px-3 py-3 rounded-xl border border-white/[0.12] text-[rgba(255,255,255,0.5)] hover:text-white text-xs transition-colors disabled:opacity-30"
            >
              End
            </button>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              placeholder={sessionId ? 'Type your question…' : 'Starting…'}
              disabled={!sessionId || isStreaming}
              className="flex-1 min-w-0 rounded-xl bg-white/[0.05] border border-white/[0.09] px-4 py-3 text-sm text-white resize-none focus:outline-none placeholder-[rgba(255,255,255,0.25)] disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !sessionId || isStreaming}
              className="shrink-0 self-end px-5 py-3 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-30"
              style={{ background: '#4060d0' }}
            >
              Send
            </button>
          </div>
        )}
      </div>

      {/* End modal — optional name/email to receive a copy */}
      {showEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => !endingSubmitting && setShowEnd(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-[#12151d] border border-white/[0.1] p-5" onClick={e => e.stopPropagation()}>
            <h2 className="text-white font-semibold text-base mb-1">Want a copy of the summary?</h2>
            <p className="text-xs text-[rgba(255,255,255,0.5)] mb-4">Optional. The candidate receives their report either way.</p>
            <input
              value={recruiterName} onChange={e => setRecruiterName(e.target.value)}
              placeholder="Your name"
              className="w-full mb-2 rounded-lg bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder-[rgba(255,255,255,0.25)] focus:outline-none"
            />
            <input
              value={recruiterEmail} onChange={e => setRecruiterEmail(e.target.value)}
              type="email" placeholder="you@company.com"
              className="w-full mb-4 rounded-lg bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder-[rgba(255,255,255,0.25)] focus:outline-none"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={submitEnd} disabled={endingSubmitting} className="px-4 py-2 rounded-lg text-sm text-[rgba(255,255,255,0.55)] hover:text-white">Skip</button>
              <button onClick={submitEnd} disabled={endingSubmitting} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#4060d0' }}>
                {endingSubmitting ? 'Ending…' : 'End conversation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Header({ candidate, initials }: { candidate: Candidate; initials: string }) {
  return (
    <div className="flex items-center gap-3">
      {candidate.avatarUrl
        ? /* eslint-disable-next-line @next/next/no-img-element */
          <img src={candidate.avatarUrl} alt={candidate.name} className="w-11 h-11 rounded-full object-cover" />
        : <div className="w-11 h-11 rounded-full bg-[#4060d0]/30 border border-[#4060d0]/40 flex items-center justify-center text-sm font-semibold text-white">{initials}</div>}
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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={[
        'max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
        isUser ? 'bg-[#4060d0]/25 border border-[#4060d0]/35 text-white'
               : 'bg-white/[0.04] border border-white/[0.08] text-[rgba(255,255,255,0.82)]',
      ].join(' ')}>{msg.content}</div>
    </div>
  );
}
