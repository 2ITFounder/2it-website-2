"use client"

import { useEffect, useMemo, useState, useRef, useLayoutEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MessageSquare, Plus, Send } from "lucide-react"
import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query"
import { GlassCard } from "@/src/components/ui-custom/glass-card"
import { Button } from "@/src/components/ui/button"
import { Textarea } from "@/src/components/ui/textarea"
import { useChats } from "@/src/hooks/useChats"
import { MessageItem, useMessages, type MessagesResponse } from "@/src/hooks/useMessages"
import { useChatUsers } from "@/src/hooks/useChatUsers"
import { cn } from "@/src/lib/utils"
import { createSupabaseBrowserClient } from "@/src/lib/supabase/client"
import { normalizeIncoming, sortByCreatedAt } from "./lib/message-helpers"
import { ChatListItem } from "./components/ChatListItem"
import { MessageRow } from "./components/MessageRow"
import { apiDeleteMessage, apiMarkChatNotificationsRead, apiUpdateMessageTag } from "./lib/message-actions"
import { apiGet } from "@/src/lib/api"

type MessagesData = InfiniteData<MessagesResponse, string | null>

const PRESENCE_HEARTBEAT_MS = 15_000
const NEAR_BOTTOM_PX = 80
const IS_DEV = process.env.NODE_ENV !== "production"

export default function MessagesPage() {
  const params = useSearchParams()
  const router = useRouter()
  const initialChat = params.get("chatId")

  const [selectedChat, setSelectedChat] = useState<string | null>(initialChat)
  const [recipient, setRecipient] = useState<string>("")
  const [composer, setComposer] = useState("")
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const [isNewChatMode, setIsNewChatMode] = useState(false)
  const [filter, setFilter] = useState<"all" | "important" | "idea">("all")
  const [actionTarget, setActionTarget] = useState<MessageItem | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const channelRef = useRef<any | null>(null)
  const channelIdRef = useRef<string | null>(null)
  const lastLocalUpdateRef = useRef<"optimistic" | "realtime" | "onSuccess" | null>(null)
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const scrollPositionsRef = useRef<Record<string, number>>({})
  const initialScrollRef = useRef<Record<string, boolean>>({})
  const filterPrefetchRef = useRef<Record<string, boolean>>({})
  const prevCountRef = useRef(0)
  const ignoreNextNewBadgeRef = useRef(false) // evita badge quando stiamo solo pre-pendendo vecchi messaggi
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const chatsQuery = useChats(true)
  const usersQuery = useChatUsers()
  const messagesQuery = useMessages(selectedChat ?? undefined)

  const qc = useQueryClient()

  const currentUserId = chatsQuery.data?.currentUserId
  const chats = chatsQuery.data?.items ?? []
  const users = usersQuery.data ?? []

  const selected = useMemo(() => chats.find((c) => c.id === selectedChat) ?? null, [chats, selectedChat])
  const logDebug = useCallback((...args: any[]) => {
    if (IS_DEV) console.debug(...args)
  }, [])

  // Prefetch la prima chat disponibile per eliminare il primo loading
  useEffect(() => {
    const firstChatId = selectedChat || chats[0]?.id
    if (!firstChatId) return
    qc.prefetchInfiniteQuery({
      queryKey: ["messages", firstChatId],
      initialPageParam: null,
      queryFn: ({ pageParam = null, signal }) => {
        const params = new URLSearchParams({ chat_id: firstChatId, limit: "30" })
        if (pageParam) params.set("before", pageParam)
        return apiGet<MessagesResponse>(`/api/messages?${params.toString()}`, signal)
      },
    })
  }, [chats, qc, selectedChat])

  // Prefetch lista utenti chat una volta sola per evitare attese nel composer
  useEffect(() => {
    qc.prefetchQuery({
      queryKey: ["chat-users"],
      queryFn: ({ signal }) => apiGet("/api/messages/users", signal),
    })
  }, [qc])

  const sendMutation = useMutation({
    mutationFn: async (variables: { body: string; tempId: string }) => {
      const payload: Record<string, any> = { body: variables.body, client_temp_id: variables.tempId }
      if (selectedChat) payload.chat_id = selectedChat
      else payload.receiver_id = recipient

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? "Errore invio")
      return json.data as MessageItem
    },

    onMutate: async (variables) => {
      if (!variables.body.trim()) return

      const chatIdForCache = selectedChat ?? undefined
      lastLocalUpdateRef.current = "optimistic"
      logDebug("[msg][optimistic] add", { chatId: chatIdForCache, tempId: variables.tempId })

      const optimisticMsg: MessageItem = {
        id: variables.tempId,
        tempId: variables.tempId,
        client_temp_id: variables.tempId,
        chat_id: selectedChat ?? "pending",
        sender_id: currentUserId ?? "me",
        body: variables.body,
        status: "sending",
        sendStatus: "sending",
        created_at: new Date().toISOString(),
      }

      await qc.cancelQueries({ queryKey: ["messages", chatIdForCache] })

      qc.setQueryData<MessagesData>(["messages", chatIdForCache], (prev) => {
        const base: MessagesData = {
          pages: [{ items: [optimisticMsg], members: [], nextCursor: null }],
          pageParams: [null],
        }
        if (!prev) return base
        const pages = [...prev.pages]
        const firstIndex = 0
        const updatedItems = [...pages[firstIndex].items, optimisticMsg].sort(sortByCreatedAt)
        pages[firstIndex] = { ...pages[firstIndex], items: updatedItems }

        return { ...prev, pages }
      })

      setComposer("")
      return { tempId: variables.tempId, chatIdForCache }
    },

    onError: (_error, _variables, context) => {
      if (!context) return

      qc.setQueryData<MessagesData>(["messages", context.chatIdForCache], (prev) => {
        if (!prev) return prev

        const pages = prev.pages.map((p) => ({
          ...p,
          items: p.items.map((m): MessageItem => {
            const isTarget = m.id === context.tempId || m.tempId === context.tempId
            return isTarget ? { ...m, sendStatus: "failed", status: "failed" } : m
          }),
        }))

        return { ...prev, pages }
      })
    },

    onSuccess: (message, _vars, context) => {
      if (!message) return

      const normalizedMessage = normalizeIncoming(message)
      const targetKey = selectedChat ?? context?.chatIdForCache ?? undefined
      lastLocalUpdateRef.current = "onSuccess"
      logDebug("[msg][onSuccess] reconcile", {
        chatId: normalizedMessage.chat_id,
        id: normalizedMessage.id,
        client_temp_id: normalizedMessage.client_temp_id ?? null,
        tempId: context?.tempId ?? null,
      })

      // reconcile optimistic message
      qc.setQueryData<MessagesData>(["messages", targetKey], (prev) => {
        if (!prev) return prev

        const pages = prev.pages.map((p) => {
          const items = p.items.map((m): MessageItem => {
            if (m.id === context?.tempId || m.tempId === context?.tempId) {
              return {
                ...m,
                ...normalizedMessage,
                id: normalizedMessage.id,
                tempId: undefined,
                status: normalizedMessage.status ?? "sent",
                sendStatus: "sent",
              }
            }
            return m
          })

          const exists = items.some((m) => m.id === normalizedMessage.id)
          return exists
            ? { ...p, items: items.sort(sortByCreatedAt) }
            : { ...p, items: [...items, normalizedMessage].sort(sortByCreatedAt) }
        })

        return { ...prev, pages }
      })

      // If new chat was created, move selection and cache
      if (!selectedChat && message?.chat_id) {
        const fromKey = context?.chatIdForCache ?? targetKey
        const cached = qc.getQueryData<MessagesData>(["messages", fromKey])

        if (cached) {
          const mergedPages = cached.pages.map((p, idx) => {
            if (idx !== 0) return p
            const updatedItems = p.items.map((m): MessageItem => {
              const isTarget = m.id === context?.tempId || m.tempId === context?.tempId
              return isTarget
                ? { ...m, ...normalizedMessage, id: normalizedMessage.id, tempId: undefined, sendStatus: "sent" }
                : m
            })
            return { ...p, items: [...updatedItems].sort(sortByCreatedAt) }
          })

          qc.setQueryData<MessagesData>(["messages", message.chat_id], { ...cached, pages: mergedPages })
        }

        setSelectedChat(message.chat_id)
        setIsNewChatMode(false)
        router.replace(`/dashboard/messaggi?chatId=${message.chat_id}`)
      }

      qc.invalidateQueries({ queryKey: ["chats"] })
    },
  })

  const conversationTitle = useMemo(() => {
    if (selected?.title) return selected.title
    const others =
      selected?.members.filter((m) => m.user_id !== currentUserId).map((m) => m.username || m.first_name || m.email) ??
      []
    return others.join(", ")
  }, [selected, currentUserId])

  const recipientLabel = useMemo(() => {
    const match = users.find((u) => u.user_id === recipient)
    if (!match) return ""
    return match.username || `${match.first_name ?? ""} ${match.last_name ?? ""}`.trim() || match.email || "Nuova chat"
  }, [recipient, users])

  const headerTitle = selectedChat ? conversationTitle || "Chat" : isNewChatMode ? "Nuova chat" : "Seleziona una chat"

  const startNewChat = () => {
    setSelectedChat(null)
    setRecipient("")
    setComposer("")
    setIsNewChatMode(true)
    router.replace("/dashboard/messaggi")
  }

  const handleSelectChat = (id: string) => {
    setSelectedChat(id)
    setRecipient("")
    setIsNewChatMode(false)
    router.replace(`/dashboard/messaggi?chatId=${id}`)
  }

  const markChatNotificationsRead = useCallback(async (chatId: string) => {
    try {
      await apiMarkChatNotificationsRead(chatId)
      qc.invalidateQueries({ queryKey: ["notifications"] })
      qc.invalidateQueries({ queryKey: ["chats"] })
    } catch {
      // silenzia errori: non blocca l'UX della chat
    }
  }, [qc])

  const buildTempId = useCallback(
    () => `temp-${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)}`,
    []
  )

  const triggerSend = useCallback((body: string) => {
    const trimmed = body.trim()
    if (!trimmed) return
    sendMutation.mutate({ body: trimmed, tempId: buildTempId() })
  }, [buildTempId, sendMutation])

  const handleRetry = useCallback((msg: MessageItem) => {
    if (!msg?.body) return
    setComposer(msg.body)
    triggerSend(msg.body)
  }, [triggerSend])

  const updateMessageTag = useCallback(async (msg: MessageItem, tag: "important" | "idea") => {
    if (!msg?.id) return
    try {
      const updated = await apiUpdateMessageTag(msg, tag)
      mergeMessageIntoCache(msg.chat_id, normalizeIncoming(updated))
      qc.invalidateQueries({ queryKey: ["messages", msg.chat_id] })
      qc.invalidateQueries({ queryKey: ["notifications"] })
    } catch (e) {
      console.error(e)
    } finally {
      setActionTarget(null)
    }
  }, [mergeMessageIntoCache, qc])

  const deleteMessage = useCallback(async (msg: MessageItem) => {
    if (!msg?.id) return
    const confirmed = typeof window !== "undefined" ? window.confirm("Eliminare questo messaggio?") : true
    if (!confirmed) return
    try {
      await apiDeleteMessage(msg)
      removeMessageFromCache(msg.chat_id, msg.id)
      qc.invalidateQueries({ queryKey: ["messages", msg.chat_id] })
      qc.invalidateQueries({ queryKey: ["chats"] })
      qc.invalidateQueries({ queryKey: ["notifications"] })
    } catch (e) {
      console.error(e)
    } finally {
      setActionTarget(null)
    }
  }, [qc, removeMessageFromCache])

  const handleOpenActions = useCallback((msg: MessageItem) => {
    setActionTarget(msg)
  }, [])

  useEffect(() => {
    if (selectedChat) {
      void markChatNotificationsRead(selectedChat)
    }
  }, [selectedChat])

  useEffect(() => {
    if (!selectedChat) return
    if (typeof document === "undefined") return

    let interval: ReturnType<typeof setInterval> | null = null

    const heartbeat = async () => {
      try {
        await fetch("/api/chat-presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId: selectedChat }),
        })
      } catch {
        // ignore heartbeat errors
      }
    }

    const start = () => {
      if (interval) return
      if (document.visibilityState !== "visible") return
      if (IS_DEV) console.info("[presence] start", { chatId: selectedChat })
      void heartbeat()
      interval = setInterval(heartbeat, PRESENCE_HEARTBEAT_MS)
    }

    const stop = (reason: string) => {
      if (!interval) return
      clearInterval(interval)
      interval = null
      if (IS_DEV) console.info("[presence] stop", { chatId: selectedChat, reason })
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        start()
      } else {
        stop("hidden")
      }
    }

    start()
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility)
      stop("cleanup")
      void fetch("/api/chat-presence", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: selectedChat }),
      }).catch(() => {})
    }
  }, [selectedChat])

  const canSend = composer.trim().length > 0 && (selectedChat || recipient)

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    const container = scrollRef.current
    if (!container) return
    if (behavior === "auto") {
      container.scrollTop = container.scrollHeight
    } else {
      bottomRef.current?.scrollIntoView({ behavior, block: "end" })
    }
    setIsAtBottom(true)
    setHasNewMessages(false)
  }

  const ensureBottom = (behavior: ScrollBehavior = "auto") => {
    scrollToBottom(behavior)
    requestAnimationFrame(() => {
      const container = scrollRef.current
      if (!container) return
      const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= NEAR_BOTTOM_PX
      if (!nearBottom) {
        scrollToBottom("auto")
      }
    })
  }

  useLayoutEffect(() => {
    if (!messagesQuery.data) return
    const key = `${selectedChat ?? "global"}-${filter}`
    const alreadyScrolled = initialScrollRef.current[key]
    if (alreadyScrolled) return
    const firstItem = messagesQuery.data.pages[0]?.items[0]
    if (selectedChat && firstItem?.chat_id && firstItem.chat_id !== selectedChat) return

    ensureBottom("auto")
    initialScrollRef.current[key] = true
    setIsAtBottom(true)
    setHasNewMessages(false)
    prevCountRef.current = messagesQuery.data.pages.reduce((sum, p) => sum + p.items.length, 0)
  }, [messagesQuery.data, filter, selectedChat])

  useEffect(() => {
    if (!messagesQuery.data) return
    const key = `${selectedChat ?? "global"}-${filter}`
    if (!initialScrollRef.current[key]) return

    if (ignoreNextNewBadgeRef.current) {
      // reset dopo fetch di pagine precedenti
      ignoreNextNewBadgeRef.current = false
      prevCountRef.current = messagesQuery.data.pages.reduce((sum, p) => sum + p.items.length, 0)
      return
    }
    const total = messagesQuery.data.pages.reduce((sum, p) => sum + p.items.length, 0)
    const container = scrollRef.current

    if (isAtBottom) {
      ensureBottom("auto")
    } else if (total > prevCountRef.current && container) {
      setHasNewMessages(true)
    }
    prevCountRef.current = total
  }, [messagesQuery.data, isAtBottom, filter, selectedChat])

  useEffect(() => {
    if (!messagesQuery.data) return
    const total = messagesQuery.data.pages.reduce((sum, p) => sum + p.items.length, 0)
    const source = lastLocalUpdateRef.current ?? (messagesQuery.isFetching ? "refetch" : "unknown")
    if (IS_DEV) {
      logDebug("[msg][data] update", { chatId: selectedChat, source, total })
      const dupes = new Map<string, number>()
      for (const page of messagesQuery.data.pages) {
        for (const msg of page.items) {
          const key = msg.tempId ?? msg.client_temp_id ?? msg.id
          dupes.set(key, (dupes.get(key) ?? 0) + 1)
        }
      }
      const duplicates = Array.from(dupes.entries()).filter(([, count]) => count > 1)
      if (duplicates.length > 0) {
        logDebug("[msg][dupes] detected", { chatId: selectedChat, duplicates })
      }
    }
    lastLocalUpdateRef.current = null
  }, [messagesQuery.data, messagesQuery.isFetching, selectedChat])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActionTarget(null)
    }
    if (actionTarget) {
      document.addEventListener("keydown", handleEsc)
    }
    return () => document.removeEventListener("keydown", handleEsc)
  }, [actionTarget])

  const handleScroll = () => {
    const container = scrollRef.current
    if (!container) return
    // salva posizione corrente per il filtro attivo (per chat)
    const key = `${selectedChat ?? "global"}-${filter}`
    scrollPositionsRef.current[key] = container.scrollTop
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= NEAR_BOTTOM_PX
    setIsAtBottom(nearBottom)
    if (nearBottom) setHasNewMessages(false)

    const nearTop = container.scrollTop < 120
    if (
      nearTop &&
      messagesQuery.hasNextPage &&
      !messagesQuery.isFetchingNextPage &&
      !messagesQuery.isLoading
    ) {
      const prevHeight = container.scrollHeight
      const prevTop = container.scrollTop
      ignoreNextNewBadgeRef.current = true
      void messagesQuery.fetchNextPage().then(() => {
        const el = scrollRef.current
        if (!el) return
        const delta = el.scrollHeight - prevHeight
        el.scrollTop = prevTop + delta
      })
    }
  }

  const dedupeMessages = useCallback((items: MessageItem[]) => {
    const byKey = new Map<string, MessageItem>()
    for (const msg of items) {
      const key = msg.tempId ?? msg.client_temp_id ?? msg.id
      const prev = byKey.get(key)
      if (!prev) {
        byKey.set(key, msg)
        continue
      }
      if (prev.sendStatus === "sending" && msg.sendStatus !== "sending") {
        byKey.set(key, { ...prev, ...msg, tempId: prev.tempId ?? msg.tempId, client_temp_id: prev.client_temp_id ?? msg.client_temp_id })
        continue
      }
      if (msg.sendStatus === "sending" && prev.sendStatus !== "sending") {
        byKey.set(key, { ...msg, ...prev, tempId: prev.tempId ?? msg.tempId, client_temp_id: prev.client_temp_id ?? msg.client_temp_id })
        continue
      }
      byKey.set(key, { ...prev, ...msg, tempId: prev.tempId ?? msg.tempId, client_temp_id: prev.client_temp_id ?? msg.client_temp_id })
    }
    return Array.from(byKey.values())
  }, [])

  const mergeMessageIntoCache = useCallback(
    (chatId: string, incoming: MessageItem, source: "realtime" | "refetch" = "realtime") => {
    const normalized = normalizeIncoming(incoming)
    lastLocalUpdateRef.current = source === "realtime" ? "realtime" : lastLocalUpdateRef.current
    if (source === "realtime") {
      logDebug("[msg][realtime] merge", {
        chatId,
        id: normalized.id,
        client_temp_id: normalized.client_temp_id ?? null,
        tempId: normalized.tempId ?? null,
      })
    }

    let mergeAction: "reconcile" | "append" | "noop" = "noop"
    qc.setQueryData<MessagesData>(["messages", chatId], (prev) => {
      const base: MessagesData = {
        pages: [{ items: [normalized], members: [], nextCursor: null }],
        pageParams: [null],
      }
      if (!prev) {
        mergeAction = "append"
        return base
      }

      let updated = false

      const pages = prev.pages.map((p, idx) => {
        const items = p.items.map((m): MessageItem => {
          const sameById = m.id === normalized.id
          const sameByTemp =
            Boolean(normalized.tempId) &&
            (m.tempId === normalized.tempId || (!m.id && m.tempId && m.tempId === normalized.tempId))

          if (sameById || sameByTemp) {
            updated = true
            return {
              ...m,
              ...normalized,
              id: normalized.id ?? m.id,
              tempId: undefined,
              sendStatus: normalized.sendStatus ?? "sent",
              status: normalized.status ?? m.status ?? "sent",
            }
          }
          return m
        })

        const deduped = dedupeMessages(items).sort(sortByCreatedAt)
        if (idx === 0) {
          return { ...p, items: deduped }
        }
        return { ...p, items: deduped }
      })

      if (updated) {
        mergeAction = "reconcile"
        return {
          ...prev,
          pages: pages.map((p) => ({ ...p, items: [...p.items].sort(sortByCreatedAt) })),
        }
      }

      const nextPages = [...pages]
      const firstIndex = 0
      const mergedItems = dedupeMessages([...nextPages[firstIndex].items, normalized]).sort(sortByCreatedAt)
      nextPages[firstIndex] = { ...nextPages[firstIndex], items: mergedItems }
      mergeAction = "append"

      return { ...prev, pages: nextPages }
    })
    if (IS_DEV && source === "realtime") {
      logDebug("[msg][realtime] mergeAction", { chatId, id: normalized.id, action: mergeAction })
    }
  }, [dedupeMessages, logDebug, qc])

  const removeMessageFromCache = useCallback((chatId: string, messageId: string) => {
    qc.setQueryData<MessagesData>(["messages", chatId], (prev) => {
      if (!prev) return prev
      const nextPages = prev.pages.map((p, idx) => {
        if (idx !== 0) return p
        const filtered = p.items.filter((m) => m.id !== messageId)
        return { ...p, items: filtered }
      })
      return { ...prev, pages: nextPages }
    })
  }, [qc])

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
          const newMsg = normalizeIncoming(payload.new as any as MessageItem)
          mergeMessageIntoCache(selectedChat, newMsg)
          // refresh sidebar ordering/last message
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
          const updated = normalizeIncoming(payload.new as any as MessageItem)
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

  const allMessages: MessageItem[] = useMemo(() => {
    const items = (messagesQuery.data?.pages ?? []).flatMap((p: MessagesResponse) => p.items)
    return dedupeMessages(items).sort(sortByCreatedAt)
  }, [dedupeMessages, messagesQuery.data])

  const filteredMessages = useMemo(() => {
    if (filter === "important") return allMessages.filter((m) => m.tag === "important")
    if (filter === "idea") return allMessages.filter((m) => m.tag === "idea")
    return allMessages
  }, [allMessages, filter])

  const handleFilterChange = (next: typeof filter) => {
    if (next === filter) return
    const container = scrollRef.current
    if (container) {
      const key = `${selectedChat ?? "global"}-${filter}`
      scrollPositionsRef.current[key] = container.scrollTop
    }
    setFilter(next)
  }

  // quando cambi filtro, ripristina la posizione di scroll precedente
  useEffect(() => {
    const key = `${selectedChat ?? "global"}-${filter}`
    const saved = scrollPositionsRef.current[key] ?? 0
    requestAnimationFrame(() => {
      const el = scrollRef.current
      if (el) el.scrollTop = saved
    })
  }, [filter, filteredMessages.length, selectedChat])

  // pre-carica messaggi extra quando si entra in "Importanti" o "Idee" per evitare spinner
  useEffect(() => {
    if (!selectedChat) return
    if (filter === "all") return
    const key = `${selectedChat}-${filter}`
    if (filterPrefetchRef.current[key]) return
    if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
      filterPrefetchRef.current[key] = true
      void messagesQuery.fetchNextPage().catch(() => {
        filterPrefetchRef.current[key] = false
      })
    }
  }, [filter, messagesQuery, selectedChat])

  // reset contatori e scroll-state quando cambi chat
  useEffect(() => {
    const base = `${selectedChat ?? "global"}`
    initialScrollRef.current[`${base}-all`] = false
    initialScrollRef.current[`${base}-important`] = false
    initialScrollRef.current[`${base}-idea`] = false
    prevCountRef.current = 0
    setHasNewMessages(false)
    setIsAtBottom(true)
  }, [selectedChat])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messaggi</h1>
          <p className="text-muted-foreground">Chat interne tra admin</p>
        </div>
        <Button size="sm" className="gap-2" onClick={startNewChat}>
          <Plus className="w-4 h-4" />
          Nuova chat
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="p-0">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-semibold">Chat</div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto divide-y">
            {chatsQuery.isLoading ? (
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
                    onSelect={handleSelectChat}
                  />
                ))
              )}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2 p-0 flex flex-col h-[70vh]">
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
                  onClick={() => handleFilterChange(f.value as typeof filter)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          {isNewChatMode ? (
            <div className="p-4 border-b space-y-3">
              <div className="text-sm text-muted-foreground">Seleziona il destinatario</div>
              <div className="rounded-lg border bg-background">
                {users.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">Nessun utente trovato. Aggiungi un altro admin.</p>
                ) : (
                  users.map((u) => {
                    const label = u.username || `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email
                    const active = recipient === u.user_id
                    return (
                      <button
                        key={u.user_id}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm transition flex items-center justify-between",
                          active ? "bg-accent/20 text-accent-foreground" : "hover:bg-muted/70"
                        )}
                        onClick={() => setRecipient(u.user_id)}
                      >
                        <span>{label || "Senza nome"}</span>
                        {active ? <span className="text-xs text-accent">Selezionato</span> : null}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          ) : null}

          <div className="relative flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef} onScroll={handleScroll}>
            {actionTarget ? (
              <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] pointer-events-auto"
                onClick={() => setActionTarget(null)}
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

          <div className="border-t p-3 flex items-center gap-2">
            <Textarea placeholder="Scrivi un messaggio..." value={composer} onChange={(e) => setComposer(e.target.value)} rows={2} />
            <Button
              onClick={() => triggerSend(composer)}
              disabled={!canSend || sendMutation.isPending}
              className="shrink-0"
            >
              <Send className="w-4 h-4 mr-2" />
              Invia
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
