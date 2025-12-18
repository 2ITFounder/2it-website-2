import { useEffect } from "react"
import { IS_DEV, PRESENCE_HEARTBEAT_MS } from "../lib/messages-constants"

export function useChatPresenceHeartbeat(selectedChat: string | null) {
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
}
