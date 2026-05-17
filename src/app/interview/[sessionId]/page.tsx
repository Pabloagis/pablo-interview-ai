import ChatPanel from '@/components/ChatPanel';

// Next.js 15: params is a Promise
interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function InterviewPage({ params }: Props) {
  const { sessionId } = await params;
  return <ChatPanel sessionId={sessionId} />;
}
