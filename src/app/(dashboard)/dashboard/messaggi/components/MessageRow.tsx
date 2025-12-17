"use client"

import { memo, useEffect, useMemo, useRef } from "react"
import { MessageItem } from "@/src/hooks/useMessages"
import { MessageItemBubble } from "./MessageItemBubble"

const IS_DEV = process.env.NODE_ENV !== "production"

type Props = {
  id: string
  clientTempId?: string | null
  tempId?: string
  chatId: string
  senderId: string
  body: string
  createdAt: string
  status: string
  sendStatus?: "sending" | "failed" | "sent"
  tag?: "important" | "idea" | null
  isMine: boolean
  isActive: boolean
  dimmed: boolean
  onOpenActions: (message: MessageItem) => void
  onUpdateTag: (message: MessageItem, tag: "important" | "idea" | "none") => void
  onDelete: (message: MessageItem) => void
  onRetry: (message: MessageItem) => void
}

export const MessageRow = memo(function MessageRow(props: Props) {
  const {
    id,
    clientTempId,
    tempId,
    chatId,
    senderId,
    body,
    createdAt,
    status,
    sendStatus,
    tag,
    isMine,
    isActive,
    dimmed,
    onOpenActions,
    onUpdateTag,
    onDelete,
    onRetry,
  } = props

  const message = useMemo<MessageItem>(
    () => ({
      id,
      tempId: tempId ?? undefined,
      client_temp_id: clientTempId ?? undefined,
      chat_id: chatId,
      sender_id: senderId,
      body,
      status,
      created_at: createdAt,
      sendStatus,
      tag,
    }),
    [id, tempId, clientTempId, chatId, senderId, body, status, createdAt, sendStatus, tag]
  )

  const prevRef = useRef({
    body,
    tag,
    sendStatus,
    status,
    isActive,
    dimmed,
    isMine,
    createdAt,
  })

  useEffect(() => {
    if (!IS_DEV) return
    const changed: string[] = []
    if (prevRef.current.body !== body) changed.push("body")
    if (prevRef.current.tag !== tag) changed.push("tag")
    if (prevRef.current.sendStatus !== sendStatus) changed.push("sendStatus")
    if (prevRef.current.status !== status) changed.push("status")
    if (prevRef.current.isActive !== isActive) changed.push("isActive")
    if (prevRef.current.dimmed !== dimmed) changed.push("dimmed")
    if (prevRef.current.isMine !== isMine) changed.push("isMine")
    if (prevRef.current.createdAt !== createdAt) changed.push("createdAt")
    if (changed.length) {
      console.debug("[MessageRow] update", { id: clientTempId ?? id, changed })
    }
    prevRef.current = { body, tag, sendStatus, status, isActive, dimmed, isMine, createdAt }
  }, [body, tag, sendStatus, status, isActive, dimmed, isMine, createdAt, clientTempId, id])

  return (
    <MessageItemBubble
      message={message}
      isMine={isMine}
      isActive={isActive}
      dimmed={dimmed}
      onOpenActions={onOpenActions}
      onUpdateTag={onUpdateTag}
      onDelete={onDelete}
      onRetry={onRetry}
    />
  )
}, areEqual)

function areEqual(prev: Props, next: Props) {
  return (
    prev.id === next.id &&
    prev.clientTempId === next.clientTempId &&
    prev.tempId === next.tempId &&
    prev.chatId === next.chatId &&
    prev.senderId === next.senderId &&
    prev.body === next.body &&
    prev.createdAt === next.createdAt &&
    prev.status === next.status &&
    prev.sendStatus === next.sendStatus &&
    prev.tag === next.tag &&
    prev.isMine === next.isMine &&
    prev.isActive === next.isActive &&
    prev.dimmed === next.dimmed &&
    prev.onOpenActions === next.onOpenActions &&
    prev.onUpdateTag === next.onUpdateTag &&
    prev.onDelete === next.onDelete &&
    prev.onRetry === next.onRetry
  )
}
