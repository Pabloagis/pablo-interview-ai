interface SpinnerProps {
  size?: number;
  label?: string;
  textOnly?: boolean;
}

const SEGMENTS = 8;

export function Spinner({ size = 20, label, textOnly = false }: SpinnerProps) {
  if (textOnly) {
    return (
      <span className="font-mono text-[var(--text-disabled)] text-[11px] uppercase tracking-[0.08em]">
        {label ?? '[LOADING...]'}
      </span>
    );
  }

  return (
    <span
      role="status"
      aria-label={label ?? 'Loading'}
      className="inline-flex items-center gap-2"
    >
      <span
        className="relative inline-block flex-shrink-0"
        style={{ width: size, height: size }}
      >
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const angle = (i / SEGMENTS) * 360;
          const rad = (angle * Math.PI) / 180;
          const radius = size * 0.32;
          const cx = size / 2 + radius * Math.sin(rad);
          const cy = size / 2 - radius * Math.cos(rad);
          const blockW = size * 0.12;
          const blockH = size * 0.22;

          return (
            <span
              key={i}
              className="absolute rounded-[1px]"
              style={{
                width: blockW,
                height: blockH,
                left: cx - blockW / 2,
                top: cy - blockH / 2,
                transform: `rotate(${angle}deg)`,
                background: 'var(--text-primary)',
                opacity: 1 - (i / SEGMENTS) * 0.85,
                animation: `ring-spin 1s linear infinite`,
                animationDelay: `${-(i / SEGMENTS)}s`,
              }}
            />
          );
        })}
      </span>
      {label && (
        <span className="font-mono text-[var(--text-disabled)] text-[11px] uppercase tracking-[0.08em]">
          {label}
        </span>
      )}
    </span>
  );
}
