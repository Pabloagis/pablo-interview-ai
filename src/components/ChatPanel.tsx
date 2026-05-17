'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Message, RecruiterContext, ToastMessage } from '@/lib/types';
import { generateId, parseSSELine } from '@/lib/utils';
import { MAX_MESSAGE_LENGTH } from '@/lib/constants';
import Header from './Header';
import MessageBubble from './MessageBubble';
import StreamingResponse from './StreamingResponse';
import Toast from './Toast';

interface ChatPanelProps {
  sessionId: string;
}

export default function ChatPanel({ sessionId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputText, setInputText] = useState('');
  const [context, setContext] = useState<RecruiterContext>({});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  // Load recruiter context from sessionStorage (set by IntakeScreen)
  useEffect(() => {
    const stored = sessionStorage.getItem(`session_${sessionId}`);
    if (!stored) return;
    try {
      setContext(JSON.parse(stored) as RecruiterContext);
    } catch {
      // ignore
    }
  }, [sessionId]);

  // Keep the message list scrolled to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'error') => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const sendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setStreamingText('');
    setIsStreaming(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Cancel any in-flight request
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, sessionId, context }),
        signal: fetchAbortRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // SSE can arrive in partial chunks — process line by line
        for (const line of chunk.split('\n')) {
          const event = parseSSELine(line) as { type: string; text?: string; message?: string } | null;
          if (!event) continue;

          if (event.type === 'content' && event.text) {
            accumulated += event.text;
            setStreamingText(accumulated);
          } else if (event.type === 'done') {
            const assistantMessage: Message = {
              id: generateId(),
              role: 'assistant',
              content: accumulated,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setStreamingText('');
            setIsStreaming(false);
          } else if (event.type === 'error' && event.message) {
            addToast(event.message);
            setStreamingText('');
            setIsStreaming(false);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User-triggered cancel — clean up silently
      } else {
        console.error('Send message error:', error);
        addToast('Connection issue. Please try again.');
      }
      setStreamingText('');
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter, allow Shift+Enter for newlines
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value.slice(0, MAX_MESSAGE_LENGTH));

    // Auto-grow up to ~5 lines
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const handleReset = () => {
    fetchAbortRef.current?.abort();
    setMessages([]);
    setStreamingText('');
    setIsStreaming(false);
    setInputText('');
    addToast('Conversation reset. Starting fresh.', 'info');
  };

  const handleDownloadTranscript = () => {
    window.open(`/api/transcript?sessionId=${sessionId}`, '_blank');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header recruiterName={context.recruiterName} company={context.company} />

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Empty state */}
          {messages.length === 0 && !isStreaming && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-2xl">P</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Hi, I&apos;m Pablo.</h2>
              <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
                Ask me about my experience, career goals, or anything you&apos;d want to know in a
                real interview.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isStreaming && <StreamingResponse text={streamingText} />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 items-end">
            <div className="flex-1 flex items-end bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-colors">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask Pablo anything…"
                rows={1}
                disabled={isStreaming}
                className="flex-1 bg-transparent resize-none text-sm text-gray-800 placeholder-gray-400 focus:outline-none leading-relaxed disabled:opacity-50"
                style={{ maxHeight: '120px' }}
              />
            </div>

            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isStreaming}
              aria-label="Send message"
              className="w-10 h-10 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-xs text-gray-300">
              {inputText.length > 0 ? `${inputText.length} / ${MAX_MESSAGE_LENGTH}` : ''}
            </span>
            <div className="flex gap-4">
              <button
                onClick={handleDownloadTranscript}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Download transcript
              </button>
              <button
                onClick={handleReset}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
