export async function apiGet<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    signal,
    credentials: "include",
  })

  // 204 / empty body safety
  const text = await res.text().catch(() => "")
  const json = text ? JSON.parse(text) : {}

  if (!res.ok) {
    const msg = (json as any)?.error?.message ?? (json as any)?.error ?? "Errore di rete"
    throw new Error(msg)
  }

  return (((json as any)?.data ?? json) as T)
}
