"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Menu, X, Bell, User, MessageCircle } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/src/components/ui/dropdown-menu"
import { cn } from "@/src/lib/utils"
import { useChats } from "@/src/hooks/useChats"
import { NotificationItem, NotificationsResponse, useNotifications } from "@/src/hooks/useNotifications"
import { apiGet } from "@/src/lib/api"
import { createSupabaseBrowserClient } from "@/src/lib/supabase/client"

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/contatti", label: "Contatti" },
  { href: "/dashboard/clienti", label: "Clienti" },
  { href: "/dashboard/progetti", label: "Progetti" },
  { href: "/dashboard/report", label: "Report" },
  { href: "/dashboard/impostazioni", label: "Impostazioni" },
]

export function DashboardTopbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const qc = useQueryClient()

  const notificationsQuery = useNotifications(true)
  const chatsQuery = useChats(true)

  const unreadCount = notificationsQuery.data?.unreadCount ?? 0
  const notifications = notificationsQuery.data?.items ?? []
  const unreadMessages = (chatsQuery.data?.items ?? []).reduce((sum, c) => sum + (c.unread_count ?? 0), 0)

  const markReadMutation = useMutation({
    mutationFn: async (payload: { ids?: string[]; all?: boolean }) => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? "Errore aggiornamento notifiche")
      return json
    },
    onSuccess: (_, payload) => {
      qc.setQueryData(["notifications"], (prev?: NotificationsResponse) => {
        if (!prev) return prev
        const idsToMark =
          payload.all === true ? new Set(prev.items.map((n) => n.id)) : new Set(payload.ids ?? [])
        if (idsToMark.size === 0) return prev

        const nextData = prev.items.map((n) => (idsToMark.has(n.id) ? { ...n, is_read: true } : n))
        const newlyRead = prev.items.reduce(
          (acc, n) => acc + (!n.is_read && idsToMark.has(n.id) ? 1 : 0),
          0,
        )
        const nextUnread = payload.all === true ? 0 : Math.max(0, prev.unreadCount - newlyRead)

        return { ...prev, items: nextData, unreadCount: nextUnread }
      })
    },
  })

  const handleOpenNotifications = (open: boolean) => {
    setNotificationsOpen(open)
    if (open) notificationsQuery.refetch()
  }

  const handleMarkRead = (id: string) => {
    const target = notifications.find((n) => n.id === id)
    if (!target || target.is_read) return
    markReadMutation.mutate({ ids: [id] })
  }

  const handleMarkAll = () => {
    markReadMutation.mutate({ all: true })
  }

  const lastUpdatedLabel = useMemo(() => {
    if (!notificationsQuery.data) return "In attesa"
    const updatedAt = notificationsQuery.data.items?.[0]?.created_at
    if (!updatedAt) return "Aggiornato"
    const d = new Date(updatedAt)
    return `Aggiornato ${d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}`
  }, [notificationsQuery.data])

  // Prefetch rotte e dati base per evitare vuoti su mobile/prime aperture
  useEffect(() => {
    router.prefetch("/dashboard/messaggi")
    router.prefetch("/dashboard/impostazioni")
    qc.prefetchQuery({ queryKey: ["notifications"], queryFn: ({ signal }) => apiGet("/api/notifications?limit=20", signal) })
    qc.prefetchQuery({ queryKey: ["chats"], queryFn: ({ signal }) => apiGet("/api/messages/chats", signal) })
  }, [qc, router])

  // Realtime notifiche + chat: merge diretto in cache, no invalidazioni pesanti
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    const mergeNotification = (notif: NotificationItem) => {
      qc.setQueryData<NotificationsResponse>(["notifications"], (prev) => {
        const base: NotificationsResponse = prev ?? { items: [], unreadCount: 0 }
        const existing = new Map(base.items.map((n) => [n.id, n]))
        existing.set(notif.id, notif)
        const items = Array.from(existing.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        const unreadCount = items.reduce((acc, n) => acc + (n.is_read ? 0 : 1), 0)
        if (process.env.NODE_ENV !== "production") console.debug("[RT][notif] merge", notif.id)
        return { items, unreadCount }
      })
    }

    const mergeChatFromMessage = (payload: any) => {
      const msg = payload?.new as any
      if (!msg?.chat_id) return
      const messageMeta = {
        id: msg.id,
        body: msg.body ?? "",
        created_at: msg.created_at,
        sender_id: msg.sender_id,
        status: msg.status ?? "sent",
      }

      qc.setQueryData<{ items: any[]; currentUserId: string }>(["chats"], (prev) => {
        if (!prev) return prev
        const currentUserId = prev.currentUserId
        const items = prev.items.map((c) => {
          if (c.id !== msg.chat_id) return c
          const unreadBump = msg.sender_id && msg.sender_id !== currentUserId ? 1 : 0
          return {
            ...c,
            unread_count: (c.unread_count ?? 0) + unreadBump,
            updated_at: msg.created_at ?? c.updated_at,
            last_message: { ...(c.last_message ?? {}), ...messageMeta },
          }
        })

        // Keep ordering by updated_at desc
        const ordered = [...items].sort(
          (a, b) => new Date(b.updated_at ?? b.last_message?.created_at ?? 0).getTime() -
            new Date(a.updated_at ?? a.last_message?.created_at ?? 0).getTime(),
        )

        if (process.env.NODE_ENV !== "production") console.debug("[RT][chat] msg", msg.id, msg.chat_id)
        return { ...prev, items: ordered }
      })
    }

    const notifChannel = supabase
      .channel("notifications-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        mergeNotification(payload.new as NotificationItem)
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications" }, (payload) => {
        mergeNotification(payload.new as NotificationItem)
      })
      .subscribe()

    const chatChannel = supabase
      .channel("messages-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, mergeChatFromMessage)
      .subscribe()

    return () => {
      supabase.removeChannel(notifChannel)
      supabase.removeChannel(chatChannel)
    }
  }, [qc])

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Mobile Menu Button */}
        <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Logo */}
        <Link href="/dashboard" className="lg:hidden text-lg font-bold">
          2it<span className="text-accent">.</span>
        </Link>

        {/* Breadcrumb / Title */}
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold capitalize">{pathname.split("/").pop() || "Dashboard"}</h1>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/messaggi" aria-label="Messaggi" className="relative">
              <MessageCircle className="w-5 h-5" />
              {unreadMessages > 0 ? (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-background" />
              ) : null}
            </Link>
          </Button>
          <DropdownMenu open={notificationsOpen} onOpenChange={handleOpenNotifications}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifiche">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 ? (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-background" />
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="bottom"
              align="end"
              sideOffset={8}
              collisionPadding={12}
              className="w-80 max-w-[calc(100vw-24px)] p-0 shadow-lg"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <div>
                  <p className="text-sm font-medium">Notifiche</p>
                  <p className="text-xs text-muted-foreground">
                    {unreadCount > 0 ? `${unreadCount} da leggere` : "Tutto letto"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={unreadCount === 0 || markReadMutation.isPending}
                  onClick={handleMarkAll}
                >
                  Segna tutte
                </Button>
              </div>

              <div className="max-h-96 overflow-y-auto divide-y">
                {notificationsQuery.isLoading ? (
                  <div className="px-3 py-4 space-y-2 text-sm text-muted-foreground">
                    <div className="h-3 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                  </div>
                ) : null}

                {notificationsQuery.error ? (
                  <div className="px-3 py-4 text-sm text-red-500">
                    Errore nel caricare le notifiche
                  </div>
                ) : null}

                {!notificationsQuery.isLoading && notifications.length === 0 ? (
                  <div className="px-3 py-6 text-sm text-muted-foreground text-center">
                    Nessuna notifica
                  </div>
                ) : null}

                {notifications.map((n) => (
                  <button
                    key={n.id}
                    className={cn(
                      "w-full text-left px-3 py-3 flex gap-3 transition-colors hover:bg-muted/60",
                      !n.is_read ? "bg-muted/40" : "bg-background",
                    )}
                    onClick={() => handleMarkRead(n.id)}
                  >
                    <span
                      className={cn(
                        "mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0",
                        n.is_read ? "bg-cyan-400" : "bg-amber-400",
                      )}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      {n.body ? (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{n.body}</p>
                      ) : null}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleString("it-IT", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="px-3 py-2 border-t text-xs text-muted-foreground flex items-center justify-between">
                <span>{lastUpdatedLabel}</span>
                {notificationsQuery.isFetching ? <span>Aggiorno...</span> : null}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/impostazioni" aria-label="Vai alle impostazioni">
              <User className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          "lg:hidden transition-[max-height] duration-300 border-b",
          mobileMenuOpen ? "max-h-[70vh] overflow-y-auto" : "max-h-0 overflow-hidden border-b-0",
        )}
      >
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block px-4 py-2 rounded-lg text-sm font-medium",
                pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted",
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
