'use client';

import { useRef, useState } from 'react';

interface TooltipProps {
  text: string;
  position?: 'top' | 'bottom';
  align?: 'center' | 'left' | 'right';
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function Tooltip({
  text,
  position = 'top',
  align = 'center',
  disabled = false,
  className = '',
  children,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (disabled) return;
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 2000);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  const bubbleAlign =
    align === 'right'
      ? 'right-0'
      : align === 'left'
      ? 'left-0'
      : 'left-1/2 -translate-x-1/2';

  const arrowAlign =
    align === 'right'
      ? 'right-3'
      : align === 'left'
      ? 'left-3'
      : 'left-1/2 -translate-x-1/2';

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {!disabled && (
        <div
          role="tooltip"
          className={[
            'pointer-events-none absolute z-20',
            bubbleAlign,
            'px-2.5 py-1.5',
            'bg-gray-800 text-white text-[11px] font-medium leading-tight whitespace-nowrap',
            'rounded-lg shadow-xl',
            'transition-all duration-150 ease-out',
            position === 'top' ? 'bottom-full mb-2.5' : 'top-full mt-2.5',
          ].join(' ')}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'scale(1)' : 'scale(0.95)',
          }}
        >
          {text}
          <span
            className={[
              'absolute w-2 h-2 bg-gray-800 rotate-45',
              arrowAlign,
              position === 'top' ? '-bottom-1' : '-top-1',
            ].join(' ')}
          />
        </div>
      )}
    </div>
  );
}
