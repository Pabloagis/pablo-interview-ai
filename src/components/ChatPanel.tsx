'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Message, RecruiterContext, ToastMessage } from '@/lib/types';
import { generateId, parseSSELine } from '@/lib/utils';
import { MAX_MESSAGE_LENGTH } from '@/lib/constants';
import Header from './Header';
import MessageBubble from './MessageBubble';
import StreamingResponse from './StreamingResponse';
import Toast from './Toast';
import EndInterviewButton from './EndInterviewButton';

const QUESTION_POOL = [
  'Tell me about your most recent role',
  'Why are you moving into hospitality tech?',
  'What PMS systems have you worked with?',
  'Walk me through an implementation you led',
  'What kind of role are you looking for?',
  "What's your experience with SaaS onboarding?",
  'How do you handle a difficult client or stakeholder?',
  'What does success look like in your next role?',
  "Tell me about a time things didn't go to plan",
  'How do you communicate with non-technical teams?',
  'Why did you leave your last role?',
  "What's your strongest professional skill?",
];

function pickRandom(pool: string[], n: number): string[] {
  return [...pool].sort(() => Math.random() - 0.5).slice(0, n);
}

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
  const [interviewEnded, setInterviewEnded] = useState<{ emailSent: boolean } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>(() => pickRandom(QUESTION_POOL, 5));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingTopRef = useRef<HTMLDivElement>(null);
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

  // Scroll management: follow bottom normally; when streaming starts, anchor to top of response
  useEffect(() => {
    if (isStreaming) {
      streamingTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'error') => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleInterviewEnded = useCallback((emailSent: boolean) => {
    setInterviewEnded({ emailSent });
  }, []);

  const sendMessage = async (overrideText?: string) => {
    const trimmed = (overrideText ?? inputText).trim();
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

  const handleSuggestedQuestion = (question: string) => {
    setSuggestions((prev) => prev.filter((q) => q !== question));
    sendMessage(question);
  };

  const handleReset = () => {
    fetchAbortRef.current?.abort();
    setMessages([]);
    setStreamingText('');
    setIsStreaming(false);
    setInputText('');
    setSuggestions(pickRandom(QUESTION_POOL, 5));
    addToast('Conversation reset. Starting fresh.', 'info');
  };

  const handleDownloadTranscript = () => {
    window.open(`/api/transcript?sessionId=${sessionId}`, '_blank');
  };

  // Success / ended screen — replaces entire chat UI
  if (interviewEnded !== null) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
          {interviewEnded.emailSent ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">All done!</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-1">
                Check your inbox — we&apos;ve sent everything to
              </p>
              {context.email && (
                <p className="text-blue-600 font-medium text-sm mb-6">{context.email}</p>
              )}
              <p className="text-gray-400 text-sm italic">
                Looking forward to hearing from you. — Pablo
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-blue-600 font-bold text-2xl">P</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Interview ended.</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Thanks for chatting! — Pablo
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 overflow-hidden">
      <Header
        recruiterName={context.recruiterName}
        company={context.company}
        action={
          <EndInterviewButton
            sessionId={sessionId}
            messages={messages}
            context={context}
            onInterviewEnded={handleInterviewEnded}
          />
        }
      />

      {/* Message list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          {/* Empty state */}
          {messages.length === 0 && !isStreaming && (
            <div className="px-4 w-full min-w-0 overflow-hidden py-16">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-2xl">P</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">Hi, I&apos;m Pablo.</h2>
              <p className="text-gray-400 text-sm leading-relaxed text-center px-4 mb-4">
                Ask me what you&apos;d ask any candidate — background, decisions, projects, how I think.
              </p>
              <p className="text-xs text-gray-300 text-center px-4 mb-6">
                When you&apos;re done, click{' '}
                <span className="text-green-500 font-medium">End Interview</span>{' '}
                (top right) to receive my CV and materials by email.
              </p>
              <div className="text-center space-y-1">
                <p className="text-xs text-gray-300">
                  ↓ Tap a suggested question to start, or type your own below
                </p>
                <p className="text-xs text-gray-300">
                  Press <span className="font-medium">Enter</span> or the arrow button to send
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isStreaming && (
            <>
              <div ref={streamingTopRef} />
              <StreamingResponse text={streamingText} />
            </>
          )}

          <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t bg-white p-3 shrink-0">
          {/* Suggested questions */}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {suggestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestedQuestion(q)}
                  disabled={isStreaming}
                  className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-3 py-1 hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2 min-w-0">
            <div className="flex-1 min-w-0 flex items-end bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-colors">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask Pablo anything…"
                rows={1}
                disabled={isStreaming}
                className="flex-1 min-w-0 resize-none bg-transparent text-base text-gray-800 placeholder-gray-400 focus:outline-none leading-relaxed disabled:opacity-50"
                style={{ maxHeight: '120px' }}
              />
            </div>

            <button
              onClick={() => sendMessage()}
              disabled={!inputText.trim() || isStreaming}
              aria-label="Send message"
              className="shrink-0 w-10 h-10 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-colors"
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
            <div className="flex gap-3">
              <button
                onClick={handleDownloadTranscript}
                aria-label="Download transcript"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {/* Download icon — label on desktop, icon-only on mobile */}
                <span className="hidden sm:inline text-xs">Download transcript</span>
                <svg className="sm:hidden w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <button
                onClick={handleReset}
                aria-label="Reset conversation"
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <span className="hidden sm:inline text-xs">Reset</span>
                <svg className="sm:hidden w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
      </div>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
