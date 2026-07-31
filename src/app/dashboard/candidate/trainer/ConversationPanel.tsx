'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import VoiceRecorder from '../components/VoiceRecorder';
import CvUpload from '../modules/CvUpload';
import CareerGoalPicker from '../modules/CareerGoalPicker';
import DocumentUpload from '../modules/DocumentUpload';
import RoleUpdate from '../modules/RoleUpdate';
import { usePlatformT } from '@/context/platform-i18n';

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
//
// 'role_update' is likewise not onboarding: it appears LONG after setup, when a
// confirmed correction has moved the agent ahead of the CV the recruiter directory
// reads. Despite the type name, these actions are simply controls a message can
// carry — the profile keeps changing after onboarding ends.
export type OnboardingAction =
  | 'cv_upload'
  | 'career_goal'
  | 'document_upload'
  | 'role_update';

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
  onCareerGoalSaved?: (goal?: string) => void;
  // Supporting-document upload — reachable any time from the composer, and also
  // rendered inline when an assistant message carries the 'document_upload' action.
  onDocumentUploaded?: (message?: string) => void;
  // Work history added without a CV re-upload — see the 'role_update' action.
  onRoleUpdated?: (message?: string) => void;
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
  onRoleUpdated,
}: Props) {
  const t = usePlatformT();
  const [draft, setDraft] = useState('');
  const [docPanelOpen, setDocPanelOpen] = useState(false);
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
              {t.conv_empty}
            </p>
          </div>
        )}

        {/* Message bubbles — an assistant message may carry an inline control */}
        {messages.map(msg => (
          <div key={msg.id} className="flex flex-col gap-2">
            <MessageBubble message={msg} />

            {msg.action === 'cv_upload' && (
              <div className="self-start w-full max-w-[82%] rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <CvUpload
                  cvLoaded={cvLoaded}
                  onSaved={() => onCvUploaded?.()}
                />
              </div>
            )}

            {msg.action === 'career_goal' && (
              <div className="self-start w-full max-w-[82%] rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <CareerGoalPicker
                  currentGoal={careerGoal}
                  moduleOptions={null}
                  // Forward the saved value: the picker can reopen later to revise
                  // the goal, and it must reopen showing what was actually saved.
                  onSaved={goal => onCareerGoalSaved?.(goal)}
                />
              </div>
            )}

            {msg.action === 'role_update' && (
              <div className="self-start w-full max-w-[82%] rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <RoleUpdate onSaved={msg => onRoleUpdated?.(msg)} />
              </div>
            )}

            {msg.action === 'document_upload' && (
              <div className="self-start w-full max-w-[82%] rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
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
            {t.conv_extracting}
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* ── Document panel (toggled by the composer paperclip) ───────────── */}
      {docPanelOpen && (
        <div className="shrink-0 border-t border-white/[0.06] px-4 py-3">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.4)] uppercase tracking-wider">
                {t.conv_add_document}
              </span>
              <button
                onClick={() => setDocPanelOpen(false)}
                className="text-[rgba(255,255,255,0.3)] hover:text-white transition-colors"
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
      <div className="shrink-0 border-t border-white/[0.06] px-4 py-3 flex items-end gap-3">

        {/* Attach a document — always available */}
        <button
          onClick={() => setDocPanelOpen(o => !o)}
          className="shrink-0 self-end p-3 rounded-xl border border-white/[0.09] bg-white/[0.05] text-[rgba(255,255,255,0.45)] hover:text-white transition-colors"
          style={docPanelOpen ? { color: '#8098f0', borderColor: 'rgba(64,96,208,0.5)' } : undefined}
          aria-label={t.conv_attach_document}
          title={t.conv_attach_document}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        <div className="flex-1 min-w-0 rounded-xl bg-white/[0.05] border border-white/[0.09] px-4 py-3 flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder={t.conv_placeholder}
            disabled={isStreaming}
            className="w-full bg-transparent text-sm text-white resize-none focus:outline-none placeholder-[rgba(255,255,255,0.20)] leading-relaxed disabled:opacity-50"
          />
          <div className="flex items-center justify-between">
            <VoiceRecorder
              onTranscript={t => setDraft(prev => prev ? `${prev} ${t}` : t)}
            />
            <span className="text-[10px] text-[rgba(255,255,255,0.18)] select-none">
              {t.conv_enter_to_send}
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
