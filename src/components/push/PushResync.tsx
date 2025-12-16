"use client"

import { useEffect, useRef } from "react"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = typeof atob === "function" ? atob(base64) : ""
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

async function ensureServiceWorkerReady(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) throw new Error("Service Worker non supportato")
  return await navigator.serviceWorker.ready
}

async function resyncPushSubscription() {
  try {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    )
      return

    // non chiediamo permessi qui: solo se già concessi
    if (Notification.permission !== "granted") return

    const settingsRes = await fetch("/api/settings", { method: "GET" })
    const settingsJson = await settingsRes.json().catch(() => null)
    const settings = (settingsJson?.data ?? settingsJson)?.data ?? settingsJson
    const pushEnabled = Boolean(settings?.notifications_push)
    if (!pushEnabled) return

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY
    if (!vapidPublicKey) return

    const reg = await ensureServiceWorkerReady()
    const existing = await reg.pushManager.getSubscription()
    const subscription =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      }))

    // idempotente: il backend può upsert su endpoint
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    }).catch((err) => {
      if (process.env.NODE_ENV !== "production") console.warn("[push] resync subscribe fail", err)
    })
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.warn("[push] resync error", e)
    // non bloccare la UI se fallisce
  }
}

export function PushResync() {
  const lastRunRef = useRef(0)

  useEffect(() => {
    const maybeSync = () => {
      const now = Date.now()
      if (now - lastRunRef.current < 30_000) return
      lastRunRef.current = now
      void resyncPushSubscription()
    }

    maybeSync()
    const handleVisibility = () => {
      if (!document.hidden) maybeSync()
    }
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [])

  return null
}
