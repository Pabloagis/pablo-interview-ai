'use client';

import { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  variant?: 'underline' | 'outline';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, variant = 'outline', className = '', id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    const borderStyle =
      variant === 'underline'
        ? 'border-0 border-b rounded-none px-0'
        : 'border rounded-[var(--radius-sm)] px-3';

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={[
            'w-full bg-transparent',
            'font-sans text-[16px] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)]',
            'border-[var(--border-visible)]',
            'py-2',
            'outline-none resize-none',
            'transition-[border-color] duration-[180ms]',
            'focus:border-[var(--text-primary)]',
            error ? 'border-[var(--accent)]' : '',
            borderStyle,
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {error && (
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--accent)]">
            {error}
          </span>
        )}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
