type ChatMessageProps = {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[85%] rounded-lg border px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'border-synthwave-pink/50 bg-synthwave-pink/10 text-white'
            : 'border-synthwave-cyan/40 bg-synthwave-dark/70 text-synthwave-cyan'
        ].join(' ')}
      >
        <div className="mb-1 text-xs uppercase tracking-wider opacity-70">
          {isUser ? 'Pilot' : 'Mission AI'}
        </div>
        <div>
          {content}
          {isStreaming && <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-synthwave-cyan" />}
        </div>
      </div>
    </div>
  )
}
