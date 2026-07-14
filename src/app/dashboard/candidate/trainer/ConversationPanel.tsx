'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import VoiceRecorder from '../components/VoiceRecorder';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TrainerMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  messages: TrainerMessage[];
  streamingText: string;   // partial assistant text while streaming
  isStreaming: boolean;
  isExtracting: boolean;
  onSend: (text: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ConversationPanel({
  messages,
  streamingText,
  isStreaming,
  isExtracting,
  onSend,
}: Props) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when a new complete message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function handleSend() {
    const text = draft.trim();
    if (!text || isStreaming) return;
    setDraft('');
    onSend(text);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Send on Enter (not Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const canSend = draft.trim().length > 0 && !isStreaming;

  return (
    // flex-1 min-w-0 comes from parent (TrainerShell conversation slot)
    <div className="flex flex-col h-full">

      {/* ── Message list ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto px-5 py-5 flex flex-col gap-3">

        {/* Empty state */}
        {messages.length === 0 && !isStreaming && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-12">
            <p className="text-sm text-[rgba(255,255,255,0.25)] text-center max-w-xs">
              Your AI interview trainer is ready. It will push you for specifics — dates, numbers, named systems.
            </p>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming bubble — assistant text being built token by token */}
        {isStreaming && streamingText && (
          <MessageBubble
            message={{ id: '__streaming__', role: 'assistant', content: streamingText }}
            isStreaming
          />
        )}

        {/* Typing indicator — shown while stream starts (before first token) */}
        {isStreaming && !streamingText && (
          <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.07] self-start max-w-[80px]">
            <Dot delay={0}   />
            <Dot delay={160} />
            <Dot delay={320} />
          </div>
        )}

        {/* Extraction indicator */}
        {isExtracting && (
          <div className="self-center text-[10px] text-[rgba(255,255,255,0.25)] flex items-center gap-1.5 mt-1">
            <div className="w-2 h-2 rounded-full border border-t-[rgba(255,255,255,0.3)] border-[rgba(255,255,255,0.08)] animate-spin" />
            Extracting evidence…
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* ── Input area ───────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-white/[0.06] px-4 py-3 flex items-end gap-3">

        <div className="flex-1 min-w-0 rounded-xl bg-white/[0.05] border border-white/[0.09] px-4 py-3 flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Answer the question…"
            disabled={isStreaming}
            className="w-full bg-transparent text-sm text-white resize-none focus:outline-none placeholder-[rgba(255,255,255,0.20)] leading-relaxed disabled:opacity-50"
          />
          <div className="flex items-center justify-between">
            <VoiceRecorder
              onTranscript={t => setDraft(prev => prev ? `${prev} ${t}` : t)}
            />
            <span className="text-[10px] text-[rgba(255,255,255,0.18)] select-none">
              Enter to send
            </span>
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
          aria-label="Send message"
        >
          Send
        </button>
      </div>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isStreaming = false,
}: {
  message: TrainerMessage;
  isStreaming?: boolean;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-[#4060d0]/25 border border-[#4060d0]/35 text-white'
            : 'bg-white/[0.04] border border-white/[0.08] text-[rgba(255,255,255,0.78)]',
          isStreaming ? 'opacity-85' : '',
        ].join(' ')}
      >
        {message.content}
        {isStreaming && (
          <span className="inline-block w-0.5 h-3.5 bg-[rgba(255,255,255,0.5)] ml-0.5 animate-pulse" />
        )}
      </div>
    </div>
  );
}

// ── Typing dot ────────────────────────────────────────────────────────────────

function Dot({ delay }: { delay: number }) {
  return (
    <div
      className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.4)]"
      style={{ animation: `pulse 1s ${delay}ms ease-in-out infinite` }}
    />
  );
}
