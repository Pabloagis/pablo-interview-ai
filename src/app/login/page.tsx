'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-auth-browser';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { usePlatformT } from '@/context/platform-i18n';
import { Button, Input } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const t = usePlatformT();
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
        setError(t.login_failed);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        router.push('/dashboard/candidate/trainer');
        return;
      }

      router.push(profile.role === 'recruiter' ? '/dashboard/recruiter' : '/dashboard/candidate/trainer');
    } catch {
      setError(t.auth_generic_error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Nav row */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/platform"
            className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-[180ms]"
          >
            {t.auth_back}
          </Link>
          <LanguageSwitcher />
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-[var(--heading)] font-medium leading-tight tracking-[-0.01em] text-[var(--text-display)] mb-1">
            {t.login_title}
          </h1>
          <p className="text-[var(--body-sm)] text-[var(--text-secondary)]">{t.login_subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label={t.auth_email}
            variant="outline"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t.login_email_ph}
            error={undefined}
          />

          <Input
            label={t.auth_password}
            variant="outline"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t.login_password_ph}
          />

          {error && (
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--accent)]">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={loading} className="w-full mt-1">
            {loading ? t.login_signing : t.login_signin}
          </Button>
        </form>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-disabled)] text-center">
          {t.login_no_account}{' '}
          <Link href="/platform" className="text-[var(--interactive)] hover:text-[var(--text-primary)] transition-colors duration-[180ms]">
            {t.login_get_started}
          </Link>
        </p>

      </div>
    </main>
  );
}
