'use client';

import { useState } from 'react';
import { Message } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import Tooltip from './Tooltip';

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
  const { t } = useLanguage();

  return (
    <>
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-5 overflow-x-hidden w-full`}>

        {/* Agent avatar */}
        {!isUser && (
          <button
            onClick={() => setAvatarOpen(true)}
            aria-label="View avatar"
            className="w-8 h-8 rounded-full overflow-hidden mr-3 mt-0.5 flex-shrink-0 cursor-zoom-in transition-opacity hover:opacity-75 active:opacity-50 border border-[var(--border-visible)]"
          >
            <img src="/assets/pablo-avatar.jpg" alt="Pablo" className="w-full h-full object-cover object-top" />
          </button>
        )}

        <div className={`max-w-[70%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Bubble */}
          <div
            className={[
              'text-[16px] leading-relaxed whitespace-pre-wrap break-words',
              isUser
                ? 'bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)]'
                : 'px-0 py-1 text-[var(--text-primary)]',
            ].join(' ')}
          >
            {message.content}
          </div>

          {/* Timestamp row */}
          <div className="mt-1.5 px-0.5 flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-disabled)]">
              {isUser ? 'You' : 'Pablo'} · {formatTimestamp(message.createdAt)}
            </span>

            {/* Audio control — agent messages only */}
            {!isUser && onPlay && (
              <Tooltip text={isPlaying ? t.playingIndicator : t.playMessage} position="top">
                <button
                  onClick={isPlaying ? onStop : onPlay}
                  aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
                  className={[
                    'flex items-center justify-center rounded-full w-5 h-5',
                    'border transition-colors duration-[180ms]',
                    isPlaying
                      ? 'border-[var(--interactive)] text-[var(--interactive)]'
                      : 'border-[var(--border-visible)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  {isPlaying ? (
                    <svg width="8" height="8" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="5" y="4" width="5" height="16" rx="1" />
                      <rect x="14" y="4" width="5" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg width="9" height="9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12m-3.536-9.536a5 5 0 000 7.072" />
                    </svg>
                  )}
                </button>
              </Tooltip>
            )}
          </div>
        </div>

        {/* User avatar (initials) */}
        {isUser && (
          <button
            onClick={() => setAvatarOpen(true)}
            aria-label="View avatar"
            className="w-8 h-8 rounded-full flex items-center justify-center ml-3 mt-0.5 flex-shrink-0 cursor-zoom-in transition-opacity hover:opacity-75 active:opacity-50 border border-[var(--border-visible)] bg-[var(--surface-raised)]"
          >
            <span className="font-mono text-[11px] text-[var(--text-secondary)]">
              {getInitials(recruiterName)}
            </span>
          </button>
        )}
      </div>

      {/* Avatar zoom overlay — no blur */}
      {avatarOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center cursor-zoom-out"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setAvatarOpen(false)}
        >
          {isUser ? (
            <div className="w-32 h-32 rounded-full flex items-center justify-center border border-[var(--border-visible)] bg-[var(--surface-raised)] animate-scale-in">
              <span className="font-mono text-[36px] text-[var(--text-primary)]">
                {getInitials(recruiterName)}
              </span>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full overflow-hidden border border-[var(--border-visible)] animate-scale-in">
              <img src="/assets/pablo-avatar.jpg" alt="Pablo" className="w-full h-full object-cover object-top" />
            </div>
          )}
        </div>
      )}
    </>
  );
}
