'use client';

interface HeaderProps {
  recruiterName?: string;
  company?: string;
}

export default function Header({ recruiterName, company }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xs">IM</span>
        </div>
        <span className="font-semibold text-gray-800 text-sm">InterviewMind</span>
      </div>

      {(recruiterName || company) && (
        <div className="text-xs text-gray-400 flex items-center gap-1">
          {recruiterName && <span>{recruiterName}</span>}
          {recruiterName && company && <span>·</span>}
          {company && <span>{company}</span>}
        </div>
      )}
    </header>
  );
}
