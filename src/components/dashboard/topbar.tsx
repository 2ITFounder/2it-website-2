"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Menu, X, Bell, User } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/src/components/ui/dropdown-menu"
import { cn } from "@/src/lib/utils"
import { NotificationsResponse, useNotifications } from "@/src/hooks/useNotifications"

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const qc = useQueryClient()

  const notificationsQuery = useNotifications(true)

  const unreadCount = notificationsQuery.data?.unreadCount ?? 0
  const notifications = notificationsQuery.data?.items ?? []

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
          <DropdownMenu open={notificationsOpen} onOpenChange={handleOpenNotifications}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifiche">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 ? (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-background" />
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg">
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
