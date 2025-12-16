import { useQuery } from "@tanstack/react-query"
import { apiGet } from "@/src/lib/api"

export type ChatUser = {
  user_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  username: string | null
}

export function useChatUsers() {
  return useQuery<ChatUser[]>({
    queryKey: ["chat-users"],
    queryFn: ({ signal }) => apiGet<ChatUser[]>("/api/messages/users", signal),
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: true,
    placeholderData: (prev) => prev, // mantiene la lista utenti tra navigazioni
  })
}
