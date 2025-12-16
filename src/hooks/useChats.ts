import { useQuery } from "@tanstack/react-query"
import { apiGet } from "@/src/lib/api"

export type ChatMember = {
  user_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  username: string | null
}

export type ChatSummary = {
  id: string
  title: string | null
  is_group: boolean
  updated_at: string | null
  unread_count: number
  members: ChatMember[]
  last_message?: {
    id: string
    body: string
    created_at: string
    sender_id: string
    status: string
  } | null
}

export function useChats(enabled = true) {
  return useQuery<{ items: ChatSummary[]; currentUserId: string }>({
    queryKey: ["chats"],
    queryFn: ({ signal }) => apiGet<{ items: ChatSummary[]; currentUserId: string }>("/api/messages/chats", signal),
    enabled,
    staleTime: 15_000,
  })
}
