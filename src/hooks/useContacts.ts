import { useQuery } from "@tanstack/react-query"
import { apiGet } from "@/src/lib/api"

export function useContacts() {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: ({ signal }) => apiGet("/api/contacts", signal),
  })
}
