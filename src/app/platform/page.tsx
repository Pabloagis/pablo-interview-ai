import type { Metadata } from 'next';
import LandingScreen from '@/components/LandingScreen';

export const metadata: Metadata = {
  title: 'InterviewMind Platform',
  description: 'Connect candidates and recruiters through AI-powered interviews.',
};

export default function PlatformPage() {
  return <LandingScreen />;
}
