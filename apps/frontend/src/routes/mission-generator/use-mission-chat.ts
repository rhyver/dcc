import { useEffect, useMemo, useRef, useState } from 'react'
import { coreClient } from '@/lib/orpc'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type SavedBriefingSummary = {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

type SavedBriefing = SavedBriefingSummary & {
  briefing: string
  messages: ChatMessage[]
  missionPlan?: Awaited<
    ReturnType<typeof coreClient.missionGenerator.generateMission>
  >['missionPlan']
}

function messageContainsQuestion(content: string) {
  return /\?/.test(content)
}

function hasUnansweredBriefingQuestions(messages: ChatMessage[]) {
  return messages.some((message, index) => {
    if (message.role !== 'assistant' || !messageContainsQuestion(message.content)) {
      return false
    }

    for (let i = index + 1; i < messages.length; i += 1) {
      const next = messages[i]
      if (next?.role === 'user' && next.content.trim().length > 0) {
        return false
      }
    }

    return true
  })
}

export function useMissionChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Describe your mission request. I can ask follow-up questions and then generate a DCS mission file.'
    }
  ])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPath, setGeneratedPath] = useState<string | null>(null)
  const [missionPlanPath, setMissionPlanPath] = useState<string | null>(null)
  const [campaignPath, setCampaignPath] = useState<string | null>(null)
  const [lastMissionPlan, setLastMissionPlan] = useState<
    Awaited<ReturnType<typeof coreClient.missionGenerator.generateMission>>['missionPlan'] | null
  >(null)
  const [savedBriefings, setSavedBriefings] = useState<SavedBriefingSummary[]>([])
  const [selectedBriefingId, setSelectedBriefingId] = useState<string>('')
  const [isSavingBriefing, setIsSavingBriefing] = useState(false)
  const [isLoadingBriefing, setIsLoadingBriefing] = useState(false)
  const [isDeletingBriefing, setIsDeletingBriefing] = useState(false)

  const cleanupRef = useRef<(() => void) | null>(null)

  const briefing = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i]
      if (message?.role === 'assistant') {
        return message.content
      }
    }
    return ''
  }, [messages])

  const hasPendingBriefingQuestions = useMemo(
    () => hasUnansweredBriefingQuestions(messages),
    [messages]
  )

  const canGenerateMission = useMemo(
    () => messages.length >= 2 && !isStreaming && !isGenerating && !hasPendingBriefingQuestions,
    [messages.length, isStreaming, isGenerating, hasPendingBriefingQuestions]
  )

  const cleanupStreamingListeners = () => {
    cleanupRef.current?.()
    cleanupRef.current = null
  }

  const applySavedBriefings = (items: SavedBriefingSummary[]) => {
    setSavedBriefings(items)
    setSelectedBriefingId((current) => {
      if (current && items.some((item) => item.id === current)) {
        return current
      }
      return items[0]?.id ?? ''
    })
  }

  const refreshSavedBriefings = async () => {
    const items = await coreClient.missionGenerator.listBriefings()
    applySavedBriefings(items)
  }

  const pushAssistantMessage = (content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return

    setMessages((current) => {
      if (current.length === 0) {
        return [{ role: 'assistant', content: trimmed }]
      }

      const updated = [...current]
      const last = updated[updated.length - 1]
      if (last?.role === 'assistant' && last.content.trim().length === 0) {
        updated[updated.length - 1] = { ...last, content: trimmed }
        return updated
      }

      return [...updated, { role: 'assistant', content: trimmed }]
    })
  }

  useEffect(() => {
    let isMounted = true

    void coreClient.missionGenerator
      .listBriefings()
      .then((items) => {
        if (isMounted) {
          applySavedBriefings(items)
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
      cleanupStreamingListeners()
    }
  }, [])

  const sendMessage = (text: string) => {
    if (isStreaming) return
    setGeneratedPath(null)
    setMissionPlanPath(null)
    setCampaignPath(null)
    setLastMissionPlan(null)
    setIsStreaming(true)

    const userMessage: ChatMessage = { role: 'user', content: text }
    const assistantPlaceholder: ChatMessage = { role: 'assistant', content: '' }
    const nextMessages = [...messages, userMessage, assistantPlaceholder]
    setMessages(nextMessages)

    const offChunk =
      window.api?.onMissionGeneratorChatChunk((chunk) => {
        setMessages((current) => {
          if (current.length === 0) return current
          const updated = [...current]
          const last = updated[updated.length - 1]
          if (!last || last.role !== 'assistant') return current
          updated[updated.length - 1] = {
            ...last,
            content: `${last.content}${chunk}`
          }
          return updated
        })
      }) ?? (() => {})

    const stopStreaming = () => {
      setIsStreaming(false)
      cleanupStreamingListeners()
    }

    const offEnd = window.api?.onMissionGeneratorChatEnd(stopStreaming) ?? (() => {})
    const offError =
      window.api?.onMissionGeneratorChatError((message) => {
        pushAssistantMessage(message)
        stopStreaming()
      }) ?? (() => {})

    cleanupRef.current = () => {
      offChunk()
      offEnd()
      offError()
    }

    window.api?.sendMissionGeneratorChat(nextMessages.filter((m) => m.content.length > 0))
  }

  const generateMission = async () => {
    if (!canGenerateMission) return
    setIsGenerating(true)
    try {
      const result = await coreClient.missionGenerator.generateMission({
        messages
      })
      setGeneratedPath(result.path)
      setMissionPlanPath(result.missionPlanPath)
      setCampaignPath(result.campaignPath)
      setLastMissionPlan(result.missionPlan)
    } catch (generationError) {
      const message =
        generationError instanceof Error ? generationError.message : 'Generation failed.'
      pushAssistantMessage(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const saveBriefing = async (name?: string) => {
    if (isSavingBriefing || briefing.trim().length === 0) return

    setIsSavingBriefing(true)
    try {
      const result = await coreClient.missionGenerator.saveBriefing({
        ...(name?.trim() ? { name: name.trim() } : {}),
        briefing: briefing.trim(),
        messages: messages.filter((message) => message.content.trim().length > 0),
        ...(lastMissionPlan ? { missionPlan: lastMissionPlan } : {})
      })
      await refreshSavedBriefings()
      setSelectedBriefingId(result.id)
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Failed to save briefing.'
      pushAssistantMessage(message)
    } finally {
      setIsSavingBriefing(false)
    }
  }

  const loadBriefing = async (id: string) => {
    if (!id || isLoadingBriefing || isStreaming || isGenerating) return

    setIsLoadingBriefing(true)
    try {
      const loaded = (await coreClient.missionGenerator.getBriefing({ id })) as SavedBriefing
      setMessages(loaded.messages)
      setSelectedBriefingId(loaded.id)
      setGeneratedPath(null)
      setMissionPlanPath(null)
      setCampaignPath(null)
      setLastMissionPlan(loaded.missionPlan ?? null)
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load briefing.'
      pushAssistantMessage(message)
    } finally {
      setIsLoadingBriefing(false)
    }
  }

  const deleteBriefing = async (id: string) => {
    if (!id || isDeletingBriefing) return

    setIsDeletingBriefing(true)
    try {
      await coreClient.missionGenerator.deleteBriefing({ id })
      await refreshSavedBriefings()
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : 'Failed to delete briefing.'
      pushAssistantMessage(message)
    } finally {
      setIsDeletingBriefing(false)
    }
  }

  return {
    messages,
    briefing,
    isStreaming,
    isGenerating,
    isSavingBriefing,
    isLoadingBriefing,
    isDeletingBriefing,
    hasPendingBriefingQuestions,
    canGenerateMission,
    generatedPath,
    missionPlanPath,
    campaignPath,
    savedBriefings,
    selectedBriefingId,
    setSelectedBriefingId,
    refreshSavedBriefings,
    sendMessage,
    generateMission,
    saveBriefing,
    loadBriefing,
    deleteBriefing
  }
}
