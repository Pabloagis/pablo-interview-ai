'use client';

import { useState } from 'react';
import { Message, RecruiterContext } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import Tooltip from './Tooltip';

interface EndInterviewButtonProps {
  sessionId: string;
  messages: Message[];
  context: RecruiterContext;
  onInterviewEnded: (emailSent: boolean) => void;
  suppressTooltip?: boolean;
}

export default function EndInterviewButton({
  sessionId,
  messages,
  context,
  onInterviewEnded,
  suppressTooltip = false,
}: EndInterviewButtonProps) {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isActive = messages.filter((m) => m.role === 'user').length >= 3;

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
      onInterviewEnded(true);
    } catch (err) {
      console.error('[EndInterview] send-followup failed:', err);
      setErrorMsg(t.endModalError);
      setIsSending(false);
    }
  };

  const btnActive = [
    'min-h-[36px] px-3 py-1.5 sm:py-2 rounded-lg text-xs font-bold text-white transition-all duration-200 whitespace-nowrap',
    'bg-gradient-to-r from-[#059669] to-[#15803d] shadow-lg shadow-emerald-700/30',
    'hover:shadow-xl hover:shadow-emerald-700/40 hover:scale-[1.01] active:scale-[0.99]',
  ].join(' ');

  const btnInactive = [
    'min-h-[36px] px-3 py-1.5 sm:py-2 rounded-lg text-xs font-bold text-white',
    'bg-[#4d8f6e] opacity-60 cursor-not-allowed',
  ].join(' ');

  return (
    <>
      {/* Desktop button with tooltip */}
      <Tooltip
        text={isActive ? t.endTooltipActive : t.endTooltipInactive}
        position="bottom"
        align="right"
        disabled={suppressTooltip}
        className="hidden sm:block flex-shrink-0"
      >
        <button onClick={openModal} disabled={!isActive} className={isActive ? btnActive : btnInactive}>
          Insights
        </button>
      </Tooltip>

      {/* Mobile icon-only button */}
      <button
        onClick={openModal}
        disabled={!isActive}
        aria-label={isActive ? t.endTooltipActive : t.endTooltipInactive}
        className={[
          'sm:hidden min-h-[36px] w-9 rounded-lg flex items-center justify-center transition-all duration-200',
          isActive
            ? 'bg-gradient-to-r from-[#059669] to-[#15803d] shadow-lg shadow-emerald-700/30 active:scale-[0.99]'
            : 'bg-[#4d8f6e] opacity-60 cursor-not-allowed',
        ].join(' ')}
      >
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m1.343-5.657-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </button>

      {/* Confirmation modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md p-8 animate-slide-up"
            style={{
              background: 'var(--modal-bg)',
              border: '0.5px solid var(--modal-border)',
              borderRadius: 20,
              boxShadow: 'var(--modal-shadow)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--modal-title)', marginBottom: 8 }}>
              {t.endModalTitle}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--modal-body)', lineHeight: 1.6, marginBottom: 24 }}>
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
                  padding: '9px 18px', fontSize: 13, fontWeight: 500,
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
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 18px', fontSize: 13, fontWeight: 600,
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
                  border: 'none', borderRadius: 10, color: '#ffffff',
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
