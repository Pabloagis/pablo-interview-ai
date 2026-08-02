'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Lang } from '@/context/LanguageContext';

// Read-aloud, using the browser's own speech synthesis rather than a TTS API:
// it is free, needs no server round-trip, and the voice follows whatever the
// listener has installed. Shared by the public chat and the agent-test sandbox
// so the candidate hears their agent exactly as a recruiter would.

const SPEECH_LOCALE: Record<Lang, string> = {
  en: 'en-GB', es: 'es-ES', it: 'it-IT', pt: 'pt-PT',
};

function synthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  return window.speechSynthesis;
}

export function useSpeech(lang: Lang) {
  const [enabled, setEnabled] = useState(false);
  const [available, setAvailable] = useState(false);
  const enabledRef = useRef(false);
  const langRef    = useRef<Lang>(lang);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { langRef.current = lang; }, [lang]);

  // Feature detection runs in an effect so the server and client first render
  // agree; anything speaking is cancelled when the chat goes away.
  useEffect(() => {
    setAvailable(synthesis() !== null);
    return () => { synthesis()?.cancel(); };
  }, []);

  const speak = useCallback((text: string) => {
    const s = synthesis();
    if (!enabledRef.current || !s) return;
    s.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LOCALE[langRef.current];
    s.speak(utterance);
  }, []);

  const cancel = useCallback(() => { synthesis()?.cancel(); }, []);

  const toggle = useCallback(() => {
    setEnabled(prev => {
      if (prev) synthesis()?.cancel();
      return !prev;
    });
  }, []);

  return { available, enabled, toggle, speak, cancel };
}

export default function SpeakToggle({
  enabled,
  onToggle,
  labelOn,
  labelOff,
}: {
  enabled:  boolean;
  onToggle: () => void;
  labelOn:  string;
  labelOff: string;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label={enabled ? labelOff : labelOn}
      aria-pressed={enabled}
      title={enabled ? labelOff : labelOn}
      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border transition-colors"
      style={{
        borderColor: enabled ? 'rgba(96,128,240,0.5)' : 'rgba(255,255,255,0.12)',
        color:       enabled ? 'rgba(140,165,250,0.95)' : 'rgba(255,255,255,0.45)',
        background:  enabled ? 'rgba(64,96,208,0.14)' : 'transparent',
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H2v6h4l5 4V5z" />
        {enabled
          ? <><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></>
          : <><path d="m17 9 4 6" /><path d="m21 9-4 6" /></>}
      </svg>
    </button>
  );
}
