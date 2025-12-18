"use client"

import { MessageSquare } from "lucide-react"
import { Button } from "@/src/components/ui/button"

type Props = {
  headerTitle: string
  filter: "all" | "important" | "idea"
  onFilterChange: (next: "all" | "important" | "idea") => void
  isNewChatMode: boolean
  selectedChat: string | null
}

export function MessagesHeader({ headerTitle, filter, onFilterChange, isNewChatMode, selectedChat }: Props) {
  return (
    <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <MessageSquare className="w-4 h-4" />
        <div className="min-w-0">
          <div className="font-semibold truncate max-w-[50vw]" title={headerTitle || undefined}>
            {headerTitle}
          </div>
          {isNewChatMode ? (
            <div className="text-xs text-muted-foreground">
              Scegli il destinatario e invia il primo messaggio.
            </div>
          ) : !selectedChat ? null : null}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {[
          { label: "Tutti", value: "all" },
          { label: "Importanti", value: "important" },
          { label: "Idee", value: "idea" },
        ].map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onFilterChange(f.value as typeof filter)}
          >
            {f.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
