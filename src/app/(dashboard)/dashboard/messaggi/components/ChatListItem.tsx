"use client"

import { useQueryClient } from "@tanstack/react-query"
import { ChatSummary } from "@/src/hooks/useChats"
import { cn } from "@/src/lib/utils"
import { apiGet } from "@/src/lib/api"

type Props = {
  chat: ChatSummary
  currentUserId?: string
  selectedChatId: string | null
  onSelect: (id: string) => void
}

export function ChatListItem({ chat, currentUserId, selectedChatId, onSelect }: Props) {
  const last = chat.last_message
  const others = chat.members.filter((m) => m.user_id !== currentUserId)
  const label = chat.title || others.map((m) => m.username || m.first_name || m.email).join(", ")
  const unread = chat.unread_count > 0
  const qc = useQueryClient()

  const prefetchMessages = () => {
    qc.prefetchInfiniteQuery({
      queryKey: ["messages", chat.id],
      initialPageParam: null,
      queryFn: ({ pageParam = null, signal }) => {
        const params = new URLSearchParams({ chat_id: chat.id, limit: "30" })
        if (pageParam) params.set("before", pageParam)
        return apiGet(`/api/messages?${params.toString()}`, signal)
      },
    })
  }

  return (
    <button
      className={cn(
        "w-full text-left px-4 py-3 hover:bg-muted/70 transition",
        selectedChatId === chat.id ? "bg-muted/60" : ""
      )}
      onClick={() => onSelect(chat.id)}
      onMouseEnter={prefetchMessages}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium truncate flex items-center gap-2">
          <span className="truncate">{label || "Chat"}</span>
          {unread ? (
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-background flex-shrink-0" />
          ) : null}
        </div>
        <span className="text-[11px] text-muted-foreground">
          {last ? new Date(last.created_at).toLocaleTimeString() : ""}
        </span>
      </div>
      <div className="text-sm text-muted-foreground truncate">{last ? last.body : "Nessun messaggio"}</div>
    </button>
  )
}
