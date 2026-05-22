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

  return (
    <>
      {/* Inline trigger — positioned by parent (Header) */}
      <Tooltip
        text={isActive ? t.endTooltipActive : t.endTooltipInactive}
        position="bottom"
        align="right"
        disabled={suppressTooltip}
        className="hidden sm:block flex-shrink-0"
      >
        <button
          onClick={openModal}
          disabled={!isActive}
          className={[
            'min-h-[36px] px-3 py-1.5 sm:py-2 rounded-lg text-xs font-bold text-white transition-all duration-200 whitespace-nowrap',
            isActive
              ? 'bg-gradient-to-r from-[#059669] to-[#15803d] shadow-lg shadow-emerald-700/30 hover:shadow-xl hover:shadow-emerald-700/40 hover:scale-[1.01] active:scale-[0.99]'
              : 'bg-[#4d8f6e] opacity-80 cursor-not-allowed',
          ].join(' ')}
        >
          Insights
        </button>
      </Tooltip>

      {/* Mobile: icon-only button, no tooltip (touch devices don't hover) */}
      <button
        onClick={openModal}
        disabled={!isActive}
        aria-label={isActive ? t.endTooltipActive : t.endTooltipInactive}
        className={[
          'sm:hidden min-h-[36px] w-9 rounded-lg flex items-center justify-center transition-all duration-200',
          isActive
            ? 'bg-gradient-to-r from-[#059669] to-[#15803d] shadow-lg shadow-emerald-700/30 active:scale-[0.99]'
            : 'bg-[#4d8f6e] opacity-80 cursor-not-allowed',
        ].join(' ')}
      >
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m1.343-5.657-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </button>

      {/* Confirmation modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900 mb-2">{t.endModalTitle}</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              {context.consentToEmail ? t.endModalWithConsent : t.endModalWithoutConsent}
            </p>

            {errorMsg && (
              <p className="text-sm text-red-500 mb-4">{errorMsg}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeModal}
                disabled={isSending}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                {t.endModalCancel}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-75"
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
