interface StreamingResponseProps {
  text: string;
}

export default function StreamingResponse({ text }: StreamingResponseProps) {
  return (
    <div className="flex justify-start mb-5">
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm mr-2.5 mt-0.5 flex-shrink-0">
        P
      </div>
      <div className="max-w-[75%] flex flex-col items-start">
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed whitespace-pre-wrap break-words bg-white text-gray-800 shadow-sm border border-gray-100">
          {text ? (
            <>
              {text}
              <span className="inline-block w-0.5 h-4 bg-gray-400 ml-0.5 animate-pulse align-middle" />
            </>
          ) : (
            <LoadingDots />
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <span className="flex gap-1 items-center h-4">
      <span
        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: '300ms' }}
      />
    </span>
  );
}
