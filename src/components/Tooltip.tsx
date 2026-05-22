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
    <div className={`relative group ${className}`}>
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
            'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100',
            'transition-all duration-150 ease-out',
            position === 'top' ? 'bottom-full mb-2.5' : 'top-full mt-2.5',
          ].join(' ')}
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
