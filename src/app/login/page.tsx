'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-auth-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (!data.user) {
        setError('Sign in failed. Please try again.');
        return;
      }

      // Fetch role to determine redirect
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        // Profile missing — send to the candidate hub as fallback
        router.push('/dashboard/candidate/trainer');
        return;
      }

      router.push(profile.role === 'recruiter' ? '/dashboard/recruiter' : '/dashboard/candidate/trainer');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0d0f14] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <Link href="/platform" className="text-sm text-[rgba(255,255,255,0.38)] hover:text-white transition-colors">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4 mb-1">Sign in</h1>
          <p className="text-sm text-[rgba(255,255,255,0.5)]">Welcome back to InterviewMind Platform.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[rgba(255,255,255,0.7)]">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.10)] text-white placeholder-[rgba(255,255,255,0.25)] text-sm focus:outline-none focus:border-[#4060d0] focus:ring-1 focus:ring-[#4060d0] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-[rgba(255,255,255,0.7)]">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.10)] text-white placeholder-[rgba(255,255,255,0.25)] text-sm focus:outline-none focus:border-[#4060d0] focus:ring-1 focus:ring-[#4060d0] transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-6 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors duration-150 mt-1"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-sm text-center text-[rgba(255,255,255,0.38)]">
          Don&apos;t have an account?{' '}
          <Link href="/platform" className="text-[#4060d0] hover:text-[#6080f0] transition-colors">
            Get started
          </Link>
        </p>
      </div>
    </main>
  );
}
