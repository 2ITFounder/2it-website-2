import { MessageItem } from "@/src/hooks/useMessages"

export function sortByCreatedAt(a: MessageItem, b: MessageItem) {
  return a.created_at.localeCompare(b.created_at)
}

export function normalizeIncoming(incoming: MessageItem): MessageItem {
  return {
    ...incoming,
    tempId: incoming.tempId ?? incoming.client_temp_id ?? undefined,
    sendStatus: incoming.sendStatus ?? "sent",
  }
}
