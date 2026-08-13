'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Read-aloud via OpenAI TTS (onyx voice), server-side — same quality in every
// browser, no dependency on the browser's speech synthesis engine.

export function useSpeech(_lang?: unknown) {
  const [available, setAvailable]   = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const audioRef     = useRef<HTMLAudioElement | null>(null);
  const speakingRef  = useRef<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => { speakingRef.current = speakingId; }, [speakingId]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    stopAudio();
    setSpeakingId(null);
  }, [stopAudio]);

  useEffect(() => {
    setAvailable(true);
    return () => { stopAudio(); };
  }, [stopAudio]);

  const speak = useCallback(async (id: string, text: string) => {
    if (speakingRef.current === id) { cancel(); return; }
    stopAudio();
    setSpeakingId(id);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) { setSpeakingId(curr => curr === id ? null : curr); return; }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      objectUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      const cleanup = () => {
        URL.revokeObjectURL(url);
        if (objectUrlRef.current === url) objectUrlRef.current = null;
        if (audioRef.current === audio)   audioRef.current = null;
        setSpeakingId(curr => curr === id ? null : curr);
      };
      audio.onended = cleanup;
      audio.onerror = cleanup;

      await audio.play();
    } catch {
      setSpeakingId(curr => curr === id ? null : curr);
    }
  }, [cancel, stopAudio]);

  return { available, speakingId, speak, cancel };
}

/** The read-aloud control that sits under a single assistant message. */
export default function SpeakButton({
  speaking,
  onClick,
  labelSpeak,
  labelStop,
}: {
  speaking:   boolean;
  onClick:    () => void;
  labelSpeak: string;
  labelStop:  string;
}) {
  const label = speaking ? labelStop : labelSpeak;
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={speaking}
      title={label}
      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-black/[0.06]"
      style={{
        color:      speaking ? 'rgba(40,80,200,0.85)'  : 'rgba(0,0,0,0.35)',
        background: speaking ? 'rgba(64,96,208,0.12)'  : 'transparent',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H2v6h4l5 4V5z" />
        {speaking
          ? <><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></>
          : <path d="M15.5 8.5a5 5 0 0 1 0 7" />}
      </svg>
    </button>
  );
}
