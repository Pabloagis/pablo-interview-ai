'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SessionCreateRequest } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import HowItWorksModal from './HowItWorksModal';
import WhatItIsModal from './WhatItIsModal';
import Footer from './Footer';
import Background from './Background';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ResumeState = {
  sessionId: string;
  recruiterName?: string;
  company?: string;
  messageCount: number;
} | null;

export default function IntakeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [recruiterName, setRecruiterName]   = useState('');
  const [nameTouched,   setNameTouched]     = useState(false);
  const [email,         setEmail]           = useState('');
  const [emailTouched,  setEmailTouched]    = useState(false);
  const [company,       setCompany]         = useState('');
  const [role,          setRole]            = useState('');
  const [isLoading,     setIsLoading]       = useState(false);
  const [isResuming,    setIsResuming]      = useState(false);
  const [error,         setError]           = useState('');
  const [resumeSession, setResumeSession]   = useState<ResumeState>(null);
  const [avatarOpen,    setAvatarOpen]      = useState(false);
  const [splashDone,    setSplashDone]      = useState(false);
  const [pageReady,     setPageReady]       = useState(false);
  const [showContextWarn, setShowContextWarn] = useState(false);
  const [whatItIsOpen,   setWhatItIsOpen]    = useState(false);
  const [hiwOpen,        setHiwOpen]         = useState(false);
  const companyInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Splash refs
  const splashOverlayRef = useRef<HTMLDivElement>(null);
  const splashWmRef      = useRef<HTMLParagraphElement>(null);
  const splashAvRef      = useRef<HTMLDivElement>(null);
  const splashRingRef    = useRef<HTMLDivElement>(null);
  const splashGlowRef    = useRef<HTMLDivElement>(null);
  const splashNameRef    = useRef<HTMLParagraphElement>(null);
  const splashRoleRef    = useRef<HTMLParagraphElement>(null);
  const splashDivRef     = useRef<HTMLDivElement>(null);
  const splashTagsRef    = useRef<(HTMLSpanElement | null)[]>([]);
  const splashVisionRef  = useRef<HTMLParagraphElement>(null);
  const vignetteRef  = useRef<HTMLDivElement>(null);
  const lightSweepRef = useRef<HTMLDivElement>(null);
  const splashRanRef     = useRef(false);

  // ── Skip before first paint for returning visitors ──
  useLayoutEffect(() => {
    if (sessionStorage.getItem('im_splash_shown')) { setSplashDone(true); setPageReady(true); }
  }, []);

  // ── Splash 1 — cinematic JS rAF animation ──
  useEffect(() => {
    if (splashRanRef.current) return;
    splashRanRef.current = true;
    if (sessionStorage.getItem('im_splash_shown')) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const rafs: number[] = [];
    const after = (fn: () => void, ms: number) => { const id = setTimeout(fn, ms); timers.push(id); };
    const tick  = (fn: FrameRequestCallback) => { const id = requestAnimationFrame(fn); rafs.push(id); return id; };

    const eO  = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);           // easeOutExpo
    const eOC = (t: number) => 1 - Math.pow(1 - t, 3);                             // easeOutCubic
    const eIO = (t: number) => t < 0.5 ? 8*t*t*t*t : 1 - Math.pow(-2*t+2, 4)/2;  // easeInOutQuart

    // Universal animate helper
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

    // Spring with blur + translateY — for avatar entrance
    function springAv(el: HTMLElement, fromSc: number, peakSc: number, finSc: number, fromBlur: number, fromTy: number, peakTy: number, dur: number, delay: number) {
      after(() => {
        const s = performance.now(), h = dur * 0.55, opDur = dur * 0.38;
        const frame = (now: number) => {
          const elapsed = now - s;
          const e = Math.min(elapsed, dur);
          let sc: number, ty: number;
          if (e < h) {
            const p = eO(e / h);
            sc = fromSc + (peakSc - fromSc) * p;
            ty = fromTy + (peakTy - fromTy) * p;
          } else {
            const p = eOC((e - h) / (dur - h));
            sc = peakSc + (finSc - peakSc) * p;
            ty = peakTy * (1 - p);
          }
          const bl = fromBlur * Math.max(0, 1 - Math.min(elapsed / dur, 1));
          el.style.transform = `translateY(${ty.toFixed(2)}px) scale(${sc.toFixed(4)})`;
          el.style.opacity = Math.min(elapsed / opDur, 1).toFixed(4);
          el.style.filter = bl > 0.2 ? `blur(${bl.toFixed(1)}px)` : '';
          if (elapsed < dur) tick(frame);
          else { el.style.transform = 'none'; el.style.opacity = '1'; el.style.filter = ''; }
        };
        tick(frame);
      }, delay);
    }

    const ov    = splashOverlayRef.current;
    const wm    = splashWmRef.current;
    const av    = splashAvRef.current;
    const ring  = splashRingRef.current;
    const glow  = splashGlowRef.current;
    const nm    = splashNameRef.current;
    const rl    = splashRoleRef.current;
    const dv    = splashDivRef.current;
    const vig   = vignetteRef.current;
    const sweep = lightSweepRef.current;
    const tags  = splashTagsRef.current.filter(Boolean) as HTMLSpanElement[];
    if (!ov || !wm || !av || !ring || !glow || !nm || !rl || !dv) return;

    const dayMode = document.documentElement.getAttribute('data-theme') === 'day';

    // ── Phase 1: Vision phrase leads (0–1700ms) ──────────────────────────────

    const vision = splashVisionRef.current;
    if (vision) {
      // 0ms — blur + scale in from center (translate kept every frame)
      animate(p => {
        vision.style.opacity   = p.toFixed(4);
        vision.style.filter    = `blur(${(10 * (1 - p)).toFixed(1)}px)`;
        vision.style.transform = `translate(-50%, -50%) scale(${(0.92 + 0.08 * p).toFixed(4)})`;
      }, 650, 0, eO, () => { vision.style.filter = ''; vision.style.transform = 'translate(-50%, -50%)'; });

      // 1300ms — fade out before Pablo identity appears
      animate(p => {
        vision.style.opacity   = (1 - p).toFixed(4);
        vision.style.filter    = `blur(${(8 * p).toFixed(1)}px)`;
        vision.style.transform = `translate(-50%, -50%) scale(${(1 - 0.04 * p).toFixed(4)})`;
      }, 400, 1300, eIO, () => { vision.style.display = 'none'; });
    }

    // ── Phase 2: Pablo identity (all original timings + 1600ms) ──────────────

    // 1600ms — Vignette (night only)
    if (!dayMode && vig) {
      animate(p => { vig.style.opacity = (p * 0.6).toFixed(4); }, 800, 1600, eIO);
    }

    // 1800ms — Wordmark: blur + tracking compression
    const wmTargetOp = dayMode ? 0.30 : 0.28;
    animate(p => {
      const tracking = 0.32 - (0.32 - 0.22) * p;
      wm.style.letterSpacing = `${tracking.toFixed(3)}em`;
      wm.style.opacity = (p * wmTargetOp).toFixed(4);
      wm.style.filter = `blur(${(8 * (1 - p)).toFixed(1)}px)`;
    }, 1000, 1800, eO);

    // 2100ms — Light sweep (night only)
    if (!dayMode && sweep) {
      animate(p => {
        const sw = p < 0.5 ? p * 2 : (1 - p) * 2;
        sweep.style.opacity = (sw * 0.8).toFixed(4);
        sweep.style.transform = `translateX(${(-100 + p * 200).toFixed(1)}%)`;
      }, 600, 2100, t => t);
    }

    // 2200ms — Avatar springs from depth with weight
    springAv(av, 0.55, 1.08, 1.0, 20, 8, -2, 1100, 2200);

    // 2600ms — Ring activates
    after(() => { ring.style.opacity = '1'; ring.style.transition = 'opacity 900ms ease'; }, 2600);

    // 2700ms — Glow pulse begins
    after(() => { glow.style.animation = 'glow-pulse 2000ms ease-in-out infinite'; }, 2700);

    // 2800ms — Name assembles from left
    animate(p => {
      nm.style.opacity = p.toFixed(4);
      nm.style.transform = `translateX(${(-40 * (1 - p)).toFixed(2)}px) scale(${(0.94 + 0.06 * p).toFixed(4)})`;
      nm.style.filter = `blur(${(14 * (1 - p)).toFixed(1)}px)`;
    }, 700, 2800, eO, () => { nm.style.transform = ''; nm.style.filter = ''; });

    // 3150ms — Role from right
    const roleOp = dayMode ? 0.65 : 0.72;
    animate(p => {
      rl.style.opacity = (p * roleOp).toFixed(4);
      rl.style.transform = `translateX(${(35 * (1 - p)).toFixed(2)}px)`;
      rl.style.filter = `blur(${(10 * (1 - p)).toFixed(1)}px)`;
    }, 600, 3150, eO, () => { rl.style.transform = ''; rl.style.filter = ''; });

    // 3450ms — Divider reveals from center
    animate(p => {
      dv.style.transform = `scaleX(${p.toFixed(4)})`;
      dv.style.opacity = (p * 0.55).toFixed(4);
    }, 500, 3450, eOC);

    // 3800ms — Tags stagger in
    tags.forEach((tag, i) => {
      animate(p => {
        tag.style.opacity = p.toFixed(4);
        tag.style.transform = `translateY(${(18 * (1 - p)).toFixed(2)}px) scale(${(0.9 + 0.1 * p).toFixed(4)})`;
        tag.style.filter = `blur(${(6 * (1 - p)).toFixed(1)}px)`;
      }, 500, 3800 + i * 80, eO, () => { tag.style.transform = ''; tag.style.filter = ''; });
    });

    // 5200ms — Cinematic EXIT (two-step)
    after(() => {
      if (!ov) return;
      const _ov = ov;
      setPageReady(true);
      ring.style.transition = 'opacity 0ms';
      ring.style.opacity = '0';
      glow.style.animation = 'none';

      // Step 1 (0–200ms): blur accumulates
      animate(p => {
        _ov.style.filter = `blur(${(3 * p).toFixed(1)}px)`;
        _ov.style.transform = `scale(${(1 - 0.005 * p).toFixed(4)})`;
      }, 200, 0, t => t);

      // Step 2 (200–700ms): directional exit
      animate(p => {
        _ov.style.transform = `translateY(${(-52 * p).toFixed(1)}px) scale(${(0.995 - 0.013 * p).toFixed(4)})`;
        _ov.style.filter = `blur(${(3 + 7 * p).toFixed(1)}px)`;
        _ov.style.opacity = (1 - p).toFixed(4);
      }, 500, 200, eIO, () => {
        setSplashDone(true);
        sessionStorage.setItem('im_splash_shown', '1');
      });
    }, 5200);

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

  const isNameValid      = recruiterName.trim().length > 0;
  const showNameError    = nameTouched && !isNameValid;
  const isEmailValid     = EMAIL_REGEX.test(email.trim());
  const showEmailError   = emailTouched && email.trim() !== '' && !isEmailValid;
  const isNameEmailReady = isNameValid && isEmailValid;
  const isFullyFilled    = isNameEmailReady && company.trim().length > 0 && role.trim().length > 0;
  const isSubmitDisabled = isLoading || !isNameEmailReady;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Gate: require company + role if not already confirmed
    if (!showContextWarn && (!company.trim() || !role.trim())) {
      setShowContextWarn(true);
      return;
    }
    setShowContextWarn(false);
    setIsLoading(true);
    try {
      const body: SessionCreateRequest & { email:string; consentToEmail:boolean } = {
        recruiterName: recruiterName.trim(),
        company: company.trim() || undefined,
        role: role.trim() || undefined,
        email: email.trim(),
        consentToEmail: true,
      };
      const response = await fetch('/api/session', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Something went wrong. Please try again.');
        setIsLoading(false);
        return;
      }
      const { sessionId } = await response.json();
      const ctx = { recruiterName:recruiterName.trim(), email:email.trim(), company:company.trim()||undefined, role:role.trim()||undefined, consentToEmail:true };
      sessionStorage.setItem(`session_${sessionId}`, JSON.stringify(ctx));
      localStorage.setItem('im_last_session', JSON.stringify({ sessionId, ...ctx }));
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
          transition: 'opacity 500ms ease 100ms',
          contain: 'layout',
        }}
      >
        {/* Language switcher */}
        <div className="absolute top-3 right-3 z-10" style={emerge(0, { ty: -20, blur: 5, dur: 500 })}>
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

        <form ref={formRef} onSubmit={handleStart} className="w-full max-w-[440px] sm:max-w-[600px]">

          {/* ── Hero header ── */}
          <div className="flex flex-col items-center gap-3 mb-7 text-center">
            <button type="button" onClick={() => setAvatarOpen(true)}
              className="relative cursor-zoom-in"
              style={{ width: 112, height: 112, ...emerge(60, { sc: 0.85, blur: 6, dur: 550 }) }}>
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


          {/* ── Form ── */}
          <div className="glass p-5 mb-2.5" style={emerge(720, { ty: 28, blur: 8, dur: 560 })}>
            <div className="flex flex-col gap-3">
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:5 }}>
                  {t.labelName} <span style={{ color:'rgba(220,80,80,0.8)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder={t.placeholderName}
                  value={recruiterName}
                  onChange={(e) => setRecruiterName(e.target.value)}
                  onBlur={() => setNameTouched(true)}
                  className={`input-glass${showNameError ? ' error' : ''}`}
                  maxLength={100}
                  autoComplete="given-name"
                  required
                />
                {showNameError && <p style={{ marginTop:4, fontSize:12, color:'rgba(220,80,80,0.85)' }}>{t.nameError}</p>}
              </div>

              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:5 }}>
                  {t.labelEmail} <span style={{ color:'rgba(220,80,80,0.8)' }}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  onBlur={() => setEmailTouched(true)}
                  className={`input-glass${showEmailError ? ' error' : ''}`}
                  maxLength={254}
                  autoComplete="email"
                  required
                />
                {showEmailError && <p style={{ marginTop:4, fontSize:12, color:'rgba(220,80,80,0.85)' }}>{t.emailError}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2.5 items-end">
                <div className="flex flex-col">
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:5, minHeight:'2.4em' }}>
                    {t.labelCompany}
                  </label>
                  <input ref={companyInputRef} type="text" value={company} onChange={(e) => { setCompany(e.target.value); if (showContextWarn) setShowContextWarn(false); }} className="input-glass" maxLength={100} autoComplete="organization" />
                </div>
                <div className="flex flex-col">
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:5, minHeight:'2.4em' }}>
                    {t.labelRole}
                  </label>
                  <input type="text" value={role} onChange={(e) => { setRole(e.target.value); if (showContextWarn) setShowContextWarn(false); }} className="input-glass" maxLength={100} />
                </div>
              </div>
            </div>
          </div>

          {error && <p style={{ color:'rgba(220,80,80,0.85)', fontSize:13, marginBottom:10 }}>{error}</p>}


          {/* ── CTA Button ── */}
          <div style={emerge(820, { sc: 0.9, blur: 4, dur: 500 })}>
            <p className="text-center mb-3" style={{ fontSize:12, color:'var(--wordmark-color)', letterSpacing:'0.1px' }}>
              {t.timeHint}
            </p>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-[15px] transition-all duration-200 flex items-center justify-center gap-2${!isSubmitDisabled ? ' btn-primary-cta' : ''}`}
              style={isSubmitDisabled ? {
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
          </div>

        </form>

        <p className="vision-closing text-center" style={{
          fontSize: 13, fontWeight: 600, fontStyle: 'italic',
          lineHeight: 1.5, color: 'var(--text-secondary)',
          padding: '18px 8px 6px',
        }}>
          {t.visionClosing}
        </p>

        <Footer />
      </div>

      {/* ── What it is modal ── */}
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

      {/* ── SPLASH 1 ── */}
      {!splashDone && (
        <div
          ref={splashOverlayRef}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center pointer-events-none overflow-hidden"
        >
          {/* Vignette (night mode only) */}
          <div ref={vignetteRef} style={{
            position:'absolute', inset:0, pointerEvents:'none',
            background:'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.14) 100%)',
            opacity:0,
          }} />

          {/* Light sweep (night mode only) */}
          <div ref={lightSweepRef} style={{
            position:'absolute', top:'50%', left:0,
            width:'100%', height:1, pointerEvents:'none',
            background:'linear-gradient(90deg, transparent 0%, rgba(100,130,255,0.22) 50%, transparent 100%)',
            opacity:0, transform:'translateX(-100%)',
          }} />

          {/* Vision phrase — HERO, shown first, absolutely centered */}
          <p ref={splashVisionRef} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 19,
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            lineHeight: 1.55,
            maxWidth: 300,
            width: '80%',
            textAlign: 'center',
            opacity: 0,
            pointerEvents: 'none',
            zIndex: 2,
          }}>
            {t.visionTitle}
          </p>

          <div style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>

            {/* Wordmark */}
            <p ref={splashWmRef} style={{
              fontSize:10, fontWeight:500, color:'var(--splash-wm)',
              letterSpacing:'0.32em', textTransform:'uppercase',
              marginBottom:52, opacity:0, filter:'blur(8px)',
            }}>
              INTERVIEWMIND
            </p>

            {/* Avatar + ring + glow */}
            <div ref={splashAvRef} style={{ position:'relative', width:112, height:112, marginBottom:24, opacity:0, transform:'translateY(8px) scale(0.55)' }}>
              {/* Glow */}
              <div ref={splashGlowRef} className="absolute inset-0 rounded-full" style={{ background:'rgba(80,110,220,0.18)' }} />
              {/* Spinning conic ring */}
              <div ref={splashRingRef} className="absolute inset-0 rounded-full" style={{
                background:'conic-gradient(from 0deg, rgba(60,90,200,0.7), rgba(100,60,180,0.5), rgba(40,130,160,0.55), rgba(60,90,200,0.7))',
                padding:2, opacity:0,
                animation:'ring-spin 3.5s linear infinite',
              }}>
                <div className="w-full h-full rounded-full" style={{ background:'var(--bg-base)' }} />
              </div>
              {/* Photo */}
              <div className="absolute rounded-full overflow-hidden" style={{ inset:3 }}>
                <img src="/assets/pablo-avatar.jpg" alt="Pablo Agis" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 15%', display:'block' }} />
              </div>
            </div>

            {/* Name */}
            <p ref={splashNameRef} className="gradient-text" style={{
              fontSize:28, fontWeight:700, letterSpacing:'-0.025em',
              marginBottom:6, opacity:0, transform:'translateX(-40px)', filter:'blur(14px)',
            }}>
              Pablo Agis Burgos
            </p>

            {/* Role */}
            <p ref={splashRoleRef} style={{
              fontSize:12.5, color:'var(--splash-role)', letterSpacing:'0.04em',
              marginBottom:16, opacity:0, transform:'translateX(35px)', filter:'blur(10px)',
            }}>
              SaaS &amp; Hospitality Tech
            </p>

            {/* Divider */}
            <div ref={splashDivRef} style={{
              width:200, height:0.5, marginBottom:20, transformOrigin:'center',
              background:'var(--splash-divider)',
              opacity:0, transform:'scaleX(0)',
            }} />

            {/* Tags — 4 items */}
            <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:8, maxWidth:300 }}>
              {(['HubOS', 'Soho House London', '5 idiomas', 'Barcelona'] as const).map((tag, i) => (
                <span
                  key={tag}
                  ref={(el) => { splashTagsRef.current[i] = el; }}
                  style={{
                    padding:'5px 12px', borderRadius:999,
                    background:'var(--splash-tag-bg)',
                    border:'0.5px solid var(--splash-tag-border)',
                    fontSize:11, color:'var(--splash-tag-text)',
                    opacity:0, transform:'translateY(18px)',
                    display:'inline-flex', alignItems:'center',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ── Context warning modal ── */}
      {showContextWarn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          onClick={() => { setShowContextWarn(false); setTimeout(() => companyInputRef.current?.focus(), 50); }}
        >
          <div
            className="mx-5 w-full max-w-sm rounded-2xl p-6"
            style={{
              background: 'var(--modal-bg)',
              border: '0.5px solid var(--modal-border)',
              boxShadow: 'var(--modal-shadow)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(200,130,0,0.12)', border: '0.5px solid rgba(200,130,0,0.25)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(200,130,0,0.95)" strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
            </div>

            {/* Title + body */}
            <p className="text-center font-semibold mb-2" style={{ fontSize: 15, color: 'var(--modal-title)' }}>
              {t.contextWarningTitle}
            </p>
            <p className="text-center text-sm leading-relaxed mb-5" style={{ color: 'var(--modal-body)' }}>
              {t.contextWarningBody}
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => formRef.current?.requestSubmit()}
                className="w-full py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: 'rgba(200,130,0,0.14)',
                  border: '0.5px solid rgba(200,130,0,0.35)',
                  color: 'rgba(180,110,0,0.95)',
                  cursor: 'pointer',
                }}
              >
                {t.contextWarningConfirm}
              </button>
              <button
                type="button"
                onClick={() => { setShowContextWarn(false); setTimeout(() => companyInputRef.current?.focus(), 50); }}
                className="theme-modal-cancel w-full py-2.5 rounded-xl text-sm"
              >
                {t.contextWarningCancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
