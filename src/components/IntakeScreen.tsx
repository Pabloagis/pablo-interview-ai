'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
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
  const [splashPhase, setSplashPhase] = useState<'hero' | 'fading' | 'done'>('hero');

  // Skip splash instantly (before first paint) for returning visitors — prevents white flash
  useLayoutEffect(() => {
    if (sessionStorage.getItem('im_splash_shown')) setSplashPhase('done');
  }, []);

  // Run animation sequence only on genuine first visit
  useEffect(() => {
    if (sessionStorage.getItem('im_splash_shown')) return;
    // wordmark ends at 780+480=1260ms, hold 2000ms → exit at 3260ms
    const t1 = setTimeout(() => setSplashPhase('fading'), 3260);
    const t2 = setTimeout(() => {
      setSplashPhase('done');
      sessionStorage.setItem('im_splash_shown', '1');
    }, 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

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
      className={`relative min-h-screen bg-[#f8f7f4] flex flex-col items-center px-4 py-12 w-full overflow-x-hidden ${splashPhase === 'hero' ? 'opacity-0 translate-y-9' : 'opacity-100 translate-y-0'}`}
      style={splashPhase === 'fading' ? {
        transitionProperty: 'opacity, transform',
        transitionDuration: '480ms',
        transitionDelay: '220ms',
        transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)',
      } : undefined}
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

      {/* SPLASH 1 — self-contained, no globals.css dependency */}
      {splashPhase !== 'done' && (
        <>
          <style>{`
            @keyframes _s1Av { 0%{transform:scale(.52);opacity:0} 65%{transform:scale(1.04);opacity:1} 100%{transform:scale(1);opacity:1} }
            @keyframes _s1Hi { from{opacity:0} to{opacity:1} }
            @keyframes _s1Hb { 0%,100%{transform:scale(1);opacity:.85} 50%{transform:scale(1.18);opacity:.4} }
            @keyframes _s1Nm { from{transform:translateY(18px);opacity:0} to{transform:translateY(0);opacity:1} }
            @keyframes _s1Sp { from{transform:scaleX(0);opacity:0} to{transform:scaleX(1);opacity:1} }
            @keyframes _s1Tg { from{transform:translateY(14px);opacity:0} to{transform:translateY(0);opacity:.8} }
            @keyframes _s1Br { from{opacity:0} to{opacity:.72} }
            @keyframes _s1Ex { from{transform:translateY(0) scale(1);filter:blur(0px);opacity:1} to{transform:translateY(-48px) scale(.985);filter:blur(5px);opacity:0} }
          `}</style>
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none', background: '#f0eeea',
              animation: splashPhase === 'fading' ? '_s1Ex 0.48s cubic-bezier(.76,0,.24,1) both' : undefined,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

              {/* Avatar + halo */}
              <div style={{
                position: 'relative', width: 88, height: 88, marginBottom: 24,
                animation: '_s1Av 0.68s cubic-bezier(.34,1.56,.64,1) 0s both',
              }}>
                <div style={{
                  position: 'absolute', borderRadius: '50%',
                  width: 148, height: 148, top: -30, left: -30,
                  background: 'radial-gradient(circle, rgba(120,130,150,.22) 0%, transparent 68%)',
                  animation: '_s1Hi .3s ease-out .08s both, _s1Hb 2.8s ease-in-out .38s infinite',
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

              {/* Name */}
              <p style={{
                fontSize: 22, fontWeight: 700, color: '#0d1117',
                letterSpacing: '-0.01em', marginBottom: 14,
                animation: '_s1Nm .38s cubic-bezier(.33,1,.68,1) .32s both',
              }}>
                Pablo Agis Burgos
              </p>

              {/* Divider */}
              <div style={{
                width: 110, height: 0.5,
                background: 'rgba(100,105,115,.25)', marginBottom: 12,
                transformOrigin: 'center',
                animation: '_s1Sp .28s cubic-bezier(.33,1,.68,1) .47s both',
              }} />

              {/* Tagline */}
              <p style={{
                fontSize: 11.5, color: '#7a8090', letterSpacing: '0.04em',
                animation: '_s1Tg .42s cubic-bezier(.33,1,.68,1) .61s both',
              }}>
                SaaS · Hospitality Tech · Sales
              </p>

              {/* Wordmark */}
              <p style={{
                fontSize: 11, fontWeight: 500, color: '#a8adb8',
                letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 40,
                animation: '_s1Br .48s cubic-bezier(.33,1,.68,1) .78s both',
              }}>
                InterviewMind
              </p>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
