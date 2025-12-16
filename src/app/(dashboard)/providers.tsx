"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(() => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000, // 1 min: niente refetch continuo
          gcTime: 10 * 60_000, // 10 min in cache anche se cambi pagina
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          refetchOnMount: false, // evita reset su navigation rapida
          retry: 1,
          networkMode: "online", // evita retry strani in background
        },
      },
    })

    // Log minimale in dev per capire fetch/cached update
    if (process.env.NODE_ENV !== "production") {
      qc.getQueryCache().subscribe((event) => {
        if (event?.type !== "updated") return
        const actionType = (event as any)?.action?.type
        const key = event.query?.queryKey?.join(" | ")
        if (!actionType || !key) return
        // Solo fetch/success/error per non spammare
        if (actionType === "fetch" || actionType === "success" || actionType === "error") {
          console.debug(`[RQ][${actionType}]`, key, event.query?.state?.dataUpdatedAt)
        }
      })
    }

    return qc
  })

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
