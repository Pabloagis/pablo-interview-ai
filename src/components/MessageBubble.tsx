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
            className="w-9 h-9 rounded-full overflow-hidden mr-3 mt-0.5 flex-shrink-0 cursor-zoom-in transition-transform hover:scale-110 active:scale-95"
            style={{ border: '1.5px solid rgba(255,255,255,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
          >
            <img src="/assets/pablo-avatar.jpg" alt="Pablo" className="w-full h-full object-cover object-top" />
          </button>
        )}

        <div className={`max-w-[70%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div
            className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words"
            style={isUser ? {
              background: '#4060d0',
              color: '#ffffff',
              borderRadius: '16px 16px 4px 16px',
              boxShadow: '0 2px 12px rgba(64,96,208,0.3)',
            } : {
              background: 'rgba(255,255,255,0.07)',
              border: '0.5px solid rgba(255,255,255,0.10)',
              color: '#ffffff',
              borderRadius: '4px 16px 16px 16px',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            {message.content}
          </div>
          <span className="text-xs mt-1 px-1" style={{ color: 'rgba(255,255,255,0.28)' }}>
            {isUser ? 'You' : 'Pablo'} · {formatTimestamp(message.createdAt)}
          </span>
        </div>

        {isUser && (
          <button
            onClick={() => setAvatarOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[13px] ml-3 mt-0.5 flex-shrink-0 cursor-zoom-in transition-transform hover:scale-110 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #4060d0, #7040c0)',
              boxShadow: '0 2px 8px rgba(64,96,208,0.3)',
            }}
          >
            {getInitials(recruiterName)}
          </button>
        )}
      </div>

      {avatarOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setAvatarOpen(false)}
        >
          {isUser ? (
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-5xl animate-scale-in"
              style={{
                background: 'linear-gradient(135deg, #4060d0, #7040c0)',
                boxShadow: '0 0 0 4px rgba(255,255,255,0.12), 0 24px 80px rgba(0,0,0,0.56)',
              }}
            >
              {getInitials(recruiterName)}
            </div>
          ) : (
            <div
              className="w-32 h-32 rounded-full overflow-hidden animate-scale-in"
              style={{ border: '3px solid rgba(255,255,255,0.18)', boxShadow: '0 24px 80px rgba(0,0,0,0.56)' }}
            >
              <img src="/assets/pablo-avatar.jpg" alt="Pablo" className="w-full h-full object-cover object-top" />
            </div>
          )}
        </div>
      )}
    </>
  );
}
