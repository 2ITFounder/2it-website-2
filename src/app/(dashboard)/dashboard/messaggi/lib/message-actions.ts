import { MessageItem } from "@/src/hooks/useMessages"

export async function apiUpdateMessageTag(msg: MessageItem, tag: "important" | "idea" | "none") {
  const res = await fetch("/api/messages", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: msg.id, tag }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error ?? "Errore aggiornamento")
  return json?.data as MessageItem
}

export async function apiDeleteMessage(msg: MessageItem) {
  const res = await fetch("/api/messages", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: msg.id }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error ?? "Errore eliminazione")
  return msg.id
}

export async function apiMarkChatNotificationsRead(chatId: string) {
  await fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId }),
  })
}
