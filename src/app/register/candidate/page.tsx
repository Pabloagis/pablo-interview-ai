'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-auth-browser';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { usePlatformT } from '@/context/platform-i18n';
import { Button, Input } from '@/components/ui';

export default function RegisterCandidatePage() {
  const router = useRouter();
  const t = usePlatformT();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/login`,
          data: { full_name: fullName },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const user = data.user;
      if (!user) {
        setError(t.reg_failed);
        return;
      }

      if (!data.session) {
        setInfo(t.reg_confirm_email);
        return;
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        role: 'candidate',
        full_name: fullName,
      });

      if (profileError) {
        setError(t.reg_profile_failed);
        return;
      }

      router.push('/dashboard/candidate/trainer');
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
            {t.reg_title}
          </h1>
          <p className="text-[var(--body-sm)] text-[var(--text-secondary)]">{t.reg_subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label={t.reg_full_name}
            variant="outline"
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder={t.reg_name_ph}
          />

          <Input
            label={t.auth_email}
            variant="outline"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t.reg_email_ph}
          />

          <Input
            label={t.auth_password}
            variant="outline"
            type="password"
            required
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t.reg_password_ph}
          />

          {error && (
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--accent)]">
              {error}
            </p>
          )}

          {info && (
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--interactive)]">
              {info}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={loading} className="w-full mt-1">
            {loading ? t.reg_creating : t.reg_create}
          </Button>
        </form>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-disabled)] text-center">
          {t.reg_have_account}{' '}
          <Link href="/login" className="text-[var(--interactive)] hover:text-[var(--text-primary)] transition-colors duration-[180ms]">
            {t.reg_signin}
          </Link>
        </p>

      </div>
    </main>
  );
}
