'use client';

// Candidate interviews their own agent as if they were a recruiter.
// After they end the test, a Haiku pass surfaces which nodes caused refusals or weak answers.

import { useState, useCallback, useRef, useEffect, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { COVERAGE_NODES, type CoverageNodeKey } from '@/lib/coverage-nodes';
import type { Gap } from '@/app/api/trainer/analyze-gaps/route';

interface TestMessage {
  id:      string;
  role:    'user' | 'assistant';
  content: string;
}

interface Props {
  onClose:     () => void;
  onTrainNode: (key: CoverageNodeKey) => void;
}

type Phase = 'interviewing' | 'analyzing' | 'results';

const GAP_TYPE_STYLE: Record<'refusal' | 'weak', { label: string; color: string; bg: string }> = {
  refusal: { label: 'REFUSAL', color: '#c04040', bg: 'rgba(192,64,64,0.12)'  },
  weak:    { label: 'WEAK',    color: '#b07030', bg: 'rgba(176,112,48,0.12)' },
};

export default function AgentTestOverlay({ onClose, onTrainNode }: Props) {
  const [phase,       setPhase]       = useState<Phase>('interviewing');
  const [messages,    setMessages]    = useState<TestMessage[]>([]);
  const [draft,       setDraft]       = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText,  setStreamText]  = useState('');
  const [gaps,        setGaps]        = useState<Gap[]>([]);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamText]);

  // Block body scroll while overlay is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Escape closes (only during interviewing)
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape' && phase === 'interviewing') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [phase, onClose]);

  const sendMessage = useCallback(async (text: string) => {
    if (isStreaming || !text.trim()) return;

    const userMsg: TestMessage = { id: crypto.randomUUID(), role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsStreaming(true);
    setStreamText('');

    let assistantText = '';
    try {
      const res = await fetch('/api/trainer/agent-test', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

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
            } else if (evt.type === 'done' || evt.type === 'error') {
              break outer;
            }
          } catch { /* malformed line */ }
        }
      }
    } catch (err) {
      console.error('[AgentTestOverlay] stream error:', err);
    } finally {
      setIsStreaming(false);
      setStreamText('');
    }

    if (assistantText) {
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: assistantText },
      ]);
    }
  }, [isStreaming, messages]);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    sendMessage(text);
  }, [draft, sendMessage]);

  function handleKeyDown(e: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const endInterview = useCallback(async () => {
    const agentTurns = messages.filter(m => m.role === 'assistant');
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
          messages: messages.map(({ role, content }) => ({ role, content })),
        }),
      });
      const { gaps: found = [] } = res.ok ? await res.json() as { gaps: Gap[] } : {};
      setGaps(found);
    } catch (err) {
      console.error('[AgentTestOverlay] analyze-gaps error (non-fatal):', err);
      setGaps([]);
    }

    setPhase('results');
  }, [messages, onClose]);

  const handleTrainNode = useCallback((key: CoverageNodeKey) => {
    onTrainNode(key);
    onClose();
  }, [onTrainNode, onClose]);

  const canSend = draft.trim().length > 0 && !isStreaming && phase === 'interviewing';

  return (
    // z-[100] — sits above the mobile sheet (z-50)
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0a0c10]">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 h-14 flex items-center px-5 gap-3 border-b border-white/[0.08]">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-white/90 leading-tight">
            {phase === 'results' ? 'What a recruiter just experienced' : 'Testing your agent'}
          </span>
          {phase === 'interviewing' && (
            <span className="text-[10px] text-white/35 leading-tight mt-0.5">
              Ask your agent anything. You're the recruiter.
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0" />
        {phase === 'interviewing' && (
          <button
            onClick={endInterview}
            disabled={messages.filter(m => m.role === 'assistant').length === 0}
            className="shrink-0 px-4 py-1.5 rounded-lg text-xs font-medium border transition-colors
                       border-white/20 text-white/60 hover:text-white hover:border-white/40
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            End interview
          </button>
        )}
        {phase === 'results' && (
          <button
            onClick={onClose}
            className="shrink-0 text-white/40 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
        {phase === 'analyzing' && (
          <div className="shrink-0 w-4 h-4 rounded-full border-2 border-t-white/50 border-white/10 animate-spin" />
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      {phase === 'interviewing' && (
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Message list */}
          <div className="flex-1 min-w-0 overflow-y-auto px-5 py-5 flex flex-col gap-3">

            {messages.length === 0 && !isStreaming && (
              <div className="flex-1 flex flex-col items-center justify-center py-16">
                <p className="text-sm text-white/25 text-center max-w-xs leading-relaxed">
                  Start with any question a recruiter might ask. The agent will respond exactly as it would in a live interview.
                </p>
              </div>
            )}

            {messages.map(msg => (
              <TestBubble key={msg.id} message={msg} />
            ))}

            {isStreaming && streamText && (
              <TestBubble
                message={{ id: '__streaming__', role: 'assistant', content: streamText }}
                isStreaming
              />
            )}

            {isStreaming && !streamText && (
              <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.07] self-start max-w-[80px]">
                <TypingDot delay={0}   />
                <TypingDot delay={160} />
                <TypingDot delay={320} />
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-white/[0.06] px-4 py-3 flex items-end gap-3">
            <div className="flex-1 min-w-0 rounded-xl bg-white/[0.05] border border-white/[0.09] px-4 py-3">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder="Ask your agent a question…"
                disabled={isStreaming}
                className="w-full bg-transparent text-sm text-white resize-none focus:outline-none placeholder-white/20 leading-relaxed disabled:opacity-50"
              />
              <div className="flex justify-end mt-1">
                <span className="text-[10px] text-white/18 select-none">Enter to send</span>
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="shrink-0 self-end px-5 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-30"
              style={{
                background: canSend ? '#4060d0' : 'rgba(64,96,208,0.35)',
                color: 'white',
              }}
            >
              Ask
            </button>
          </div>
        </div>
      )}

      {phase === 'analyzing' && (
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center gap-4">
          <div className="w-7 h-7 rounded-full border-2 border-t-white/60 border-white/10 animate-spin" />
          <p className="text-sm text-white/40">Analysing what recruiters heard…</p>
        </div>
      )}

      {phase === 'results' && (
        <div className="flex-1 min-w-0 overflow-y-auto px-5 py-6 flex flex-col gap-5">

          {gaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-sm text-white/60 text-center">
                No gaps detected. Your agent handled every question.
              </p>
              <button
                onClick={onClose}
                className="mt-2 text-xs text-white/35 hover:text-white/70 transition-colors underline underline-offset-2"
              >
                Return to training
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-white/35 max-w-sm leading-relaxed">
                {gaps.length === 1
                  ? 'One node where the agent failed or hedged.'
                  : `${gaps.length} nodes where the agent failed or hedged.`}{' '}
                Train them to close the gap before your next real interview.
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
                          {style.label}
                        </span>
                        <span className="text-sm text-white/80 font-medium">
                          {node?.label ?? gap.nodeKey}
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
                          Train this ↗
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

// ── Sub-components ─────────────────────────────────────────────────────────────

function TestBubble({
  message,
  isStreaming = false,
}: {
  message: TestMessage;
  isStreaming?: boolean;
}) {
  const isUser = message.role === 'user'; // user = recruiter in this context

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} flex-col gap-0.5`}>
      {/* Role label */}
      <span className={`text-[9px] font-semibold uppercase tracking-wider ${isUser ? 'text-right' : 'text-left'} text-white/20`}>
        {isUser ? 'You (recruiter)' : 'Your agent'}
      </span>
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div
          className={[
            'max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
            isUser
              ? 'bg-white/[0.07] border border-white/[0.12] text-white'
              : 'bg-[#1a1d24] border border-white/[0.07] text-white/75',
          ].join(' ')}
        >
          {message.content}
          {isStreaming && (
            <span className="inline-block w-0.5 h-3.5 bg-white/40 ml-0.5 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}

function TypingDot({ delay }: { delay: number }) {
  return (
    <div
      className="w-1.5 h-1.5 rounded-full bg-white/40"
      style={{ animation: `pulse 1s ${delay}ms ease-in-out infinite` }}
    />
  );
}
