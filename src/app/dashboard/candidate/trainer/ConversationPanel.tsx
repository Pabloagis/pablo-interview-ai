'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import VoiceRecorder from '../components/VoiceRecorder';
import CvUpload from '../modules/CvUpload';
import CareerGoalPicker from '../modules/CareerGoalPicker';
import DocumentUpload from '../modules/DocumentUpload';
import { usePlatformT } from '@/context/platform-i18n';
import { Button } from '@/components/ui';

// ── Types ─────────────────────────────────────────────────────────────────────

// Some onboarding steps need real UI (a file picker, a chip select) — chat can't
// "receive" a CV as text. An assistant message can therefore carry an inline
// control, rendered directly under its bubble. The controls are the SAME components
// the wizard uses and hit the SAME API routes; this is UI relocation, not a second
// implementation.
//
// 'document_upload' is not a blocking onboarding gate like cv_upload / career_goal —
// it's an invitation the agent can attach when a document would strengthen a node.
// The same control is always reachable from the composer paperclip regardless.
export type OnboardingAction = 'cv_upload' | 'career_goal' | 'document_upload';

export interface TrainerMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: OnboardingAction;
}

interface Props {
  messages: TrainerMessage[];
  streamingText: string;   // partial assistant text while streaming
  isStreaming: boolean;
  isExtracting: boolean;
  onSend: (text: string) => void;
  // Inline onboarding controls (omitted once the candidate is past onboarding)
  cvLoaded?: boolean;
  careerGoal?: string | null;
  onCvUploaded?: () => void;
  onCareerGoalSaved?: () => void;
  // Supporting-document upload — reachable any time from the composer, and also
  // rendered inline when an assistant message carries the 'document_upload' action.
  onDocumentUploaded?: (message?: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ConversationPanel({
  messages,
  streamingText,
  isStreaming,
  isExtracting,
  onSend,
  cvLoaded = false,
  careerGoal = null,
  onCvUploaded,
  onCareerGoalSaved,
  onDocumentUploaded,
}: Props) {
  const t = usePlatformT();
  const [draft, setDraft] = useState('');
  const [docPanelOpen, setDocPanelOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const canSend = draft.trim().length > 0 && !isStreaming;

  return (
    <div className="flex flex-col h-full">

      {/* ── Message list ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto px-5 py-5 flex flex-col gap-3">

        {/* Empty state */}
        {messages.length === 0 && !isStreaming && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-disabled)] text-center max-w-xs">
              {t.conv_empty}
            </p>
          </div>
        )}

        {/* Message bubbles — an assistant message may carry an inline control */}
        {messages.map(msg => (
          <div key={msg.id} className="flex flex-col gap-2">
            <MessageBubble message={msg} />

            {msg.action === 'cv_upload' && (
              <div className="self-start w-full max-w-[82%] rounded-[var(--radius-md)] border border-[var(--border-visible)] bg-[var(--surface)] px-4 py-3">
                <CvUpload
                  cvLoaded={cvLoaded}
                  onSaved={() => onCvUploaded?.()}
                />
              </div>
            )}

            {msg.action === 'career_goal' && (
              <div className="self-start w-full max-w-[82%] rounded-[var(--radius-md)] border border-[var(--border-visible)] bg-[var(--surface)] px-4 py-3">
                <CareerGoalPicker
                  currentGoal={careerGoal}
                  moduleOptions={null}
                  onSaved={() => onCareerGoalSaved?.()}
                />
              </div>
            )}

            {msg.action === 'document_upload' && (
              <div className="self-start w-full max-w-[82%] rounded-[var(--radius-md)] border border-[var(--border-visible)] bg-[var(--surface)] px-4 py-3">
                <DocumentUpload compact onSaved={msg => onDocumentUploaded?.(msg)} />
              </div>
            )}
          </div>
        ))}

        {/* Streaming bubble — assistant text being built token by token */}
        {isStreaming && streamingText && (
          <MessageBubble
            message={{ id: '__streaming__', role: 'assistant', content: streamingText }}
            isStreaming
          />
        )}

        {/* Typing indicator — before first token */}
        {isStreaming && !streamingText && (
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-disabled)] self-start px-0 py-2">
            [...]
          </span>
        )}

        {/* Extraction indicator */}
        {isExtracting && (
          <div className="self-center font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-disabled)] flex items-center gap-1.5 mt-1">
            <div className="w-2 h-2 rounded-full border border-t-[var(--text-secondary)] border-[var(--border-visible)] animate-spin" />
            {t.conv_extracting}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Document panel ───────────────────────────────────────────── */}
      {docPanelOpen && (
        <div className="shrink-0 border-t border-[var(--border-visible)] px-4 py-3">
          <div className="rounded-[var(--radius-md)] border border-[var(--border-visible)] bg-[var(--surface)] px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                {t.conv_add_document}
              </span>
              <button
                onClick={() => setDocPanelOpen(false)}
                className="text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors"
                aria-label={t.conv_close}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <DocumentUpload
              compact
              onSaved={msg => { setDocPanelOpen(false); onDocumentUploaded?.(msg); }}
            />
          </div>
        </div>
      )}

      {/* ── Input area ───────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-[var(--border-visible)] px-4 py-3 flex items-end gap-3">

        {/* Attach a document */}
        <button
          onClick={() => setDocPanelOpen(o => !o)}
          className={[
            'shrink-0 self-end p-2.5 rounded-[var(--radius-sm)]',
            'border transition-colors duration-[180ms]',
            docPanelOpen
              ? 'border-[var(--interactive)] text-[var(--interactive)]'
              : 'border-[var(--border-visible)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]',
          ].join(' ')}
          aria-label={t.conv_attach_document}
          title={t.conv_attach_document}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        {/* Composer */}
        <div className="flex-1 min-w-0 rounded-[var(--radius-sm)] bg-[var(--surface)] border border-[var(--border-visible)] px-4 py-3 flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder={t.conv_placeholder}
            disabled={isStreaming}
            className="w-full bg-transparent font-sans text-[16px] text-[var(--text-primary)] resize-none focus:outline-none placeholder:text-[var(--text-disabled)] leading-relaxed disabled:opacity-50"
          />
          <div className="flex items-center justify-between">
            <VoiceRecorder
              onTranscript={t => setDraft(prev => prev ? `${prev} ${t}` : t)}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-disabled)] select-none">
              {t.conv_enter_to_send}
            </span>
          </div>
        </div>

        {/* Send */}
        <Button
          variant="primary"
          size="sm"
          disabled={!canSend}
          onClick={handleSend}
          aria-label={t.conv_send}
        >
          {t.conv_send}
        </Button>
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
          'max-w-[82%] text-[16px] leading-relaxed',
          isUser
            ? 'bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)]'
            : 'py-1 text-[var(--text-primary)]',
          isStreaming ? 'opacity-80' : '',
        ].join(' ')}
      >
        {message.content}
        {isStreaming && (
          <span className="inline-block w-[2px] h-[1em] bg-[var(--text-disabled)] ml-0.5 align-middle animate-pulse" style={{ verticalAlign: '-0.1em' }} />
        )}
      </div>
    </div>
  );
}
