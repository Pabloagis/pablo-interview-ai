// Single source of truth for the app's public URL.
//
// NEXT_PUBLIC_ prefix is required: this value is read from client components
// (SlugManager) as well as from server code (emails, OG metadata). Without the
// prefix Next.js strips it from the browser bundle and it arrives undefined.
//
// The literal below is the only place the production domain appears in code.
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, '') || 'https://interviewmind.one';

// Host without protocol, for places that display the URL rather than link to it.
export const BASE_HOST = BASE_URL.replace(/^https?:\/\//, '');
