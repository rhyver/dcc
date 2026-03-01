import { SendHorizontal } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

type ChatInputProps = {
  disabled?: boolean
  onSend: (text: string) => void
}

export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [value, setValue] = useState('')

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            submit()
          }
        }}
        disabled={disabled}
        rows={3}
        className="w-full resize-none rounded-md border border-synthwave-purple/40 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-synthwave-cyan"
        placeholder="Describe the mission you want to fly..."
      />
      <div className="flex justify-end">
        <Button
          onClick={submit}
          disabled={disabled || value.trim().length === 0}
          className="bg-synthwave-pink text-white hover:bg-synthwave-pink/80"
        >
          <SendHorizontal className="mr-2 h-4 w-4" />
          Send
        </Button>
      </div>
    </div>
  )
}
