'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggleButton from './ThemeToggleButton';
import HowItWorksModal from './HowItWorksModal';
import WhatItIsModal from './WhatItIsModal';
import Footer from './Footer';
import Background from './Background';

type ResumeState = {
  sessionId: string;
  recruiterName?: string;
  company?: string;
  messageCount: number;
} | null;

export default function IntakeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isLoading,     setIsLoading]     = useState(false);
  const [isResuming,    setIsResuming]    = useState(false);
  const [error,         setError]         = useState('');
  const [resumeSession, setResumeSession] = useState<ResumeState>(null);
  const [avatarOpen,    setAvatarOpen]    = useState(false);
  const [splashDone,    setSplashDone]    = useState(false);
  const [pageReady,     setPageReady]     = useState(false);
  const [whatItIsOpen,  setWhatItIsOpen]  = useState(false);
  const [hiwOpen,       setHiwOpen]       = useState(false);
  const welcomeAvRef = useRef<HTMLButtonElement>(null);

  // Splash refs
  const splashOverlayRef = useRef<HTMLDivElement>(null);
  const splashWmRef      = useRef<HTMLParagraphElement>(null);
  const splashVisionRef  = useRef<HTMLDivElement>(null);
  const splashRanRef     = useRef(false);

  // ── Skip before first paint for returning visitors ──
  useLayoutEffect(() => {
    if (sessionStorage.getItem('im_splash_shown')) { setSplashDone(true); setPageReady(true); }
  }, []);

  // ── Splash ──
  useEffect(() => {
    if (splashRanRef.current) return;
    splashRanRef.current = true;
    if (sessionStorage.getItem('im_splash_shown')) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const rafs:   number[] = [];
    const tick  = (fn: FrameRequestCallback) => { const id = requestAnimationFrame(fn); rafs.push(id); return id; };
    const after = (fn: () => void, ms: number) => { const id = setTimeout(fn, ms); timers.push(id); };
    const eO  = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    const eIO = (t: number) => t < 0.5 ? 8*t*t*t*t : 1 - Math.pow(-2*t+2, 4)/2;

    function animate(fn: (p: number) => void, duration: number, delay: number, easing: (t: number) => number, onDone?: () => void) {
      after(() => {
        const start = performance.now();
        const frame = (now: number) => {
          const raw = Math.min((now - start) / duration, 1);
          fn(easing(raw));
          if (raw < 1) tick(frame);
          else if (onDone) onDone();
        };
        tick(frame);
      }, delay);
    }

    const wm     = splashWmRef.current;
    const vision = splashVisionRef.current;
    if (!wm) return;

    const dayMode  = document.documentElement.getAttribute('data-theme') === 'day';
    const glowRgb  = dayMode ? '58,85,192' : '100,130,255';

    animate(p => {
      wm.style.opacity   = p.toFixed(4);
      wm.style.transform = `scale(${(0.96 + 0.04 * p).toFixed(4)})`;
    }, 800, 0, eO, () => { wm.style.transform = ''; });

    if (vision) {
      animate(p => { vision.style.opacity = p.toFixed(4); }, 600, 500, eO);
      animate(p => { vision.style.opacity = (1 - p).toFixed(4); }, 400, 3700, eIO);
    }

    after(() => {
      animate(p => {
        wm.style.textShadow = `0 0 ${(22 * p).toFixed(1)}px rgba(${glowRgb},${(0.5 * p).toFixed(3)})`;
      }, 600, 0, eO);
    }, 2700);

    after(() => {
      animate(p => { wm.style.opacity = (1 - p).toFixed(4); }, 400, 0, eO, () => {
        wm.style.textShadow = '';
        setPageReady(true);
        setSplashDone(true);
        sessionStorage.setItem('im_splash_shown', '1');
      });
    }, 4200);

    return () => { timers.forEach(clearTimeout); rafs.forEach(cancelAnimationFrame); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Check for unfinished session ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem('im_last_session');
      if (!raw) return;
      const data = JSON.parse(raw) as { sessionId:string; recruiterName?:string; company?:string; ended?:boolean; };
      if (data.ended) return;
      const msgsRaw = localStorage.getItem(`im_chat_${data.sessionId}`);
      const msgs: unknown[] = msgsRaw ? JSON.parse(msgsRaw) : [];
      if (Array.isArray(msgs) && msgs.length > 0) {
        setResumeSession({ sessionId:data.sessionId, recruiterName:data.recruiterName, company:data.company, messageCount:msgs.length });
      }
    } catch { localStorage.removeItem('im_last_session'); }
  }, []);

  const handleResume = () => {
    try {
      const raw = localStorage.getItem('im_last_session');
      if (!raw) return;
      const data = JSON.parse(raw) as { sessionId:string; recruiterName?:string; email?:string; company?:string; role?:string; consentToEmail?:boolean; };
      sessionStorage.setItem(`session_${data.sessionId}`, JSON.stringify({ recruiterName:data.recruiterName, email:data.email, company:data.company, role:data.role, consentToEmail:data.consentToEmail }));
      setIsResuming(true);
      router.push(`/interview/${data.sessionId}`);
    } catch { setResumeSession(null); }
  };

  const handleDismissResume = () => {
    try {
      const raw = localStorage.getItem('im_last_session');
      if (raw) { const data = JSON.parse(raw) as { sessionId:string }; localStorage.removeItem(`im_chat_${data.sessionId}`); }
    } catch {}
    localStorage.removeItem('im_last_session');
    setResumeSession(null);
  };

  const handleStart = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError((data as { error?: string }).error || 'Something went wrong. Please try again.');
        setIsLoading(false);
        return;
      }
      const { sessionId } = await response.json();
      sessionStorage.setItem(`session_${sessionId}`, JSON.stringify({}));
      localStorage.setItem('im_last_session', JSON.stringify({ sessionId }));
      router.push(`/interview/${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  // Page assembly — per-element directional entrance
  const emerge = (
    delay: number,
    from: { tx?: number; ty?: number; sc?: number; blur?: number; maxOp?: number; dur?: number } = {},
    extra?: React.CSSProperties
  ): React.CSSProperties => {
    const { tx = 0, ty = 0, sc = 1, blur = 6, maxOp = 1, dur = 560 } = from;
    const parts: string[] = [];
    if (tx !== 0) parts.push(`translateX(${tx}px)`);
    if (ty !== 0) parts.push(`translateY(${ty}px)`);
    if (sc !== 1) parts.push(`scale(${sc})`);
    const notReady = parts.length ? parts.join(' ') : 'none';
    return {
      opacity: pageReady ? maxOp : 0,
      transform: pageReady ? 'none' : notReady,
      filter: pageReady ? 'none' : `blur(${blur}px)`,
      transition: `opacity ${dur}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform ${dur}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, filter ${dur}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      ...extra,
    };
  };


  return (
    <>
      <Background />

      {/* ── Main page content ── */}
      <div
        className="relative min-h-screen flex flex-col items-center px-4 py-10 w-full max-w-full overflow-x-hidden"
        style={{
          opacity: pageReady ? 1 : 0,
          transform: pageReady ? 'none' : 'translateY(36px) scale(0.97)',
          filter: pageReady ? 'none' : 'blur(6px)',
          transition: 'opacity 700ms cubic-bezier(0.16,1,0.3,1) 280ms, transform 700ms cubic-bezier(0.16,1,0.3,1) 280ms, filter 700ms cubic-bezier(0.16,1,0.3,1) 280ms',
          contain: 'layout',
        }}
      >
        {/* Top-right controls */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5" style={emerge(0, { ty: -20, blur: 5, dur: 500 })}>
          <ThemeToggleButton />
          <LanguageSwitcher />
        </div>

        {/* Resume session banner */}
        {resumeSession && (
          <div className="w-full max-w-[440px] sm:max-w-[600px] mb-4 mt-2" style={emerge(0)}>
            <div className="glass rounded-xl px-4 py-3 flex items-start sm:items-center justify-between gap-3 border-[rgba(60,90,200,0.3)]">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t.resumeBannerPrefix}
                {resumeSession.recruiterName && <span className="font-medium"> {t.resumeBannerWith} {resumeSession.recruiterName}</span>}
                {resumeSession.company && <span style={{ color:'var(--text-tertiary)' }}> ({resumeSession.company})</span>}
                <span className="text-xs ml-1" style={{ color:'var(--text-muted)' }}>
                  · {resumeSession.messageCount} {resumeSession.messageCount !== 1 ? t.resumeBannerMsgs : t.resumeBannerMsg}
                </span>
              </p>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={handleResume} disabled={isResuming}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                  style={{ background:'var(--chip-hover-bg)', color:'var(--chip-hover-text)', border:'0.5px solid var(--chip-hover-border)', opacity: isResuming ? 0.7 : 1 }}>
                  {isResuming && (
                    <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  )}
                  {t.resumeBtn}
                </button>
                <button type="button" onClick={handleDismissResume}
                  className="text-xs px-2 py-1.5 transition-colors"
                  style={{ color:'var(--text-muted)' }}>
                  {t.dismissBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-w-[440px] sm:max-w-[600px]">

          {/* ── Hero header ── */}
          <div className="flex flex-col items-center gap-3 mb-7 text-center">
            <button ref={welcomeAvRef} type="button" onClick={() => setAvatarOpen(true)}
              className="relative cursor-zoom-in"
              style={{ width: 112, height: 112, ...emerge(0, { sc: 0.97, blur: 3, dur: 500 }) }}>
              <div className="absolute inset-0 rounded-full" style={{
                background: 'conic-gradient(from 0deg, rgba(60,90,200,0.7), rgba(100,60,180,0.5), rgba(40,130,160,0.55), rgba(60,90,200,0.7))',
                animation: 'ring-spin 3.5s linear infinite',
                padding: 2,
              }}>
                <div className="w-full h-full rounded-full" style={{ background:'var(--bg-base)' }} />
              </div>
              <div className="absolute rounded-full overflow-hidden" style={{ inset: 3 }}>
                <img src="/assets/pablo-avatar.jpg" alt="Pablo Agis" className="w-full h-full object-cover" style={{ objectPosition: 'center 15%' }} />
              </div>
            </button>
            <h1 className="gradient-text" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', ...emerge(140, { tx: -24, blur: 8, dur: 550 }) }}>
              {t.emptyGreeting}
            </h1>
            <p style={{ fontSize: 12, color:'var(--splash-status)', letterSpacing:'0.04em', lineHeight:1.5, ...emerge(220, { ty: 14, blur: 5, dur: 500 }) }}>
              {t.intakeSubtitle}
            </p>
          </div>

          {/* ── What it is trigger ── */}
          <div className="mb-3" style={emerge(300, { ty: 24, blur: 8, dur: 580 })}>
            <button
              type="button"
              onClick={() => setWhatItIsOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '11px 14px 11px 16px',
                background: 'var(--modal-bg)',
                border: '0.5px solid var(--modal-border)',
                borderRadius: 22,
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="var(--accent-primary)" strokeWidth={1.8}
                strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0, opacity: 0.75 }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--modal-title)', letterSpacing: '0.01em' }}>
                {t.whatItIsLabel}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="var(--text-tertiary)" strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* ── How it works trigger ── */}
          <div className="mb-5" style={emerge(380, { ty: 24, blur: 8, dur: 580 })}>
            <button
              type="button"
              onClick={() => setHiwOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '11px 14px 11px 16px',
                background: 'var(--modal-bg)',
                border: '0.5px solid var(--modal-border)',
                borderRadius: 22,
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="var(--accent-primary)" strokeWidth={1.8}
                strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0, opacity: 0.75 }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--modal-title)', letterSpacing: '0.01em' }}>
                {t.howItWorksTitle}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="var(--text-tertiary)" strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* ── Divider ── */}
          <div style={{ height:0.5, background:'var(--glass-border)', margin:'6px 0 10px', ...emerge(460, { sc: 0.9, blur: 2, dur: 400 }) }} />

          {/* ── CTA ── */}
          <div style={emerge(820, { sc: 0.9, blur: 4, dur: 500 })}>
            <p className="text-center mb-3" style={{ fontSize:12, color:'var(--wordmark-color)', letterSpacing:'0.1px' }}>
              {t.timeHint}
            </p>
            <button
              type="button"
              onClick={handleStart}
              disabled={isLoading}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-[15px] transition-all duration-200 flex items-center justify-center gap-2${!isLoading ? ' btn-primary-cta' : ''}`}
              style={isLoading ? {
                background: 'var(--btn-disabled-bg)',
                color: 'var(--btn-disabled-color)',
                cursor: 'not-allowed',
                border: '0.5px solid var(--btn-disabled-border)',
              } : {
                cursor: 'pointer',
              }}
            >
              {isLoading && (
                <svg className="animate-spin shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              )}
              {isLoading ? t.buttonStarting : t.buttonStart}
            </button>
            {error && <p style={{ color:'rgba(220,80,80,0.85)', fontSize:13, marginTop:10, textAlign:'center' }}>{error}</p>}
          </div>

        </div>

        <Footer />
      </div>

      {/* ── How it works modal ── */}
      {hiwOpen && (
        <HowItWorksModal onClose={() => setHiwOpen(false)} />
      )}

      {whatItIsOpen && (
        <WhatItIsModal body={t.visionBody} onClose={() => setWhatItIsOpen(false)} />
      )}

      {/* ── Avatar zoom overlay ── */}
      {avatarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ background:'rgba(0,0,0,0.6)' }} onClick={() => setAvatarOpen(false)}>
          <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl animate-scale-in">
            <img src="/assets/pablo-avatar.jpg" alt="Pablo Agis" className="w-full h-full object-cover" style={{ objectPosition: 'center 15%' }} />
          </div>
        </div>
      )}

      {/* ── SPLASH ── */}
      {!splashDone && (
        <div
          ref={splashOverlayRef}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center"
          style={{ pointerEvents: 'none' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 32 }}>

            <p ref={splashWmRef} style={{
              margin: 0,
              fontSize: 11, fontWeight: 600,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'var(--nav-text)',
              opacity: 0,
            }}>
              InterviewMind
            </p>

            <div ref={splashVisionRef} style={{ opacity: 0, maxWidth: 400, width: '88%', textAlign: 'center' }}>
              <div style={{
                width: 32, height: 1, margin: '0 auto 20px',
                background: 'linear-gradient(90deg, transparent, var(--glass-border), transparent)',
              }} />
              <p className="gradient-text" style={{
                margin: 0,
                fontSize: 19, fontWeight: 700,
                letterSpacing: '-0.025em', lineHeight: 1.5,
              }}>
                {t.visionTitle}
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
