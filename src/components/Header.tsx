'use client';

import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  recruiterName?: string;
  company?: string;
  action?: React.ReactNode;
}

export default function Header({ recruiterName, company, action }: HeaderProps) {
  return (
    <header
      className="flex items-center gap-2 px-3 py-2.5 shrink-0"
      style={{
        borderBottom: `0.5px solid var(--nav-border)`,
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
            boxShadow: '0 2px 8px var(--accent-glow)',
          }}
        >
          <span className="text-white font-bold text-xs">IM</span>
        </div>
        <span className="font-semibold text-sm truncate" style={{ color: 'var(--nav-text)', letterSpacing: '-0.01em' }}>
          InterviewMind
        </span>
      </div>

      {(recruiterName || company) && (
        <div className="hidden sm:flex items-center gap-1 shrink-0" style={{ fontSize: 11, color: 'var(--nav-muted)' }}>
          {recruiterName && <span>{recruiterName}</span>}
          {recruiterName && company && <span>·</span>}
          {company && <span>{company}</span>}
        </div>
      )}

      <LanguageSwitcher />

      <div className="shrink-0">{action}</div>
    </header>
  );
}
