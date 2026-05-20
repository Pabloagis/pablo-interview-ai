import { Message } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-5 overflow-x-hidden w-full`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm mr-2.5 mt-0.5 flex-shrink-0">
          P
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
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm ml-2.5 mt-0.5 flex-shrink-0">
          R
        </div>
      )}
    </div>
  );
}
