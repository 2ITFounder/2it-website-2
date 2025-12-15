import { useInfiniteQuery } from "@tanstack/react-query"
import { apiGet } from "@/src/lib/api"

export type MessageItem = {
  id: string
  chat_id: string
  sender_id: string
  body: string
  status: string
  created_at: string
}

export type MessagesResponse = {
  items: MessageItem[]
  members: string[]
  nextCursor: string | null
}

export function useMessages(chatId?: string) {
  return useInfiniteQuery<MessagesResponse>({
    queryKey: ["messages", chatId],
    enabled: Boolean(chatId),
    queryFn: async ({ signal, pageParam }) => {
      const params = new URLSearchParams({ chat_id: chatId ?? "" })
      if (pageParam) params.set("before", pageParam as string)
      params.set("limit", "30")
      return apiGet<MessagesResponse>(`/api/messages?${params.toString()}`, signal)
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    refetchOnWindowFocus: true,
  })
}
