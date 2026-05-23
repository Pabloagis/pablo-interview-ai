'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SessionCreateRequest } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
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
  const [error,         setError]           = useState('');
  const [resumeSession, setResumeSession]   = useState<ResumeState>(null);
  const [avatarOpen,    setAvatarOpen]      = useState(false);
  const [splashDone,    setSplashDone]      = useState(false);
  const [pageReady,     setPageReady]       = useState(false);

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

  // ── Skip before first paint for returning visitors ──
  useLayoutEffect(() => {
    if (sessionStorage.getItem('im_splash_shown')) { setSplashDone(true); setPageReady(true); }
  }, []);

  // ── Splash 1 — JS rAF animation ──
  useEffect(() => {
    if (sessionStorage.getItem('im_splash_shown')) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const rafs: number[] = [];
    const after = (fn: () => void, ms: number) => { const id = setTimeout(fn, ms); timers.push(id); };
    const tick  = (fn: FrameRequestCallback) => { const id = requestAnimationFrame(fn); rafs.push(id); return id; };
    const eo3  = (t: number) => 1 - Math.pow(1-t, 3);
    const eio4 = (t: number) => t < 0.5 ? 8*t*t*t*t : 1 - Math.pow(-2*t+2,4)/2;

    // Spring with optional blur
    function springBlur(el: HTMLElement, fromSc: number, peakSc: number, finSc: number, fromBlur: number, dur: number, delay: number) {
      after(() => {
        const s = performance.now(), h = dur * 0.55;
        function f(now: number) {
          const e = now-s;
          const sc = e < h ? fromSc+(peakSc-fromSc)*eo3(e/h) : peakSc+(finSc-peakSc)*eo3((e-h)/(dur-h));
          const bl = fromBlur * Math.max(0, 1 - e/dur);
          el.style.transform = `scale(${sc.toFixed(4)})`;
          el.style.opacity = Math.min(e/(dur*0.38),1).toFixed(4);
          el.style.filter = bl > 0.2 ? `blur(${bl.toFixed(1)}px)` : '';
          if (e < dur) tick(f); else { el.style.transform='scale(1)'; el.style.opacity='1'; el.style.filter=''; }
        }
        tick(f);
      }, delay);
    }

    // Slide from X with blur
    function slideBlurX(el: HTMLElement, fromTx: number, fromBlur: number, fromSc: number, toOp: number, dur: number, delay: number) {
      after(() => {
        const s = performance.now();
        function f(now: number) {
          const raw = Math.min((now-s)/dur, 1), p = eo3(raw);
          el.style.transform = `translateX(${(fromTx*(1-p)).toFixed(2)}px) scale(${(fromSc+(1-fromSc)*p).toFixed(4)})`;
          el.style.opacity = (raw*toOp).toFixed(4);
          const bl = fromBlur*(1-p);
          el.style.filter = bl > 0.2 ? `blur(${bl.toFixed(1)}px)` : '';
          if (raw < 1) tick(f); else { el.style.transform=''; el.style.opacity=toOp.toString(); el.style.filter=''; }
        }
        tick(f);
      }, delay);
    }

    // Slide from Y with blur
    function flyUpBlur(el: HTMLElement, fromTy: number, fromBlur: number, toOp: number, dur: number, delay: number) {
      after(() => {
        const s = performance.now();
        function f(now: number) {
          const raw = Math.min((now-s)/dur, 1), p = eo3(raw);
          el.style.transform = `translateY(${(fromTy*(1-p)).toFixed(2)}px)`;
          el.style.opacity = (raw*toOp).toFixed(4);
          const bl = fromBlur*(1-p);
          el.style.filter = bl > 0.2 ? `blur(${bl.toFixed(1)}px)` : '';
          if (raw < 1) tick(f); else { el.style.transform=''; el.style.opacity=toOp.toString(); el.style.filter=''; }
        }
        tick(f);
      }, delay);
    }

    // ScaleX (divider)
    function scaleX(el: HTMLElement, dur: number, delay: number) {
      after(() => {
        const s = performance.now();
        function f(now: number) {
          const raw = Math.min((now-s)/dur, 1), p = eo3(raw);
          el.style.transform = `scaleX(${p.toFixed(4)})`;
          el.style.opacity = (raw*0.6).toFixed(4);
          if (raw < 1) tick(f); else { el.style.transform='scaleX(1)'; el.style.opacity='0.6'; }
        }
        tick(f);
      }, delay);
    }

    // FadeIn
    function fadeIn(el: HTMLElement, dur: number, delay: number, maxOp: number) {
      after(() => {
        const s = performance.now();
        function f(now: number) {
          const raw = Math.min((now-s)/dur, 1);
          el.style.opacity = (raw*maxOp).toFixed(4);
          if (raw < 1) tick(f);
        }
        tick(f);
      }, delay);
    }

    const ov   = splashOverlayRef.current;
    const wm   = splashWmRef.current;
    const av   = splashAvRef.current;
    const ring = splashRingRef.current;
    const glow = splashGlowRef.current;
    const nm   = splashNameRef.current;
    const rl   = splashRoleRef.current;
    const dv   = splashDivRef.current;
    const tags = splashTagsRef.current.filter(Boolean) as HTMLSpanElement[];
    if (!ov||!wm||!av||!ring||!glow||!nm||!rl||!dv) return;

    // 0ms — wordmark fades in
    fadeIn(wm, 1400, 0, 0.30);

    // 400ms — avatar springs in (scale 0.68→1.05→1.0, blur 14→0)
    springBlur(av, 0.68, 1.05, 1.0, 14, 900, 400);

    // 800ms — ring activates (CSS transition via style)
    after(() => { ring.style.opacity = '1'; ring.style.transition = 'opacity 1000ms ease'; }, 800);
    after(() => { glow.style.animation = 'glow-pulse 1800ms ease-in-out infinite'; }, 800);

    // 1040ms — name slides from left
    slideBlurX(nm, -50, 12, 0.86, 1, 750, 1040);

    // 1120ms — role slides from right
    slideBlurX(rl, 50, 8, 1, 0.75, 680, 1120);

    // 1480ms — divider
    scaleX(dv, 500, 1480);

    // 2120ms — tags stagger
    tags.forEach((tag, i) => flyUpBlur(tag, 24, 8, 1, 600, 2120 + i*80));

    // 5000ms — EXIT (overlap with page enter)
    after(() => {
      if (!ov) return;
      const _ov = ov;
      // Trigger page entrance (CSS transition with 280ms delay)
      setPageReady(true);
      ring.style.opacity = '0';
      glow.style.animation = 'none';
      const s = performance.now();
      function exit(now: number) {
        const raw = Math.min((now-s)/650, 1), p = eio4(raw);
        _ov.style.opacity = (1-p).toFixed(4);
        _ov.style.transform = `translateY(${(-60*p).toFixed(1)}px) scale(${(1-0.02*p).toFixed(4)})`;
        _ov.style.filter = `blur(${(10*p).toFixed(1)}px)`;
        if (raw < 1) tick(exit);
        else {
          setSplashDone(true);
          sessionStorage.setItem('im_splash_shown', '1');
        }
      }
      tick(exit);
    }, 5000);

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

  // Page assembly transition style helper
  const emerge = (delay: number, extra?: React.CSSProperties): React.CSSProperties => ({
    opacity: pageReady ? 1 : 0,
    transform: pageReady ? 'translateY(0)' : 'translateY(20px)',
    filter: pageReady ? 'blur(0px)' : 'blur(8px)',
    transition: `opacity 600ms cubic-bezier(.25,1,.5,1) ${delay}ms, transform 600ms cubic-bezier(.25,1,.5,1) ${delay}ms, filter 600ms cubic-bezier(.25,1,.5,1) ${delay}ms`,
    ...extra,
  });

  const TAGS = ['HubOS', 'Soho House London', '5 idiomas', 'Barcelona'];

  return (
    <>
      <Background />

      {/* ── Main page content ── */}
      <div
        className="relative min-h-screen flex flex-col items-center px-4 py-10 w-full overflow-x-hidden"
        style={{
          opacity: pageReady ? 1 : 0,
          transform: pageReady ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.97)',
          filter: pageReady ? 'blur(0px)' : 'blur(6px)',
          transition: 'opacity 700ms cubic-bezier(.76,0,.24,1) 280ms, transform 700ms cubic-bezier(.76,0,.24,1) 280ms, filter 700ms cubic-bezier(.76,0,.24,1) 280ms',
        }}
      >
        {/* Language switcher */}
        <div className="absolute top-3 right-3 z-10" style={emerge(800)}>
          <LanguageSwitcher />
        </div>

        {/* Resume session banner */}
        {resumeSession && (
          <div className="w-full max-w-[440px] sm:max-w-[600px] mb-4 mt-2" style={emerge(0)}>
            <div className="glass rounded-xl px-4 py-3 flex items-start sm:items-center justify-between gap-3 border-[rgba(60,90,200,0.3)]">
              <p className="text-sm" style={{ color: 'rgba(180,200,255,0.9)' }}>
                Resume your session
                {resumeSession.recruiterName && <span className="font-medium"> with {resumeSession.recruiterName}</span>}
                {resumeSession.company && <span style={{ color:'rgba(180,200,255,0.6)' }}> ({resumeSession.company})</span>}
                <span className="text-xs ml-1" style={{ color:'rgba(255,255,255,0.35)' }}>
                  · {resumeSession.messageCount} message{resumeSession.messageCount !== 1 ? 's' : ''}
                </span>
              </p>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={handleResume}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                  style={{ background:'rgba(60,90,200,0.35)', color:'rgba(180,200,255,1)', border:'0.5px solid rgba(60,90,200,0.5)' }}>
                  Resume
                </button>
                <button type="button" onClick={handleDismissResume}
                  className="text-xs px-2 py-1.5 transition-colors"
                  style={{ color:'rgba(255,255,255,0.35)' }}>
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleStart} className="w-full max-w-[440px] sm:max-w-[600px]">

          {/* ── Hero header ── */}
          <div className="flex flex-col items-center gap-3 mb-7 text-center" style={emerge(100)}>
            <button type="button" onClick={() => setAvatarOpen(true)}
              className="relative cursor-zoom-in"
              style={{ width: 80, height: 80 }}>
              {/* Conic ring */}
              <div className="absolute inset-0 rounded-full" style={{
                background: 'conic-gradient(from 0deg, rgba(60,90,200,0.7), rgba(100,60,180,0.5), rgba(40,130,160,0.55), rgba(60,90,200,0.7))',
                animation: 'ring-spin 3.5s linear infinite',
                padding: 2,
              }}>
                <div className="w-full h-full rounded-full" style={{ background:'#0d0f14' }} />
              </div>
              {/* Avatar */}
              <div className="absolute rounded-full overflow-hidden" style={{ inset: 3 }}>
                <img src="/assets/pablo-avatar.jpg" alt="Pablo Agis" className="w-full h-full object-cover object-top" />
              </div>
            </button>

            <h1 className="gradient-text" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {t.emptyGreeting}
            </h1>
            <p style={{ fontSize: 12, color:'rgba(255,255,255,0.45)', letterSpacing:'0.04em', lineHeight:1.5 }}>
              {t.intakeSubtitle}
            </p>
          </div>

          {/* ── Vision card ── */}
          <div className="glass p-5 mb-3 text-center" style={emerge(200)}>
            <p style={{ fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.9)', lineHeight:1.5, marginBottom:10 }}>
              {t.visionTitle}
            </p>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.52)', lineHeight:1.65, marginBottom:12 }}>
              {t.visionBody}
            </p>
            <p style={{ fontSize:13.5, fontWeight:600, fontStyle:'italic', lineHeight:1.4,
              background:'linear-gradient(90deg, rgba(120,160,255,0.9), rgba(160,120,255,0.8))',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              backgroundClip:'text', paddingTop:12, borderTop:'0.5px solid rgba(255,255,255,0.08)' }}>
              {t.visionClosing}
            </p>
          </div>

          {/* ── Divider + time hint ── */}
          <div style={{ height:0.5, background:'rgba(255,255,255,0.07)', margin:'6px 0 10px', ...emerge(250) }} />
          <p className="text-center mb-4" style={{ fontSize:12, color:'rgba(255,255,255,0.28)', letterSpacing:'0.1px', ...emerge(280) }}>
            {t.timeHint}
          </p>

          {/* ── Bento grid ── */}
          <div className="grid grid-cols-2 gap-2.5 mb-2.5" style={emerge(300)}>
            {/* Cell 1 — Rol actual */}
            <div className="glass p-4" style={{ transform:'rotate(-0.3deg)' }}>
              <p style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.28)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                Rol actual
              </p>
              <p style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)', lineHeight:1.4 }}>
                Implementation Specialist
              </p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.38)', marginTop:2 }}>
                HubOS · 2026
              </p>
            </div>

            {/* Cell 2 — Idiomas */}
            <div className="glass p-4" style={{ transform:'rotate(0.3deg)' }}>
              <p style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.28)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                Idiomas
              </p>
              <p style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)' }}>
                5 languages
              </p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.38)', marginTop:2, letterSpacing:'0.06em' }}>
                ES · EN · IT · PT · GL
              </p>
            </div>

            {/* Cell 3 — Posicionamiento (full width) */}
            <div className="glass p-4 col-span-2">
              <p style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.28)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                Posicionamiento
              </p>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.72)', lineHeight:1.55 }}>
                Hospitality-Tech Generalist → Commercial SaaS
              </p>
            </div>
          </div>

          {/* ── How it works ── */}
          <div className="glass p-5 mb-2.5" style={emerge(360)}>
            <p style={{ fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.28)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:14 }}>
              {t.howItWorksTitle}
            </p>
            <div className="flex flex-col gap-3">
              {([
                { n:'1', text: t.step1 },
                { n:'2', text: t.step2 },
                { n:'3', text: t.step3 },
                { n:'4', text: (
                  <>{t.step3Label}{' '}
                    <strong style={{ color:'rgba(80,180,120,0.9)' }}>{t.endButtonFull}</strong>
                    {' '}{t.step3Rest}</>
                )},
              ] as { n:string; text:React.ReactNode }[]).map(({ n, text }) => (
                <div key={n} className="flex items-start gap-3">
                  <span className="flex items-center justify-center shrink-0 mt-0.5"
                    style={{ width:22, height:22, borderRadius:'50%', background:'rgba(60,90,200,0.2)', color:'rgba(120,160,255,0.9)', fontSize:11, fontWeight:700 }}>
                    {n}
                  </span>
                  <p style={{ fontSize:13.5, color:'rgba(255,255,255,0.6)', lineHeight:1.55 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Form ── */}
          <div className="glass p-5 mb-2.5" style={emerge(460)}>
            <div className="flex flex-col gap-3">
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:5 }}>
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
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:5 }}>
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

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.22)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:5 }}>
                    {t.labelCompany}
                  </label>
                  <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="input-glass" maxLength={100} autoComplete="organization" />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.22)', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:5 }}>
                    {t.labelRole}
                  </label>
                  <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className="input-glass" maxLength={100} />
                </div>
              </div>
            </div>
          </div>

          {error && <p style={{ color:'rgba(220,80,80,0.85)', fontSize:13, marginBottom:10 }}>{error}</p>}

          {/* ── CTA Button ── */}
          <div style={emerge(560)}>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-[15px] transition-all duration-200"
              style={isSubmitDisabled ? {
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.28)',
                cursor: 'not-allowed',
                border: '0.5px solid rgba(255,255,255,0.08)',
              } : isFullyFilled ? {
                background: 'linear-gradient(135deg, #3a55c0, #6030b8)',
                color: '#fff',
                boxShadow: '0 4px 28px rgba(60,85,192,0.4)',
                border: 'none',
              } : {
                background: 'linear-gradient(135deg, rgba(58,85,192,0.7), rgba(96,48,184,0.7))',
                color: 'rgba(255,255,255,0.85)',
                border: 'none',
              }}
            >
              {isLoading ? t.buttonStarting : t.buttonStart}
            </button>
            <p className="text-center mt-3" style={{ fontSize:12, color:'rgba(255,255,255,0.22)' }}>
              {t.timeHint}
            </p>
          </div>

        </form>

        <Footer />
      </div>

      {/* ── Avatar zoom overlay ── */}
      {avatarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ background:'rgba(0,0,0,0.6)' }} onClick={() => setAvatarOpen(false)}>
          <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl animate-scale-in">
            <img src="/assets/pablo-avatar.jpg" alt="Pablo Agis" className="w-full h-full object-cover object-top" />
          </div>
        </div>
      )}

      {/* ── SPLASH 1 ── */}
      {!splashDone && (
        <div
          ref={splashOverlayRef}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center pointer-events-none"
        >
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>

            {/* Wordmark */}
            <p ref={splashWmRef} style={{
              fontSize:10, fontWeight:500, color:'rgba(255,255,255,0.28)',
              letterSpacing:'0.22em', textTransform:'uppercase',
              marginBottom:52, opacity:0,
            }}>
              INTERVIEWMIND
            </p>

            {/* Avatar + ring + glow */}
            <div ref={splashAvRef} style={{ position:'relative', width:88, height:88, marginBottom:24, opacity:0, transform:'scale(0.68)' }}>
              {/* Glow */}
              <div ref={splashGlowRef} className="absolute inset-0 rounded-full" style={{ background:'rgba(80,110,220,0.18)' }} />
              {/* Spinning conic ring */}
              <div ref={splashRingRef} className="absolute inset-0 rounded-full" style={{
                background:'conic-gradient(from 0deg, rgba(60,90,200,0.7), rgba(100,60,180,0.5), rgba(40,130,160,0.55), rgba(60,90,200,0.7))',
                padding:2, opacity:0,
                animation:'ring-spin 3.5s linear infinite',
              }}>
                <div className="w-full h-full rounded-full" style={{ background:'#0d0f14' }} />
              </div>
              {/* Photo */}
              <div className="absolute rounded-full overflow-hidden" style={{ inset:3 }}>
                <img src="/assets/pablo-avatar.jpg" alt="Pablo Agis" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top', display:'block' }} />
              </div>
            </div>

            {/* Name */}
            <p ref={splashNameRef} className="gradient-text" style={{
              fontSize:28, fontWeight:700, letterSpacing:'-0.025em',
              marginBottom:6, opacity:0, transform:'translateX(-50px)',
            }}>
              Pablo Agis Burgos
            </p>

            {/* Role */}
            <p ref={splashRoleRef} style={{
              fontSize:12.5, color:'rgba(255,255,255,0.55)', letterSpacing:'0.04em',
              marginBottom:16, opacity:0, transform:'translateX(50px)',
            }}>
              SaaS &amp; Hospitality Tech
            </p>

            {/* Divider */}
            <div ref={splashDivRef} style={{
              width:200, height:0.5, marginBottom:20, transformOrigin:'center',
              background:'linear-gradient(90deg, transparent, rgba(100,130,255,0.5), transparent)',
              opacity:0, transform:'scaleX(0)',
            }} />

            {/* Tags */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
              {TAGS.map((tag, i) => (
                <span
                  key={tag}
                  ref={(el) => { splashTagsRef.current[i] = el; }}
                  style={{
                    padding:'5px 12px',
                    borderRadius:999,
                    background:'rgba(255,255,255,0.06)',
                    border:'0.5px solid rgba(255,255,255,0.14)',
                    fontSize:11.5, color:'rgba(255,255,255,0.55)',
                    opacity:0, transform:'translateY(24px)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
