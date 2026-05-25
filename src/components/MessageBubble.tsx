'use client';

import { useState } from 'react';
import { Message } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  recruiterName?: string;
  onPlay?: () => void;
  isPlaying?: boolean;
  onStop?: () => void;
}

function getInitials(name?: string): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function MessageBubble({ message, recruiterName, onPlay, isPlaying, onStop }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [avatarOpen, setAvatarOpen] = useState(false);

  return (
    <>
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-5 overflow-x-hidden w-full`}>
        {!isUser && (
          <button
            onClick={() => setAvatarOpen(true)}
            className="w-9 h-9 rounded-full overflow-hidden mr-3 mt-0.5 flex-shrink-0 cursor-zoom-in transition-transform hover:scale-110 active:scale-95"
            style={{ border: '1.5px solid var(--avatar-border)', boxShadow: 'var(--avatar-shadow)' }}
          >
            <img src="/assets/pablo-avatar.jpg" alt="Pablo" className="w-full h-full object-cover object-top" />
          </button>
        )}

        <div className={`max-w-[70%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div
            className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words"
            style={isUser ? {
              background: 'var(--accent-primary)',
              color: '#ffffff',
              borderRadius: '16px 16px 4px 16px',
              boxShadow: '0 2px 12px var(--accent-glow)',
            } : {
              background: 'var(--bubble-pablo-bg)',
              border: '0.5px solid var(--bubble-pablo-border)',
              color: 'var(--bubble-pablo-text)',
              borderRadius: '4px 16px 16px 16px',
              boxShadow: 'var(--bubble-pablo-shadow)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            {message.content}
          </div>
          <span className="text-xs mt-1 px-1 flex items-center gap-1.5" style={{ color: 'var(--timestamp)' }}>
            {isUser ? 'You' : 'Pablo'} · {formatTimestamp(message.createdAt)}
            {!isUser && onPlay && (
              <button
                onClick={isPlaying ? onStop : onPlay}
                aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
                className="flex items-center transition-opacity opacity-40 hover:opacity-80 active:scale-90"
                style={{ color: isPlaying ? 'var(--accent-mid)' : 'inherit' }}
              >
                {isPlaying ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12m-3.536-9.536a5 5 0 000 7.072" />
                  </svg>
                )}
              </button>
            )}
          </span>
        </div>

        {isUser && (
          <button
            onClick={() => setAvatarOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[13px] ml-3 mt-0.5 flex-shrink-0 cursor-zoom-in transition-transform hover:scale-110 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
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
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
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
