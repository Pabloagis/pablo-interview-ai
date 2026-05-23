interface StreamingResponseProps {
  text: string;
  thinkingPhrase?: string;
}

export default function StreamingResponse({ text, thinkingPhrase }: StreamingResponseProps) {
  return (
    <div className="flex justify-start mb-5 overflow-hidden">
      <div
        className="w-9 h-9 rounded-full overflow-hidden mr-3 mt-0.5 flex-shrink-0"
        style={{ border: '1.5px solid rgba(255,255,255,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
      >
        <img src="/assets/pablo-avatar.jpg" alt="Pablo" className="w-full h-full object-cover object-top" />
      </div>
      <div className="max-w-[75%] flex flex-col items-start">
        <div
          className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '0.5px solid rgba(255,255,255,0.10)',
            color: '#ffffff',
            borderRadius: '4px 16px 16px 16px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {text ? (
            <>
              {text}
              <span
                className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
                style={{ background: 'rgba(255,255,255,0.5)' }}
              />
            </>
          ) : (
            <span className="italic" style={{ color: 'rgba(255,255,255,0.38)' }}>
              {thinkingPhrase || 'Thinking…'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
