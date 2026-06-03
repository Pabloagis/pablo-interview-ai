'use client';

import { useState, useRef, useEffect } from 'react';

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

type RecordState = 'idle' | 'recording' | 'transcribing' | 'done' | 'unsupported';

// Augment window for SpeechRecognition cross-browser
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: { [index: number]: { [index: number]: { transcript: string }; isFinal: boolean; length: number }; length: number };
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

export default function VoiceRecorder({ onTranscript, disabled }: Props) {
  const [state, setState] = useState<RecordState>('idle');
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const finalRef = useRef('');

  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setState('unsupported');
    }
    return () => { recognitionRef.current?.abort(); };
  }, []);

  function startRecording() {
    const SpeechRecognitionAPI =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    finalRef.current = '';
    setInterimText('');

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let interim = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalChunk += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      if (finalChunk) finalRef.current += finalChunk;
      setInterimText(interim);
    };

    recognition.onend = () => {
      setState('done');
      setInterimText('');
      const full = finalRef.current.trim();
      if (full) onTranscript(full);
    };

    recognition.onerror = () => {
      setState('idle');
      setInterimText('');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setState('recording');
  }

  function stopRecording() {
    setState('transcribing');
    recognitionRef.current?.stop();
  }

  if (state === 'unsupported') {
    return (
      <p className="text-[10px] text-[rgba(255,255,255,0.25)] italic">
        Voice recording requires Chrome or Edge.
      </p>
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
            {state === 'done' ? 'Record again' : 'Record your answer'}
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
            Stop recording
          </button>
        ) : (
          <span className="text-xs text-[rgba(255,255,255,0.35)] italic">Transcribing…</span>
        )}
      </div>

      {/* Interim transcript preview */}
      {interimText && (
        <p className="text-[11px] text-[rgba(255,255,255,0.35)] italic pl-1">{interimText}</p>
      )}
    </div>
  );
}
