'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SessionCreateRequest } from '@/lib/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function IntakeScreen() {
  const router = useRouter();
  const [recruiterName, setRecruiterName] = useState('');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [consentToEmail, setConsentToEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEmailValid = EMAIL_REGEX.test(email.trim());
  const showEmailError = emailTouched && email.trim() !== '' && !isEmailValid;
  const isSubmitDisabled = isLoading || !isEmailValid || !consentToEmail;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const body: SessionCreateRequest & { email: string; consentToEmail: boolean } = {
        recruiterName: recruiterName.trim() || undefined,
        company: company.trim() || undefined,
        role: role.trim() || undefined,
        email: email.trim(),
        consentToEmail,
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

      // Persist context so ChatPanel can read it without another DB call
      sessionStorage.setItem(
        `session_${sessionId}`,
        JSON.stringify({
          recruiterName: recruiterName.trim() || undefined,
          email: email.trim(),
          company: company.trim() || undefined,
          role: role.trim() || undefined,
          consentToEmail,
        })
      );

      router.push(`/interview/${sessionId}`);
    } catch (err) {
      console.error('Session creation error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors bg-white';

  const inputErrorClass =
    'w-full px-3 py-2.5 rounded-xl border border-red-300 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-colors bg-white';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12 w-full overflow-x-hidden">
      <div className="w-full max-w-md">
        {/* Logo + title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <span className="text-white font-bold text-xl">IM</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">InterviewMind</h1>
          <p className="text-gray-500 mt-2 text-sm">Interview his AI. Then interview him.</p>
        </div>

        {/* About card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
          <p className="text-gray-600 text-sm leading-relaxed">
            An interactive AI version of{' '}
            <strong className="text-gray-800">Pablo Agis Burgos</strong> — hospitality tech
            professional. Ask what you&apos;d ask any candidate: his background, decisions,
            projects, how he thinks.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">How it works</p>
          <div className="space-y-3">
            {[
              { n: '1', text: 'Introduce yourself below (optional)' },
              { n: '2', text: 'Ask Pablo anything you\'d ask in a real interview' },
              { n: '3', text: <>Click <span className="text-green-600 font-semibold">End Interview</span> when done — Pablo will email you his CV and materials</> },
            ].map(({ n, text }) => (
              <div key={n} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
                <p className="text-sm text-gray-600 leading-snug">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Intake form */}
        <form
          onSubmit={handleStart}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
        >
          <p className="text-sm font-medium text-gray-700 mb-4">
            Introduce yourself — Pablo will personalise the conversation
          </p>

          <div className="space-y-3 mb-5">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Your name</label>
              <input
                type="text"
                placeholder="e.g. Alice"
                value={recruiterName}
                onChange={(e) => setRecruiterName(e.target.value)}
                className={inputClass}
                maxLength={100}
                autoComplete="given-name"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Your email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="sarah@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                onBlur={() => setEmailTouched(true)}
                className={showEmailError ? inputErrorClass : inputClass}
                maxLength={254}
                autoComplete="email"
                required
              />
              {showEmailError && (
                <p className="mt-1 text-xs text-red-500">Please enter a valid email address</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Company</label>
              <input
                type="text"
                placeholder="e.g. Mews, Apaleo, HubOS"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={inputClass}
                maxLength={100}
                autoComplete="organization"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Role you&apos;re filling</label>
              <input
                type="text"
                placeholder="e.g. SDR, Account Executive, CSM"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={inputClass}
                maxLength={100}
              />
            </div>
          </div>

          {/* GDPR consent */}
          <div className="mb-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentToEmail}
                onChange={(e) => setConsentToEmail(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-500 accent-blue-500 flex-shrink-0"
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                I&apos;d like to receive an email with Pablo&apos;s interview summary and materials
              </span>
            </label>
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-sm"
          >
            {isLoading ? 'Starting…' : 'Start Interview'}
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            Name, company &amp; role optional · <span className="text-red-400">*</span> Email required
          </p>
        </form>
      </div>
    </div>
  );
}
