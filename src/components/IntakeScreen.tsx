'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SessionCreateRequest } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggleButton from './ThemeToggleButton';
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
  const welcomeAvRef = useRef<HTMLButtonElement>(null);

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
  const splashVisionRef  = useRef<HTMLDivElement>(null);
  const vignetteRef  = useRef<HTMLDivElement>(null);
  const lightSweepRef = useRef<HTMLDivElement>(null);
  const splashRanRef     = useRef(false);
  const [splashPaused,   setSplashPaused]   = useState(false);
  const splashControlRef = useRef<{ pause: () => void; resume: () => void } | null>(null);
  const sharedTransitionRan = useRef(false);

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
    const tick = (fn: FrameRequestCallback) => { const id = requestAnimationFrame(fn); rafs.push(id); return id; };

    // Pause state (local to this animation run)
    const isPaused = { current: false };
    const pausedAt = { current: 0 };
    const pendingList: Array<{ id: ReturnType<typeof setTimeout>; fn: () => void; firesAt: number }> = [];

    const after = (fn: () => void, ms: number) => {
      const firesAt = performance.now() + ms;
      const id = setTimeout(() => {
        const idx = pendingList.findIndex(e => e.id === id);
        if (idx >= 0) pendingList.splice(idx, 1);
        fn();
      }, ms);
      timers.push(id);
      pendingList.push({ id, fn, firesAt });
    };

    const eO  = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);           // easeOutExpo
    const eOC = (t: number) => 1 - Math.pow(1 - t, 3);                             // easeOutCubic
    const eIO = (t: number) => t < 0.5 ? 8*t*t*t*t : 1 - Math.pow(-2*t+2, 4)/2;  // easeInOutQuart

    // Universal animate helper — pause-aware
    function animate(fn: (p: number) => void, duration: number, delay: number, easing: (t: number) => number, onDone?: () => void) {
      after(() => {
        let start = performance.now();
        let last = start;
        const frame = (now: number) => {
          if (isPaused.current) { start += now - last; }
          last = now;
          const raw = Math.min((now - start) / duration, 1);
          fn(easing(raw));
          if (raw < 1) tick(frame);
          else if (onDone) onDone();
        };
        tick(frame);
      }, delay);
    }

    // Spring with blur + translateY — for avatar entrance (pause-aware)
    function springAv(el: HTMLElement, fromSc: number, peakSc: number, finSc: number, fromBlur: number, fromTy: number, peakTy: number, dur: number, delay: number) {
      after(() => {
        let s = performance.now(), last = s;
        const h = dur * 0.55, opDur = dur * 0.38;
        const frame = (now: number) => {
          if (isPaused.current) { s += now - last; }
          last = now;
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
    const namePulsed = { current: false };

    // Expose pause/resume for hold-to-pause (Instagram Stories style)
    splashControlRef.current = {
      pause: () => {
        if (isPaused.current) return;
        isPaused.current = true;
        pausedAt.current = performance.now();
        pendingList.forEach(entry => clearTimeout(entry.id));
        setSplashPaused(true);
      },
      resume: () => {
        if (!isPaused.current) return;
        const pauseDuration = performance.now() - pausedAt.current;
        isPaused.current = false;
        [...pendingList].forEach(entry => {
          entry.firesAt += pauseDuration;
          const fn = entry.fn;
          const newId = setTimeout(() => {
            const idx = pendingList.indexOf(entry);
            if (idx >= 0) pendingList.splice(idx, 1);
            fn();
          }, Math.max(0, entry.firesAt - performance.now()));
          timers.push(newId);
          entry.id = newId;
        });
        setSplashPaused(false);
      },
    };

    // ── Phase 1: Vision phrase leads (0–3300ms) ──────────────────────────────

    const vision = splashVisionRef.current;
    if (vision) {
      // 200ms — blur + scale in from center (translate kept every frame)
      animate(p => {
        vision.style.opacity   = p.toFixed(4);
        vision.style.filter    = `blur(${(10 * (1 - p)).toFixed(1)}px)`;
        vision.style.transform = `translate(-50%, -50%) scale(${(0.92 + 0.08 * p).toFixed(4)})`;
      }, 800, 200, eO, () => { vision.style.filter = ''; vision.style.transform = 'translate(-50%, -50%)'; });

      // 3300ms — fade out, leaving enough time to read
      animate(p => {
        vision.style.opacity   = (1 - p).toFixed(4);
        vision.style.filter    = `blur(${(8 * p).toFixed(1)}px)`;
        vision.style.transform = `translate(-50%, -50%) scale(${(1 - 0.04 * p).toFixed(4)})`;
      }, 550, 3300, eIO, () => { vision.style.display = 'none'; });
    }

    // ── Phase 2: Pablo identity ───────────────────────────────────────────────

    // 3000ms — Vignette (night only)
    if (!dayMode && vig) {
      animate(p => { vig.style.opacity = (p * 0.7).toFixed(4); }, 1000, 3000, eIO);
    }

    // 3200ms — Wordmark: blur + tracking compression
    const wmTargetOp = dayMode ? 0.30 : 0.28;
    animate(p => {
      const tracking = 0.34 - (0.34 - 0.22) * p;
      wm.style.letterSpacing = `${tracking.toFixed(3)}em`;
      wm.style.opacity = (p * wmTargetOp).toFixed(4);
      wm.style.filter = `blur(${(12 * (1 - p)).toFixed(1)}px)`;
    }, 1100, 3200, eO);

    // 3600ms — Wordmark glow: rise then settle (illumination at beginning)
    {
      const gc  = dayMode ? '58,85,192'   : '120,150,255';
      const pkP = dayMode ? 16 : 20;   // peak size px
      const pkA = dayMode ? 0.30 : 0.50; // peak alpha
      const stP = dayMode ? 6  : 8;    // settle size px
      const stA = dayMode ? 0.12 : 0.18; // settle alpha
      animate(
        p => { wm.style.textShadow = `0 0 ${(pkP * p).toFixed(1)}px rgba(${gc},${(pkA * p).toFixed(2)})`; },
        600, 3600, eO,
        () => animate(
          p => { wm.style.textShadow = `0 0 ${(pkP - (pkP - stP) * p).toFixed(1)}px rgba(${gc},${(pkA - (pkA - stA) * p).toFixed(2)})`; },
          400, 0, eOC
        )
      );
    }

    // 3500ms — Light sweep (night only)
    if (!dayMode && sweep) {
      animate(p => {
        const sw = p < 0.5 ? p * 2 : (1 - p) * 2;
        sweep.style.opacity = (sw * 0.6).toFixed(4);
        sweep.style.transform = `translateX(${(-100 + p * 200).toFixed(1)}%)`;
      }, 700, 3500, t => t);
    }

    // 3600ms — Avatar springs from depth with weight
    springAv(av, 0.50, 1.10, 1.0, 24, 10, -3, 1300, 3600);

    // 4000ms — Ring activates
    after(() => { ring.style.opacity = '1'; ring.style.transition = 'opacity 1100ms ease'; }, 4000);

    // 4100ms — Glow pulse begins
    after(() => { glow.style.animation = 'glow-pulse 2200ms ease-in-out infinite'; }, 4100);

    // 4250ms — Name assembles from left
    const nameEl = nm;
    animate(p => {
      nameEl.style.opacity = p.toFixed(4);
      nameEl.style.transform = `translateX(${(-48 * (1 - p)).toFixed(2)}px) scale(${(0.92 + 0.08 * p).toFixed(4)})`;
      nameEl.style.filter = `blur(${(16 * (1 - p)).toFixed(1)}px)`;
    }, 750, 4250, eO, () => { nameEl.style.transform = ''; nameEl.style.filter = ''; });

    // 4625ms — Name micro-pulse (at 375ms into the 750ms name animation)
    after(() => {
      if (!namePulsed.current) {
        namePulsed.current = true;
        animate(
          pp => { nameEl.style.transform = `translateX(0) scale(${(1 + 0.014 * Math.sin(pp * Math.PI)).toFixed(4)})`; },
          90, 0, t => t
        );
      }
    }, 4625);

    // 4600ms — Role from right
    const roleOp = dayMode ? 0.62 : 0.70;
    animate(p => {
      rl.style.opacity = (p * roleOp).toFixed(4);
      rl.style.transform = `translateX(${(40 * (1 - p)).toFixed(2)}px)`;
      rl.style.filter = `blur(${(12 * (1 - p)).toFixed(1)}px)`;
    }, 650, 4600, eO, () => { rl.style.transform = ''; rl.style.filter = ''; });

    // 4900ms — Divider reveals from center
    const divOp = dayMode ? 0.50 : 0.60;
    animate(p => {
      dv.style.transform = `scaleX(${p.toFixed(4)})`;
      dv.style.opacity = (p * divOp).toFixed(4);
    }, 550, 4900, eOC);

    // 5200ms — Tags stagger in
    tags.forEach((tag, i) => {
      animate(p => {
        tag.style.opacity = p.toFixed(4);
        tag.style.transform = `translateY(${(18 * (1 - p)).toFixed(2)}px) scale(${(0.88 + 0.12 * p).toFixed(4)})`;
        tag.style.filter = `blur(${(8 * (1 - p)).toFixed(1)}px)`;
      }, 520, 5200 + i * 90, eO, () => { tag.style.transform = ''; tag.style.filter = ''; });
    });

    // 6600ms — EXIT: shared element transitions (avatar + wordmark)
    after(() => {
      if (!ov) return;

      // Stop glow pulse (ring stays visible and travels with the avatar)
      glow.style.animation = 'none';

      // Make page visible so positions can be measured after paint
      setPageReady(true);

      // Both avatar AND wordmark must call checkDone before splash unmounts
      const landingCount = { current: 0 };
      const checkDone = () => {
        landingCount.current += 1;
        if (landingCount.current >= 2) {
          setSplashDone(true);
          sessionStorage.setItem('im_splash_shown', '1');
        }
      };

      // ── Wordmark: illuminate → fallback fade (no page wordmark on Page 1) ──
      // Excluded from ctxEls — handles its own exit
      const wmEl = wm;
      const wmBaseOp  = dayMode ? 0.30 : 0.28;
      const wmBrightOp = dayMode ? 0.55 : 0.65;
      const wmGc       = dayMode ? '58,85,192' : '140,170,255';
      animate(
        p => {
          wmEl.style.opacity    = (wmBaseOp + (wmBrightOp - wmBaseOp) * p).toFixed(4);
          wmEl.style.textShadow = dayMode
            ? `0 0 ${(32 * p).toFixed(1)}px rgba(58,85,192,${(0.50 * p).toFixed(2)}), 0 0 ${(60 * p).toFixed(1)}px rgba(58,85,192,${(0.18 * p).toFixed(2)})`
            : `0 0 ${(40 * p).toFixed(1)}px rgba(140,170,255,${(0.80 * p).toFixed(2)}), 0 0 ${(80 * p).toFixed(1)}px rgba(100,130,255,${(0.30 * p).toFixed(2)})`;
        },
        300, 0, eO,
        () => {
          // Fallback: fade out wordmark (no destination to fly to)
          animate(
            p => {
              wmEl.style.opacity    = (wmBrightOp * (1 - p)).toFixed(4);
              wmEl.style.textShadow = `0 0 ${(40 * (1 - p)).toFixed(1)}px rgba(${wmGc},${(0.80 * (1 - p)).toFixed(2)})`;
            },
            300, 0, eO,
            () => { wmEl.style.textShadow = 'none'; checkDone(); }
          );
        }
      );

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const pageAvEl = welcomeAvRef.current;

          if (!av || !pageAvEl) {
            checkDone(); // avatar fallback counts as done
            return;
          }

          // Hide page avatar during flight so it doesn't double-show
          pageAvEl.style.opacity   = '0';
          pageAvEl.style.transition = 'none';

          // Fade out context elements (wordmark excluded — handles itself)
          const ctxEls = [
            splashNameRef.current, splashRoleRef.current,
            splashDivRef.current, vignetteRef.current,
            ...splashTagsRef.current.filter(Boolean),
          ].filter(Boolean) as HTMLElement[];
          const initOps = ctxEls.map(el => parseFloat(el.style.opacity || '1'));
          animate(p => {
            ctxEls.forEach((el, i) => { el.style.opacity = (initOps[i] * (1 - p)).toFixed(4); });
          }, 180, 0, eIO);
          if (splashVisionRef.current) splashVisionRef.current.style.opacity = '0';

          // Measure screen-space positions
          const splashRect = av.getBoundingClientRect();
          const pageRect   = pageAvEl.getBoundingClientRect();
          const dx = (pageRect.left + pageRect.width  / 2) - (splashRect.left + splashRect.width  / 2);
          const dy = (pageRect.top  + pageRect.height / 2) - (splashRect.top  + splashRect.height / 2);
          const scaleTarget = pageRect.width / splashRect.width;

          // Avatar flight: 80ms delay, 600ms, eO
          animate(
            p => {
              av.style.transform = `translate(${(dx * p).toFixed(2)}px, ${(dy * p).toFixed(2)}px) scale(${(1 + (scaleTarget - 1) * p).toFixed(4)})`;
              ring.style.opacity = (1 - p * 0.85).toFixed(4);
              glow.style.opacity = (1 - p).toFixed(4);
              av.style.opacity   = p > 0.85 ? (1 - (p - 0.85) / 0.15).toFixed(4) : '1';
            },
            600, 80, eO,
            () => {
              av.style.opacity = '0';
              sharedTransitionRan.current = true;

              pageAvEl.style.opacity   = '1';
              pageAvEl.style.transition = 'none';
              pageAvEl.style.transform  = 'scale(0.94)';

              requestAnimationFrame(() => {
                pageAvEl.style.transition = 'transform 280ms cubic-bezier(0.34,1.56,0.64,1)';
                pageAvEl.style.transform  = 'scale(1.0)';
                setTimeout(checkDone, 280);
              });
            }
          );
        });
      });
    }, 6600);

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

        <form ref={formRef} onSubmit={handleStart} className="w-full max-w-[440px] sm:max-w-[600px]">

          {/* ── Hero header ── */}
          <div className="flex flex-col items-center gap-3 mb-7 text-center">
            <button ref={welcomeAvRef} type="button" onClick={() => setAvatarOpen(true)}
              className="relative cursor-zoom-in"
              style={{ width: 112, height: 112, ...(sharedTransitionRan.current ? {} : emerge(0, { sc: 0.97, blur: 3, dur: 500 })) }}>
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
          className="fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden"
          onPointerDown={() => splashControlRef.current?.pause()}
          onPointerUp={() => splashControlRef.current?.resume()}
          onPointerLeave={() => splashControlRef.current?.resume()}
          style={{ cursor: 'default', userSelect: 'none' }}
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

          {/* Pause indicator */}
          {splashPaused && (
            <div style={{
              position: 'absolute', bottom: 32, left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 999,
              background: 'rgba(255,255,255,0.07)',
              border: '0.5px solid rgba(255,255,255,0.13)',
              pointerEvents: 'none',
            }}>
              <svg width="8" height="8" viewBox="0 0 10 10" fill="rgba(255,255,255,0.42)">
                <rect x="1" y="0" width="3" height="10" rx="1" />
                <rect x="6" y="0" width="3" height="10" rx="1" />
              </svg>
              <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
                paused
              </span>
            </div>
          )}

          {/* Vision phrase — HERO, shown first, absolutely centered */}
          <div ref={splashVisionRef} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            maxWidth: 300, width: '82%',
            textAlign: 'center',
            opacity: 0,
            filter: 'blur(10px)',
            pointerEvents: 'none',
            zIndex: 2,
          }}>
            {/* Micro wordmark — orients the viewer */}
            <span style={{
              fontSize: 8.5,
              fontWeight: 600,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--splash-wm)',
              marginBottom: 12,
            }}>
              InterviewMind
            </span>

            {/* Accent line */}
            <span style={{
              display: 'block',
              width: 32, height: 1,
              background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)',
              marginBottom: 16,
              opacity: 0.7,
            }} />

            {/* Main phrase */}
            <p className="gradient-text" style={{
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.45,
              margin: 0,
            }}>
              {t.visionTitle}
            </p>
          </div>

          <div style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>

            {/* Wordmark */}
            <p ref={splashWmRef} style={{
              fontSize:10, fontWeight:500, color:'var(--splash-wm)',
              letterSpacing:'0.34em', textTransform:'uppercase',
              marginBottom:52, opacity:0, filter:'blur(12px)',
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
              marginBottom:16, opacity:0, transform:'translateX(40px)', filter:'blur(12px)',
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
