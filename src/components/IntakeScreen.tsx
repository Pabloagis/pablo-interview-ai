'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SessionCreateRequest } from '@/lib/types';

export default function IntakeScreen() {
  const router = useRouter();
  const [recruiterName, setRecruiterName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const body: SessionCreateRequest = {
        recruiterName: recruiterName.trim() || undefined,
        company: company.trim() || undefined,
        role: role.trim() || undefined,
      };

      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create session');
      }

      const { sessionId } = await response.json();

      // Persist context so the interview page can read it without another DB call
      sessionStorage.setItem(`session_${sessionId}`, JSON.stringify(body));

      router.push(`/interview/${sessionId}`);
    } catch (err) {
      console.error('Session creation error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors bg-white';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo + title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <span className="text-white font-bold text-xl">IM</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">InterviewMind</h1>
          <p className="text-gray-500 mt-2 text-sm">A real conversation with Pablo Agis Burgos</p>
        </div>

        {/* About card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
          <p className="text-gray-600 text-sm leading-relaxed">
            You&apos;re about to talk to an AI that represents{' '}
            <strong className="text-gray-800">Pablo Agis Burgos</strong> — a hospitality + SaaS
            professional with 7 years of hotel ops and 4 months of SaaS implementation at HubOS.
            Ask him anything you&apos;d ask in a real interview.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Opera PMS · 7 yrs', 'HubOS SaaS', 'London 6 yrs', 'EN · ES · IT · PT', 'Barcelona'].map(
              (tag) => (
                <span
                  key={tag}
                  className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium"
                >
                  {tag}
                </span>
              )
            )}
          </div>
        </div>

        {/* Intake form */}
        <form
          onSubmit={handleStart}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
        >
          <p className="text-sm font-medium text-gray-700 mb-4">
            Optional: introduce yourself to Pablo
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

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-sm"
          >
            {isLoading ? 'Starting…' : 'Start Interview'}
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            All fields optional · No account needed
          </p>
        </form>
      </div>
    </div>
  );
}
