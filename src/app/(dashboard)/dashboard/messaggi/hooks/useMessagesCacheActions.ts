import { useCallback, useRef } from "react"
import { type QueryClient } from "@tanstack/react-query"
import { type MessageItem } from "@/src/hooks/useMessages"
import { normalizeIncoming, sortByCreatedAt } from "../lib/message-helpers"
import { IS_DEV } from "../lib/messages-constants"
import { dedupeMessages } from "../lib/messages-dedupe"

type MergeSource = "realtime" | "refetch" | "optimistic" | "onSuccess" | null

export function useMessagesCacheActions({
  qc,
  logDebug,
}: {
  qc: QueryClient
  logDebug: (...args: any[]) => void
}) {
  const lastLocalUpdateRef = useRef<MergeSource>(null)

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
      qc.setQueryData<InfiniteDataType>(["messages", chatId], (prev) => {
        const base: InfiniteDataType = {
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
    },
    [logDebug, qc]
  )

  const removeMessageFromCache = useCallback(
    (chatId: string, messageId: string) => {
      qc.setQueryData<InfiniteDataType>(["messages", chatId], (prev) => {
        if (!prev) return prev
        const nextPages = prev.pages.map((p, idx) => {
          if (idx !== 0) return p
          const filtered = p.items.filter((m) => m.id !== messageId)
          return { ...p, items: filtered }
        })
        return { ...prev, pages: nextPages }
      })
    },
    [qc]
  )

  return { mergeMessageIntoCache, removeMessageFromCache, lastLocalUpdateRef }
}

type InfiniteDataType = {
  pages: { items: MessageItem[]; members: any[]; nextCursor: string | null }[]
  pageParams: (string | null)[]
}
