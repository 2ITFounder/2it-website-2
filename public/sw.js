const CACHE = "2it-app-v4" // <-- bump versione per forzare refresh
const APP_SHELL = "/dashboard"
const IS_DEV = self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1"
const debugLog = (...args) => {
  if (IS_DEV) console.log(...args)
}

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

self.addEventListener("push", (event) => {
  const data = (() => {
    try { return event.data ? event.data.json() : {} } catch { return {} }
  })()

  const title = data.title || "2IT Gestionale"
  const body = data.body || ""
  const url = data.url || "/dashboard"

  event.waitUntil(
    (async () => {
      debugLog("[push] received", { title, body, url, type: data.type, chatId: data.chatId })
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
