'use client';

import { useState } from 'react';
import { Message, RecruiterContext } from '@/lib/types';

interface EndInterviewButtonProps {
  sessionId: string;
  messages: Message[];
  context: RecruiterContext;
  onInterviewEnded: (emailSent: boolean) => void;
}

export default function EndInterviewButton({
  sessionId,
  messages,
  context,
  onInterviewEnded,
}: EndInterviewButtonProps) {
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
      setErrorMsg('Something went wrong. Please try again.');
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Inline trigger — positioned by parent (Header) */}
      <div className="relative group flex-shrink-0">
        <button
          onClick={openModal}
          disabled={!isActive}
          className={[
            'min-h-[36px] px-2 py-1.5 sm:py-2 rounded-lg text-xs font-semibold text-white transition-all duration-200 whitespace-nowrap',
            isActive
              ? 'bg-green-500 hover:bg-green-600 shadow-sm hover:shadow-md'
              : 'bg-slate-300 opacity-60 cursor-not-allowed',
          ].join(' ')}
        >
          <span className="sm:hidden">End</span>
          <span className="hidden sm:inline">End Interview</span>
        </button>

        {/* Tooltip — desktop only (mobile has no hover), opens downward */}
        <div className="hidden sm:block absolute top-full right-0 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
          {isActive
            ? "Click here to properly finish the interview"
            : "Keep chatting — available after min. 3 questions"}
        </div>
      </div>

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
            <h2 className="text-lg font-bold text-gray-900 mb-2">End this interview?</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              {context.consentToEmail
                ? "We'll send you Pablo's CV, LinkedIn profile and conversation transcript to your email."
                : 'The interview will be closed. Thanks for chatting with Pablo.'}
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
                Cancel
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
                {isSending ? 'Sending…' : 'Yes, send everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
