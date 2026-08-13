'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Lang } from '@/context/LanguageContext';

// Read-aloud, using the browser's own speech synthesis rather than a TTS API:
// it is free, needs no server round-trip, and the voice follows whatever the
// listener has installed. Shared by the public chat and the agent-test sandbox
// so the candidate hears their agent exactly as a recruiter would.
//
// Reading is per message and on demand: every answer carries its own button, and
// nothing is spoken unless someone asks for it. The earlier design was a single
// header switch that read every answer from then on — it sat far from the text it
// applied to, and the only way to silence one long answer was to turn the whole
// feature off.

const SPEECH_LOCALE: Record<Lang, string> = {
  en: 'en-GB', es: 'es-ES', it: 'it-IT', pt: 'pt-PT',
};

function synthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  return window.speechSynthesis;
}

export function useSpeech(lang: Lang) {
  const [available, setAvailable]   = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const speakingRef = useRef<string | null>(null);
  const langRef     = useRef<Lang>(lang);

  useEffect(() => { speakingRef.current = speakingId; }, [speakingId]);
  useEffect(() => { langRef.current = lang; }, [lang]);

  // Feature detection runs in an effect so the server and client first render
  // agree; anything speaking is cancelled when the chat goes away.
  useEffect(() => {
    setAvailable(synthesis() !== null);
    return () => { synthesis()?.cancel(); };
  }, []);

  const cancel = useCallback(() => {
    synthesis()?.cancel();
    setSpeakingId(null);
  }, []);

  /** Speak one message; calling it again for the message already playing stops it. */
  const speak = useCallback((id: string, text: string) => {
    const s = synthesis();
    if (!s) return;

    const wasSpeaking = speakingRef.current === id;
    s.cancel();                     // one voice at a time, whatever was playing
    setSpeakingId(null);
    if (wasSpeaking) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LOCALE[langRef.current];
    // Each handler closes over its own id, so a cancelled utterance's late
    // `onend` cannot clear the state of the one that replaced it.
    const clear = () => setSpeakingId(current => (current === id ? null : current));
    utterance.onend   = clear;
    utterance.onerror = clear;
    setSpeakingId(id);
    s.speak(utterance);
  }, []);

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
