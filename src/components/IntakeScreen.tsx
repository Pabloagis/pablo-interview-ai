'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SessionCreateRequest } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import Footer from './Footer';

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
  const [recruiterName, setRecruiterName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resumeSession, setResumeSession] = useState<ResumeState>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [pageEnter, setPageEnter] = useState(false);
  const splashOverlayRef = useRef<HTMLDivElement>(null);
  const splashAvRef     = useRef<HTMLDivElement>(null);
  const splashHaloRef   = useRef<HTMLDivElement>(null);
  const splashNameRef   = useRef<HTMLParagraphElement>(null);
  const splashDivRef    = useRef<HTMLDivElement>(null);
  const splashTagRef    = useRef<HTMLParagraphElement>(null);
  const splashWmRef     = useRef<HTMLParagraphElement>(null);

  // Skip before first paint for returning visitors
  useLayoutEffect(() => {
    if (sessionStorage.getItem('im_splash_shown')) { setSplashDone(true); setPageEnter(true); }
  }, []);

  // JS rAF animation — mirrors the reference HTML exactly
  useEffect(() => {
    if (sessionStorage.getItem('im_splash_shown')) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const rafs: number[] = [];
    const after = (fn: () => void, ms: number) => { const id = setTimeout(fn, ms); timers.push(id); };
    const tick  = (fn: FrameRequestCallback) => { const id = requestAnimationFrame(fn); rafs.push(id); return id; };
    const eo3  = (t: number) => 1 - Math.pow(1-t, 3);
    const eio4 = (t: number) => t < 0.5 ? 8*t*t*t*t : 1 - Math.pow(-2*t+2, 4)/2;

    function spring(el: HTMLElement, from: number, peak: number, fin: number, dur: number, delay: number) {
      after(() => {
        const s = performance.now(), h = dur * 0.55;
        function f(now: number) {
          const e = now-s, sc = e < h ? from+(peak-from)*eo3(e/h) : peak+(fin-peak)*eo3((e-h)/(dur-h));
          el.style.transform = `scale(${sc.toFixed(4)})`; el.style.opacity = Math.min(e/(dur*0.38),1).toFixed(4);
          if (e < dur) tick(f); else { el.style.transform='scale(1)'; el.style.opacity='1'; }
        }
        tick(f);
      }, delay);
    }
    function fadeSlide(el: HTMLElement, yFrom: number, dur: number, delay: number, maxOp: number) {
      after(() => {
        const s = performance.now();
        function f(now: number) {
          const raw = Math.min((now-s)/dur, 1), p = eo3(raw);
          el.style.opacity = (raw*maxOp).toFixed(4); el.style.transform = `translateY(${(yFrom*(1-p)).toFixed(2)}px)`;
          if (raw < 1) tick(f);
        }
        tick(f);
      }, delay);
    }
    function scaleXAnim(el: HTMLElement, dur: number, delay: number) {
      after(() => {
        const s = performance.now();
        function f(now: number) {
          const raw = Math.min((now-s)/dur, 1), p = eo3(raw);
          el.style.opacity = (raw*0.65).toFixed(4); el.style.transform = `scaleX(${p.toFixed(4)})`;
          if (raw < 1) tick(f);
        }
        tick(f);
      }, delay);
    }
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

    const ov=splashOverlayRef.current, av=splashAvRef.current, hl=splashHaloRef.current;
    const nm=splashNameRef.current, dv=splashDivRef.current, tg=splashTagRef.current, wm=splashWmRef.current;
    if (!ov||!av||!hl||!nm||!dv||!tg||!wm) return;

    spring(av, 0.52, 1.04, 1.0, 680, 0);
    after(() => { hl.style.animation = '_s1Hb 2.8s ease-in-out infinite'; }, 380);
    fadeSlide(nm, 18, 380, 320, 1);
    scaleXAnim(dv, 280, 470);
    fadeSlide(tg, 14, 420, 610, 0.8);
    fadeIn(wm, 480, 780, 0.72);

    after(() => {
      if (!ov) return;
      const _ov = ov;
      hl.style.animation = 'none';
      const s = performance.now();
      function exit(now: number) {
        const raw = Math.min((now-s)/480, 1), p = eio4(raw);
        _ov.style.opacity = (1-p).toFixed(4);
        _ov.style.transform = `translateY(${(-48*p).toFixed(1)}px) scale(${(1-0.015*p).toFixed(4)})`;
        _ov.style.filter = `blur(${(5*p).toFixed(1)}px)`;
        if (raw < 1) tick(exit);
        else {
          setSplashDone(true);
          sessionStorage.setItem('im_splash_shown', '1');
          requestAnimationFrame(() => requestAnimationFrame(() => setPageEnter(true)));
        }
      }
      tick(exit);
    }, 3260);

    return () => { timers.forEach(clearTimeout); rafs.forEach(cancelAnimationFrame); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check for an unfinished session in localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('im_last_session');
      if (!raw) return;
      const data = JSON.parse(raw) as {
        sessionId: string;
        recruiterName?: string;
        company?: string;
        ended?: boolean;
      };
      if (data.ended) return;
      const msgsRaw = localStorage.getItem(`im_chat_${data.sessionId}`);
      const msgs: unknown[] = msgsRaw ? JSON.parse(msgsRaw) : [];
      if (Array.isArray(msgs) && msgs.length > 0) {
        setResumeSession({
          sessionId: data.sessionId,
          recruiterName: data.recruiterName,
          company: data.company,
          messageCount: msgs.length,
        });
      }
    } catch {
      localStorage.removeItem('im_last_session');
    }
  }, []);

  const handleResume = () => {
    try {
      const raw = localStorage.getItem('im_last_session');
      if (!raw) return;
      const data = JSON.parse(raw) as {
        sessionId: string;
        recruiterName?: string;
        email?: string;
        company?: string;
        role?: string;
        consentToEmail?: boolean;
      };
      sessionStorage.setItem(
        `session_${data.sessionId}`,
        JSON.stringify({
          recruiterName: data.recruiterName,
          email: data.email,
          company: data.company,
          role: data.role,
          consentToEmail: data.consentToEmail,
        })
      );
      router.push(`/interview/${data.sessionId}`);
    } catch {
      setResumeSession(null);
    }
  };

  const handleDismissResume = () => {
    try {
      const raw = localStorage.getItem('im_last_session');
      if (raw) {
        const data = JSON.parse(raw) as { sessionId: string };
        localStorage.removeItem(`im_chat_${data.sessionId}`);
      }
    } catch {}
    localStorage.removeItem('im_last_session');
    setResumeSession(null);
  };

  const isNameValid = recruiterName.trim().length > 0;
  const showNameError = nameTouched && !isNameValid;
  const isEmailValid = EMAIL_REGEX.test(email.trim());
  const showEmailError = emailTouched && email.trim() !== '' && !isEmailValid;
  const isNameEmailReady = isNameValid && isEmailValid;
  const isFullyFilled = isNameEmailReady && company.trim().length > 0 && role.trim().length > 0;
  const isSubmitDisabled = isLoading || !isNameEmailReady;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const body: SessionCreateRequest & { email: string; consentToEmail: boolean } = {
        recruiterName: recruiterName.trim(),
        company: company.trim() || undefined,
        role: role.trim() || undefined,
        email: email.trim(),
        consentToEmail: true,
      };

      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Something went wrong. Please try again.');
        setIsLoading(false);
        return;
      }

      const { sessionId } = await response.json();

      const sessionContext = {
        recruiterName: recruiterName.trim(),
        email: email.trim(),
        company: company.trim() || undefined,
        role: role.trim() || undefined,
        consentToEmail: true,
      };

      sessionStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionContext));

      localStorage.setItem(
        'im_last_session',
        JSON.stringify({ sessionId, ...sessionContext })
      );

      router.push(`/interview/${sessionId}`);
    } catch (err) {
      console.error('Session creation error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 rounded-xl border border-[#ddd] text-base text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#2d6cdf] focus:ring-1 focus:ring-[#2d6cdf]/20 transition-colors bg-[#fafafa] focus:bg-white';

  const inputErrorClass =
    'w-full px-3 py-2.5 rounded-xl border border-red-300 text-base text-gray-800 placeholder-gray-300 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20 transition-colors bg-[#fafafa] focus:bg-white';

  const card = 'bg-white rounded-2xl border border-[#e8e5e0] shadow-sm p-5';

  return (
    <div
      className="relative min-h-screen bg-[#f8f7f4] flex flex-col items-center px-4 py-12 w-full overflow-x-hidden"
      style={{
        opacity: pageEnter ? 1 : 0,
        transform: pageEnter ? 'translateY(0)' : 'translateY(36px)',
        transition: 'opacity 480ms cubic-bezier(.76,0,.24,1) 220ms, transform 480ms cubic-bezier(.76,0,.24,1) 220ms',
      }}
    >
      <div className="absolute top-3 right-3">
        <LanguageSwitcher />
      </div>

      {resumeSession && (
        <div className="w-full max-w-[440px] sm:max-w-[640px] lg:max-w-[760px] mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-blue-800">
              Resume your session
              {resumeSession.recruiterName && (
                <span className="font-medium"> with {resumeSession.recruiterName}</span>
              )}
              {resumeSession.company && (
                <span className="text-blue-600"> ({resumeSession.company})</span>
              )}
              <span className="text-blue-500 text-xs ml-1">
                · {resumeSession.messageCount} message{resumeSession.messageCount !== 1 ? 's' : ''}
              </span>
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResume}
                className="text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={handleDismissResume}
                className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1.5 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleStart} className="w-full max-w-[440px] sm:max-w-[640px] lg:max-w-[760px]">

        {/* ── Header ── */}
        <div className="flex flex-col items-center gap-3 mb-7 text-center">
          <button
            type="button"
            onClick={() => setAvatarOpen(true)}
            className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-200 flex-shrink-0 cursor-zoom-in transition-transform hover:scale-110 active:scale-95"
          >
            <img src="/assets/pablo-avatar.jpg" alt="Pablo Agis" className="w-full h-full object-cover object-top" />
          </button>
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">
            {t.emptyGreeting}
          </h1>
          <p className="text-[13px] text-gray-500 leading-snug">{t.intakeSubtitle}</p>
        </div>

        {/* ── Vision card ── */}
        <div className={`${card} mb-3 text-center`}>
          <p className="text-sm font-bold text-gray-900 leading-snug mb-3">{t.visionTitle}</p>
          <p className="text-[13.5px] text-gray-500 leading-relaxed mb-3">{t.visionBody}</p>
          <p className="text-[14px] font-semibold text-[#2d6cdf] italic leading-snug pt-3 border-t border-[#f0ede8]">
            {t.visionClosing}
          </p>
        </div>

        {/* ── Divider ── */}
        <hr className="border-t border-[#e8e5e0] my-1" />

        {/* ── Time hint ── */}
        <p className="text-[12.5px] text-gray-400 text-center tracking-[0.1px] my-3">
          {t.timeHint}
        </p>

        {/* ── How this works ── */}
        <div className={`${card} mb-3`}>
          <p className="text-[10.5px] font-bold text-gray-300 uppercase tracking-[0.8px] mb-3">
            {t.howItWorksTitle}
          </p>
          <div className="flex flex-col gap-3">
            {([
              { n: '1', text: t.step1 },
              { n: '2', text: t.step2 },
              { n: '3', text: t.step3 },
              { n: '4', text: (
                <>{t.step3Label}{' '}
                  <strong className="text-green-700 font-semibold">{t.endButtonFull}</strong>
                  {' '}{t.step3Rest}</>
              )},
            ] as { n: string; text: React.ReactNode }[]).map(({ n, text }) => (
              <div key={n} className="flex items-start gap-3">
                <span className="w-[22px] h-[22px] rounded-full bg-blue-50 text-blue-500 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {n}
                </span>
                <p className="text-[13.5px] text-gray-600 leading-snug">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Intake form fields ── */}
        <div className={`${card} mb-3`}>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.4px] mb-1">
                {t.labelName} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder={t.placeholderName}
                value={recruiterName}
                onChange={(e) => setRecruiterName(e.target.value)}
                onBlur={() => setNameTouched(true)}
                className={showNameError ? inputErrorClass : inputClass}
                maxLength={100}
                autoComplete="given-name"
                required
              />
              {showNameError && (
                <p className="mt-1 text-xs text-red-500">{t.nameError}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.4px] mb-1">
                {t.labelEmail} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="alex@company.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                onBlur={() => setEmailTouched(true)}
                className={showEmailError ? inputErrorClass : inputClass}
                maxLength={254}
                autoComplete="email"
                required
              />
              {showEmailError && (
                <p className="mt-1 text-xs text-red-500">{t.emailError}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-[0.4px] mb-1">
                  {t.labelCompany}
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={inputClass}
                  maxLength={100}
                  autoComplete="organization"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-[0.4px] mb-1">
                  {t.labelRole}
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={inputClass}
                  maxLength={100}
                />
              </div>
            </div>
          </div>
        </div>

        {error &&<p className="text-red-500 text-sm mb-3">{error}</p>}

        {/* ── Start button ── */}
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className={[
            'w-full font-bold py-3.5 px-4 rounded-xl transition-all text-[15px]',
            isSubmitDisabled
              ? 'bg-[#dde5f5] text-[#8aa5d8] cursor-not-allowed'
              : isFullyFilled
              ? 'bg-gradient-to-r from-[#059669] to-[#15803d] text-white shadow-lg shadow-emerald-700/30 hover:shadow-xl hover:shadow-emerald-700/40 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
              : 'bg-[#4d8f6e] text-white hover:opacity-90 active:opacity-80 cursor-pointer',
          ].join(' ')}
        >
          {isLoading ? t.buttonStarting : t.buttonStart}
        </button>

      </form>
      <Footer />

      {avatarOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setAvatarOpen(false)}
        >
          <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-white shadow-2xl animate-scale-in">
            <img src="/assets/pablo-avatar.jpg" alt="Pablo Agis" className="w-full h-full object-cover object-top" />
          </div>
        </div>
      )}

      {/* SPLASH 1 — JS rAF animated, self-contained */}
      {!splashDone && (
        <>
          <style>{`@keyframes _s1Hb{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.15);opacity:.55}}`}</style>
          <div
            ref={splashOverlayRef}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none', background: '#f0eeea',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div ref={splashAvRef} style={{ position: 'relative', width: 88, height: 88, marginBottom: 24, opacity: 0, transform: 'scale(0.52)' }}>
                <div ref={splashHaloRef} style={{
                  position: 'absolute', borderRadius: '50%',
                  width: 148, height: 148, top: -30, left: -30,
                  background: 'radial-gradient(circle, rgba(120,130,150,.22) 0%, transparent 68%)',
                }} />
                <div style={{
                  position: 'relative', width: '100%', height: '100%',
                  borderRadius: '50%', overflow: 'hidden',
                  border: '1.5px solid rgba(180,185,195,.55)',
                  boxShadow: '0 4px 20px rgba(0,0,0,.07)',
                }}>
                  <img src="/assets/pablo-avatar.jpg" alt="Pablo Agis" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                </div>
              </div>
              <p ref={splashNameRef} style={{ fontSize: 22, fontWeight: 700, color: '#0d1117', letterSpacing: '-0.01em', marginBottom: 14, opacity: 0, transform: 'translateY(18px)' }}>
                Pablo Agis Burgos
              </p>
              <div ref={splashDivRef} style={{ width: 110, height: 0.5, background: 'rgba(100,105,115,.25)', marginBottom: 12, transformOrigin: 'center', opacity: 0, transform: 'scaleX(0)' }} />
              <p ref={splashTagRef} style={{ fontSize: 11.5, color: '#7a8090', letterSpacing: '0.04em', opacity: 0, transform: 'translateY(14px)' }}>
                SaaS · Hospitality Tech · Sales
              </p>
              <p ref={splashWmRef} style={{ fontSize: 11, fontWeight: 500, color: '#a8adb8', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 40, opacity: 0 }}>
                InterviewMind
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
