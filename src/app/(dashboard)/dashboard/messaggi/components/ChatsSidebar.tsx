"use client"

import { GlassCard } from "@/src/components/ui-custom/glass-card"
import { ChatSummary } from "@/src/hooks/useChats"
import { ChatListItem } from "./ChatListItem"

type Props = {
  chats: ChatSummary[]
  isLoading: boolean
  currentUserId?: string
  selectedChat: string | null
  onSelect: (id: string) => void
}

export function ChatsSidebar({ chats, isLoading, currentUserId, selectedChat, onSelect }: Props) {
  return (
    <GlassCard className="p-0">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="font-semibold">Chat</div>
      </div>

      <div className="max-h-[70vh] overflow-y-auto divide-y">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">Caricamento...</div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">Nessuna chat</div>
          ) : (
            chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                currentUserId={currentUserId}
                selectedChatId={selectedChat}
                onSelect={onSelect}
              />
            ))
          )}
      </div>
    </GlassCard>
  )
}
