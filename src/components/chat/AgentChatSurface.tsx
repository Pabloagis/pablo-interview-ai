'use client';

import { useState, useEffect, useRef, type ReactNode, type KeyboardEvent, type ChangeEvent } from 'react';
import VoiceRecorder from '@/app/dashboard/candidate/components/VoiceRecorder';
import SpeakButton from '@/components/chat/speech';

// The conversation surface itself — chips, transcript, composer — shared by the
// recruiter-facing chat at /<slug> and the candidate's agent-test sandbox.
//
// It exists so the sandbox cannot drift from the product. A candidate who tests
// their agent is deciding whether it is ready to send to a recruiter; if the
// thing they test looks different from the thing recruiters get, that decision
// is made on the wrong evidence. Everything above and below this component —
// headers, end-of-conversation flows, gap analysis — is each caller's own.
//
// Interaction rules preserved verbatim — see original file for rationale:
//   - every shrinkable child carries min-w-0
//   - message text is whitespace-pre-wrap break-words
//   - composer font-size is 16px (iOS Safari zoom guard)
//   - scroll pins TOP of incoming answer, not the bottom

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
  thinkingLabels: string[];
  ready:               boolean;
  onSend:              (text: string) => void;
  placeholder:         string;
  startingPlaceholder: string;
  sendLabel:           string;
  inputAriaLabel:      string;
  onDraftChange?:      (value: string) => void;
  topics?:          ChatTopic[];
  topicsLabel?:     string;
  onTopic?:         (topic: ChatTopic) => void;
  onRefreshTopics?: () => void;
  refreshLabel?:    string;
  emptyState?: ReactNode;
  errorText?:  string | null;
  voice?:       boolean;
  onVoiceError?: (message: string) => void;
  onSpeak?:      (id: string, text: string) => void;
  speakingId?:   string | null;
  speakLabel?:   string;
  stopSpeakLabel?: string;
  footer?:  ReactNode;
  agentAvatarUrl?: string | null;
  agentInitials?:  string;
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
  onSpeak,
  speakingId = null,
  speakLabel,
  stopSpeakLabel,
  footer,
  agentAvatarUrl,
  agentInitials,
}: Props) {
  const [input, setInput] = useState('');
  const [thinkingIndex, setThinkingIndex] = useState(0);

  const bottomRef       = useRef<HTMLDivElement>(null);
  const streamingTopRef = useRef<HTMLDivElement>(null);
  const textareaRef     = useRef<HTMLTextAreaElement>(null);

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
    setInput(value);
    onDraftChange?.(value);
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
        <div className="shrink-0 px-3 py-2 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {topicsLabel && (
              <span className="shrink-0 pr-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-disabled)] select-none">
                {topicsLabel}
              </span>
            )}
            {topics.map(topic => (
              <button
                key={topic.label}
                onClick={() => onTopic?.(topic)}
                disabled={isStreaming || !ready}
                className="shrink-0 rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] border border-[var(--border-visible)] bg-transparent text-[var(--text-secondary)] transition-colors duration-[180ms] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)] disabled:opacity-40"
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
                className="shrink-0 ml-0.5 w-7 h-7 flex items-center justify-center rounded-full border border-[var(--border-visible)] text-[var(--text-secondary)] transition-colors duration-[180ms] hover:text-[var(--text-primary)] disabled:opacity-40"
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
        className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden px-5 py-5 flex flex-col gap-3"
        role="log"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.length === 0 && !isStreaming && !errorText && emptyState}

        {errorText && (
          <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--accent)] text-center mt-10">{errorText}</p>
        )}

        {messages.map(m => (
          <Bubble
            key={m.id}
            msg={m}
            agentAvatarUrl={agentAvatarUrl}
            agentInitials={agentInitials}
            onSpeak={onSpeak}
            speaking={speakingId === m.id}
            speakLabel={speakLabel}
            stopSpeakLabel={stopSpeakLabel}
          />
        ))}

        {isStreaming && (
          <>
            <div ref={streamingTopRef} />
            <div className="flex items-start gap-2.5 min-w-0">
              {(agentAvatarUrl || agentInitials) && (
                <div className="shrink-0 mt-1">
                  {agentAvatarUrl
                    ? /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={agentAvatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                    : <div className="w-7 h-7 rounded-full bg-[#4060d0]/15 border border-[#4060d0]/25 flex items-center justify-center text-[10px] font-semibold text-[#3050b0]">{agentInitials}</div>
                  }
                </div>
              )}
              <div className="max-w-[80%] min-w-0 bg-white border border-black/[0.07] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words text-[#0d0f14]">
                {streamingText ? (
                  <>
                    {streamingText}
                    <span className="inline-block w-0.5 h-3.5 align-middle ml-0.5 bg-black/30 animate-pulse" />
                  </>
                ) : (
                  <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[rgba(0,0,0,0.38)]">
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
        <div className="shrink-0 border-t border-[var(--border)] px-4 py-3">
          <div className="flex items-end gap-2 min-w-0">
            {voice && (
              <VoiceRecorder
                compact
                onTranscript={onTranscript}
                onError={message => onVoiceError?.(message)}
                disabled={!ready || isStreaming}
              />
            )}

            <div className="flex-1 min-w-0 flex items-end rounded-[var(--radius-md)] px-4 py-2.5 bg-[var(--surface)] border border-[var(--border-visible)] focus-within:border-[var(--text-primary)] transition-colors duration-[180ms]">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={onInputChange}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder={ready ? placeholder : startingPlaceholder}
                disabled={!ready || isStreaming}
                aria-label={inputAriaLabel}
                className="flex-1 min-w-0 resize-none bg-transparent text-[var(--text-primary)] leading-relaxed focus:outline-none placeholder-[var(--text-disabled)] disabled:opacity-50"
                style={{ fontSize: 16, maxHeight: 120 }}
              />
            </div>

            <button
              onClick={() => send(input)}
              disabled={!input.trim() || !ready || isStreaming}
              aria-label={sendLabel}
              className="shrink-0 h-11 px-5 rounded-full font-mono text-[13px] uppercase tracking-[0.06em] transition-colors duration-[180ms] disabled:opacity-30"
              style={{
                background: (input.trim() && ready && !isStreaming) ? 'var(--text-display)' : 'var(--surface-raised)',
                color: (input.trim() && ready && !isStreaming) ? 'var(--black)' : 'var(--text-disabled)',
              }}
            >
              {sendLabel}
            </button>
          </div>

        </div>
      )}
    </>
  );
}

function AgentAvatar({ avatarUrl, initials }: { avatarUrl?: string | null; initials?: string }) {
  if (!avatarUrl && !initials) return null;
  if (avatarUrl) {
    /* eslint-disable-next-line @next/next/no-img-element */
    return <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 mt-1" />;
  }
  return (
    <div className="w-7 h-7 rounded-full bg-[#4060d0]/15 border border-[#4060d0]/25 flex items-center justify-center text-[10px] font-semibold text-[#3050b0] shrink-0 mt-1">
      {initials}
    </div>
  );
}

function Bubble({
  msg, agentAvatarUrl, agentInitials, onSpeak, speaking, speakLabel, stopSpeakLabel,
}: {
  msg:              ChatMessage;
  agentAvatarUrl?:  string | null;
  agentInitials?:   string;
  onSpeak?:         (id: string, text: string) => void;
  speaking:         boolean;
  speakLabel?:      string;
  stopSpeakLabel?:  string;
}) {
  const isUser = msg.role === 'user';
  const canSpeak = !isUser && !!onSpeak;
  const hasAvatar = !isUser && (agentAvatarUrl || agentInitials);

  return (
    <div className={`flex items-start gap-2.5 min-w-0 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {hasAvatar && <AgentAvatar avatarUrl={agentAvatarUrl} initials={agentInitials} />}
      <div className="max-w-[80%] min-w-0 flex flex-col items-start">
        <div className={[
          'min-w-0 text-sm leading-relaxed whitespace-pre-wrap break-words px-4 py-3 rounded-2xl',
          isUser
            ? 'bg-[#edf0ff] border border-[#4060d0]/25 text-[#0d0f14]'
            : 'bg-white border border-black/[0.07] text-[#0d0f14]',
        ].join(' ')}>{msg.content}</div>
        {canSpeak && (
          <div className="mt-1 ml-0.5">
            <SpeakButton
              speaking={speaking}
              onClick={() => onSpeak(msg.id, msg.content)}
              labelSpeak={speakLabel ?? 'Read aloud'}
              labelStop={stopSpeakLabel ?? 'Stop'}
            />
          </div>
        )}
      </div>
    </div>
  );
}
