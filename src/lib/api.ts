export async function apiGet<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    signal,
    credentials: "include",
    // IMPORTANTISSIMO: togli "no-store" dal lato client,
    // la cache la gestirà React Query.
  })

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(json?.error || "Errore di rete")
  }

  return (json?.data ?? json) as T
}
