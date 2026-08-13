'use client';

// Candidate interviews their own agent as if they were a recruiter.
// After they end the test, a Haiku pass surfaces which nodes caused refusals or weak answers.

import { useState, useCallback, useRef, useEffect, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { COVERAGE_NODES, type CoverageNodeKey } from '@/lib/coverage-nodes';
import type { Gap } from '@/app/api/trainer/analyze-gaps/route';
import { usePlatformT } from '@/context/platform-i18n';

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

const GAP_TYPE_STYLE: Record<'refusal' | 'weak', { color: string; bg: string }> = {
  refusal: { color: '#D71921', bg: 'rgba(215,25,33,0.12)'  }, // --accent
  weak:    { color: '#D4A843', bg: 'rgba(212,168,67,0.12)' }, // --warning
};

export default function AgentTestOverlay({ onClose, onTrainNode }: Props) {
  const t = usePlatformT();
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
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--black)]">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 h-14 flex items-center px-5 gap-3 border-b border-[var(--border-visible)]">
        <div className="flex flex-col">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-display)] leading-tight">
            {phase === 'results' ? t.test_results_title : t.test_testing_title}
          </span>
          {phase === 'interviewing' && (
            <span className="font-mono text-[10px] text-[var(--text-disabled)] leading-tight mt-0.5">
              {t.test_subtitle}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0" />
        {phase === 'interviewing' && (
          <button
            onClick={endInterview}
            disabled={messages.filter(m => m.role === 'assistant').length === 0}
            className="shrink-0 px-4 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-[0.06em] border transition-colors
                       border-[var(--border-visible)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)]
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t.test_end}
          </button>
        )}
        {phase === 'results' && (
          <button
            onClick={onClose}
            className="shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label={t.test_close}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
        {phase === 'analyzing' && (
          <div className="shrink-0 w-4 h-4 rounded-full border-2 border-t-[var(--text-secondary)] border-[var(--border)] animate-spin" />
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      {phase === 'interviewing' && (
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Message list */}
          <div className="flex-1 min-w-0 overflow-y-auto px-5 py-5 flex flex-col gap-3">

            {messages.length === 0 && !isStreaming && (
              <div className="flex-1 flex flex-col items-center justify-center py-16">
                <p className="text-sm text-[var(--text-disabled)] text-center max-w-xs leading-relaxed">
                  {t.test_empty}
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
              <div className="self-start px-3 py-2 font-mono text-[11px] text-[var(--text-disabled)]">
                [...]
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-[var(--border-visible)] px-4 py-3 flex items-end gap-3">
            <div className="flex-1 min-w-0 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border-visible)] px-4 py-3">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder={t.test_placeholder}
                disabled={isStreaming}
                className="w-full bg-transparent text-sm text-[var(--text-primary)] resize-none focus:outline-none placeholder:text-[var(--text-disabled)] leading-relaxed disabled:opacity-50"
              />
              <div className="flex justify-end mt-1">
                <span className="font-mono text-[10px] text-[var(--text-disabled)] select-none">{t.conv_enter_to_send}</span>
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="shrink-0 self-end px-5 py-2.5 rounded-full font-mono text-[12px] uppercase tracking-[0.06em] transition-colors disabled:opacity-30"
              style={{
                background: 'var(--text-display)',
                color: 'var(--black)',
              }}
            >
              {t.test_ask}
            </button>
          </div>
        </div>
      )}

      {phase === 'analyzing' && (
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center gap-4">
          <div className="w-7 h-7 rounded-full border-2 border-t-[var(--text-secondary)] border-[var(--border)] animate-spin" />
          <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-disabled)]">{t.test_analyzing}</p>
        </div>
      )}

      {phase === 'results' && (
        <div className="flex-1 min-w-0 overflow-y-auto px-5 py-6 flex flex-col gap-5">

          {gaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-sm text-[var(--text-secondary)] text-center">
                {t.test_no_gaps}
              </p>
              <button
                onClick={onClose}
                className="mt-2 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors underline underline-offset-2"
              >
                {t.test_return}
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm leading-relaxed">
                {t.test_gaps(gaps.length)}
              </p>

              <div className="flex flex-col gap-3">
                {gaps.map(gap => {
                  const node   = COVERAGE_NODES.find(n => n.key === gap.nodeKey);
                  const style  = GAP_TYPE_STYLE[gap.type];
                  return (
                    <div
                      key={gap.nodeKey}
                      className="rounded-[var(--radius-md)] border border-[var(--border-visible)] bg-[var(--surface)] overflow-hidden"
                    >
                      {/* Gap header */}
                      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                        <span
                          className="font-mono text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded"
                          style={{ color: style.color, background: style.bg }}
                        >
                          {gap.type === 'refusal' ? t.test_gap_refusal : t.test_gap_weak}
                        </span>
                        <span className="text-sm text-[var(--text-primary)] font-medium">
                          {node ? t.nodes[gap.nodeKey].label : gap.nodeKey}
                        </span>
                      </div>

                      {/* Excerpt — verbatim agent text */}
                      <blockquote className="mx-4 mb-3 pl-3 border-l-2 text-xs text-[var(--text-secondary)] leading-relaxed italic"
                        style={{ borderColor: style.color + '60' }}
                      >
                        &ldquo;{gap.excerpt}&rdquo;
                      </blockquote>

                      {/* Train link */}
                      <div className="px-4 pb-4">
                        <button
                          onClick={() => handleTrainNode(gap.nodeKey)}
                          className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--interactive)] hover:opacity-80 transition-opacity"
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

// ── Sub-components ─────────────────────────────────────────────────────────────

function TestBubble({
  message,
  isStreaming = false,
}: {
  message: TestMessage;
  isStreaming?: boolean;
}) {
  const t = usePlatformT();
  const isUser = message.role === 'user'; // user = recruiter in this context

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} flex-col gap-0.5`}>
      {/* Role label */}
      <span className={`font-mono text-[9px] uppercase tracking-[0.06em] ${isUser ? 'text-right' : 'text-left'} text-[var(--text-disabled)]`}>
        {isUser ? t.test_you_recruiter : t.test_your_agent}
      </span>
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div
          className={[
            'max-w-[82%] px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-[var(--surface-raised)] border border-[var(--border-visible)] text-[var(--text-primary)] rounded-[var(--radius-md)]'
              : 'text-[var(--text-primary)]',
          ].join(' ')}
        >
          {message.content}
          {isStreaming && (
            <span className="inline-block w-0.5 h-3.5 bg-[var(--text-secondary)] ml-0.5 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}

