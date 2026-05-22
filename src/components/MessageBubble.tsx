import { Message } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  recruiterName?: string;
}

function getInitials(name?: string): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function MessageBubble({ message, recruiterName }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-5 overflow-x-hidden w-full`}>
      {!isUser && (
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm mr-3 mt-0.5 flex-shrink-0">
          <img src="/assets/pablo-avatar.jpg" alt="Pablo" className="w-full h-full object-cover object-top" />
        </div>
      )}

      <div className={`max-w-[70%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-blue-500 text-white rounded-tr-sm'
              : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
          }`}
        >
          {message.content}
        </div>
        <span className="text-xs text-gray-400 mt-1 px-1">
          {isUser ? 'You' : 'Pablo'} · {formatTimestamp(message.createdAt)}
        </span>
      </div>

      {isUser && (
        <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-[13px] ml-3 mt-0.5 flex-shrink-0 shadow-sm">
          {getInitials(recruiterName)}
        </div>
      )}
    </div>
  );
}
