'use client';

import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-auth-browser';
import { usePlatformT } from '@/context/platform-i18n';

// `className` lets a compact host (the trainer's account menu) drop the standalone
// button chrome without a second copy of the sign-out logic.
export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const t = usePlatformT();

  async function handleLogout() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <button
      onClick={handleLogout}
      className={
        className ??
        'px-4 py-2 text-sm text-[rgba(255,255,255,0.6)] border border-[rgba(255,255,255,0.12)] rounded-lg hover:text-white hover:border-[rgba(255,255,255,0.3)] transition-colors cursor-pointer'
      }
    >
      {t.nav_signout}
    </button>
  );
}
