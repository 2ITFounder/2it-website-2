import { useEffect, useRef } from "react"
import { type SupabaseClient } from "@supabase/supabase-js"
import { type QueryClient } from "@tanstack/react-query"
import { type MessageItem } from "@/src/hooks/useMessages"

export function useMessagesRealtimeChannel({
  selectedChat,
  supabase,
  mergeMessageIntoCache,
  removeMessageFromCache,
  markChatNotificationsRead,
  qc,
  logDebug,
}: {
  selectedChat: string | null
  supabase: SupabaseClient | null
  mergeMessageIntoCache: (chatId: string, incoming: MessageItem) => void
  removeMessageFromCache: (chatId: string, messageId: string) => void
  markChatNotificationsRead: (chatId: string) => Promise<void>
  qc: QueryClient
  logDebug: (...args: any[]) => void
}) {
  const channelRef = useRef<any | null>(null)
  const channelIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!selectedChat) return

    if (!supabase) return
    if (channelRef.current) {
      logDebug("[RT][messages] cleanup existing channel before subscribe", { chatId: selectedChat })
      channelRef.current.unsubscribe()
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
      channelIdRef.current = null
    }

    const channelId = `messages-${selectedChat}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    channelIdRef.current = channelId
    logDebug("[RT][messages] subscribe", { chatId: selectedChat, channelId })

    const channel = supabase
      .channel(`messages-${selectedChat}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${selectedChat}` },
        (payload) => {
          const msg = payload.new as any
          logDebug("[RT][messages] insert", {
            chatId: selectedChat,
            channelId,
            id: msg?.id,
            client_temp_id: msg?.client_temp_id ?? null,
          })
          const newMsg = (payload.new as any as MessageItem)
          mergeMessageIntoCache(selectedChat, newMsg)
          qc.invalidateQueries({ queryKey: ["chats"] })
          void markChatNotificationsRead(selectedChat)
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `chat_id=eq.${selectedChat}` },
        (payload) => {
          const msg = payload.new as any
          logDebug("[RT][messages] update", {
            chatId: selectedChat,
            channelId,
            id: msg?.id,
            client_temp_id: msg?.client_temp_id ?? null,
          })
          const updated = (payload.new as any as MessageItem)
          mergeMessageIntoCache(selectedChat, updated)
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages", filter: `chat_id=eq.${selectedChat}` },
        (payload) => {
          const msg = payload.old as any
          logDebug("[RT][messages] delete", {
            chatId: selectedChat,
            channelId,
            id: msg?.id,
            client_temp_id: msg?.client_temp_id ?? null,
          })
          const deletedId = (payload.old as any)?.id
          if (deletedId) removeMessageFromCache(selectedChat, deletedId)
          qc.invalidateQueries({ queryKey: ["chats"] })
        }
      )
      .subscribe((status) => {
        logDebug("[RT][messages] status", { chatId: selectedChat, channelId, status })
      })

    channelRef.current = channel

    return () => {
      logDebug("[RT][messages] unsubscribe", { chatId: selectedChat, channelId })
      channel.unsubscribe()
      supabase.removeChannel(channel)
      channelRef.current = null
      channelIdRef.current = null
    }
  }, [logDebug, markChatNotificationsRead, mergeMessageIntoCache, qc, removeMessageFromCache, selectedChat, supabase])
}
