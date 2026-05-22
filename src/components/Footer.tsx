interface FooterProps {
  variant?: 'full' | 'compact';
}

export default function Footer({ variant = 'full' }: FooterProps) {
  if (variant === 'compact') {
    return (
      <div className="shrink-0 py-2 px-4 text-center">
        <p className="text-[10px] text-gray-300">
          InterviewMind &nbsp;·&nbsp;{' '}
          <a href="/privacy" className="hover:text-gray-500 transition-colors">Privacy</a>
          {' '}&nbsp;·&nbsp;{' '}
          <a href="https://www.linkedin.com/in/pablo-agis-burgos" target="_blank" rel="noopener noreferrer" className="hover:text-gray-500 transition-colors">LinkedIn</a>
          {' '}&nbsp;·&nbsp;{' '}
          <a href="mailto:pabloagisburgos@gmail.com" className="hover:text-gray-500 transition-colors">Contact</a>
        </p>
      </div>
    );
  }

  return (
    <footer className="w-full max-w-[440px] mx-auto text-center pt-12 pb-10 px-4 space-y-3">
      <p className="text-[11.5px] text-gray-400 leading-relaxed">
        <span className="font-medium text-gray-500">InterviewMind</span>
        {' '}— built and owned by Pablo Agis Burgos, Barcelona.
      </p>
      <p className="text-[11px] text-gray-300 leading-relaxed">
        Conversations are private and never shared externally.
      </p>
      <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-gray-300">
        <a href="/privacy" className="hover:text-gray-500 transition-colors">Privacy</a>
        <span>·</span>
        <a href="https://www.linkedin.com/in/pablo-agis-burgos" target="_blank" rel="noopener noreferrer" className="hover:text-gray-500 transition-colors">LinkedIn</a>
        <span>·</span>
        <a href="mailto:pabloagisburgos@gmail.com" className="hover:text-gray-500 transition-colors">Contact</a>
      </div>
    </footer>
  );
}
