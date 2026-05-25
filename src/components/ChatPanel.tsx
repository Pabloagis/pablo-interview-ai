'use client';

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { Message, RecruiterContext, ToastMessage } from '@/lib/types';
import { generateId, parseSSELine } from '@/lib/utils';
import { MAX_MESSAGE_LENGTH } from '@/lib/constants';
import Header from './Header';
import MessageBubble from './MessageBubble';
import StreamingResponse from './StreamingResponse';
import Toast from './Toast';
import EndInterviewButton from './EndInterviewButton';
import InteractiveReport from './InteractiveReport';
import Tooltip from './Tooltip';
import Background from './Background';
import { useLanguage } from '@/context/LanguageContext';
import Footer from './Footer';

import type { Topic } from '@/context/LanguageContext';
import type { ReportData } from '@/lib/report';

function pickRandom<T>(pool: T[], n: number): T[] {
  return [...pool].sort(() => Math.random() - 0.5).slice(0, n);
}

function InsightsOverlay({
  onClose, fetching, error, report, onRetry,
  recruiterName, company, messages,
  backLabel, fetchingLabel, errorLabel, retryLabel,
}: {
  onClose: () => void;
  fetching: boolean;
  error: string | null;
  report: ReportData | null;
  onRetry: () => void;
  recruiterName: string | null;
  company: string | null;
  messages: Array<{ role: string; content: string }>;
  backLabel: string;
  fetchingLabel: string;
  errorLabel: string;
  retryLabel: string;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{
        zIndex: 60,
        background: 'var(--bg-base)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 220ms ease',
      }}
    >
      <div
        className="shrink-0 flex items-center gap-3 px-4"
        style={{
          height: 56,
          borderBottom: '0.5px solid var(--glass-border)',
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)',
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
          }}
        >
          {backLabel}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {fetching && (
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <svg className="animate-spin w-8 h-8" style={{ color: 'var(--accent-primary)' }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{fetchingLabel}</p>
          </div>
        )}

        {error && !fetching && (
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{errorLabel}</p>
            <button
              onClick={onRetry}
              style={{
                padding: '8px 20px', fontSize: 13, fontWeight: 600,
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
                border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer',
              }}
            >
              {retryLabel}
            </button>
          </div>
        )}

        {report && !fetching && (
          <InteractiveReport
            report={report}
            recruiterName={recruiterName}
            company={company}
            messages={messages}
          />
        )}
      </div>
    </div>
  );
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
  const [inputFocused, setInputFocused] = useState(false);
  const [context, setContext] = useState<RecruiterContext>({});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [interviewEnded, setInterviewEnded] = useState<{ emailSent: boolean } | null>(null);
  const [suggestions, setSuggestions] = useState<Topic[]>([]);
  const [thinkingPhrase, setThinkingPhrase] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [reminderState, setReminderState] = useState<'hidden' | 'visible' | 'fading'>('hidden');
  const [chatSplashDone, setChatSplashDone] = useState(false);
  const [chatPageEnter, setChatPageEnter] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insightsReport, setInsightsReport] = useState<ReportData | null>(null);
  const [insightsFetching, setInsightsFetching] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [insightsUnlocked, setInsightsUnlocked] = useState(() => {
    try { return !!localStorage.getItem(`im_insights_${sessionId}`); } catch { return false; }
  });
  const insightsCacheRef = useRef<{ report: ReportData; msgCount: number } | null>(null);

  // Splash 2 refs
  const s2OverlayRef    = useRef<HTMLDivElement>(null);
  const s2AvRef         = useRef<HTMLDivElement>(null);
  const s2RingRef       = useRef<HTMLDivElement>(null);
  const s2GlowRef       = useRef<HTMLDivElement>(null);
  const s2NameRef       = useRef<HTMLParagraphElement>(null);
  const s2WmRef         = useRef<HTMLParagraphElement>(null);
  const s2StatusDotRef  = useRef<HTMLDivElement>(null);
  const s2StatusTextRef = useRef<HTMLSpanElement>(null);

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
  const checkInLastActivityRef = useRef<number>(Date.now());
  const userMessageCountRef = useRef(0);
  const reminderDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reminderPersistentRef = useRef(false);
  const isStreamingRef = useRef(false);
  const messagesLengthRef = useRef(0);
  const contextRef = useRef(context);
  const langRef = useRef(lang);
  const inputTextRef = useRef('');
  const sendCheckInRef = useRef<() => Promise<void>>();
  const dismissPersistentReminderRef = useRef<() => void>();
  const usedTopicsRef = useRef<Set<string>>(new Set());
  const interviewEndedRef = useRef(false);
  const s2RanRef          = useRef(false);

  // Skip splash before first paint for returning visitors
  useLayoutEffect(() => {
    if (sessionStorage.getItem(`im_s2_${sessionId}`)) { setChatSplashDone(true); setChatPageEnter(true); }
  }, [sessionId]);

  // Splash 2 — cinematic JS rAF animation (first visit only)
  useEffect(() => {
    if (s2RanRef.current) return;
    s2RanRef.current = true;
    if (sessionStorage.getItem(`im_s2_${sessionId}`)) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const rafs: number[] = [];
    const after = (fn: () => void, ms: number) => { const id = setTimeout(fn, ms); timers.push(id); };
    const tick  = (fn: FrameRequestCallback) => { const id = requestAnimationFrame(fn); rafs.push(id); return id; };

    const eO  = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    const eOC = (t: number) => 1 - Math.pow(1 - t, 3);
    const eIO = (t: number) => t < 0.5 ? 8*t*t*t*t : 1 - Math.pow(-2*t+2, 4)/2;

    function animate(fn: (p: number) => void, duration: number, delay: number, easing: (t: number) => number, onDone?: () => void) {
      after(() => {
        const start = performance.now();
        const frame = (now: number) => {
          const raw = Math.min((now - start) / duration, 1);
          fn(easing(raw));
          if (raw < 1) tick(frame);
          else if (onDone) onDone();
        };
        tick(frame);
      }, delay);
    }

    function springAv(el: HTMLElement, fromSc: number, peakSc: number, finSc: number, fromBlur: number, fromTy: number, peakTy: number, dur: number, delay: number) {
      after(() => {
        const s = performance.now(), h = dur * 0.55, opDur = dur * 0.38;
        const frame = (now: number) => {
          const elapsed = now - s;
          const e = Math.min(elapsed, dur);
          let sc: number, ty: number;
          if (e < h) {
            const p = eO(e / h);
            sc = fromSc + (peakSc - fromSc) * p;
            ty = fromTy + (peakTy - fromTy) * p;
          } else {
            const p = eOC((e - h) / (dur - h));
            sc = peakSc + (finSc - peakSc) * p;
            ty = peakTy * (1 - p);
          }
          const bl = fromBlur * Math.max(0, 1 - Math.min(elapsed / dur, 1));
          el.style.transform = `translateY(${ty.toFixed(2)}px) scale(${sc.toFixed(4)})`;
          el.style.opacity = Math.min(elapsed / opDur, 1).toFixed(4);
          el.style.filter = bl > 0.2 ? `blur(${bl.toFixed(1)}px)` : '';
          if (elapsed < dur) tick(frame);
          else { el.style.transform = 'none'; el.style.opacity = '1'; el.style.filter = ''; }
        };
        tick(frame);
      }, delay);
    }

    const ov  = s2OverlayRef.current, av = s2AvRef.current, rg = s2RingRef.current;
    const gl  = s2GlowRef.current, nm = s2NameRef.current, wm = s2WmRef.current;
    const dot = s2StatusDotRef.current, txt = s2StatusTextRef.current;
    if (!ov || !av || !rg || !gl || !nm || !wm) return;

    const dayMode = document.documentElement.getAttribute('data-theme') === 'day';

    // 0ms: Avatar springs from depth with translateY
    springAv(av, 0.60, 1.06, 1.0, 18, 6, -1, 680, 0);

    // 360ms: Name assembles from left
    animate(p => {
      nm.style.opacity = p.toFixed(4);
      nm.style.transform = `translateX(${(-36 * (1 - p)).toFixed(2)}px) scale(${(0.93 + 0.07 * p).toFixed(4)})`;
      nm.style.filter = `blur(${(12 * (1 - p)).toFixed(1)}px)`;
    }, 600, 360, eO, () => { nm.style.transform = ''; nm.style.filter = ''; });

    // 380ms: Ring activates
    after(() => { rg.style.transition = 'opacity 700ms ease'; rg.style.opacity = '1'; }, 380);

    // 420ms: Glow activates
    after(() => { gl.style.transition = 'opacity 600ms ease'; gl.style.opacity = '0.9'; }, 420);

    // 700ms: Wordmark with tracking compression
    const wmTargetOp = dayMode ? 0.48 : 0.52;
    animate(p => {
      const tracking = 0.28 - (0.28 - 0.20) * p;
      wm.style.letterSpacing = `${tracking.toFixed(3)}em`;
      wm.style.opacity = (p * wmTargetOp).toFixed(4);
      wm.style.filter = `blur(${(6 * (1 - p)).toFixed(1)}px)`;
    }, 650, 700, eO);

    // 1000ms: Status dot spring
    if (dot) {
      after(() => {
        const s = performance.now(), dur = 400, h = dur * 0.55;
        const frame = (now: number) => {
          const elapsed = now - s;
          const e = Math.min(elapsed, dur);
          const sc = e < h ? eO(e / h) * 1.2 : 1.2 - 0.2 * eOC((e - h) / (dur - h));
          dot.style.opacity = Math.min(elapsed / (dur * 0.4), 1).toFixed(4);
          dot.style.transform = `scale(${sc.toFixed(4)})`;
          if (elapsed < dur) tick(frame);
          else { dot.style.transform = 'scale(1)'; dot.style.opacity = '1'; }
        };
        tick(frame);
      }, 1000);
    }

    // 1080ms: Status text slides in
    if (txt) {
      animate(p => {
        txt.style.opacity = (p * 0.65).toFixed(4);
        txt.style.transform = `translateX(${(-12 * (1 - p)).toFixed(2)}px)`;
        txt.style.filter = `blur(${(4 * (1 - p)).toFixed(1)}px)`;
      }, 450, 1080, eO, () => { txt.style.transform = ''; txt.style.filter = ''; });
    }

    // 3050ms: Cinematic exit
    after(() => {
      if (!ov) return;
      const _ov = ov;
      const s = performance.now();
      function exit(now: number) {
        const raw = Math.min((now - s) / 550, 1), p = eIO(raw);
        _ov.style.opacity = (1 - p).toFixed(4);
        _ov.style.transform = `translateY(${(-48 * p).toFixed(1)}px) scale(${(1 - 0.016 * p).toFixed(4)})`;
        _ov.style.filter = `blur(${(9 * p).toFixed(1)}px)`;
        if (raw < 1) tick(exit);
        else {
          setChatSplashDone(true);
          sessionStorage.setItem(`im_s2_${sessionId}`, '1');
          requestAnimationFrame(() => requestAnimationFrame(() => setChatPageEnter(true)));
        }
      }
      tick(exit);
    }, 3050);

    return () => { timers.forEach(clearTimeout); rafs.forEach(cancelAnimationFrame); };
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load recruiter context from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(`session_${sessionId}`);
    if (!stored) return;
    try {
      setContext(JSON.parse(stored) as RecruiterContext);
    } catch {
      // ignore
    }
  }, [sessionId]);

  // Restore messages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`im_chat_${sessionId}`);
      if (!stored) return;
      const msgs = JSON.parse(stored) as Message[];
      if (Array.isArray(msgs) && msgs.length > 0) setMessages(msgs);
    } catch {
      // ignore corrupt data
    }
  }, [sessionId]);

  // Sync messages to localStorage in real time
  useEffect(() => {
    if (messages.length === 0) return;
    try {
      localStorage.setItem(`im_chat_${sessionId}`, JSON.stringify(messages));
    } catch {
      // ignore (e.g. storage quota exceeded)
    }
  }, [messages, sessionId]);


  // Reset suggestions when language changes
  useEffect(() => {
    usedTopicsRef.current = new Set();
    const initial = pickRandom(t.topics, 3);
    initial.forEach(tp => usedTopicsRef.current.add(tp.label));
    setSuggestions(initial);
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

  // Scroll management
  useEffect(() => {
    if (isStreaming) {
      streamingTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  // Page-load reminder: auto-dismisses after 6s
  useEffect(() => {
    const timer = setTimeout(() => {
      if (reminderDismissRef.current) clearTimeout(reminderDismissRef.current);
      reminderPersistentRef.current = false;
      setReminderState('visible');
      reminderDismissRef.current = setTimeout(() => {
        setReminderState('fading');
        setTimeout(() => setReminderState('hidden'), 350);
      }, 6000);
    }, 600);
    return () => {
      clearTimeout(timer);
      if (reminderDismissRef.current) clearTimeout(reminderDismissRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (messages.length > 0) {
      lastActivityRef.current = Date.now();
      checkInLastActivityRef.current = Date.now();
    }
  }, [messages]);

  // Inactivity reminder after 3 user messages and 90s of no activity
  useEffect(() => {
    const interval = setInterval(() => {
      if (userMessageCountRef.current >= 3 && Date.now() - lastActivityRef.current >= 90_000) {
        lastActivityRef.current = Date.now();
        if (reminderDismissRef.current) clearTimeout(reminderDismissRef.current);
        reminderPersistentRef.current = true;
        setReminderState('visible');
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    try {
      const raw = localStorage.getItem('im_last_session');
      if (raw) {
        const data = JSON.parse(raw) as { sessionId: string };
        if (data.sessionId === sessionId) {
          localStorage.setItem('im_last_session', JSON.stringify({ ...data, ended: true }));
        }
      }
    } catch {
      // ignore
    }
  }, [sessionId]);

  const openInsights = useCallback(async () => {
    setInsightsUnlocked(true);
    try { localStorage.setItem(`im_insights_${sessionId}`, '1'); } catch {}
    setInsightsOpen(true);
    setInsightsError(null);

    const userMsgCount = messagesLengthRef.current;
    if (insightsCacheRef.current?.msgCount === userMsgCount && insightsCacheRef.current.report) {
      setInsightsReport(insightsCacheRef.current.report);
      setInsightsFetching(false);
      return;
    }

    setInsightsFetching(true);
    setInsightsReport(null);
    try {
      const res = await fetch(`/api/report?id=${sessionId}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json() as ReportData;
      insightsCacheRef.current = { report: data, msgCount: userMsgCount };
      setInsightsReport(data);
    } catch {
      setInsightsError('error');
    } finally {
      setInsightsFetching(false);
    }
  }, [sessionId]);

  const playResponse = useCallback(async (text: string, messageId?: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsPlayingAudio(true);
    if (messageId) setPlayingMessageId(messageId);
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
      audio.onended = () => { URL.revokeObjectURL(url); setIsPlayingAudio(false); setPlayingMessageId(null); currentAudioRef.current = null; };
      audio.onerror = () => { setIsPlayingAudio(false); setPlayingMessageId(null); currentAudioRef.current = null; };
      await audio.play();
    } catch {
      setIsPlayingAudio(false);
      setPlayingMessageId(null);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
    setIsPlayingAudio(false);
    setPlayingMessageId(null);
  }, []);

  // Keep refs in sync
  userMessageCountRef.current = messages.filter(m => m.role === 'user').length;
  isStreamingRef.current = isStreaming;
  messagesLengthRef.current = messages.length;
  contextRef.current = context;
  langRef.current = lang;
  interviewEndedRef.current = interviewEnded !== null;

  // Auto-intro after 30s if recruiter hasn't typed
  useEffect(() => {
    const introAbort = new AbortController();
    const timer = setTimeout(async () => {
      if (messagesLengthRef.current > 0 || isStreamingRef.current || inputTextRef.current.trim().length > 0) return;
      setStreamingText('');
      setIsStreaming(true);
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: '__AUTO_INTRO__',
            sessionId,
            context: { ...contextRef.current, language: langRef.current },
            autoIntro: true,
          }),
          signal: introAbort.signal,
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
    }, 30_000);
    return () => { clearTimeout(timer); introAbort.abort(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  sendCheckInRef.current = async () => {
    if (messages.length === 0 || isStreaming || interviewEnded) return;
    if (messages[messages.length - 1]?.role === 'assistant') return;
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
      if (Date.now() - checkInLastActivityRef.current >= 87_000) {
        checkInLastActivityRef.current = Date.now();
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

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    fetch('/api/save-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, role: 'user', content: trimmed }),
    }).catch(() => {});

    fetchAbortRef.current?.abort();
    fetchAbortRef.current = new AbortController();

    const MAX_RETRIES = 2;
    let lastErrorMessage = '';

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 3000));
        if (fetchAbortRef.current.signal.aborted) return;
        setStreamingText('');
      }

      let shouldRetry = false;

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, sessionId, context: { ...context, language: lang } }),
          signal: fetchAbortRef.current.signal,
        });

        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        readLoop: while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          for (const line of decoder.decode(value, { stream: true }).split('\n')) {
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
              if (voiceTriggeredRef.current) {
                voiceTriggeredRef.current = false;
                playResponse(accumulated, assistantMessage.id);
              }
              return;
            } else if (event.type === 'error' && event.message) {
              lastErrorMessage = event.message;
              if (event.message.includes('busy') && attempt < MAX_RETRIES) {
                shouldRetry = true;
              } else {
                addToast(event.message);
                setStreamingText('');
                setIsStreaming(false);
                return;
              }
              break readLoop;
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // User-triggered cancel
        } else {
          console.error('Send message error:', error);
          addToast(t.connectionIssue);
        }
        setStreamingText('');
        setIsStreaming(false);
        return;
      }

      if (!shouldRetry) return;
    }

    addToast(lastErrorMessage || t.connectionIssue);
    setStreamingText('');
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dismissPersistentReminderRef.current?.();
    const newVal = e.target.value.slice(0, MAX_MESSAGE_LENGTH);
    setInputText(newVal);
    inputTextRef.current = newVal;
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const refreshSuggestions = () => {
    usedTopicsRef.current = new Set();
    const next = pickRandom(t.topics, 3);
    next.forEach(tp => usedTopicsRef.current.add(tp.label));
    setSuggestions(next);
  };

  const handleSuggestedQuestion = (topic: Topic) => {
    usedTopicsRef.current.add(topic.label);
    const unused = t.topics.filter(tp => !usedTopicsRef.current.has(tp.label));
    const replacement = unused.length > 0 ? pickRandom(unused, 1) : [];
    if (replacement.length > 0) usedTopicsRef.current.add(replacement[0].label);
    setSuggestions(prev => {
      const remaining = prev.filter(s => s.label !== topic.label);
      return [...remaining, ...replacement];
    });
    sendMessage(topic.question);
  };

  const handleReset = () => {
    fetchAbortRef.current?.abort();
    setMessages([]);
    setStreamingText('');
    setIsStreaming(false);
    setInputText('');
    usedTopicsRef.current = new Set();
    const fresh = pickRandom(t.topics, 3);
    fresh.forEach(tp => usedTopicsRef.current.add(tp.label));
    setSuggestions(fresh);
    localStorage.removeItem(`im_chat_${sessionId}`);
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

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };
  const toggleRecording = () => { if (isRecording) { stopRecording(); } else { startRecording(); } };
  const handleDownloadTranscript = () => { window.open(`/api/transcript?sessionId=${sessionId}`, '_blank'); };

  // Page 2 assembly — per-element directional entrance
  const emerge2 = (
    delay: number,
    from: { tx?: number; ty?: number; sc?: number; blur?: number; maxOp?: number; dur?: number } = {}
  ): React.CSSProperties => {
    const { tx = 0, ty = 0, sc = 1, blur = 5, maxOp = 1, dur = 500 } = from;
    const parts: string[] = [];
    if (tx !== 0) parts.push(`translateX(${tx}px)`);
    if (ty !== 0) parts.push(`translateY(${ty}px)`);
    if (sc !== 1) parts.push(`scale(${sc})`);
    const notReady = parts.length ? parts.join(' ') : 'none';
    return {
      opacity: chatPageEnter ? maxOp : 0,
      transform: chatPageEnter ? 'none' : notReady,
      filter: chatPageEnter ? 'none' : `blur(${blur}px)`,
      transition: `opacity ${dur}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform ${dur}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, filter ${dur}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    };
  };

  // Ended screen
  if (interviewEnded !== null) {
    return (
      <>
        <Background />
        <div className="flex flex-col min-h-screen items-center justify-center px-4">
          <div
            className="w-full max-w-md text-center p-10"
            style={{
              background: 'var(--ended-card-bg)',
              border: '0.5px solid var(--ended-card-border)',
              borderRadius: 20,
              boxShadow: '0 24px 80px rgba(0,0,0,0.56), inset 0 1px 0 rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            {interviewEnded.emailSent ? (
              <>
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: 'rgba(58,106,64,0.3)', border: '0.5px solid rgba(58,106,64,0.5)' }}
                >
                  <svg className="w-8 h-8" style={{ color: 'var(--success-text)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ended-title)', marginBottom: 12 }}>{t.allDoneTitle}</h2>
                <p style={{ fontSize: 13, color: 'var(--ended-body)', lineHeight: 1.6, marginBottom: 4 }}>{t.allDoneMsg}</p>
                {context.email && (
                  <p style={{ fontSize: 13, color: 'var(--accent-mid)', fontWeight: 500, marginBottom: 24 }}>{context.email}</p>
                )}
                <p style={{ fontSize: 13, color: 'var(--ended-sig)', fontStyle: 'italic' }}>{t.allDoneSignature}</p>
              </>
            ) : (
              <>
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))', boxShadow: '0 4px 24px var(--accent-glow)' }}
                >
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>P</span>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ended-title)', marginBottom: 12 }}>{t.interviewEndedTitle}</h2>
                <p style={{ fontSize: 13, color: 'var(--ended-body)', lineHeight: 1.6 }}>{t.interviewEndedMsg}</p>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Background />

      {/* Main chat UI */}
      <div
        className="fixed inset-0 flex flex-col overflow-hidden"
        style={{
          height: '100dvh',
          opacity: chatPageEnter ? 1 : 0,
          transition: 'opacity 600ms cubic-bezier(0.22,1,0.36,1) 60ms',
        }}
      >
        <div className="shrink-0" style={emerge2(0, { ty: -18, blur: 5, dur: 480 })}>
          <Header
            recruiterName={context.recruiterName}
            company={context.company}
            role={context.role}
            action={
              <EndInterviewButton
                sessionId={sessionId}
                messages={messages}
                context={context}
                onInterviewEnded={handleInterviewEnded}
                onOpenInsights={openInsights}
                skipModal={insightsUnlocked}
                suppressTooltip={reminderState !== 'hidden'}
              />
            }
          />
        </div>

        {/* Suggested topics strip */}
        {suggestions.length > 0 && (
          <div
            className="px-3 py-2 shrink-0"
            style={{
              borderBottom: '0.5px solid var(--chips-strip-border)',
              background: 'var(--chips-strip-bg)',
              ...emerge2(80, { ty: 12, blur: 4, dur: 460 }),
            }}
          >
            <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <span
                className="shrink-0 text-[10px] font-semibold uppercase tracking-widest select-none"
                style={{ color: 'var(--text-muted)', letterSpacing: '0.08em', paddingRight: 2 }}
              >
                {t.topicsLabel}
              </span>
              {suggestions.map((topic) => (
                <button
                  key={topic.label}
                  onClick={() => handleSuggestedQuestion(topic)}
                  disabled={isStreaming}
                  className="theme-chip flex items-center gap-1.5 shrink-0 text-[12px] font-semibold rounded-full px-3 py-1.5 transition-all disabled:opacity-40"
                >
                  {topic.label}
                </button>
              ))}
              <button
                onClick={refreshSuggestions}
                disabled={isStreaming}
                title="New suggestions"
                className="theme-util-btn shrink-0 w-7 h-7 flex items-center justify-center rounded-full disabled:opacity-40 ml-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M8 16H3v5"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Message list */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 pt-4 px-3">
          {/* Empty state */}
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center px-6 py-10 w-full">
              {/* Avatar with spinning ring */}
              <div
                className="relative mb-5"
                style={{ width: 96, height: 96, ...emerge2(60, { sc: 0.85, blur: 6, dur: 550 }) }}
              >
                <div className="absolute inset-0 rounded-full" style={{
                  background: 'conic-gradient(from 0deg, rgba(60,90,200,0.7), rgba(100,60,180,0.5), rgba(40,130,160,0.55), rgba(60,90,200,0.7))',
                  animation: 'ring-spin 3.5s linear infinite',
                  padding: 2,
                }}>
                  <div className="w-full h-full rounded-full" style={{ background: 'var(--bg-base)' }} />
                </div>
                <div className="absolute rounded-full overflow-hidden" style={{ inset: 3 }}>
                  <img src="/assets/pablo-avatar.jpg" alt="Pablo Agis" className="w-full h-full object-cover" style={{ objectPosition: 'center 15%' }} />
                </div>
              </div>
              <h1 className="gradient-text text-2xl font-bold mb-2 text-center" style={{ letterSpacing: '-0.02em', ...emerge2(160, { tx: -22, blur: 7, dur: 520 }) }}>
                {t.emptyGreeting}
              </h1>
              <p className="text-xs text-center leading-relaxed mb-8" style={{ color: 'var(--splash-status)', letterSpacing: '0.04em', maxWidth: 320, ...emerge2(240, { ty: 12, blur: 5, dur: 480, maxOp: 0.7 }) }}>
                {t.intakeSubtitle}
              </p>
              <div className="w-10 h-px mb-6" style={{ background: 'var(--glass-border)' }} />
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
                {t.tryAsking}
              </p>
              <div className="w-full max-w-sm space-y-2">
                {[t.q1, t.q2, t.q3].map((q, i) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    disabled={isStreaming}
                    className="theme-question w-full flex items-center justify-between rounded-xl px-4 py-3.5 text-left disabled:opacity-40"
                    style={emerge2(420 + i * 80, { ty: 20, blur: 6, dur: 460 })}
                  >
                    <span className="q-label text-sm">{q}</span>
                    <span className="q-arrow ml-3 shrink-0">↗</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              recruiterName={context.recruiterName}
              onPlay={msg.role === 'assistant' ? () => playResponse(msg.content, msg.id) : undefined}
              isPlaying={playingMessageId === msg.id}
              onStop={stopAudio}
            />
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
        <div
          className="shrink-0 p-3"
          style={{
            borderTop: '0.5px solid var(--input-area-border)',
            background: 'var(--input-area-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            ...emerge2(680, { ty: 14, blur: 4, dur: 460 }),
          }}
        >
          {/* Playing indicator */}
          {isPlayingAudio && (
            <button
              onClick={stopAudio}
              className="flex items-center gap-2 text-xs rounded-full px-3 py-1.5 mb-2 transition-colors"
              style={{
                background: 'var(--playing-bg)',
                border: '0.5px solid var(--playing-border)',
                color: 'var(--playing-text)',
              }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ background: 'var(--accent-mid)' }} />
              {t.playingIndicator}
            </button>
          )}

          <div className="flex items-end gap-2 min-w-0">
            {/* Pill input */}
            <div
              className="flex-1 min-w-0 flex items-end rounded-3xl px-4 py-2.5"
              style={{
                background: 'var(--input-pill-bg)',
                border: `0.5px solid ${inputFocused ? 'var(--input-focus-border)' : 'var(--input-pill-border)'}`,
                boxShadow: inputFocused ? 'var(--input-focus-shadow)' : 'none',
                transition: 'border-color 180ms ease, box-shadow 180ms ease',
              }}
            >
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={t.inputPlaceholder}
                rows={1}
                disabled={isStreaming}
                className="flex-1 min-w-0 resize-none bg-transparent focus:outline-none leading-relaxed disabled:opacity-50 placeholder:text-white/30"
                style={{ color: 'var(--input-text)', maxHeight: '120px', fontSize: 16 }}
              />
            </div>

            {/* Mic button */}
            <button
              onClick={toggleRecording}
              disabled={isStreaming || isTranscribing || isPlayingAudio}
              aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 shrink-0"
              style={isRecording ? {
                background: '#ef4444',
                boxShadow: '0 2px 12px rgba(239,68,68,0.4)',
              } : {
                background: 'var(--input-pill-bg)',
                border: '0.5px solid var(--input-pill-border)',
              }}
            >
              {isRecording ? (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1.5" />
                </svg>
              ) : isTranscribing ? (
                <svg className="w-4 h-4 animate-spin" style={{ color: 'var(--accent-mid)' }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" style={{ color: 'var(--util-color)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>

            {/* Send button */}
            <button
              onClick={() => sendMessage()}
              disabled={!inputText.trim() || isStreaming}
              aria-label="Send message"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0"
              style={inputText.trim() && !isStreaming ? {
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
                boxShadow: '0 2px 12px var(--accent-glow)',
              } : {
                background: 'linear-gradient(135deg, rgba(75,111,255,0.38), rgba(160,64,240,0.38))',
                opacity: 0.7,
              }}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          {/* Bottom utility row */}
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-xs" style={{ color: 'var(--char-count)' }}>
              {inputText.length > 0 ? `${inputText.length} / ${MAX_MESSAGE_LENGTH}` : ''}
            </span>
            <div className="flex gap-3 items-center">
              <Tooltip text={t.downloadTranscript}>
                <button
                  onClick={handleDownloadTranscript}
                  aria-label="Download transcript"
                  className="theme-util-btn transition-colors"
                >
                  <span className="hidden sm:inline text-xs">{t.downloadTranscript}</span>
                  <svg className="sm:hidden w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </Tooltip>
              <Tooltip text={t.clearConversation}>
                <button
                  onClick={handleReset}
                  aria-label="Reset conversation"
                  className="theme-util-btn danger transition-colors"
                >
                  <span className="hidden sm:inline text-xs">{t.reset}</span>
                  <svg className="sm:hidden w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* End interview reminder */}
        {reminderState !== 'hidden' && !interviewEnded && (
          <div className="fixed top-[58px] right-3 z-40 pointer-events-none">
            <div
              className={`animate-slide-down relative px-4 py-2.5 text-[13px] leading-snug max-w-[260px] transition-opacity duration-300 ${reminderState === 'fading' ? 'opacity-0' : 'opacity-100'}`}
              style={{
                background: 'var(--reminder-bg)',
                border: '0.5px solid var(--reminder-border)',
                borderRadius: 12,
                boxShadow: 'var(--reminder-shadow)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                color: 'var(--reminder-text)',
              }}
            >
              <div
                className="absolute -top-[5px] right-4 w-2.5 h-2.5 rotate-45"
                style={{
                  background: 'var(--reminder-bg)',
                  borderLeft: '0.5px solid var(--reminder-border)',
                  borderTop: '0.5px solid var(--reminder-border)',
                }}
              />
              {t.endReminderPrefix}{' '}
              <strong style={{ color: 'var(--success-text)', fontWeight: 600 }}>{t.endButtonFull}</strong>{' '}
              {t.endReminderSuffix}
            </div>
          </div>
        )}

        <Footer variant="compact" />
        <Toast toasts={toasts} onDismiss={dismissToast} />

      </div>

      {/* ── Insights overlay ── */}
      {insightsOpen && <InsightsOverlay
        onClose={() => setInsightsOpen(false)}
        fetching={insightsFetching}
        error={insightsError}
        report={insightsReport}
        onRetry={openInsights}
        recruiterName={context.recruiterName ?? null}
        company={context.company ?? null}
        messages={messages}
        backLabel={t.backToChat}
        fetchingLabel={t.generatingInsights}
        errorLabel={t.insightsErrorMsg}
        retryLabel={t.insightsRetry}
      />}

      {/* SPLASH 2 — transparent overlay (Background shows through) */}
      {!chatSplashDone && (
        <div
          ref={s2OverlayRef}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {/* Avatar with conic ring + glow */}
            <div
              ref={s2AvRef}
              style={{
                position: 'relative', width: 72, height: 72,
                marginBottom: 24, opacity: 0,
                transform: 'translateY(6px) scale(0.60)', filter: 'blur(18px)',
              }}
            >
              {/* Spinning conic ring */}
              <div
                ref={s2RingRef}
                style={{
                  position: 'absolute', inset: -10, borderRadius: '50%',
                  background: 'conic-gradient(from 0deg, transparent 0%, rgba(80,110,220,0.9) 35%, rgba(120,80,200,0.7) 65%, transparent 100%)',
                  opacity: 0,
                  animation: 'ring-spin 3.5s linear infinite',
                }}
              />
              {/* Glow halo */}
              <div
                ref={s2GlowRef}
                style={{
                  position: 'absolute', inset: -24, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(64,96,208,0.4) 0%, transparent 70%)',
                  opacity: 0,
                }}
              />
              {/* Photo */}
              <div style={{
                position: 'relative', width: '100%', height: '100%',
                borderRadius: '50%', overflow: 'hidden',
                border: '1.5px solid rgba(255,255,255,0.18)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              }}>
                <img
                  src="/assets/pablo-avatar.jpg"
                  alt="Pablo Agis"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
                />
              </div>
            </div>

            {/* Name */}
            <p
              ref={s2NameRef}
              style={{
                fontSize: 18, fontWeight: 700, color: 'var(--splash-name)',
                letterSpacing: '-0.01em', marginBottom: 0,
                opacity: 0, transform: 'translateX(-36px)', filter: 'blur(12px)',
              }}
            >
              Pablo Agis Burgos
            </p>

            {/* Wordmark */}
            <p
              ref={s2WmRef}
              style={{
                fontSize: 11, fontWeight: 500,
                color: 'var(--splash-wm)',
                letterSpacing: '0.28em', textTransform: 'uppercase',
                marginTop: 28, opacity: 0, filter: 'blur(6px)',
              }}
            >
              InterviewMind
            </p>

            {/* Status indicator — dot and text animated separately */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
              <div
                ref={s2StatusDotRef}
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#3a9d5d', flexShrink: 0,
                  animation: 'status-pulse 2s ease-in-out infinite',
                  opacity: 0, transform: 'scale(0)',
                }}
              />
              <span
                ref={s2StatusTextRef}
                style={{
                  fontSize: 11, color: 'var(--splash-status)', letterSpacing: '0.04em',
                  opacity: 0, transform: 'translateX(-12px)', filter: 'blur(4px)',
                }}
              >
                IA lista · Conectando sesión
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
