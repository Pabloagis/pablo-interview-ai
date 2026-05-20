interface StreamingResponseProps {
  text: string;
  thinkingPhrase?: string;
}

export default function StreamingResponse({ text, thinkingPhrase }: StreamingResponseProps) {
  return (
    <div className="flex justify-start mb-5 overflow-hidden">
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
            <span className="text-gray-400 italic">{thinkingPhrase || 'Thinking…'}</span>
          )}
        </div>
      </div>
    </div>
  );
}
