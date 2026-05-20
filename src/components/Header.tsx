'use client';

interface HeaderProps {
  recruiterName?: string;
  company?: string;
  action?: React.ReactNode;
}

export default function Header({ recruiterName, company, action }: HeaderProps) {
  return (
    <header style={{display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, width:'100%', maxWidth:'100%', overflowX:'hidden', padding:'12px 12px', borderBottom:'1px solid #e5e7eb', backgroundColor:'white', minHeight:'48px', boxSizing:'border-box'}}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xs">IM</span>
        </div>
        <span className="font-semibold text-gray-800 text-sm truncate">InterviewMind</span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 pl-2">
        {(recruiterName || company) && (
          <div className="hidden sm:flex text-xs text-gray-400 items-center gap-1">
            {recruiterName && <span>{recruiterName}</span>}
            {recruiterName && company && <span>·</span>}
            {company && <span>{company}</span>}
          </div>
        )}
        {action}
      </div>
    </header>
  );
}
