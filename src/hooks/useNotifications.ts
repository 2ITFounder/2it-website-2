import { useQuery } from "@tanstack/react-query"
import { apiGet } from "@/src/lib/api"

export type NotificationItem = {
  id: string
  title: string
  body: string | null
  type?: string | null
  link?: string | null
  is_read: boolean
  created_at: string
}

export type NotificationsResponse = {
  items: NotificationItem[]
  unreadCount: number
}

export function useNotifications(enabled: boolean = true) {
  return useQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: ({ signal }) => apiGet<NotificationsResponse>("/api/notifications?limit=20", signal),
    enabled,
    staleTime: 30_000,
  })
}
