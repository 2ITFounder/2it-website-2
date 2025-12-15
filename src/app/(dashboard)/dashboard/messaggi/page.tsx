"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MessageSquare, Send } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { GlassCard } from "@/src/components/ui-custom/glass-card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { useChats } from "@/src/hooks/useChats"
import { useMessages } from "@/src/hooks/useMessages"
import { useChatUsers } from "@/src/hooks/useChatUsers"
import { cn } from "@/src/lib/utils"
import { createSupabaseBrowserClient } from "@/src/lib/supabase/client"

export default function MessagesPage() {
  const params = useSearchParams()
  const router = useRouter()
  const initialChat = params.get("chatId")

  const [selectedChat, setSelectedChat] = useState<string | null>(initialChat)
  const [recipient, setRecipient] = useState<string>("")
  const [composer, setComposer] = useState("")
  const [isAtBottom, setIsAtBottom] = useState(true)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const chatsQuery = useChats(true)
  const usersQuery = useChatUsers()
  const messagesQuery = useMessages(selectedChat ?? undefined)

  const qc = useQueryClient()

  const currentUserId = chatsQuery.data?.currentUserId
  const chats = chatsQuery.data?.items ?? []
  const users = usersQuery.data ?? []

  const selected = useMemo(() => chats.find((c) => c.id === selectedChat) ?? null, [chats, selectedChat])

  const sendMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = { body: composer.trim() }
      if (selectedChat) payload.chat_id = selectedChat
      else payload.receiver_id = recipient

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? "Errore invio")
      return json.data
    },
    onSuccess: (message) => {
      setComposer("")
      if (!selectedChat && message?.chat_id) {
        setSelectedChat(message.chat_id)
        router.replace(`/dashboard/messaggi?chatId=${message.chat_id}`)
      }
      qc.invalidateQueries({ queryKey: ["chats"] })
      qc.invalidateQueries({ queryKey: ["messages", selectedChat ?? message?.chat_id] })
    },
  })

  const conversationTitle = useMemo(() => {
    if (selected?.title) return selected.title
    const others =
      selected?.members.filter((m) => m.user_id !== currentUserId).map((m) => m.username || m.first_name || m.email) ??
      []
    return others.join(", ")
  }, [selected, currentUserId])

  const handleSelectChat = (id: string) => {
    setSelectedChat(id)
    setRecipient("")
    router.replace(`/dashboard/messaggi?chatId=${id}`)
  }

  const canSend = composer.trim().length > 0 && (selectedChat || recipient)

  // Scroll to bottom on new messages when user is already near bottom
  useEffect(() => {
    if (!messagesQuery.data || !isAtBottom) return
    const container = scrollRef.current
    if (!container) return
    container.scrollTop = container.scrollHeight
  }, [messagesQuery.data, isAtBottom])

  const handleScroll = () => {
    const container = scrollRef.current
    if (!container) return
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 40
    setIsAtBottom(nearBottom)
  }

  // Realtime subscription to new messages in selected chat
  useEffect(() => {
    if (!selectedChat) return
    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel(`messages-${selectedChat}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${selectedChat}` },
        (payload) => {
          const newMsg = payload.new as any
          qc.setQueryData<any>(["messages", selectedChat], (prev) => {
            if (!prev) return prev
            const exists = prev.pages.some((p: any) => p.items.find((m: any) => m.id === newMsg.id))
            if (exists) return prev
            const nextPages = [...prev.pages]
            if (nextPages.length === 0) {
              nextPages.push({ items: [newMsg], members: [], nextCursor: null })
            } else {
              const lastIndex = nextPages.length - 1
              const merged = [...nextPages[lastIndex].items, newMsg].sort((a, b) =>
                a.created_at.localeCompare(b.created_at)
              )
              nextPages[lastIndex] = { ...nextPages[lastIndex], items: merged }
            }
            return { ...prev, pages: nextPages }
          })
          qc.invalidateQueries({ queryKey: ["chats"] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc, selectedChat])

  const allMessages =
    messagesQuery.data?.pages.flatMap((p) => p.items) ??
    []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messaggi</h1>
          <p className="text-muted-foreground">Chat interne tra admin</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="p-0">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-semibold">Chat</div>
            <Button variant="outline" size="sm" onClick={() => { setSelectedChat(null); setRecipient(""); }}>
              Nuova chat
            </Button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto divide-y">
            {chatsQuery.isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Caricamento...</div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">Nessuna chat</div>
            ) : (
              chats.map((chat) => {
                const last = chat.last_message
                const others = chat.members.filter((m) => m.user_id !== currentUserId)
                const label = chat.title || others.map((m) => m.username || m.first_name || m.email).join(", ")
                return (
                  <button
                    key={chat.id}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-muted/70 transition",
                      selectedChat === chat.id ? "bg-muted/60" : ""
                    )}
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium truncate">{label || "Chat"}</div>
                      <span className="text-[11px] text-muted-foreground">
                        {last ? new Date(last.created_at).toLocaleTimeString() : ""}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {last ? last.body : "Nessun messaggio"}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2 p-0 flex flex-col min-h-[70vh]">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <div className="font-semibold">{conversationTitle || "Nuova chat"}</div>
            </div>
          </div>

          {!selectedChat ? (
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

          <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef} onScroll={handleScroll}>
            {messagesQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">Caricamento messaggi...</div>
            ) : allMessages.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nessun messaggio</div>
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

                {allMessages.map((m) => {
                  const mine = m.sender_id === currentUserId
                  return (
                    <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "px-3 py-2 rounded-lg max-w-lg text-sm",
                          mine ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"
                        )}
                      >
                        <div className="whitespace-pre-wrap">{m.body}</div>
                        <div className="text-[11px] opacity-80 mt-1">
                          {new Date(m.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>

          <div className="border-t p-3 flex items-center gap-2">
            <Textarea
              placeholder="Scrivi un messaggio..."
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              rows={2}
            />
            <Button onClick={() => sendMutation.mutate()} disabled={!canSend || sendMutation.isPending} className="shrink-0">
              <Send className="w-4 h-4 mr-2" />
              Invia
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
