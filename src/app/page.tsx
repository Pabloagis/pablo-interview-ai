import { redirect } from 'next/navigation';

// Root points at Pablo's public agent — live recruiter outreach targets the root domain.
// Switching root to LandingScreen (already built, wired to /platform) is a deliberate
// one-line change for later.
export default function Home() {
  redirect('/pablo-agis-burgos');
}
