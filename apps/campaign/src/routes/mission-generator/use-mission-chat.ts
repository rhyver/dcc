import { useEffect, useMemo, useRef, useState } from 'react'
import { coreClient } from '@/lib/orpc'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
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
  const [error, setError] = useState<string | null>(null)
  const [generatedPath, setGeneratedPath] = useState<string | null>(null)

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

  const cleanupStreamingListeners = () => {
    cleanupRef.current?.()
    cleanupRef.current = null
  }

  useEffect(() => {
    return () => {
      cleanupStreamingListeners()
    }
  }, [])

  const sendMessage = (text: string) => {
    if (isStreaming) return
    setError(null)
    setGeneratedPath(null)
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
        setError(message)
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
    if (isStreaming || isGenerating) return
    setError(null)
    setIsGenerating(true)
    try {
      const result = await coreClient.missionGenerator.generateMission({
        messages
      })
      setGeneratedPath(result.path)
    } catch (generationError) {
      const message =
        generationError instanceof Error ? generationError.message : 'Generation failed.'
      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    messages,
    briefing,
    isStreaming,
    isGenerating,
    generatedPath,
    error,
    sendMessage,
    generateMission
  }
}
