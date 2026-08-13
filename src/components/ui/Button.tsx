'use client';

import { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--text-display)] text-[var(--black)] border-0 ' +
    'hover:brightness-90 active:brightness-80',
  secondary:
    'bg-transparent text-[var(--text-primary)] border border-[var(--border-visible)] ' +
    'hover:border-[var(--text-primary)] hover:text-[var(--text-display)] active:brightness-90',
  ghost:
    'bg-transparent text-[var(--text-secondary)] border-0 rounded-none ' +
    'hover:text-[var(--text-primary)] active:text-[var(--text-display)]',
  destructive:
    'bg-transparent text-[var(--accent)] border border-[var(--accent)] ' +
    'hover:brightness-110 active:brightness-90',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-1.5 text-[11px] tracking-[0.07em] min-h-[36px]',
  md: 'px-6 py-3 text-[13px] tracking-[0.06em] min-h-[44px]',
  lg: 'px-8 py-3.5 text-[14px] tracking-[0.06em] min-h-[52px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', disabled, children, ...props }, ref) => {
    const isGhost = variant === 'ghost';
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={[
          'inline-flex items-center justify-center gap-2',
          'font-mono uppercase font-normal',
          'transition-[filter,border-color,color] duration-[180ms]',
          'cursor-pointer select-none',
          isGhost ? '' : 'rounded-full',
          variantStyles[variant],
          sizeStyles[size],
          disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
