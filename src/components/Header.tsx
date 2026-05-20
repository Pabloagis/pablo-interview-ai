'use client';

import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  recruiterName?: string;
  company?: string;
  action?: React.ReactNode;
}

export default function Header({ recruiterName, company, action }: HeaderProps) {
  return (
    <header className="flex items-center gap-2 px-3 py-3 border-b bg-white shrink-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">IM</span>
          </div>
          <span className="font-semibold text-gray-800 text-sm truncate">InterviewMind</span>
        </div>
      </div>

      {(recruiterName || company) && (
        <div className="hidden sm:flex text-xs text-gray-400 items-center gap-1 shrink-0">
          {recruiterName && <span>{recruiterName}</span>}
          {recruiterName && company && <span>·</span>}
          {company && <span>{company}</span>}
        </div>
      )}

      <LanguageSwitcher />

      <div className="shrink-0">
        {action}
      </div>
    </header>
  );
}
