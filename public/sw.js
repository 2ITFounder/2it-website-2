const CACHE = "2it-app-v1"

const APP_PATHS = ["/login", "/dashboard"]

self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_PATHS)).catch(() => {})
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Non toccare API / Supabase / roba dinamica
  if (url.pathname.startsWith("/api")) return

  const isApp =
    url.pathname === "/login" ||
    url.pathname.startsWith("/dashboard")

  const isNextStatic =
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons/")

  // Solo per APP + asset statici
  if (!isApp && !isNextStatic) return

  // HTML: network-first (evita problemi auth)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(event.request, copy))
          return res
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // Asset: cache-first
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
})
