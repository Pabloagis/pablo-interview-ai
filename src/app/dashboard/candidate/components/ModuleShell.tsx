'use client';

import { useState, useRef, useEffect } from 'react';

interface Props {
  id: string;
  title: string;
  description: string;
  valueLabel: string;        // e.g. "+10%" or "+5% per story"
  isHighValue?: boolean;
  completionLabel?: string;  // e.g. "3 / 7 answered" or "Uploaded"
  isComplete?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  saveConfirmation?: string | null;  // message shown after save, cleared by parent
  children: React.ReactNode;
}

export default function ModuleShell({
  title,
  description,
  valueLabel,
  isHighValue,
  completionLabel,
  isComplete,
  isOpen,
  onToggle,
  saveConfirmation,
  children,
}: Props) {
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Show toast whenever saveConfirmation changes to a non-null string
  useEffect(() => {
    if (!saveConfirmation) return;
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 3000);
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, [saveConfirmation]);

  return (
    <div
      className="rounded-xl border transition-colors duration-200"
      style={{
        borderColor: isOpen
          ? 'rgba(64,96,208,0.4)'
          : isComplete
            ? 'rgba(96,192,128,0.25)'
            : 'rgba(255,255,255,0.08)',
        background: isOpen
          ? 'rgba(64,96,208,0.06)'
          : 'rgba(255,255,255,0.02)',
      }}
    >
      {/* Header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        {/* Completion dot */}
        <div
          className="mt-1 shrink-0 w-2.5 h-2.5 rounded-full"
          style={{
            background: isComplete
              ? 'rgba(96,192,128,0.8)'
              : 'rgba(255,255,255,0.15)',
          }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-white">{title}</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{
                background: isHighValue ? 'rgba(64,96,208,0.2)' : 'rgba(255,255,255,0.06)',
                color: isHighValue ? '#8090f0' : 'rgba(255,255,255,0.4)',
                border: isHighValue ? '0.5px solid rgba(64,96,208,0.35)' : '0.5px solid rgba(255,255,255,0.1)',
              }}
            >
              {valueLabel}
            </span>
            {isHighValue && (
              <span className="text-[10px] text-[#f0a030]">🏆 Highest value</span>
            )}
          </div>
          <p className="text-xs text-[rgba(255,255,255,0.4)] leading-relaxed">{description}</p>
          {completionLabel && (
            <p
              className="text-[10px] mt-1 font-medium"
              style={{ color: isComplete ? 'rgba(96,192,128,0.8)' : 'rgba(255,255,255,0.35)' }}
            >
              {completionLabel}
            </p>
          )}
        </div>

        {/* Chevron */}
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.3)" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round"
          className="shrink-0 mt-0.5 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Body — expanded */}
      {isOpen && (
        <div ref={bodyRef} className="px-4 pb-5">
          <div className="h-px bg-[rgba(255,255,255,0.06)] mb-4" />
          {children}

          {/* Save confirmation toast */}
          <div
            className="mt-4 text-xs text-[rgba(96,192,128,0.9)] transition-opacity duration-300"
            style={{ opacity: toastVisible ? 1 : 0, minHeight: 18 }}
          >
            {toastVisible && saveConfirmation}
          </div>
        </div>
      )}
    </div>
  );
}
