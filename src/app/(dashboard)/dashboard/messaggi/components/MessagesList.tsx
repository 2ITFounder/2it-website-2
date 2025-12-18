"use client"

import { RefObject } from "react"
import { Button } from "@/src/components/ui/button"
import { type MessageItem, type useMessages } from "@/src/hooks/useMessages"
import { MessageRow } from "./MessageRow"

type Props = {
  actionTarget: MessageItem | null
  onClearActionTarget: () => void
  scrollRef: RefObject<HTMLDivElement | null>
  bottomRef: RefObject<HTMLDivElement | null>
  onScroll: () => void
  selectedChat: string | null
  isNewChatMode: boolean
  messagesQuery: ReturnType<typeof useMessages>
  filteredMessages: MessageItem[]
  currentUserId?: string
  recipient: string
  recipientLabel: string
  hasNewMessages: boolean
  isAtBottom: boolean
  ensureBottom: (behavior?: ScrollBehavior) => void
  updateMessageTag: (msg: MessageItem, tag: "important" | "idea" | "none") => void
  deleteMessage: (msg: MessageItem) => Promise<void>
  handleRetry: (msg: MessageItem) => void
  handleOpenActions: (msg: MessageItem) => void
}

export function MessagesList({
  actionTarget,
  onClearActionTarget,
  scrollRef,
  bottomRef,
  onScroll,
  selectedChat,
  isNewChatMode,
  messagesQuery,
  filteredMessages,
  currentUserId,
  recipient,
  recipientLabel,
  hasNewMessages,
  isAtBottom,
  ensureBottom,
  updateMessageTag,
  deleteMessage,
  handleRetry,
  handleOpenActions,
}: Props) {
  return (
    <div className="relative flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef} onScroll={onScroll}>
      {actionTarget ? (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] pointer-events-auto"
          onClick={onClearActionTarget}
          role="presentation"
        />
      ) : null}

      {!selectedChat && !isNewChatMode ? null : messagesQuery.isLoading ? (
        <div className="text-sm text-muted-foreground">Caricamento messaggi...</div>
      ) : filteredMessages.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          {recipient ? `Scrivi il primo messaggio a ${recipientLabel || "un utente"}.` : "Nessun messaggio"}
        </div>
      ) : (
        <>
          {messagesQuery.hasNextPage ? (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => messagesQuery.fetchNextPage()}
                disabled={messagesQuery.isFetchingNextPage}
              >
                {messagesQuery.isFetchingNextPage ? "Carico..." : "Carica messaggi precedenti"}
              </Button>
            </div>
          ) : null}

          {filteredMessages.map((m) => {
            const mine = m.sender_id === currentUserId
            const actionKey = actionTarget?.client_temp_id ?? actionTarget?.tempId ?? actionTarget?.id ?? null
            const messageKey = m.client_temp_id ?? m.tempId ?? m.id
            const isActive = Boolean(actionKey && messageKey === actionKey)
            const dimmed = Boolean(actionTarget && !isActive)

            return (
              <MessageRow
                key={messageKey}
                id={m.id}
                clientTempId={m.client_temp_id ?? null}
                tempId={m.tempId}
                chatId={m.chat_id}
                senderId={m.sender_id}
                body={m.body}
                createdAt={m.created_at}
                status={m.status}
                sendStatus={m.sendStatus}
                tag={m.tag ?? null}
                isMine={mine}
                isActive={isActive}
                dimmed={dimmed}
                onOpenActions={handleOpenActions}
                onUpdateTag={updateMessageTag}
                onDelete={deleteMessage}
                onRetry={handleRetry}
              />
            )
          })}

          {hasNewMessages && !isAtBottom ? (
            <div className="sticky bottom-2 flex justify-center">
              <Button size="sm" variant="secondary" onClick={() => ensureBottom("smooth")}>
                Nuovi messaggi
              </Button>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </>
      )}
    </div>
  )
}
