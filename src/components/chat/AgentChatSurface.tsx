'use client';

import { useState, useEffect, useRef, type ReactNode, type KeyboardEvent, type ChangeEvent } from 'react';
import { MAX_MESSAGE_LENGTH } from '@/lib/constants';
import VoiceRecorder from '@/app/dashboard/candidate/components/VoiceRecorder';

// The conversation surface itself — chips, transcript, composer — shared by the
// recruiter-facing chat at /<slug> and the candidate's agent-test sandbox.
//
// It exists so the sandbox cannot drift from the product. A candidate who tests
// their agent is deciding whether it is ready to send to a recruiter; if the
// thing they test looks different from the thing recruiters get, that decision
// is made on the wrong evidence. Everything above and below this component —
// headers, end-of-conversation flows, gap analysis — is each caller's own.
//
// The interaction rules here were each paid for by a real failure and must not
// be relaxed:
//
//   - every shrinkable child carries min-w-0, or one long unbroken string
//     (a URL, a German compound) widens the flex row and the page scrolls
//     sideways
//   - message text is whitespace-pre-wrap break-words: the agent writes in
//     paragraphs, and without it they collapse into a wall
//   - the composer's font-size is 16px, because iOS Safari zooms the whole page
//     on focus for anything smaller and never zooms back
//   - while streaming, the scroll pins the TOP of the incoming answer, not the
//     bottom: chasing the last token drags the text out from under the reader
//
// Platform errors are deliberately not rendered here. An error inside the
// transcript reads as the agent speaking, which puts words in the candidate's
// mouth that they never said; callers surface them as toasts instead.

export interface ChatMessage {
  id:      string;
  role:    'user' | 'assistant';
  content: string;
}

export interface ChatTopic {
  label:    string;
  question: string;
}

interface Props {
  messages:       ChatMessage[];
  isStreaming:    boolean;
  streamingText:  string;
  /** Rotated every 1.8s while waiting for the first token. */
  thinkingLabels: string[];

  /** The composer is live only when this is true; until then it shows `startingPlaceholder`. */
  ready:               boolean;
  onSend:              (text: string) => void;
  placeholder:         string;
  startingPlaceholder: string;
  sendLabel:           string;
  inputAriaLabel:      string;
  /** Mirrors the draft out so a caller can gate proactive turns on "they are typing". */
  onDraftChange?:      (value: string) => void;

  topics?:          ChatTopic[];
  topicsLabel?:     string;
  onTopic?:         (topic: ChatTopic) => void;
  onRefreshTopics?: () => void;
  refreshLabel?:    string;

  /** Shown while the transcript is empty and nothing is streaming. */
  emptyState?: ReactNode;
  /** A fatal start-up failure, shown in place of the transcript. */
  errorText?:  string | null;

  voice?:       boolean;
  onVoiceError?: (message: string) => void;

  /** Sits to the left of the composer (the public chat puts "End" there). */
  leading?: ReactNode;
  /** Replaces the composer entirely once the conversation is over. */
  footer?:  ReactNode;
}

export default function AgentChatSurface({
  messages,
  isStreaming,
  streamingText,
  thinkingLabels,
  ready,
  onSend,
  placeholder,
  startingPlaceholder,
  sendLabel,
  inputAriaLabel,
  onDraftChange,
  topics = [],
  topicsLabel,
  onTopic,
  onRefreshTopics,
  refreshLabel,
  emptyState,
  errorText = null,
  voice = false,
  onVoiceError,
  leading,
  footer,
}: Props) {
  const [input, setInput] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);

  const bottomRef       = useRef<HTMLDivElement>(null);
  const streamingTopRef = useRef<HTMLDivElement>(null);
  const textareaRef     = useRef<HTMLTextAreaElement>(null);

  // Note the dependency list: messages.length and isStreaming, never
  // streamingText. Reacting to every token scrolls the answer out from under the
  // reader as it arrives.
  useEffect(() => {
    if (isStreaming) streamingTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isStreaming]);

  useEffect(() => {
    if (!isStreaming) return;
    setThinkingIndex(0);
    const id = setInterval(() => setThinkingIndex(i => i + 1), 1800);
    return () => clearInterval(id);
  }, [isStreaming]);

  function updateDraft(value: string) {
    const next = value.slice(0, MAX_MESSAGE_LENGTH);
    setInput(next);
    onDraftChange?.(next);
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || !ready || isStreaming) return;
    updateDraft('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    onSend(trimmed);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  // Auto-grow to a ceiling, the way every messaging app behaves. Without the
  // reset to 'auto' first, the box only ever grows and never shrinks back.
  function onInputChange(e: ChangeEvent<HTMLTextAreaElement>) {
    updateDraft(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function onTranscript(text: string) {
    updateDraft(input ? `${input} ${text}` : text);
    textareaRef.current?.focus();
  }

  const showChips = topics.length > 0 && !footer && !!onTopic;

  return (
    <>
      {/* ── Suggested topics ─────────────────────────────────────────────── */}
      {showChips && (
        <div className="shrink-0 px-3 py-2 border-b border-white/[0.05] bg-white/[0.015]">
          <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {topicsLabel && (
              <span className="shrink-0 pr-1 text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.28)] select-none">
                {topicsLabel}
              </span>
            )}
            {topics.map(topic => (
              <button
                key={topic.label}
                onClick={() => onTopic?.(topic)}
                disabled={isStreaming || !ready}
                className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium border border-white/[0.1] bg-white/[0.04] text-[rgba(255,255,255,0.7)] transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
              >
                {topic.label}
              </button>
            ))}
            {onRefreshTopics && (
              <button
                onClick={onRefreshTopics}
                disabled={isStreaming}
                aria-label={refreshLabel}
                title={refreshLabel}
                className="shrink-0 ml-0.5 w-7 h-7 flex items-center justify-center rounded-full border border-white/[0.1] text-[rgba(255,255,255,0.45)] transition-colors hover:text-white disabled:opacity-40"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Transcript ───────────────────────────────────────────────────── */}
      <div
        className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-5 py-5 flex flex-col gap-3"
        role="log"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.length === 0 && !isStreaming && !errorText && emptyState}

        {errorText && (
          <p className="text-sm text-[rgba(220,120,120,0.8)] text-center mt-10">{errorText}</p>
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
                    {thinkingLabels[thinkingIndex % thinkingLabels.length]}
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Composer ─────────────────────────────────────────────────────── */}
      {footer ?? (
        <div className="shrink-0 border-t border-white/[0.07] px-4 py-3">
          <div className="flex items-end gap-2 min-w-0">
            {leading}

            {voice && (
              <VoiceRecorder
                compact
                onTranscript={onTranscript}
                onError={message => onVoiceError?.(message)}
                disabled={!ready || isStreaming}
              />
            )}

            {/* The focus state lives on this wrapper, so the ring surrounds the
                whole pill rather than the bare textarea. */}
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
                placeholder={ready ? placeholder : startingPlaceholder}
                disabled={!ready || isStreaming}
                aria-label={inputAriaLabel}
                className="flex-1 min-w-0 resize-none bg-transparent text-white leading-relaxed focus:outline-none placeholder-[rgba(255,255,255,0.25)] disabled:opacity-50"
                style={{ fontSize: 16, maxHeight: 120 }}
              />
            </div>

            <button
              onClick={() => send(input)}
              disabled={!input.trim() || !ready || isStreaming}
              aria-label={sendLabel}
              className="shrink-0 h-11 px-5 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-30"
              style={{ background: '#4060d0' }}
            >
              {sendLabel}
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
    </>
  );
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex min-w-0 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={[
        'max-w-[82%] min-w-0 px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words',
        isUser ? 'bg-[#4060d0]/25 border border-[#4060d0]/35 text-white'
               : 'bg-white/[0.04] border border-white/[0.08] text-[rgba(255,255,255,0.82)]',
      ].join(' ')}>{msg.content}</div>
    </div>
  );
}
