'use client';

import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggleButton from './ThemeToggleButton';
import { useLanguage } from '@/context/LanguageContext';

interface HeaderProps {
  recruiterName?: string;
  company?: string;
  role?: string;
  action?: React.ReactNode;
}

export default function Header({ recruiterName, company, role, action }: HeaderProps) {
  const { t } = useLanguage();

  return (
    <header
      className="flex items-center gap-2 px-3 py-2 shrink-0"
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
      {/* Left: session info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center" style={{ gap: 1 }}>
        {recruiterName && (
          <span className="truncate" style={{
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.3,
            color: 'var(--text-primary)',
          }}>
            {recruiterName}
          </span>
        )}
        {company && (
          <span className="truncate" style={{
            fontSize: 11,
            lineHeight: 1.3,
            color: 'var(--text-tertiary)',
          }}>
            {company}
          </span>
        )}
        {role && (
          <span className="truncate" style={{
            fontSize: 11,
            lineHeight: 1.3,
            color: 'var(--text-tertiary)',
            opacity: 0.7,
          }}>
            {role}
          </span>
        )}
      </div>

      {/* Center: wordmark — flex-1 on both sides keeps this truly centered */}
      <div className="shrink-0 flex items-center justify-center">
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--nav-text)',
          whiteSpace: 'nowrap',
        }}>
          InterviewMind
        </span>
      </div>

      {/* Right cluster */}
      <div className="flex-1 flex items-center justify-end gap-2">
        <ThemeToggleButton />

        <LanguageSwitcher />

        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
