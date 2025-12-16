import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query"
import { apiGet } from "@/src/lib/api"

export type MessageItem = {
  id: string
  tempId?: string
  chat_id: string
  sender_id: string
  body: string
  status: string
  created_at: string
  sendStatus?: "sending" | "failed" | "sent"
  tag?: "important" | "idea" | null
}

export type MessagesResponse = {
  items: MessageItem[]
  members: string[]
  nextCursor: string | null
}

export function useMessages(chatId?: string) {
  return useInfiniteQuery<
    MessagesResponse,
    Error,
    InfiniteData<MessagesResponse>,
    ["messages", string | undefined],
    string | null
  >({
    queryKey: ["messages", chatId],
    enabled: Boolean(chatId),
    initialPageParam: null,
    queryFn: async ({ signal, pageParam }) => {
      const params = new URLSearchParams({ chat_id: chatId ?? "" })
      if (pageParam) params.set("before", pageParam)
      params.set("limit", "30")
      return apiGet<MessagesResponse>(`/api/messages?${params.toString()}`, signal)
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 10_000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: true,
    // fallback polling to keep the thread updated if realtime events are missed
    refetchInterval: chatId ? 4000 : false,
    refetchIntervalInBackground: true,
    placeholderData: (prev) => prev, // evita pagina vuota quando cambi chat rapidamente
  })
}
