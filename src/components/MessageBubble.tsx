'use client';

import { useState } from 'react';
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
  const [avatarOpen, setAvatarOpen] = useState(false);

  return (
    <>
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-5 overflow-x-hidden w-full`}>
        {!isUser && (
          <button
            onClick={() => setAvatarOpen(true)}
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm mr-3 mt-0.5 flex-shrink-0 cursor-zoom-in transition-transform hover:scale-110 active:scale-95"
          >
            <img src="/assets/pablo-avatar.jpg" alt="Pablo" className="w-full h-full object-cover object-top" />
          </button>
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
          <button
            onClick={() => setAvatarOpen(true)}
            className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-[13px] ml-3 mt-0.5 flex-shrink-0 shadow-sm cursor-zoom-in transition-transform hover:scale-110 active:scale-95"
          >
            {getInitials(recruiterName)}
          </button>
        )}
      </div>

      {avatarOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setAvatarOpen(false)}
        >
          {isUser ? (
            <div className="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-5xl shadow-2xl animate-scale-in">
              {getInitials(recruiterName)}
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl animate-scale-in">
              <img src="/assets/pablo-avatar.jpg" alt="Pablo" className="w-full h-full object-cover object-top" />
            </div>
          )}
        </div>
      )}
    </>
  );
}
