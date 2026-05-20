import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'InterviewMind — Talk to Pablo',
  description:
    'An AI interview simulator. Talk to Pablo Agis Burgos — hospitality + SaaS professional with 7 years of hotel ops and hands-on SaaS implementation experience.',
  openGraph: {
    title: 'InterviewMind — Pablo Agis Burgos',
    description:
      'Ask anything you\'d ask in a real interview. Pablo has 7 years of hospitality ops + SaaS implementation experience at HubOS.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
