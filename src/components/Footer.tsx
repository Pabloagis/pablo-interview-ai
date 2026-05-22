interface FooterProps {
  variant?: 'full' | 'compact';
}

export default function Footer({ variant = 'full' }: FooterProps) {
  const links = (
    <>
      <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</a>
      <span className="text-gray-300">·</span>
      <a
        href="https://www.linkedin.com/in/pablo-agis-burgos"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-gray-600 transition-colors"
      >
        LinkedIn
      </a>
      <span className="text-gray-300">·</span>
      <a href="mailto:pabloagisburgos@gmail.com" className="hover:text-gray-600 transition-colors">
        Contact
      </a>
    </>
  );

  if (variant === 'compact') {
    return (
      <div className="shrink-0 border-t border-gray-100 bg-white py-2 px-4 text-center">
        <div className="flex items-center justify-center gap-2 text-[10.5px] text-gray-300">
          <span className="font-medium text-gray-400">InterviewMind</span>
          <span>·</span>
          {links}
        </div>
      </div>
    );
  }

  return (
    <footer className="w-full max-w-[440px] mx-auto text-center pt-10 pb-8 px-4">
      <p className="text-[13px] font-semibold text-gray-600 mb-0.5">InterviewMind</p>
      <p className="text-[12px] text-gray-400 mb-6">Interactive AI profiles for modern recruiting</p>

      <p className="text-[12px] text-gray-500 mb-0.5">Built and owned by Pablo Agis Burgos</p>
      <p className="text-[12px] text-gray-400 mb-6">Barcelona, Spain</p>

      <p className="text-[11.5px] text-gray-400 mb-7 leading-relaxed max-w-xs mx-auto">
        All conversations remain private and are never shared externally.
      </p>

      <div className="flex items-center justify-center gap-3 text-[12px] text-gray-400">
        {links}
      </div>
    </footer>
  );
}
