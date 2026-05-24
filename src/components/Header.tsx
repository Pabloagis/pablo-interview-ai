'use client';

import { useRef } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import Tooltip from './Tooltip';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

interface HeaderProps {
  recruiterName?: string;
  company?: string;
  action?: React.ReactNode;
}

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

export default function Header({ recruiterName, company, action }: HeaderProps) {
  const { isDayMode, toggleTheme, manualOverride, clearOverride } = useTheme();
  const { t } = useLanguage();
  const mouseDownTime = useRef(0);

  const handleMouseDown = () => { mouseDownTime.current = Date.now(); };

  const handleClick = () => {
    const elapsed = Date.now() - mouseDownTime.current;
    if (elapsed >= 600 && manualOverride) {
      clearOverride();
    } else {
      toggleTheme();
    }
  };

  const tooltipText = isDayMode ? t.switchToNight : t.switchToDay;

  return (
    <header
      className="flex items-center gap-2 px-3 py-2.5 shrink-0"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        borderBottom: '0.5px solid var(--nav-border)',
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Left: wordmark */}
      <div className="flex-1 min-w-0 flex items-center">
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--nav-text)',
        }}>
          InterviewMind
        </span>
      </div>

      {/* Center: recruiter context */}
      {(recruiterName || company) && (
        <div className="hidden sm:flex items-center gap-1 shrink-0"
          style={{ fontSize: 11, color: 'var(--nav-muted)' }}>
          {recruiterName && <span>{recruiterName}</span>}
          {recruiterName && company && <span>·</span>}
          {company && <span>{company}</span>}
        </div>
      )}

      {/* Right cluster */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Theme toggle */}
        <Tooltip text={tooltipText} position="bottom" align="right">
          <button
            onMouseDown={handleMouseDown}
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
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--glass-2)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--glass-border-hi)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--glass-1)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--glass-border)';
            }}
          >
            {isDayMode ? <MoonIcon /> : <SunIcon />}

            {/* Override indicator dot */}
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

        <LanguageSwitcher />
      </div>

      <div className="shrink-0">{action}</div>
    </header>
  );
}
