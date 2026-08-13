interface StreamingResponseProps {
  text: string;
  thinkingPhrase?: string;
}

export default function StreamingResponse({ text, thinkingPhrase }: StreamingResponseProps) {
  return (
    <div className="flex justify-start mb-5 overflow-hidden">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden mr-3 mt-0.5 flex-shrink-0 border border-[var(--border-visible)]">
        <img src="/assets/pablo-avatar.jpg" alt="Pablo" className="w-full h-full object-cover object-top" />
      </div>

      <div className="max-w-[75%] flex flex-col items-start pt-1">
        <div className="text-[16px] leading-relaxed whitespace-pre-wrap break-words text-[var(--text-primary)]">
          {text ? (
            <>
              {text}
              {/* Blinking cursor while streaming */}
              <span
                className="inline-block w-[2px] h-[1em] ml-0.5 align-middle animate-pulse"
                style={{ background: 'var(--text-disabled)', verticalAlign: '-0.1em' }}
              />
            </>
          ) : (
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-disabled)]">
              {thinkingPhrase ?? '[thinking...]'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
