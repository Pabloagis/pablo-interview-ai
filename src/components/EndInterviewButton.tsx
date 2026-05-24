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

      {/* Insights modal — portal to escape stacking context */}
      {modalOpen && portalRoot && createPortal(
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
              padding: '22px 20px 18px',
              borderRadius: 22,
              background: 'var(--bg-elevated)',
              border: '0.5px solid var(--glass-border-hi)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
              transform: panelReady ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
              opacity: panelReady ? 1 : 0,
              transition: 'transform 380ms cubic-bezier(0.16,1,0.3,1) 60ms, opacity 380ms ease 60ms',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Wordmark */}
            <div style={{
              textAlign: 'center', fontSize: 9, fontWeight: 500,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--text-muted)', marginBottom: 14,
            }}>
              INTERVIEWMIND
            </div>

            {/* ── Scaled page preview ─────────────────────────────── */}
            <div style={{
              borderRadius: 14,
              border: '0.5px solid var(--glass-border)',
              background: 'var(--glass-1)',
              height: 210,
              overflow: 'hidden',
              position: 'relative',
              marginBottom: 14,
            }}>
              {/* Content rendered at 660px then scaled to fit */}
              <div style={{
                position: 'absolute',
                top: 12,
                left: '50%',
                transform: 'translateX(-50%) scale(0.5)',
                transformOrigin: 'top center',
                width: 660,
                pointerEvents: 'none',
                padding: '0 16px',
              }}>
                {/* 2×2 action cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  {[
                    <svg key="cal" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
                    <svg key="dl" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
                    <svg key="li" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12" rx="0.5"/><circle cx="4" cy="4" r="2"/></svg>,
                    <svg key="ref" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
                  ].map((icon, i) => (
                    <div key={i} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      padding: '16px 12px', borderRadius: 14,
                      background: 'var(--glass-1)', border: '0.5px solid var(--glass-border)',
                      color: 'var(--accent-primary)',
                    }}>
                      {icon}
                      <div style={{ width: 54, height: 7, borderRadius: 3, background: 'var(--glass-border)' }} />
                    </div>
                  ))}
                </div>

                {/* Section accordion headers */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 16px', borderRadius: 12, marginBottom: 6,
                    background: 'var(--glass-1)', border: '0.5px solid var(--glass-border)',
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--glass-border)',
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div style={{ flex: 1, height: 7, borderRadius: 3, background: 'var(--glass-border)' }} />
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                ))}
              </div>

              {/* Bottom fade */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
                background: 'linear-gradient(to bottom, transparent, var(--glass-1))',
                pointerEvents: 'none',
              }} />
            </div>

            {/* CTA */}
            <button
              onClick={handleConfirm}
              disabled={isSending}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '13px',
                fontSize: 14, fontWeight: 600,
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
                border: 'none', borderRadius: 12,
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

            {errorMsg && (
              <p style={{ fontSize: 12, color: '#f87171', marginTop: 10, textAlign: 'center' }}>
                {errorMsg}
              </p>
            )}

            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button
                onClick={closeModal}
                disabled={isSending}
                style={{
                  fontSize: 12, color: 'var(--text-tertiary)',
                  cursor: isSending ? 'not-allowed' : 'pointer',
                  background: 'none', border: 'none', padding: 0,
                  fontFamily: 'inherit', opacity: isSending ? 0.5 : 1,
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => { if (!isSending) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; }}
              >
                {t.endModalBackToChat}
              </button>
            </div>
          </div>
        </div>,
        portalRoot
      )}
    </>
  );
}
