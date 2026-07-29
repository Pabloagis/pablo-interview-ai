import type { createServerSupabaseClient } from './supabase';

type SupabaseAdmin = ReturnType<typeof createServerSupabaseClient>;

/**
 * Name → URL slug. Handles accents (Agís, Muñoz, Gonçalves) via NFD normalization
 * + combining-mark stripping (̀-ͯ covers accents, tilde, cedilla).
 */
export function slugifyName(input: string): string {
  const base = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')     // any run of non-alphanumerics → single hyphen
    .replace(/^-+|-+$/g, '');        // trim leading/trailing hyphens
  return base.slice(0, 60).replace(/-+$/g, ''); // truncate to 60, re-trim a cut hyphen
}

/**
 * Produce a slug unique across reserved_slugs and profiles.slug.
 * base → base-2 → base-3 … up to base-50, then a stable timestamp fallback.
 * `excludeUserId` lets a user keep their own slug when re-saving.
 */
export async function generateUniqueSlug(
  fullName: string,
  supabaseAdmin: SupabaseAdmin,
  excludeUserId?: string,
): Promise<string> {
  const base = slugifyName(fullName) || 'candidate';

  for (let i = 1; i <= 50; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;

    const { data: reserved } = await supabaseAdmin
      .from('reserved_slugs')
      .select('slug')
      .eq('slug', candidate)
      .maybeSingle();
    if (reserved) continue;

    let query = supabaseAdmin.from('profiles').select('id').eq('slug', candidate);
    if (excludeUserId) query = query.neq('id', excludeUserId);
    const { data: taken } = await query.maybeSingle();
    if (!taken) return candidate;
  }

  // Exhausted -2…-50 (extremely unlikely): stable, unique fallback.
  return `${base}-${Date.now().toString(36)}`;
}

/** Format guard used by the slug-management endpoint. Mirrors slugifyName's output rules. */
export function isValidSlugFormat(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 1 && slug.length <= 60;
}
