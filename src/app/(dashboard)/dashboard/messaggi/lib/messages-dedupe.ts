import { type MessageItem } from "@/src/hooks/useMessages"

export function dedupeMessages(items: MessageItem[]) {
  const byKey = new Map<string, MessageItem>()
  for (const msg of items) {
    const key = msg.tempId ?? msg.client_temp_id ?? msg.id
    const prev = byKey.get(key)
    if (!prev) {
      byKey.set(key, msg)
      continue
    }
    if (prev.sendStatus === "sending" && msg.sendStatus !== "sending") {
      byKey.set(key, { ...prev, ...msg, tempId: prev.tempId ?? msg.tempId, client_temp_id: prev.client_temp_id ?? msg.client_temp_id })
      continue
    }
    if (msg.sendStatus === "sending" && prev.sendStatus !== "sending") {
      byKey.set(key, { ...msg, ...prev, tempId: prev.tempId ?? msg.tempId, client_temp_id: prev.client_temp_id ?? msg.client_temp_id })
      continue
    }
    byKey.set(key, { ...prev, ...msg, tempId: prev.tempId ?? msg.tempId, client_temp_id: prev.client_temp_id ?? msg.client_temp_id })
  }
  return Array.from(byKey.values())
}
