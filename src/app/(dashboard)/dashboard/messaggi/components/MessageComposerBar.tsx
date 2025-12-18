"use client"

import { Send } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Textarea } from "@/src/components/ui/textarea"

type Props = {
  composer: string
  setComposer: (value: string) => void
  canSend: boolean
  isPending: boolean
  onSend: () => void
}

export function MessageComposerBar({ composer, setComposer, canSend, isPending, onSend }: Props) {
  return (
    <div className="border-t p-3 flex items-center gap-2">
      <Textarea placeholder="Scrivi un messaggio..." value={composer} onChange={(e) => setComposer(e.target.value)} rows={2} />
      <Button
        onClick={onSend}
        disabled={!canSend || isPending}
        className="shrink-0"
      >
        <Send className="w-4 h-4 mr-2" />
        Invia
      </Button>
    </div>
  )
}
