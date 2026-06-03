import { NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/login';

  if (code) {
    const supabase = await createServerSupabaseAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}?confirmed=1`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
