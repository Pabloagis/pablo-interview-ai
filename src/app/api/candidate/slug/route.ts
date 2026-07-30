import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAuthClient } from '@/lib/supabase-auth-server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { slugifyName, generateUniqueSlug, isValidSlugFormat } from '@/lib/slug';

export const dynamic = 'force-dynamic';

async function requireCandidate() {
  const auth = await createServerSupabaseAuthClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const { data: profile } = await auth
    .from('profiles')
    .select('id, full_name, slug, published_at, role')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role === 'recruiter') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { profile };
}

// Availability of a specific candidate slug (format + reserved + uniqueness).
async function availability(slug: string, excludeUserId: string): Promise<{ available: boolean; reason?: string }> {
  if (!isValidSlugFormat(slug)) return { available: false, reason: 'Use lowercase letters, numbers and hyphens.' };
  const db = createServerSupabaseClient();
  const { data: reserved } = await db.from('reserved_slugs').select('slug').eq('slug', slug).maybeSingle();
  if (reserved) return { available: false, reason: 'That link is reserved.' };
  const { data: taken } = await db.from('profiles').select('id').eq('slug', slug).neq('id', excludeUserId).maybeSingle();
  if (taken) return { available: false, reason: 'That link is already taken.' };
  return { available: true };
}

// GET → current slug + editability; GET ?check=<slug> → live validation.
export async function GET(req: NextRequest) {
  const res = await requireCandidate();
  if ('error' in res) return res.error;
  const { profile } = res;

  const check = new URL(req.url).searchParams.get('check');
  if (check !== null) {
    return NextResponse.json(await availability(check, profile.id));
  }

  return NextResponse.json({
    slug: profile.slug ?? null,
    suggested: profile.slug ?? (slugifyName(profile.full_name) || 'candidate'),
    editable: profile.published_at == null, // read-only once published
  });
}

// POST { slug? } → save a chosen slug (validated) or auto-generate. Blocked once published.
export async function POST(req: NextRequest) {
  const res = await requireCandidate();
  if ('error' in res) return res.error;
  const { profile } = res;

  if (profile.published_at != null) {
    return NextResponse.json({ error: 'Your link is locked once published.' }, { status: 409 });
  }

  let requested: string | undefined;
  try { ({ slug: requested } = (await req.json()) as { slug?: string }); } catch { /* generate */ }

  const db = createServerSupabaseClient();
  let slug: string;

  if (requested && requested.trim()) {
    slug = requested.trim().toLowerCase();
    const a = await availability(slug, profile.id);
    if (!a.available) return NextResponse.json({ error: a.reason }, { status: 422 });
  } else {
    slug = await generateUniqueSlug(profile.full_name, db, profile.id);
  }

  const { error } = await db.from('profiles').update({ slug }).eq('id', profile.id);
  if (error) {
    console.error('[candidate/slug] update failed:', error);
    return NextResponse.json({ error: 'Could not save link' }, { status: 500 });
  }
  return NextResponse.json({ slug });
}
