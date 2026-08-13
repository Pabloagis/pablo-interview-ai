'use client';

import { useEffect } from 'react';
import { ToastMessage } from '@/lib/types';
import { TOAST_DURATION_MS } from '@/lib/constants';

// NOTE: Nothing design uses inline [STATUS] text instead of toast popups.
// This component is kept for back-compat but is considered a deprecated pattern.

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="alert" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const borderColor = {
    success: 'var(--success)',
    error:   'var(--accent)',
    info:    'var(--interactive)',
  }[toast.type];

  const textColor = borderColor;

  return (
    <div
      className="bg-[var(--surface-raised)] px-4 py-3 rounded-[var(--radius-sm)] flex items-center gap-3 max-w-sm"
      style={{ border: `1px solid ${borderColor}` }}
    >
      <span className="font-sans text-[14px] flex-1 leading-snug" style={{ color: textColor }}>
        {toast.message}
      </span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="font-mono text-[var(--text-disabled)] hover:text-[var(--text-primary)] text-lg leading-none flex-shrink-0 transition-colors duration-[180ms]"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
