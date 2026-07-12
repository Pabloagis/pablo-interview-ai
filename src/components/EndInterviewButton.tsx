'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Message, RecruiterContext } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import { isValidEmail } from '@/lib/utils';
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
  const [previewSlide, setPreviewSlide] = useState(0);
  const [emailInput, setEmailInput] = useState('');
  const [gdprChecked, setGdprChecked] = useState(false);

  useEffect(() => { setPortalRoot(document.body); }, []);

  useEffect(() => {
    if (!modalOpen) { setPanelReady(false); return; }
    const id = requestAnimationFrame(() => setPanelReady(true));
    return () => cancelAnimationFrame(id);
  }, [modalOpen]);

  // Cycle slides 0 → 1 → 2 → 0 …
  useEffect(() => {
    if (!modalOpen) { setPreviewSlide(0); return; }
    const id = setInterval(() => setPreviewSlide(s => (s + 1) % 3), 2800);
    return () => clearInterval(id);
  }, [modalOpen]);


  const isActive = messages.filter((m) => m.role === 'user').length >= 2;
  const canSend = isValidEmail(emailInput) && gdprChecked && !isSending;

  const handleButtonClick = () => {
    if (!isActive) return;
    if (skipModal && onOpenInsights) {
      onOpenInsights();
    } else {
      setErrorMsg(null);
      setEmailInput('');
      setGdprChecked(false);
      setModalOpen(true);
    }
  };

  const closeModal = () => {
    if (isSending) return;
    setModalOpen(false);
    setErrorMsg(null);
    setEmailInput('');
    setGdprChecked(false);
  };

  const handleConfirm = async () => {
    if (isSending) return;
    setErrorMsg(null);
    setIsSending(true);
    try {
      const res = await fetch('/api/send-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, email: emailInput, consentToEmail: true }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (!(data as { skipped?: boolean }).skipped) {
          throw new Error((data as { error?: string }).error || 'Request failed');
        }
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

  const handleSkip = () => {
    setModalOpen(false);
    if (onOpenInsights) {
      onOpenInsights();
    } else {
      onInterviewEnded(false);
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
          className={`flex items-center justify-center gap-[6px] shrink-0 w-10 h-10 p-0 rounded-xl sm:w-auto sm:h-auto sm:px-[14px] sm:py-[6px] sm:rounded-full${isActive ? ' btn-primary-cta' : ''}`}
          style={isActive ? {
            cursor: 'pointer',
            fontFamily: 'inherit',
          } : {
            background: 'linear-gradient(135deg, rgba(75,111,255,0.14), rgba(160,64,240,0.14))',
            border: '0.5px solid rgba(100,100,220,0.22)',
            color: 'var(--text-secondary)',
            cursor: 'not-allowed',
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
              maxWidth: 390,
              padding: '14px 14px 14px',
              borderRadius: 26,
              background: 'var(--bg-elevated)',
              border: '0.5px solid var(--glass-border-hi)',
              boxShadow: '0 32px 100px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
              transform: panelReady ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
              opacity: panelReady ? 1 : 0,
              transition: 'transform 380ms cubic-bezier(0.16,1,0.3,1) 60ms, opacity 380ms ease 60ms',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Follow-up offer ── */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 4 }}>
                {t.closingModalTitle}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
                {t.closingModalSubtitle}
              </p>

              {/* Bullets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                {(['My CV (PDF)', 'LinkedIn profile', 'This conversation transcript'] as const).map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Email input */}
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={t.closingModalEmailPlaceholder}
                className="input-glass w-full"
                style={{ fontSize: 13, marginBottom: 8 }}
                autoComplete="email"
                disabled={isSending}
              />

              {/* GDPR checkbox */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={gdprChecked}
                  onChange={(e) => setGdprChecked(e.target.checked)}
                  disabled={isSending}
                  style={{ marginTop: 2, accentColor: 'var(--accent-primary)', flexShrink: 0 }}
                />
                <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {t.closingModalGdprText}
                </span>
              </label>
            </div>

            {/* CTA */}
            <button
              onClick={handleConfirm}
              disabled={!canSend}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '13px',
                fontSize: 14, fontWeight: 600,
                borderRadius: 13,
                cursor: canSend ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                marginBottom: 12,
                background: canSend
                  ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))'
                  : 'var(--btn-disabled-bg)',
                color: canSend ? '#fff' : 'var(--btn-disabled-color)',
                border: canSend ? 'none' : '0.5px solid var(--btn-disabled-border)',
                boxShadow: canSend ? '0 4px 20px var(--accent-glow)' : 'none',
                transition: 'all 200ms ease',
              }}
            >
              {isSending && (
                <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isSending ? t.endModalSending : t.closingModalConfirm}
            </button>

            {/* ── 3-part preview ────────────────────────────────── */}
            <div style={{
              borderRadius: 18, height: 220, overflow: 'hidden',
              position: 'relative', background: 'var(--bg-base)',
              border: '0.5px solid var(--glass-border)', marginBottom: 0,
            }}>

              {/* ── Slide 0: Header ── */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '16px 20px', gap: 8,
                opacity: previewSlide === 0 ? 1 : 0,
                transform: previewSlide === 0 ? 'translateY(0)' : previewSlide < 1 ? 'translateY(-10px)' : 'translateY(10px)',
                transition: 'opacity 380ms ease, transform 380ms ease',
                pointerEvents: 'none',
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 999,
                  background: 'rgba(58,85,192,0.09)', border: '0.5px solid rgba(58,85,192,0.24)',
                  fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: 'var(--accent-primary)',
                }}>
                  <svg width="6" height="6" viewBox="0 0 8 8" fill="var(--accent-primary)"><path d="M4 0l.97 2.93H8L5.52 4.74l.97 2.93L4 5.96l-2.49 1.71.97-2.93L0 2.93h3.03z"/></svg>
                  Insights Report
                </span>
                <div style={{ width: 52, height: 52, borderRadius: '50%', position: 'relative' }}>
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, rgba(60,90,200,0.7), rgba(100,60,180,0.5), rgba(40,130,160,0.55), rgba(60,90,200,0.7))',
                    animation: 'ring-spin 3.5s linear infinite',
                  }} />
                  <div style={{ position: 'absolute', inset: 2.5, borderRadius: '50%', background: 'var(--bg-base)', overflow: 'hidden' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/pablo-avatar.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }} />
                  </div>
                </div>
                <div style={{
                  fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em',
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>Pablo Agis Burgos</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>SaaS · Hospitality Tech · 5 idiomas</div>
              </div>

              {/* ── Slide 1: Action links ── */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                padding: '14px 16px',
                opacity: previewSlide === 1 ? 1 : 0,
                transform: previewSlide === 1 ? 'translateY(0)' : previewSlide < 1 ? 'translateY(-10px)' : 'translateY(10px)',
                transition: 'opacity 380ms ease, transform 380ms ease',
                pointerEvents: 'none',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 7 }}>
                  {([
                    { label: t.bookCallLabel ?? 'Book a call', grad: true,
                      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                    { label: t.downloadCvLabel ?? 'Download CV', grad: false,
                      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> },
                    { label: 'LinkedIn', grad: false,
                      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12" rx="0.5"/><circle cx="4" cy="4" r="2"/></svg> },
                  ] as Array<{ label: string; grad: boolean; icon: React.ReactNode }>).map(({ label, grad, icon }) => (
                    <div key={label} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 9,
                      background: grad ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))' : 'var(--glass-1)',
                      border: grad ? 'none' : '0.5px solid var(--glass-border)',
                      color: grad ? '#fff' : 'var(--accent-primary)',
                    }}>
                      {icon}
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: grad ? '#fff' : 'var(--text-primary)', flex: 1 }}>{label}</span>
                      <span style={{ fontSize: 11, opacity: 0.5 }}>→</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Slide 2: Report sections ── */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                padding: '10px 14px', gap: 5,
                pointerEvents: 'none',
              }}>
                {[
                  { num: '01', label: t.endModalSectionExec,      accent: 'var(--accent-primary)',     snippet: 'Opera PMS · Salesforce · SaaS · 5 idiomas' },
                  { num: '02', label: t.endModalSectionCore,       accent: 'rgba(96,48,180,0.9)',        snippet: 'HubOS · Accor · Soho House · London' },
                  { num: '03', label: t.endModalSectionInsights,   accent: 'rgba(64,120,220,0.85)',      snippet: 'Comunicación · Adaptabilidad · Tech mindset' },
                  { num: '04', label: t.endModalSectionTakeaways,  accent: 'rgba(130,70,200,0.85)',      snippet: 'Customer Success · Implementation · Intl. roles' },
                ].map(({ num, label, accent, snippet }, i) => (
                  <div key={num} style={{
                    borderRadius: 9, overflow: 'hidden',
                    background: 'var(--glass-1)',
                    border: '0.5px solid var(--glass-border-hi)',
                    opacity: previewSlide === 2 ? 1 : 0,
                    transform: previewSlide === 2 ? 'translateY(0)' : 'translateY(8px)',
                    transition: previewSlide === 2
                      ? `opacity 260ms ease ${60 + i * 65}ms, transform 260ms ease ${60 + i * 65}ms`
                      : 'opacity 140ms ease, transform 140ms ease',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 11px' }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: accent, fontSize: 7.5, fontWeight: 800, color: '#fff',
                      }}>{num}</div>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                        textTransform: 'uppercase', flex: 1, color: 'var(--text-primary)',
                      }}>{label}</span>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                        strokeLinecap="round" strokeLinejoin="round"
                        style={{ color: 'var(--text-muted)', transform: 'rotate(180deg)', flexShrink: 0 }}>
                        <path d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                    <div style={{ height: '0.5px', background: 'var(--glass-border)', margin: '0 11px' }} />
                    <p style={{ margin: 0, padding: '4px 11px 6px', fontSize: 9.5, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                      {snippet}
                    </p>
                  </div>
                ))}
              </div>

              {/* Slide indicator dots */}
              <div style={{
                position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: 5, pointerEvents: 'none',
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: i === previewSlide ? 16 : 5, height: 5, borderRadius: 3,
                    background: i === previewSlide ? 'var(--accent-primary)' : 'var(--glass-border)',
                    transition: 'width 300ms cubic-bezier(0.25,1,0.5,1), background 300ms ease',
                  }} />
                ))}
              </div>
            </div>

            {errorMsg && (
              <p style={{ fontSize: 12, color: '#f87171', marginTop: 8, textAlign: 'center' }}>
                {errorMsg}
              </p>
            )}

            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button
                onClick={handleSkip}
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
                {t.closingModalDismiss}
              </button>
            </div>
          </div>
        </div>,
        portalRoot
      )}
    </>
  );
}
