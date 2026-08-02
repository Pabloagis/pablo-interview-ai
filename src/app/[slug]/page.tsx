import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isPublicChatEnabled } from '@/lib/rate-limit';
import { BASE_URL } from '@/lib/base-url';
import PublicAgentChat from './PublicAgentChat';

export const dynamic = 'force-dynamic';

interface PublicProfile {
  slug: string;
  full_name: string;
  headline: string | null;
  avatar_url: string | null;
  published_at: string | null;
}

async function loadProfile(slug: string): Promise<PublicProfile | null> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('profiles')
    .select('slug, full_name, headline, avatar_url, published_at')
    .eq('slug', slug)
    .maybeSingle();
  if (!data || !data.published_at) return null; // 404 whether missing or unpublished
  return data as PublicProfile;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const profile = await loadProfile(slug);
  if (!profile) return { title: 'Not found', robots: { index: false, follow: false } };

  const title = `${profile.full_name} — AI interview`;
  const description = profile.headline ?? `Interview ${profile.full_name}'s AI agent.`;
  return {
    title,
    description,
    // Quiet job-hunters must not rank for their own name. Opt-in indexing comes later.
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${profile.slug}`,
      type: 'profile',
    },
  };
}

export default async function PublicAgentPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const profile = await loadProfile(slug);
  if (!profile) notFound();

  const candidate = {
    slug: profile.slug,
    name: profile.full_name,
    headline: profile.headline,
    avatarUrl: profile.avatar_url,
  };

  return (
    <PublicAgentChat candidate={candidate} enabled={isPublicChatEnabled()} />
  );
}
