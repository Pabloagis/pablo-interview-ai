'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import VoiceRecorder from '../components/VoiceRecorder';
import CvUpload from '../modules/CvUpload';
import CareerGoalPicker from '../modules/CareerGoalPicker';
import DocumentUpload from '../modules/DocumentUpload';
import RoleUpdate from '../modules/RoleUpdate';
import { usePlatformT } from '@/context/platform-i18n';

// ── Types ─────────────────────────────────────────────────────────────────────

export type OnboardingAction =
  | 'cv_upload'
  | 'career_goal'
  | 'document_upload'
  | 'role_update';

export interface AnticipatedOffer {
  topic:        string;
  trigger_hint: string;
  question:     string;
}

export interface TrainerMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: OnboardingAction;
  anticipated?: AnticipatedOffer;
  anticipatedResolved?: boolean;
}

interface Props {
  messages: TrainerMessage[];
  streamingText: string;
  isStreaming: boolean;
  isExtracting: boolean;
  isAssessing?: boolean;
  onSend: (text: string) => void;
  cvLoaded?: boolean;
  careerGoal?: string | null;
  onCvUploaded?: () => void;
  onCareerGoalSaved?: (goal?: string) => void;
  onDocumentUploaded?: (message?: string) => void;
  onRoleUpdated?: (message?: string) => void;
  answeringQuestion?: string | null;
  onCancelAnswering?: () => void;
  onAcceptAnticipated?: (messageId: string, offer: AnticipatedOffer) => void;
  onDeclineAnticipated?: (messageId: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ConversationPanel({
  messages,
  streamingText,
  isStreaming,
  isExtracting,
  isAssessing = false,
  onSend,
  cvLoaded = false,
  careerGoal = null,
  onCvUploaded,
  onCareerGoalSaved,
  onDocumentUploaded,
  onRoleUpdated,
  answeringQuestion = null,
  onCancelAnswering,
  onAcceptAnticipated,
  onDeclineAnticipated,
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

        {messages.length === 0 && !isStreaming && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-12">
            <p className="text-[var(--body-sm)] text-[var(--text-disabled)] text-center max-w-xs">
              {t.conv_empty}
            </p>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className="flex flex-col gap-2">
            <MessageBubble message={msg} />

            {msg.action === 'cv_upload' && (
              <div className="self-start w-full max-w-[82%] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <CvUpload cvLoaded={cvLoaded} onSaved={() => onCvUploaded?.()} />
              </div>
            )}

            {msg.action === 'career_goal' && (
              <div className="self-start w-full max-w-[82%] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <CareerGoalPicker
                  currentGoal={careerGoal}
                  moduleOptions={null}
                  onSaved={goal => onCareerGoalSaved?.(goal)}
                />
              </div>
            )}

            {msg.action === 'role_update' && (
              <div className="self-start w-full max-w-[82%] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <RoleUpdate onSaved={msg => onRoleUpdated?.(msg)} />
              </div>
            )}

            {msg.anticipated && !msg.anticipatedResolved && (
              <div className="self-start flex items-center gap-2">
                <button
                  onClick={() => onAcceptAnticipated?.(msg.id, msg.anticipated!)}
                  className="px-3 py-1.5 rounded-[var(--radius-sm)] font-mono text-[11px] uppercase tracking-[0.06em] transition-colors duration-[180ms]"
                  style={{ background: 'rgba(212,168,67,0.15)', color: 'var(--warning)', border: '1px solid rgba(212,168,67,0.4)' }}
                >
                  {t.ant_answer_now}
                </button>
                <button
                  onClick={() => onDeclineAnticipated?.(msg.id)}
                  className="px-2 py-1.5 rounded-[var(--radius-sm)] font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors duration-[180ms]"
                >
                  {t.ant_answering_cancel}
                </button>
              </div>
            )}

            {msg.action === 'document_upload' && (
              <div className="self-start w-full max-w-[82%] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <DocumentUpload compact onSaved={msg => onDocumentUploaded?.(msg)} />
              </div>
            )}
          </div>
        ))}

        {isStreaming && streamingText && (
          <MessageBubble
            message={{ id: '__streaming__', role: 'assistant', content: streamingText }}
            isStreaming
          />
        )}

        {/* Typing indicator — bracket text, no bouncing dots */}
        {isStreaming && !streamingText && (
          <div className="self-start px-1 py-1">
            <span className="font-mono text-[13px] text-[var(--text-disabled)]">[...]</span>
          </div>
        )}

        {(isExtracting || isAssessing) && (
          <div className="self-center font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-disabled)] flex items-center gap-1.5 mt-1">
            <div className="w-2 h-2 rounded-full border border-t-[var(--text-secondary)] border-[var(--border)] animate-spin" />
            {isAssessing ? t.ant_checking : t.conv_extracting}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Document panel ───────────────────────────────────────────────── */}
      {docPanelOpen && (
        <div className="shrink-0 border-t border-[var(--border)] px-4 py-3">
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                {t.conv_add_document}
              </span>
              <button
                onClick={() => setDocPanelOpen(false)}
                className="text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors duration-[180ms]"
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

      {/* ── Answering an anticipated question ───────────────────────────── */}
      {answeringQuestion && (
        <div
          className="shrink-0 mx-4 mb-0 mt-3 rounded-[var(--radius-md)] border px-3 py-2 flex items-center gap-2"
          style={{ borderColor: 'rgba(212,168,67,0.40)', background: 'rgba(212,168,67,0.08)' }}
        >
          <span className="text-[11px] leading-snug flex-1 min-w-0" style={{ color: 'var(--warning)' }}>
            {t.ant_answering(answeringQuestion)}
          </span>
          <button
            onClick={() => onCancelAnswering?.()}
            className="shrink-0 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors duration-[180ms]"
          >
            {t.ant_answering_cancel}
          </button>
        </div>
      )}

      {/* ── Input area ───────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-[var(--border)] px-4 py-3 flex items-end gap-3">

        <button
          onClick={() => setDocPanelOpen(o => !o)}
          className="shrink-0 self-end p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-visible)] transition-colors duration-[180ms]"
          style={docPanelOpen ? { color: 'var(--interactive)', borderColor: 'rgba(91,155,246,0.5)' } : undefined}
          aria-label={t.conv_attach_document}
          title={t.conv_attach_document}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        <div className="flex-1 min-w-0 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border-visible)] px-4 py-3 flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder={t.conv_placeholder}
            disabled={isStreaming}
            className="w-full bg-transparent text-[var(--body)] text-[var(--text-primary)] resize-none focus:outline-none placeholder-[var(--text-disabled)] leading-relaxed disabled:opacity-50"
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

        <button
          onClick={handleSend}
          disabled={!canSend}
          className="shrink-0 self-end px-5 py-3 rounded-full font-mono text-[13px] uppercase tracking-[0.06em] transition-colors duration-[180ms] disabled:opacity-30"
          style={{
            background: canSend ? 'var(--text-display)' : 'var(--surface-raised)',
            color: canSend ? 'var(--black)' : 'var(--text-disabled)',
          }}
          aria-label={t.conv_send}
        >
          {t.conv_send}
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
          'max-w-[82%] px-4 py-3 rounded-[var(--radius-md)] text-[var(--body)] leading-relaxed',
          isUser
            ? 'bg-[var(--surface-raised)] border border-[var(--border-visible)] text-[var(--text-primary)]'
            : 'text-[var(--text-primary)]',
          isStreaming ? 'opacity-85' : '',
        ].join(' ')}
      >
        {message.content}
        {isStreaming && (
          <span className="inline-block w-0.5 h-3.5 bg-[var(--text-secondary)] ml-0.5 animate-pulse" />
        )}
      </div>
    </div>
  );
}
