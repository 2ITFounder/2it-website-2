import { useQuery } from "@tanstack/react-query"
import { apiGet } from "@/src/lib/api"

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: ({ signal }) => apiGet("/api/clients", signal),
  })
}
