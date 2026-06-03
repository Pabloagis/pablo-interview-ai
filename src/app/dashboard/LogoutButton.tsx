'use client';

import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-auth-browser';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <button
      onClick={handleLogout}
      className="mt-6 px-4 py-2 text-sm text-[rgba(255,255,255,0.6)] border border-[rgba(255,255,255,0.12)] rounded-lg hover:text-white hover:border-[rgba(255,255,255,0.3)] transition-colors cursor-pointer"
    >
      Sign out
    </button>
  );
}
