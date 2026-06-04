'use client';

import { useState, useEffect, useRef } from 'react';
import type { AnalysisResult } from '@/app/api/training/analyze/route';

interface Props {
  analysis: AnalysisResult | null;
  onAdvance: () => void;
  onBack: () => void;
  onAnalyzed: () => void;
}

const LOADING_MESSAGES = [
  'Analysing your background…',
  'Identifying your strengths…',
  'Mapping potential concerns…',
  'Building your profile…',
];

export default function Step3Analysis({ analysis, onAdvance, onBack, onAnalyzed }: Props) {
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>(
    analysis ? 'done' : 'loading'
  );
  const [result, setResult] = useState<AnalysisResult | null>(analysis);
  const [errorMsg, setErrorMsg] = useState('');
  const [msgIdx, setMsgIdx] = useState(0);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (status !== 'loading') return;
    const t = setInterval(() => setMsgIdx(i => (i + 1) % LOADING_MESSAGES.length), 900);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    if (analysis || hasRunRef.current) return;
    hasRunRef.current = true;
    runAnalysis();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function runAnalysis() {
    setStatus('loading');
    setErrorMsg('');
    try {
      const [res] = await Promise.all([
        fetch('/api/training/analyze', { method: 'POST' }),
        new Promise(r => setTimeout(r, 3000)), // minimum 3s for the wow moment
      ]);
      if (!res.ok) {
        const j = await res.json() as { error?: string };
        setErrorMsg(j.error ?? 'Analysis failed. Please try again.');
        setStatus('error');
        return;
      }
      const j = await res.json() as { analysis: AnalysisResult };
      setResult(j.analysis);
      setStatus('done');
      onAnalyzed();
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'loading') {
    return (
      <div className="max-w-xl">
        <StepLabel />
        <h1 className="text-xl font-bold text-white mt-1 mb-12">Analysing your background…</h1>
        <div className="flex flex-col items-center gap-8 py-6">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-[rgba(64,96,208,0.15)]" />
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#4060d0] animate-spin"
              style={{ animationDuration: '1.2s' }}
            />
            <div className="absolute inset-2 rounded-full bg-[rgba(64,96,208,0.08)] animate-pulse" />
          </div>
          <p className="text-sm text-[rgba(255,255,255,0.5)]">{LOADING_MESSAGES[msgIdx]}</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-xl">
        <StepLabel />
        <h1 className="text-xl font-bold text-white mt-1 mb-6">Analysis failed.</h1>
        <p className="text-sm text-red-400 mb-6">{errorMsg}</p>
        <div className="flex gap-3">
          <button onClick={onBack} className={BTN_BACK}>← Back</button>
          <button onClick={runAnalysis} className={BTN_PRIMARY}>Try again</button>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="max-w-xl">
      <StepLabel />
      <h1 className="text-xl font-bold text-white mt-1 mb-6">Here&apos;s what I&apos;ve learned.</h1>

      <div className="flex flex-col gap-3 mb-8">
        {result.learned.length > 0 && (
          <ResultBlock title="Here's what I've learned:">
            {result.learned.map((item, i) => (
              <ResultRow key={i} icon="✓" color="text-green-400">{item}</ResultRow>
            ))}
          </ResultBlock>
        )}

        {result.objections.length > 0 && (
          <ResultBlock title="Potential concerns:">
            {result.objections.map((obj, i) => (
              <ResultRow key={i} icon="⚠" color="text-amber-400">{obj.concern}</ResultRow>
            ))}
          </ResultBlock>
        )}

        {result.hidden_strengths.length > 0 && (
          <ResultBlock title="Potential strengths:">
            {result.hidden_strengths.map((str, i) => (
              <ResultRow key={i} icon="⭐" color="text-blue-300">{str.strength}</ResultRow>
            ))}
          </ResultBlock>
        )}
      </div>

      <p className="text-white font-semibold text-base mb-5">
        Let&apos;s build your Digital Twin together.
      </p>

      <div className="flex gap-3">
        <button onClick={onBack} className={BTN_BACK}>← Back</button>
        <button onClick={onAdvance} className={BTN_PRIMARY}>Continue →</button>
      </div>
    </div>
  );
}

function StepLabel() {
  return (
    <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-widest">
      AI Analysis · Step 3 of 10
    </span>
  );
}

function ResultBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] p-4">
      <p className="text-[10px] font-semibold text-[rgba(255,255,255,0.35)] uppercase tracking-wider mb-3">{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function ResultRow({ icon, color, children }: { icon: string; color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-[rgba(255,255,255,0.8)]">
      <span className={`${color} shrink-0 mt-0.5 text-xs`}>{icon}</span>
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}

const BTN_PRIMARY = 'inline-flex px-6 py-2.5 rounded-xl bg-[#4060d0] hover:bg-[#3050c0] text-white text-sm font-medium transition-colors';
const BTN_BACK = 'inline-flex px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.5)] hover:text-white text-sm transition-colors';
