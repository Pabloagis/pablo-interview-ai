'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Message, RecruiterContext } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import Tooltip from './Tooltip';

interface EndInterviewButtonProps {
  sessionId: string;
  messages: Message[];
  context: RecruiterContext;
  onInterviewEnded: (emailSent: boolean) => void;
  onOpenInsights?: () => void;
  skipModal?: boolean;
  suppressTooltip?: boolean;
}

export default function EndInterviewButton({
  sessionId,
  messages,
  context,
  onInterviewEnded,
  onOpenInsights,
  skipModal = false,
  suppressTooltip = false,
}: EndInterviewButtonProps) {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [portalRoot, setPortalRoot] = useState<Element | null>(null);
  const [panelReady, setPanelReady] = useState(false);

  useEffect(() => { setPortalRoot(document.body); }, []);

  useEffect(() => {
    if (!modalOpen) { setPanelReady(false); return; }
    const id = requestAnimationFrame(() => setPanelReady(true));
    return () => cancelAnimationFrame(id);
  }, [modalOpen]);

  const isActive = messages.filter((m) => m.role === 'user').length >= 2;

  const handleButtonClick = () => {
    if (!isActive) return;
    if (skipModal && onOpenInsights) {
      onOpenInsights();
    } else {
      setErrorMsg(null);
      setModalOpen(true);
    }
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
      if (onOpenInsights) {
        onOpenInsights();
      } else {
        onInterviewEnded(false);
      }
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
      if (onOpenInsights) {
        onOpenInsights();
      } else {
        onInterviewEnded(true);
      }
    } catch (err) {
      console.error('[EndInterview] send-followup failed:', err);
      setErrorMsg(t.endModalError);
      setIsSending(false);
    }
  };

  const shimmerCards = [
    { label: t.endModalSectionCore,      delay: '0ms' },
    { label: t.endModalSectionInsights,  delay: '200ms' },
    { label: t.endModalSectionTakeaways, delay: '400ms' },
  ];

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
          onClick={handleButtonClick}
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

      {/* Insights preview modal — rendered via portal to escape any stacking context */}
      {modalOpen && portalRoot && createPortal(
        <>
          <style>{`
            @keyframes imRingSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes imGlowPulse { 0%,100%{opacity:0.35;transform:scale(1)} 50%{opacity:0.72;transform:scale(1.18)} }
            @keyframes imShimmer { 0%,100%{opacity:0.15} 50%{opacity:0.38} }
          `}</style>
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto"
            style={{
              background: panelReady ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              transition: 'background 250ms ease',
            }}
            onClick={closeModal}
          >
            <div
              style={{
                width: 'calc(100% - 32px)',
                maxWidth: 400,
                padding: '24px 24px 20px',
                borderRadius: 20,
                background: 'var(--bg-elevated)',
                border: '0.5px solid var(--glass-border-hi)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
                transform: panelReady ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
                opacity: panelReady ? 1 : 0,
                transition: 'transform 380ms cubic-bezier(0.16,1,0.3,1) 60ms, opacity 380ms ease 60ms',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 1. Wordmark */}
              <div style={{
                textAlign: 'center',
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 20,
              }}>
                INTERVIEWMIND
              </div>

              {/* 2. Avatar block */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginBottom: 20 }}>
                <div style={{ position: 'relative', width: 76, height: 76 }}>
                  {/* Glow */}
                  <div style={{
                    position: 'absolute',
                    inset: -12,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
                    animation: 'imGlowPulse 1800ms ease-in-out infinite',
                    animationDelay: '400ms',
                    opacity: panelReady ? 1 : 0,
                    transition: 'opacity 300ms ease 400ms',
                    pointerEvents: 'none',
                  }} />
                  {/* Spinning ring */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, var(--accent-primary) 0%, var(--accent-purple) 55%, transparent 55%)',
                    animation: 'imRingSpin 3.5s linear infinite',
                    opacity: panelReady ? 1 : 0,
                    transition: 'opacity 300ms ease 400ms',
                  }} />
                  {/* Photo inset */}
                  <div style={{
                    position: 'absolute',
                    inset: 3,
                    borderRadius: '50%',
                    background: 'var(--bg-elevated)',
                    overflow: 'hidden',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/pablo-avatar.jpg"
                      alt="Pablo Agis Burgos"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', borderRadius: '50%' }}
                    />
                  </div>
                </div>
                <div style={{
                  marginTop: 10,
                  fontSize: 16,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Pablo Agis Burgos
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>
                  SaaS · Hospitality Tech · 5 idiomas
                </div>
              </div>

              {/* 3. Preview section cards */}
              <div>
                {/* Executive Summary — Ready */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 10, marginBottom: 6,
                  background: 'var(--glass-1)',
                  border: '0.5px solid var(--glass-border)',
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: 'var(--text-muted)',
                  }}>
                    {t.endModalSectionExec}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: 'var(--accent-primary)',
                    background: 'rgba(58,85,192,0.12)',
                    border: '0.5px solid rgba(58,85,192,0.25)',
                    borderRadius: 6,
                    padding: '2px 8px',
                  }}>
                    {t.endModalReady}
                  </span>
                </div>

                {/* Shimmer cards */}
                {shimmerCards.map(({ label, delay }) => (
                  <div key={label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: 10, marginBottom: 6,
                    background: 'var(--glass-1)',
                    border: '0.5px solid var(--glass-border)',
                  }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                      textTransform: 'uppercase', color: 'var(--text-muted)',
                    }}>
                      {label}
                    </span>
                    <div style={{
                      width: 60, height: 6, borderRadius: 3,
                      background: 'var(--glass-border)',
                      animation: 'imShimmer 1.8s ease-in-out infinite',
                      animationDelay: delay,
                    }} />
                  </div>
                ))}
              </div>

              {/* 4. Confirm button */}
              <button
                onClick={handleConfirm}
                disabled={isSending}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  marginTop: 16,
                  padding: '13px',
                  fontSize: 14,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
                  border: 'none',
                  borderRadius: 12,
                  color: '#ffffff',
                  cursor: isSending ? 'not-allowed' : 'pointer',
                  opacity: isSending ? 0.65 : 1,
                  boxShadow: '0 4px 20px var(--accent-glow)',
                  fontFamily: 'inherit',
                }}
              >
                {isSending && (
                  <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {isSending ? t.endModalSending : t.endModalOpenReport}
              </button>

              {/* Error message */}
              {errorMsg && (
                <p style={{ fontSize: 12, color: '#f87171', marginTop: 10, textAlign: 'center' }}>
                  {errorMsg}
                </p>
              )}

              {/* 5. Back to conversation link */}
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <button
                  onClick={closeModal}
                  disabled={isSending}
                  style={{
                    fontSize: 12,
                    color: 'var(--text-tertiary)',
                    cursor: isSending ? 'not-allowed' : 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontFamily: 'inherit',
                    transition: 'color 150ms ease',
                    opacity: isSending ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => { if (!isSending) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; }}
                >
                  {t.endModalBackToChat}
                </button>
              </div>
            </div>
          </div>
        </>,
        portalRoot
      )}
    </>
  );
}
