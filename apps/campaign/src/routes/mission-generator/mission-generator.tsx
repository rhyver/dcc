import { ArrowLeft, FileDown, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { ChatInput } from './chat-input'
import { ChatMessage } from './chat-message'
import { useMissionChat } from './use-mission-chat'

export function MissionGenerator() {
  const navigate = useNavigate()
  const {
    messages,
    briefing,
    isStreaming,
    isGenerating,
    generatedPath,
    error,
    sendMessage,
    generateMission
  } = useMissionChat()

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-synthwave-dark text-white">
      <div className="absolute inset-0 z-0 opacity-20 [background-image:linear-gradient(to_right,var(--synthwave-pink)_1px,transparent_1px),linear-gradient(to_bottom,var(--synthwave-pink)_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="relative z-10 flex w-full gap-4 p-4">
        <div className="flex w-2/3 flex-col rounded-lg border border-synthwave-purple/40 bg-black/45 p-4 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="retro-font text-2xl text-synthwave-cyan">AI MISSION GENERATOR</h1>
            <Button
              variant="ghost"
              onClick={() => navigate('/new')}
              className="text-synthwave-pink"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>

          <div className="mb-4 flex-1 space-y-3 overflow-y-auto rounded-md border border-synthwave-purple/30 bg-black/30 p-3">
            {messages.map((message, index) => {
              const isLast = index === messages.length - 1
              return (
                <ChatMessage
                  key={`${index}-${message.role}`}
                  role={message.role}
                  content={message.content}
                  isStreaming={isLast && message.role === 'assistant' && isStreaming}
                />
              )
            })}
          </div>

          <ChatInput disabled={isStreaming || isGenerating} onSend={sendMessage} />
        </div>

        <div className="flex w-1/3 flex-col rounded-lg border border-synthwave-cyan/40 bg-black/45 p-4 backdrop-blur-sm">
          <h2 className="retro-font mb-3 text-lg text-synthwave-pink">BRIEFING PREVIEW</h2>
          <div className="flex-1 overflow-y-auto rounded-md border border-synthwave-cyan/30 bg-black/30 p-3 text-sm whitespace-pre-wrap">
            {briefing || 'Mission briefing will appear here as the AI responds.'}
          </div>

          {error && <p className="mt-3 rounded bg-red-950/60 p-2 text-xs text-red-200">{error}</p>}
          {generatedPath && (
            <p className="mt-3 rounded bg-emerald-950/60 p-2 text-xs text-emerald-200">
              Mission generated at: {generatedPath}
            </p>
          )}

          <Button
            onClick={() => void generateMission()}
            disabled={isStreaming || isGenerating || messages.length < 2}
            className="mt-4 bg-synthwave-pink text-white hover:bg-synthwave-pink/80"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            {isGenerating ? 'Generating .miz...' : 'Generate Mission'}
          </Button>
        </div>
      </div>
    </div>
  )
}
