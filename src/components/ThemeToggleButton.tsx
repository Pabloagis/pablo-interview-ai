'use client';

import { useRef } from 'react';
import Tooltip from './Tooltip';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

export default function ThemeToggleButton() {
  const { isDayMode, toggleTheme, manualOverride, clearOverride } = useTheme();
  const { t } = useLanguage();
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const startHold = () => {
    didLongPress.current = false;
    holdTimer.current = setTimeout(() => {
      if (manualOverride) {
        clearOverride();
        didLongPress.current = true;
      }
    }, 600);
  };

  const cancelHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const handleClick = () => {
    if (didLongPress.current) {
      didLongPress.current = false;
      return;
    }
    toggleTheme();
  };

  const tooltipText = isDayMode ? t.switchToNight : t.switchToDay;

  return (
    <Tooltip text={tooltipText} position="bottom" align="right">
      <button
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={e => {
          cancelHold();
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--glass-1)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--glass-border)';
        }}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        onTouchMove={cancelHold}
        onClick={handleClick}
        aria-label={tooltipText}
        style={{
          position: 'relative',
          width: 28, height: 28,
          borderRadius: 'var(--radius-sm)',
          background: 'var(--glass-1)',
          border: '0.5px solid var(--glass-border)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 180ms ease, border-color 180ms ease',
          color: 'var(--text-tertiary)',
          padding: 0,
          touchAction: 'manipulation',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--glass-2)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--glass-border-hi)';
        }}
      >
        {isDayMode ? <MoonIcon /> : <SunIcon />}

        {manualOverride && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 4, height: 4, borderRadius: '50%',
            background: 'var(--accent-primary)',
            pointerEvents: 'none',
          }} />
        )}
      </button>
    </Tooltip>
  );
}
