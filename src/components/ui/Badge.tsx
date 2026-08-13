import { forwardRef } from 'react';

type BadgeVariant = 'default' | 'active' | 'success' | 'warning' | 'destructive';
type BadgeShape = 'pill' | 'technical';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  shape?: BadgeShape;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:     'border-[var(--border-visible)] text-[var(--text-secondary)]',
  active:      'border-[var(--text-display)] text-[var(--text-display)]',
  success:     'border-[var(--success)] text-[var(--success)]',
  warning:     'border-[var(--warning)] text-[var(--warning)]',
  destructive: 'border-[var(--accent)] text-[var(--accent)]',
};

const shapeStyles: Record<BadgeShape, string> = {
  pill:      'rounded-full px-3 py-1',
  technical: 'rounded-[var(--radius-sm)] px-2 py-0.5',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', shape = 'pill', className = '', children, ...props }, ref) => (
    <span
      ref={ref}
      className={[
        'inline-flex items-center',
        'font-mono text-[11px] uppercase tracking-[0.08em]',
        'border bg-transparent',
        variantStyles[variant],
        shapeStyles[shape],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </span>
  ),
);
Badge.displayName = 'Badge';
