'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';

const TOTAL_STEPS = 5;
const AUTO_ADVANCE_MS = 5000;

interface Props {
  onClose: () => void;
}

// ── Scene sub-components ──────────────────────────────────────────────────────

function FormScene() {
  const { t } = useLanguage();
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '36px 22px 18px',
    }}>
      <div style={{
        width: '100%', maxWidth: 268,
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: 14, padding: '15px 13px',
      }}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: 'rgba(160,180,255,0.45)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t.labelName}
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(100,130,255,0.35)',
            borderRadius: 8, padding: '7px 10px', fontSize: 12,
            color: 'rgba(220,230,255,0.9)', display: 'flex', alignItems: 'center', gap: 2,
          }}>
            Alex
            <span style={{
              display: 'inline-block', width: 1.5, height: 13,
              background: 'rgba(100,140,255,0.9)',
              animation: 'hiwCursor 1s ease infinite',
            }} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: 'rgba(160,180,255,0.45)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t.labelEmail}
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.09)',
            borderRadius: 8, padding: '7px 10px', fontSize: 12, color: 'rgba(180,200,255,0.45)',
          }}>
            alex@company.com
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(64,96,208,0.9), rgba(96,48,180,0.9))',
          borderRadius: 9, padding: '8px',
          textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: '#fff', letterSpacing: '0.3px',
        }}>
          {t.buttonStart} →
        </div>
      </div>
    </div>
  );
}

function QuestionsScene() {
  const { t } = useLanguage();
  const questions = [t.q1, t.q2, t.q3];
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '34px 18px 14px', gap: 7,
    }}>
      <div style={{ fontSize: 9.5, color: 'rgba(160,180,255,0.45)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {t.tryAsking}…
      </div>
      {questions.map((q, i) => (
        <div key={i} style={{
          background: i === 0 ? 'rgba(64,96,208,0.22)' : 'rgba(255,255,255,0.04)',
          border: `0.5px solid ${i === 0 ? 'rgba(100,140,255,0.45)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 10, padding: '9px 12px',
          fontSize: 11.5, color: i === 0 ? 'rgba(180,205,255,0.95)' : 'rgba(160,180,255,0.5)',
          animation: i === 0 ? 'hiwGlow 2.4s ease infinite' : undefined,
        }}>
          {q}
        </div>
      ))}
    </div>
  );
}

function ConversationScene({ typeText, typewriterFull }: { typeText: string; typewriterFull: string }) {
  const { t } = useLanguage();
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '34px 14px 12px', gap: 10,
    }}>
      {/* User message */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(64,96,208,0.88), rgba(96,48,180,0.88))',
          borderRadius: '11px 11px 4px 11px', padding: '8px 11px',
          fontSize: 11.5, color: 'rgba(255,255,255,0.95)', maxWidth: '78%',
        }}>
          {t.q1}
        </div>
      </div>

      {/* AI response */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(64,96,208,0.9), rgba(96,48,180,0.9))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, color: '#fff', fontWeight: 700,
        }}>
          PA
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          border: '0.5px solid rgba(255,255,255,0.1)',
          borderRadius: '4px 11px 11px 11px', padding: '8px 11px',
          fontSize: 11.5, color: 'rgba(220,230,255,0.9)', maxWidth: '84%', lineHeight: 1.5,
          minHeight: 38,
        }}>
          {typeText || ' '}
          {typeText.length < typewriterFull.length && typeText.length > 0 && (
            <span style={{
              display: 'inline-block', width: 1.5, height: 11,
              background: 'rgba(100,140,255,0.9)',
              animation: 'hiwCursor 0.8s ease infinite',
              marginLeft: 2, verticalAlign: 'middle',
            }} />
          )}
        </div>
      </div>
    </div>
  );
}

function ReportScene() {
  const { t } = useLanguage();
  const sections = [t.hiwKeyStrengths, t.hiwCultureFit, t.hiwConvHighlights];
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '34px 18px 14px',
    }}>
      <div style={{
        width: '100%', maxWidth: 272,
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: 14, padding: '12px',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(155,185,255,0.8)', marginBottom: 9, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
          {t.hiwInsightsReport}
        </div>
        {sections.map((s, i) => (
          <div key={s} style={{
            background: i === 0 ? 'rgba(64,96,208,0.18)' : 'rgba(255,255,255,0.04)',
            border: `0.5px solid ${i === 0 ? 'rgba(100,140,255,0.4)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 8, padding: '7px 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 5, fontSize: 11,
            color: i === 0 ? 'rgba(200,220,255,0.95)' : 'rgba(160,180,255,0.5)',
          }}>
            <span>{s}</span>
            <span style={{ fontSize: 9, opacity: 0.7 }}>{i === 0 ? '▼' : '▶'}</span>
          </div>
        ))}
        <div style={{ marginTop: 8, display: 'flex', gap: 5 }}>
          {[t.hiwBookCall, t.hiwDownloadCV].map((label) => (
            <div key={label} style={{
              flex: 1, background: 'rgba(64,96,208,0.15)',
              border: '0.5px solid rgba(64,96,208,0.28)',
              borderRadius: 7, padding: '5px 4px',
              textAlign: 'center', fontSize: 9.5, fontWeight: 600,
              color: 'rgba(155,185,255,0.85)',
            }}>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InsightsScene() {
  const { t } = useLanguage();
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '34px 18px 14px',
    }}>
      <div style={{
        width: '100%', maxWidth: 272,
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: 14, padding: '15px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(74,222,128,0.18)', border: '0.5px solid rgba(74,222,128,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(74,222,128,0.9)" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(230,240,255,0.95)' }}>{t.allDoneTitle}</div>
            <div style={{ fontSize: 10, color: 'rgba(160,180,255,0.5)' }}>{t.hiwInsightsOnWay}</div>
          </div>
        </div>

        <div style={{
          fontSize: 11, color: 'rgba(160,180,255,0.55)', marginBottom: 12,
          paddingBottom: 12, borderBottom: '0.5px solid rgba(255,255,255,0.07)',
        }}>
          {t.hiwSentTo} <span style={{ color: 'rgba(130,160,255,0.85)' }}>alex@company.com</span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {[t.hiwCVAttached, t.hiwTranscriptLabel].map((label) => (
            <div key={label} style={{
              flex: 1, background: 'rgba(64,96,208,0.15)',
              border: '0.5px solid rgba(64,96,208,0.28)',
              borderRadius: 8, padding: '6px 4px',
              textAlign: 'center', fontSize: 10, fontWeight: 600,
              color: 'rgba(155,185,255,0.85)',
            }}>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function HowItWorksModal({ onClose }: Props) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [sceneVisible, setSceneVisible] = useState(true);
  const [typeText, setTypeText] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const typewriterFull = t.hiwTypewriterText;

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Typewriter on step 2
  useEffect(() => {
    if (step !== 2) { setTypeText(''); return; }
    let i = 0;
    setTypeText('');
    const tick = () => {
      i++;
      setTypeText(typewriterFull.slice(0, i));
      if (i < typewriterFull.length) {
        timerRef.current = setTimeout(tick, 22);
      }
    };
    timerRef.current = setTimeout(tick, 700);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [step, typewriterFull]);

  const close = useCallback(() => {
    setMounted(false);
    setTimeout(onClose, 380);
  }, [onClose]);

  const goTo = useCallback((newStep: number) => {
    setSceneVisible(false);
    setTimeout(() => { setStep(newStep); setSceneVisible(true); }, 190);
  }, []);

  const prev = () => { if (step > 0) goTo(step - 1); };
  const next = () => { if (step < TOTAL_STEPS - 1) goTo(step + 1); else close(); };

  // Auto-advance every AUTO_ADVANCE_MS, reset on manual navigation
  useEffect(() => {
    const id = setTimeout(() => next(), AUTO_ADVANCE_MS);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const titles = [t.hiwStep1Title, t.hiwStep2Title, t.hiwStep3Title, t.hiwStep4Title, t.hiwStep5Title];
  const descs  = [t.hiwStep1Desc,  t.hiwStep2Desc,  t.hiwStep3Desc,  t.hiwStep4Desc,  t.hiwStep5Desc];

  return (
    <>
      <style>{`
        @keyframes hiwCursor { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes hiwGlow { 0%,100%{box-shadow:0 0 0 0 rgba(64,96,208,0.35)} 50%{box-shadow:0 0 0 5px rgba(64,96,208,0)} }
      `}</style>

      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-y-auto"
        style={{
          background: mounted ? 'rgba(0,0,0,0.86)' : 'rgba(0,0,0,0)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          transition: 'background 400ms ease',
        }}
        onClick={close}
      >
        <div
          className="relative w-full max-w-[360px] my-auto"
          style={{
            transform: mounted ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.95)',
            opacity: mounted ? 1 : 0,
            transition: 'transform 430ms cubic-bezier(.25,1,.5,1), opacity 380ms ease',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={close}
            aria-label="Close"
            style={{
              position: 'absolute', top: 12, right: 12, zIndex: 2,
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)', border: 'none',
              color: 'rgba(255,255,255,0.8)', fontSize: 18, lineHeight: 1,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>

          {/* Card */}
          <div style={{
            background: 'var(--modal-bg)',
            border: '0.5px solid var(--modal-border)',
            borderRadius: 22,
            boxShadow: 'var(--modal-shadow)',
            overflow: 'hidden',
          }}>

            {/* Scene */}
            <div style={{
              height: 210,
              background: 'linear-gradient(155deg, #0c1030 0%, #180a38 100%)',
              position: 'relative',
              overflow: 'hidden',
              opacity: sceneVisible ? 1 : 0,
              transition: 'opacity 190ms ease',
            }}>
              {/* Ambient glow */}
              <div style={{
                position: 'absolute', width: 200, height: 200, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(64,96,208,0.22) 0%, transparent 70%)',
                filter: 'blur(50px)', top: -40, left: '50%', transform: 'translateX(-50%)',
                pointerEvents: 'none',
              }} />

              {step === 0 && <FormScene />}
              {step === 1 && <QuestionsScene />}
              {step === 2 && <ConversationScene typeText={typeText} typewriterFull={typewriterFull} />}
              {step === 3 && <InsightsScene />}
              {step === 4 && <ReportScene />}

              {/* Step badge */}
              <div style={{
                position: 'absolute', top: 13, left: 13,
                padding: '3px 10px', borderRadius: 999,
                background: 'rgba(64,96,208,0.22)',
                border: '0.5px solid rgba(64,96,208,0.38)',
                fontSize: 9.5, fontWeight: 700, color: 'rgba(155,185,255,0.9)',
                letterSpacing: '0.5px', textTransform: 'uppercase',
              }}>
                {t.hiwStep} {step + 1}
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '18px 22px 22px' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--modal-title)', marginBottom: 6 }}>
                {titles[step]}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--modal-body)', lineHeight: 1.6, marginBottom: 18 }}>
                {descs[step]}
              </p>

              {/* Progress + nav */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Dots */}
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      aria-label={`Go to step ${i + 1}`}
                      style={{
                        width: i === step ? 18 : 6,
                        height: 6, borderRadius: 3, border: 'none', padding: 0, cursor: 'pointer',
                        background: i === step ? 'var(--accent-primary)' : 'var(--glass-border)',
                        transition: 'width 260ms cubic-bezier(.25,1,.5,1), background 260ms ease',
                      }}
                    />
                  ))}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {step > 0 && (
                    <button
                      onClick={prev}
                      className="theme-modal-cancel"
                      style={{ padding: '8px 14px', fontSize: 13, fontWeight: 500, borderRadius: 10, cursor: 'pointer' }}
                    >
                      ←
                    </button>
                  )}
                  <button
                    onClick={next}
                    style={{
                      padding: '8px 20px', fontSize: 13, fontWeight: 600, borderRadius: 10,
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
                      border: 'none', color: '#fff', cursor: 'pointer',
                      boxShadow: '0 3px 12px rgba(64,96,208,0.35)',
                    }}
                  >
                    {step === TOTAL_STEPS - 1 ? t.hiwStep5Cta : t.hiwNext}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
