import { forwardRef } from 'react';

type CardVariant = 'default' | 'raised' | 'bordered';
type CardSize = 'sm' | 'md';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  size?: CardSize;
}

const variantStyles: Record<CardVariant, string> = {
  default:  'bg-[var(--surface)] border border-[var(--border)]',
  raised:   'bg-[var(--surface-raised)] border border-[var(--border)]',
  bordered: 'bg-[var(--surface)] border border-[var(--border-visible)]',
};

const sizeStyles: Record<CardSize, string> = {
  sm: 'p-4 rounded-[var(--radius-md)]',
  md: 'p-6 rounded-[var(--radius-lg)]',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', size = 'md', className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={[variantStyles[variant], sizeStyles[size], className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  ),
);
Card.displayName = 'Card';
