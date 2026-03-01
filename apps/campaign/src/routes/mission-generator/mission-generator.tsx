import { ArrowLeft, FileDown, Loader2, Save, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
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
    hasPendingBriefingQuestions,
    canGenerateMission,
    generatedPath,
    missionPlanPath,
    campaignPath,
    savedBriefings,
    selectedBriefingId,
    setSelectedBriefingId,
    isSavingBriefing,
    isLoadingBriefing,
    isDeletingBriefing,
    sendMessage,
    generateMission,
    saveBriefing,
    loadBriefing,
    deleteBriefing
  } = useMissionChat()
  const [briefingName, setBriefingName] = useState('')

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

          <div className="synthwave-scrollbar mb-4 flex-1 space-y-3 overflow-y-auto rounded-md border border-synthwave-purple/30 bg-black/30 p-3">
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
          <div className="synthwave-scrollbar flex-1 overflow-y-auto rounded-md border border-synthwave-cyan/30 bg-black/30 p-3 text-sm whitespace-pre-wrap">
            {briefing || 'Mission briefing will appear here as the AI responds.'}
          </div>

          {generatedPath && (
            <p className="mt-3 rounded bg-emerald-950/60 p-2 text-xs text-emerald-200">
              Mission generated at: {generatedPath}
            </p>
          )}
          {missionPlanPath && (
            <p className="mt-2 rounded bg-emerald-950/60 p-2 text-xs text-emerald-200">
              Mission plan JSON: {missionPlanPath}
            </p>
          )}
          {campaignPath && (
            <p className="mt-2 rounded bg-emerald-950/60 p-2 text-xs text-emerald-200">
              Campaign JSON: {campaignPath}
            </p>
          )}

          {hasPendingBriefingQuestions && (
            <p className="mt-3 rounded bg-amber-950/60 p-2 text-xs text-amber-200">
              Answer all mission briefing questions before generating the mission.
            </p>
          )}

          <div className="mt-4 space-y-2 rounded-md border border-synthwave-cyan/30 bg-black/30 p-3">
            <p className="text-xs font-semibold tracking-wide text-synthwave-cyan">
              BRIEFING LIBRARY
            </p>
            <div className="flex gap-2">
              <input
                value={briefingName}
                onChange={(event) => setBriefingName(event.target.value)}
                placeholder="Optional briefing name..."
                className="w-full rounded border border-synthwave-purple/40 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-synthwave-cyan"
              />
              <Button
                onClick={() => void saveBriefing(briefingName)}
                disabled={isSavingBriefing || briefing.trim().length === 0}
                className="bg-synthwave-cyan text-black hover:bg-synthwave-cyan/80"
              >
                {isSavingBriefing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedBriefingId}
                onChange={(event) => setSelectedBriefingId(event.target.value)}
                className="w-full rounded border border-synthwave-purple/40 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-synthwave-cyan"
              >
                <option value="">Select saved briefing</option>
                {savedBriefings.map((savedBriefing) => (
                  <option key={savedBriefing.id} value={savedBriefing.id}>
                    {savedBriefing.name}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => void loadBriefing(selectedBriefingId)}
                disabled={!selectedBriefingId || isLoadingBriefing}
                variant="outline"
                className="border-synthwave-cyan text-synthwave-cyan hover:bg-synthwave-cyan/20"
              >
                {isLoadingBriefing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={() => void deleteBriefing(selectedBriefingId)}
                disabled={!selectedBriefingId || isDeletingBriefing}
                variant="outline"
                className="border-red-400 text-red-300 hover:bg-red-500/20"
              >
                {isDeletingBriefing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            onClick={() => void generateMission()}
            disabled={!canGenerateMission}
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
