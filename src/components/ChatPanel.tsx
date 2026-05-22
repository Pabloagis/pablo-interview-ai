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
import { useLanguage } from '@/context/LanguageContext';
import Footer from './Footer';

import type { Topic } from '@/context/LanguageContext';

function pickRandom<T>(pool: T[], n: number): T[] {
  return [...pool].sort(() => Math.random() - 0.5).slice(0, n);
}

interface ChatPanelProps {
  sessionId: string;
}

export default function ChatPanel({ sessionId }: ChatPanelProps) {
  const { lang, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputText, setInputText] = useState('');
  const [context, setContext] = useState<RecruiterContext>({});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [interviewEnded, setInterviewEnded] = useState<{ emailSent: boolean } | null>(null);
  const [suggestions, setSuggestions] = useState<Topic[]>([]);
  const [thinkingPhrase, setThinkingPhrase] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [listenMode, setListenMode] = useState(false);
  const [reminderState, setReminderState] = useState<'hidden' | 'visible' | 'fading'>('hidden');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingTopRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const thinkingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceTriggeredRef = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());
  const reminderDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reminderPersistentRef = useRef(false);
  const sendAutoIntroRef = useRef<() => Promise<void>>();
  const sendCheckInRef = useRef<() => Promise<void>>();
  const dismissPersistentReminderRef = useRef<() => void>();

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

  // Reset suggestions when language changes
  useEffect(() => {
    setSuggestions(pickRandom(t.topics, 5));
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rotate thinking phrases while waiting for first streaming content
  useEffect(() => {
    if (!isStreaming) {
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
      setThinkingPhrase('');
      return;
    }
    let i = 0;
    setThinkingPhrase(t.thinking[0]);
    thinkingIntervalRef.current = setInterval(() => {
      i = (i + 1) % t.thinking.length;
      setThinkingPhrase(t.thinking[i]);
    }, 1800);
    return () => { if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current); };
  }, [isStreaming]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll management: follow bottom normally; when streaming starts, anchor to top of response
  useEffect(() => {
    if (isStreaming) {
      streamingTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  // Page-load reminder: auto-dismisses after 4s
  useEffect(() => {
    const timer = setTimeout(() => {
      if (reminderDismissRef.current) clearTimeout(reminderDismissRef.current);
      reminderPersistentRef.current = false;
      setReminderState('visible');
      reminderDismissRef.current = setTimeout(() => {
        setReminderState('fading');
        setTimeout(() => setReminderState('hidden'), 350);
      }, 4000);
    }, 600);
    return () => {
      clearTimeout(timer);
      if (reminderDismissRef.current) clearTimeout(reminderDismissRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (messages.length > 0) lastActivityRef.current = Date.now();
  }, [messages]);

  // Inactivity reminder: stays until the user interacts
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= 90_000) {
        lastActivityRef.current = Date.now();
        if (reminderDismissRef.current) clearTimeout(reminderDismissRef.current);
        reminderPersistentRef.current = true;
        setReminderState('visible');
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Dismiss the persistent inactivity reminder on any user action
  dismissPersistentReminderRef.current = () => {
    if (!reminderPersistentRef.current) return;
    reminderPersistentRef.current = false;
    setReminderState('fading');
    setTimeout(() => setReminderState('hidden'), 350);
  };

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

  const playResponse = useCallback(async (text: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsPlayingAudio(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); setIsPlayingAudio(false); currentAudioRef.current = null; };
      audio.onerror = () => { setIsPlayingAudio(false); currentAudioRef.current = null; };
      await audio.play();
    } catch {
      setIsPlayingAudio(false);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
    setIsPlayingAudio(false);
  }, []);

  // Keep ref in sync with latest closure so the 35s timer always sees current state
  sendAutoIntroRef.current = async () => {
    if (messages.length > 0 || isStreaming) return;
    setStreamingText('');
    setIsStreaming(true);
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = new AbortController();
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '__AUTO_INTRO__', sessionId, context: { ...context, language: lang }, autoIntro: true }),
        signal: fetchAbortRef.current.signal,
      });
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          const event = parseSSELine(line) as { type: string; text?: string } | null;
          if (!event) continue;
          if (event.type === 'content' && event.text) { accumulated += event.text; setStreamingText(accumulated); }
          else if (event.type === 'done') {
            setMessages([{ id: generateId(), role: 'assistant', content: accumulated, createdAt: new Date().toISOString() }]);
            setStreamingText('');
            setIsStreaming(false);
          } else if (event.type === 'error') { setStreamingText(''); setIsStreaming(false); }
        }
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) console.error('Auto-intro error:', err);
      setStreamingText('');
      setIsStreaming(false);
    }
  };

  // Greet recruiter if they haven't typed after 35 seconds
  useEffect(() => {
    const timer = setTimeout(() => sendAutoIntroRef.current?.(), 35_000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check-in message after 1m27s of inactivity (only when conversation has started)
  sendCheckInRef.current = async () => {
    if (messages.length === 0 || isStreaming || interviewEnded) return;
    setStreamingText('');
    setIsStreaming(true);
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = new AbortController();
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '__CHECK_IN__', sessionId, context: { ...context, language: lang }, autoCheckIn: true }),
        signal: fetchAbortRef.current.signal,
      });
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          const event = parseSSELine(line) as { type: string; text?: string } | null;
          if (!event) continue;
          if (event.type === 'content' && event.text) { accumulated += event.text; setStreamingText(accumulated); }
          else if (event.type === 'done') {
            setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: accumulated, createdAt: new Date().toISOString() }]);
            setStreamingText('');
            setIsStreaming(false);
          } else if (event.type === 'error') { setStreamingText(''); setIsStreaming(false); }
        }
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) console.error('Check-in error:', err);
      setStreamingText('');
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= 87_000) {
        lastActivityRef.current = Date.now();
        sendCheckInRef.current?.();
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = async (overrideText?: string) => {
    const trimmed = (overrideText ?? inputText).trim();
    if (!trimmed || isStreaming) return;
    dismissPersistentReminderRef.current?.();

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
        body: JSON.stringify({ message: trimmed, sessionId, context: { ...context, language: lang } }),
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
            if (voiceTriggeredRef.current || listenMode) {
              voiceTriggeredRef.current = false;
              playResponse(accumulated);
            }
            // Silent notification after 3rd assistant response
            const prevAssistantCount = messages.filter((m) => m.role === 'assistant').length;
            if (prevAssistantCount + 1 === 3) {
              fetch('/api/internal-notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
              }).catch(() => {});
            }
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
        addToast(t.connectionIssue);
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
    dismissPersistentReminderRef.current?.();
    setInputText(e.target.value.slice(0, MAX_MESSAGE_LENGTH));

    // Auto-grow up to ~5 lines
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const handleSuggestedQuestion = (topic: Topic) => {
    setSuggestions((prev) => prev.filter((s) => s.label !== topic.label));
    sendMessage(topic.question);
  };

  const handleReset = () => {
    fetchAbortRef.current?.abort();
    setMessages([]);
    setStreamingText('');
    setIsStreaming(false);
    setInputText('');
    setSuggestions(pickRandom(t.topics, 5));
    addToast(t.conversationReset, 'info');
  };

  const startRecording = async () => {
    if (isStreaming || isTranscribing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');
          const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.text?.trim()) {
            voiceTriggeredRef.current = true;
            sendMessage(data.text.trim());
          }
        } catch {
          addToast(t.transcribeFailed);
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      addToast(t.microphoneDenied);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const toggleRecording = () => { if (isRecording) { stopRecording(); } else { startRecording(); } };

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
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t.allDoneTitle}</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-1">{t.allDoneMsg}</p>
              {context.email && (
                <p className="text-blue-600 font-medium text-sm mb-6">{context.email}</p>
              )}
              <p className="text-gray-400 text-sm italic">{t.allDoneSignature}</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-blue-600 font-bold text-2xl">P</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t.interviewEndedTitle}</h2>
              <p className="text-gray-500 text-sm leading-relaxed">{t.interviewEndedMsg}</p>
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

      {/* Topics sub-header — persists throughout conversation */}
      {suggestions.length > 0 && (
        <div className="border-b bg-white px-3 py-2 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {suggestions.map((topic) => (
              <button
                key={topic.label}
                onClick={() => handleSuggestedQuestion(topic)}
                disabled={isStreaming}
                className="flex items-center gap-1 shrink-0 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md px-2.5 py-1 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 transition-all"
              >
                {topic.label}
                <span className="text-gray-400 text-[10px]">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 pt-4">
          {/* Empty state */}
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center px-6 py-14 w-full">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-200 mb-5">
                <img src="/assets/pablo-avatar.jpg" alt="Pablo Agis" className="w-full h-full object-cover object-top" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">{t.emptyGreeting}</h1>
              <p className="text-gray-400 text-sm text-center leading-relaxed mb-8 max-w-xs">
                {t.emptySubtitle}
              </p>
              <div className="w-10 h-px bg-gray-200 mb-6" />
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">{t.tryAsking}</p>
              <div className="w-full max-w-sm space-y-2">
                {[t.q1, t.q2, t.q3].map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    disabled={isStreaming}
                    className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-left hover:border-blue-300 hover:bg-blue-50 transition-all group"
                  >
                    <span className="text-sm text-gray-700 group-hover:text-blue-700">{q}</span>
                    <span className="text-gray-300 group-hover:text-blue-400 ml-3 shrink-0">↗</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} recruiterName={context.recruiterName} />
          ))}

          {isStreaming && (
            <>
              <div ref={streamingTopRef} />
              <StreamingResponse text={streamingText} thinkingPhrase={thinkingPhrase} />
            </>
          )}

          <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t bg-white p-3 shrink-0">
          {/* Playing indicator */}
          {isPlayingAudio && (
            <button
              onClick={stopAudio}
              className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 mb-2 hover:bg-blue-100 transition-colors"
            >
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shrink-0" />
              {t.playingIndicator}
            </button>
          )}
          <div className="flex items-end gap-2 min-w-0">
            <div className="flex-1 min-w-0 flex items-end bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-colors">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={t.inputPlaceholder}
                rows={1}
                disabled={isStreaming}
                className="flex-1 min-w-0 resize-none bg-transparent text-base text-gray-800 placeholder-gray-400 focus:outline-none leading-relaxed disabled:opacity-50"
                style={{ maxHeight: '120px' }}
              />
            </div>

            {/* Mic button */}
            <button
              onClick={toggleRecording}
              disabled={isStreaming || isTranscribing || isPlayingAudio}
              aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
              className={[
                'shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : isTranscribing
                  ? 'bg-gray-100 cursor-not-allowed'
                  : 'bg-gray-100 hover:bg-gray-200',
              ].join(' ')}
            >
              {isRecording ? (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1.5" />
                </svg>
              ) : isTranscribing ? (
                <svg className="w-4 h-4 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>

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
            <div className="flex gap-3 items-center">
              {/* Listen mode toggle */}
              <button
                onClick={() => { if (listenMode && isPlayingAudio) stopAudio(); setListenMode((v) => !v); }}
                aria-label={listenMode ? 'Disable listen mode' : 'Enable listen mode'}
                title={listenMode ? t.listenModeOn : t.listenModeOff}
                className={listenMode ? 'text-blue-500 hover:text-blue-600 transition-colors' : 'text-gray-400 hover:text-gray-600 transition-colors'}
              >
                <svg className="w-4 h-4" fill={listenMode ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12m-3.536-9.536a5 5 0 000 7.072" />
                </svg>
              </button>
              <button
                onClick={handleDownloadTranscript}
                aria-label="Download transcript"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {/* Download icon — label on desktop, icon-only on mobile */}
                <span className="hidden sm:inline text-xs">{t.downloadTranscript}</span>
                <svg className="sm:hidden w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <button
                onClick={handleReset}
                aria-label="Reset conversation"
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <span className="hidden sm:inline text-xs">{t.reset}</span>
                <svg className="sm:hidden w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
      </div>

      {/* End interview reminder — anchored below the End Interview button */}
      {reminderState !== 'hidden' && !interviewEnded && (
        <div className="fixed top-[58px] right-3 z-40 pointer-events-none">
          <div className={`animate-slide-down relative bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-2.5 text-[13px] text-gray-600 whitespace-nowrap transition-opacity duration-300 ${reminderState === 'fading' ? 'opacity-0' : 'opacity-100'}`}>
            {/* Arrow pointing up toward the End Interview button */}
            <div className="absolute -top-[5px] right-4 w-2.5 h-2.5 bg-white border-l border-t border-gray-200 rotate-45" />
            {t.endReminderPrefix} <strong className="text-green-700 font-semibold">{t.endButtonFull}</strong> {t.endReminderSuffix}
          </div>
        </div>
      )}

      <Footer variant="compact" />
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
