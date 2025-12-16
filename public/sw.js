const CACHE = "2it-app-v4" // <-- bump versione per forzare refresh
const APP_SHELL = "/dashboard"
const activeChatsByClient = new Map()

self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["/login", APP_SHELL])).catch(() => {})
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // pulizia cache vecchie
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // non toccare API
  if (url.pathname.startsWith("/api")) return

  const isDashboard = url.pathname.startsWith("/dashboard")
  const isLogin = url.pathname === "/login"
  const isNextStatic = url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons/")

  // NAVIGAZIONI HTML: app-shell fallback (mai "undefined")
  if (event.request.mode === "navigate" && (isDashboard || isLogin)) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        // fallback sempre valido
        const cachedShell = await caches.match(APP_SHELL)
        return cachedShell || caches.match("/login")
      })
    )
    return
  }

  // Static assets: cache-first
  if (isNextStatic) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(event.request, copy))
          return res
        })
      })
    )
  }
})

self.addEventListener("message", (event) => {
  const data = event.data
  const sourceId = event.source && "id" in event.source ? event.source.id : null

  if (!data || typeof data !== "object" || !sourceId) return
  if (data.type !== "chat-state" && data.type !== "chat-inactive") return

  const chatId = data.chatId
  const visible = data.visible === true

  if (data.type === "chat-state" && chatId) {
    activeChatsByClient.set(sourceId, { chatId: String(chatId), visible })
  } else {
    activeChatsByClient.delete(sourceId)
  }
})

self.addEventListener("push", (event) => {
  const data = (() => {
    try { return event.data ? event.data.json() : {} } catch { return {} }
  })()

  const title = data.title || "2IT Gestionale"
  const body = data.body || ""
  const url = data.url || "/dashboard"

  const chatId = data.chatId || (() => {
    try {
      const u = new URL(url, self.location.origin)
      return u.searchParams.get("chatId")
    } catch {
      return null
    }
  })()

  const shouldShowNotification = async () => {
    if (!chatId || data.type !== "message") return true

    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true })

    const currentIds = new Set(clients.map((c) => c.id))
    Array.from(activeChatsByClient.keys()).forEach((id) => {
      if (!currentIds.has(id)) activeChatsByClient.delete(id)
    })

    const isChatOpen = clients.some((c) => {
      const activeChat = activeChatsByClient.get(c.id)
      const isVisible =
        activeChat?.visible === true
          ? true
          : "visibilityState" in c
            ? c.visibilityState === "visible"
            : true

      if (activeChat?.chatId === chatId && isVisible) return true

      try {
        const current = new URL(c.url)
        const openChatId = current.searchParams.get("chatId")
        const isMessagesPage = current.pathname.startsWith("/dashboard/messaggi")
        return isMessagesPage && openChatId === chatId && isVisible
      } catch {
        return false
      }
    })

    return !isChatOpen
  }

  event.waitUntil(
    (async () => {
      const show = await shouldShowNotification()
      if (!show) return
      return self.registration.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: { url },
      })
    })()
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification?.data?.url || "/dashboard"

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
      const client = allClients.find((c) => "focus" in c)
      if (client) {
        client.focus()
        client.navigate(url)
        return
      }
      self.clients.openWindow(url)
    })()
  )
})
