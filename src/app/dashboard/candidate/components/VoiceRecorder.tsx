'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { usePlatformT } from '@/context/platform-i18n';

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  // Composer variant: a single round mic button with no inline label or error
  // line, so it fits in a chat input row. Errors go to `onError` instead — the
  // caller surfaces them wherever it already shows failures.
  compact?: boolean;
  onError?: (message: string) => void;
}

type RecordState = 'idle' | 'recording' | 'transcribing' | 'done' | 'unsupported';

// Whisper transcribes the recorded audio server-side (/api/transcribe). This is a
// large accuracy upgrade over the browser Web Speech API this component used to use:
// Web Speech is Chrome/Edge-only, streams loose guesses, and mangles proper nouns.
// MediaRecorder + Whisper works in Safari/Firefox too and is far more faithful.
//
// We pass the user's selected app language to Whisper so it transcribes in the right
// language instead of guessing — the language picker is the source of truth now.

// Pick a container the browser can actually produce; name the upload to match so
// Whisper reads the right format. Safari yields mp4; Chrome/Firefox yield webm.
function pickMimeType(): { mimeType?: string; ext: string } {
  if (typeof MediaRecorder === 'undefined') return { ext: 'webm' };
  const candidates = [
    { mimeType: 'audio/webm;codecs=opus', ext: 'webm' },
    { mimeType: 'audio/webm',             ext: 'webm' },
    { mimeType: 'audio/mp4',              ext: 'mp4'  },
    { mimeType: 'audio/mpeg',             ext: 'mp3'  },
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c.mimeType)) return c;
  }
  return { ext: 'webm' };   // let the browser default; still upload as .webm
}

export default function VoiceRecorder({ onTranscript, disabled, compact, onError }: Props) {
  const { lang } = useLanguage();
  const t = usePlatformT();
  const [state, setState]     = useState<RecordState>('idle');
  const [error, setError]     = useState('');
  const [seconds, setSeconds] = useState(0);

  const fail = (message: string) => { if (compact) onError?.(message); else setError(message); };

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const streamRef   = useRef<MediaStream | null>(null);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // Feature-detect once.
  useEffect(() => {
    const ok =
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== 'undefined';
    if (!ok) setState('unsupported');
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cleanup() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }

  async function startRecording() {
    if (disabled) return;
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const { mimeType, ext } = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      recorder.onstop = async () => {
        cleanup();
        setState('transcribing');
        const blob = new Blob(chunksRef.current, { type: mimeType ?? 'audio/webm' });

        // Guard against an empty / far-too-short recording.
        if (blob.size < 1200) {
          setState('idle');
          fail(t.voice_too_short);
          return;
        }

        try {
          const formData = new FormData();
          formData.append('audio', blob, `answer.${ext}`);
          formData.append('language', lang);   // transcribe in the user's chosen language
          const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.text?.trim()) {
            setState('idle');
            fail(t.voice_no_transcript);
            return;
          }
          onTranscript(data.text.trim());
          setState('done');
        } catch {
          setState('idle');
          fail(t.voice_failed);
        }
      };

      recorder.start();
      setState('recording');
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      setState('idle');
      fail(t.voice_mic_blocked);
    }
  }

  function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    recorderRef.current?.stop();
  }

  if (state === 'unsupported') {
    // In a composer row there is no space for an explanation, and a browser that
    // cannot record simply has no mic button.
    if (compact) return null;
    return (
      <p className="text-[10px] text-[rgba(255,255,255,0.25)] italic">
        {t.voice_unsupported}
      </p>
    );
  }

  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  if (compact) {
    const recording = state === 'recording';
    const busy = state === 'transcribing';
    return (
      <button
        type="button"
        onClick={recording ? stopRecording : startRecording}
        disabled={disabled || busy}
        aria-label={recording ? `${t.voice_stop} · ${mmss}` : t.voice_record}
        title={recording ? `${t.voice_stop} · ${mmss}` : t.voice_record}
        className="shrink-0 h-11 w-11 flex items-center justify-center rounded-xl border transition-colors disabled:opacity-40"
        style={{
          background: recording ? 'rgba(200,60,60,0.10)' : 'rgba(0,0,0,0.04)',
          borderColor: recording ? 'rgba(200,60,60,0.35)' : 'rgba(0,0,0,0.14)',
          color: recording ? 'rgba(220,80,80,0.9)' : 'rgba(0,0,0,0.45)',
        }}
      >
        {busy ? (
          <span className="w-3.5 h-3.5 rounded-full border-2 border-black/20 border-t-black/55 animate-spin" />
        ) : recording ? (
          <span className="w-3 h-3 rounded-sm bg-[rgba(240,80,80,0.95)]" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
            <path fill="none" stroke="currentColor" strokeWidth="2" d="M19 10a7 7 0 0 1-14 0M12 19v4M8 23h8" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {state === 'idle' || state === 'done' ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: 'rgba(64,96,208,0.12)',
              border: '0.5px solid rgba(64,96,208,0.3)',
              color: disabled ? 'rgba(255,255,255,0.25)' : 'rgba(130,150,240,0.9)',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/>
              <path fill="none" stroke="currentColor" strokeWidth="2" d="M19 10a7 7 0 0 1-14 0M12 19v4M8 23h8"/>
            </svg>
            {state === 'done' ? t.voice_record_again : t.voice_record}
          </button>
        ) : state === 'recording' ? (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
            style={{
              background: 'rgba(200,60,60,0.15)',
              border: '0.5px solid rgba(200,60,60,0.4)',
              color: 'rgba(240,120,120,0.9)',
              cursor: 'pointer',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          >
            <span className="w-2 h-2 rounded-sm bg-[rgba(240,80,80,0.9)]" />
            {t.voice_stop} · {mmss}
          </button>
        ) : (
          <span className="text-xs text-[rgba(255,255,255,0.35)] italic">{t.voice_transcribing}</span>
        )}
      </div>

      {error && (
        <p className="text-[11px] text-[rgba(220,120,120,0.8)] pl-1">{error}</p>
      )}
    </div>
  );
}
