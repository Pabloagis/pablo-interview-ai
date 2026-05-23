import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import { generateReport } from '@/lib/report';
import Background from '@/components/Background';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import InteractiveReport from '@/components/InteractiveReport';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function EmailPreviewPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  if (!id) notFound();

  const supabase = createServerSupabaseClient();
  const { data: session, error } = await supabase
    .from('sessions')
    .select('messages, recruiter_name, company')
    .eq('id', id)
    .single();

  if (error || !session) notFound();

  const messages = (session.messages ?? []) as Array<{ role: string; content: string }>;
  if (messages.filter(m => m.role === 'user').length < 1) notFound();

  let report;
  try {
    report = await generateReport({
      messages,
      recruiterName: session.recruiter_name,
      company: session.company,
    });
  } catch (err) {
    console.error('[email-preview] Report generation failed:', err);
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Background />
      <Header
        recruiterName={session.recruiter_name ?? undefined}
        company={session.company ?? undefined}
      />
      <main className="flex-1 w-full">
        <InteractiveReport
          report={report}
          recruiterName={session.recruiter_name}
          company={session.company}
        />
      </main>
      <Footer variant="compact" />
    </div>
  );
}
