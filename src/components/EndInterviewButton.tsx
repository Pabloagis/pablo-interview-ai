'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Message, RecruiterContext } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import Tooltip from './Tooltip';

interface EndInterviewButtonProps {
  sessionId: string;
  messages: Message[];
  context: RecruiterContext;
  onInterviewEnded: (emailSent: boolean) => void;
  onLeaving?: () => void;
  suppressTooltip?: boolean;
}

export default function EndInterviewButton({
  sessionId,
  messages,
  context,
  onInterviewEnded,
  onLeaving,
  suppressTooltip = false,
}: EndInterviewButtonProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hovered,  setHovered]  = useState(false);
  const [pressed,  setPressed]  = useState(false);

  const isActive = messages.filter((m) => m.role === 'user').length >= 2;

  const openModal = () => {
    if (!isActive) return;
    setErrorMsg(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (isSending) return;
    setModalOpen(false);
    setErrorMsg(null);
  };

  const handleConfirm = async () => {
    if (isSending) return;
    setErrorMsg(null);

    if (!context.consentToEmail) {
      setModalOpen(false);
      onInterviewEnded(false);
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/send-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Request failed');
      }

      setModalOpen(false);
      onLeaving?.();
      setTimeout(() => router.push(`/email-preview?id=${sessionId}`), 300);
    } catch (err) {
      console.error('[EndInterview] send-followup failed:', err);
      setErrorMsg(t.endModalError);
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Unified Insights trigger — pill on desktop, icon square on mobile */}
      <Tooltip
        text={isActive ? t.endTooltipActive : t.endTooltipInactive}
        position="bottom"
        align="right"
        disabled={suppressTooltip}
        className="shrink-0"
      >
        <button
          onClick={openModal}
          disabled={!isActive}
          onMouseEnter={() => isActive && setHovered(true)}
          onMouseLeave={() => { setHovered(false); setPressed(false); }}
          onMouseDown={() => isActive && setPressed(true)}
          onMouseUp={() => setPressed(false)}
          aria-label={isActive ? t.endTooltipActive : t.endTooltipInactive}
          className="flex items-center justify-center gap-[6px] shrink-0 w-[34px] h-[34px] p-0 rounded-lg sm:w-auto sm:h-auto sm:px-[14px] sm:py-[6px] sm:rounded-full"
          style={isActive ? {
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: hovered && !pressed ? '0 4px 20px var(--accent-glow)' : '0 2px 12px var(--accent-glow)',
            transform: pressed ? 'translateY(0)' : hovered ? 'translateY(-1px)' : 'translateY(0)',
            transition: 'transform 180ms ease, box-shadow 180ms ease',
          } : {
            background: 'var(--glass-1)',
            border: '0.5px solid var(--glass-border)',
            color: 'var(--text-muted)',
            cursor: 'not-allowed',
            opacity: 0.45,
            fontFamily: 'inherit',
          }}
        >
          <svg
            className="shrink-0 w-[16px] h-[16px] sm:w-[14px] sm:h-[14px]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m1.343-5.657-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="hidden sm:inline" style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {t.endButtonFull}
          </span>
        </button>
      </Tooltip>

      {/* Confirmation modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md px-6 py-6 sm:p-8 my-auto animate-slide-up"
            style={{
              background: 'var(--bg-elevated)',
              border: '0.5px solid var(--glass-border-hi)',
              borderRadius: 20,
              boxShadow: '0 24px 80px rgba(0,0,0,0.56), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              {t.endModalTitle}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
              {context.consentToEmail ? t.endModalWithConsent : t.endModalWithoutConsent}
            </p>

            {errorMsg && (
              <p style={{ fontSize: 13, color: '#f87171', marginBottom: 16 }}>{errorMsg}</p>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={closeModal}
                disabled={isSending}
                className="theme-modal-cancel"
                style={{
                  padding: '9px 18px',
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 10,
                  cursor: isSending ? 'not-allowed' : 'pointer',
                  opacity: isSending ? 0.5 : 1,
                }}
              >
                {t.endModalCancel}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSending}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
                  border: 'none',
                  borderRadius: 10,
                  color: '#ffffff',
                  cursor: isSending ? 'not-allowed' : 'pointer',
                  opacity: isSending ? 0.75 : 1,
                  boxShadow: '0 4px 16px rgba(64,96,208,0.35)',
                }}
              >
                {isSending && (
                  <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {isSending ? t.endModalSending : t.endModalConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
