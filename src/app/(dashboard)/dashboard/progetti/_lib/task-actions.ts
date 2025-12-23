import type { QueryClient } from "@tanstack/react-query"
import type { Task, TaskPatch } from "./types"

async function readJsonSafe(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

export async function createTaskAction(args: {
  projectId: string
  title: string
  weight: number
  qc: QueryClient
}): Promise<void> {
  const { projectId, title, weight, qc } = args

  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, title, weight }),
  })

  const json = (await readJsonSafe(res)) as { error?: { message?: string } | string }
  if (!res.ok) throw new Error((json as any)?.error?.message ?? (json as any)?.error ?? "Errore creazione task")

  await Promise.all([
    qc.invalidateQueries({ queryKey: ["tasks", projectId] }),
    qc.invalidateQueries({ queryKey: ["project", projectId] }),
    qc.invalidateQueries({ queryKey: ["projects"] }),
    qc.invalidateQueries({ queryKey: ["dashboardSummary"] }),
    qc.invalidateQueries({ queryKey: ["reports", "projects"] }),
  ])
}

export async function patchTaskAction(args: {
  projectId: string
  id: string
  payload: TaskPatch
  qc: QueryClient
  setError: (msg: string) => void
}): Promise<void> {
  const { projectId, id, payload, qc, setError } = args

  qc.setQueryData<Task[]>(["tasks", projectId], (prev) => {
    if (!prev) return prev
    return prev.map((t) => (t.id === id ? { ...t, ...payload } : t))
  })

  try {
    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    })
    const json = (await readJsonSafe(res)) as { error?: { message?: string } | string }
    if (!res.ok) throw new Error((json as any)?.error?.message ?? (json as any)?.error ?? "Errore update task")

    await Promise.all([
      qc.invalidateQueries({ queryKey: ["tasks", projectId] }),
      qc.invalidateQueries({ queryKey: ["project", projectId] }),
      qc.invalidateQueries({ queryKey: ["projects"] }),
      qc.invalidateQueries({ queryKey: ["dashboardSummary"] }),
      qc.invalidateQueries({ queryKey: ["reports", "projects"] }),
    ])
  } catch (e: unknown) {
    setError(e instanceof Error ? e.message : "Errore di rete")
    await qc.invalidateQueries({ queryKey: ["tasks", projectId] })
  }
}

export async function moveTaskAction(args: {
  projectId: string
  id: string
  dir: "UP" | "DOWN"
  qc: QueryClient
  setError: (msg: string) => void
}): Promise<void> {
  const { projectId, id, dir, qc, setError } = args
  const snapshot = qc.getQueryData<Task[]>(["tasks", projectId])

  qc.setQueryData<Task[]>(["tasks", projectId], (prev) => {
    if (!prev) return prev
    const i = prev.findIndex((t) => t.id === id)
    if (i === -1) return prev
    const j = dir === "UP" ? i - 1 : i + 1
    if (j < 0 || j >= prev.length) return prev
    const next = [...prev]
    ;[next[i], next[j]] = [next[j], next[i]]
    return next
  })

  try {
    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, move: dir }),
    })
    const json = (await readJsonSafe(res)) as { error?: { message?: string } | string }
    if (!res.ok) throw new Error((json as any)?.error?.message ?? (json as any)?.error ?? "Errore move task")

    await Promise.all([
      qc.invalidateQueries({ queryKey: ["tasks", projectId] }),
      qc.invalidateQueries({ queryKey: ["project", projectId] }),
      qc.invalidateQueries({ queryKey: ["projects"] }),
      qc.invalidateQueries({ queryKey: ["dashboardSummary"] }),
      qc.invalidateQueries({ queryKey: ["reports", "projects"] }),
    ])
  } catch (e: unknown) {
    setError(e instanceof Error ? e.message : "Errore di rete")
    if (snapshot) qc.setQueryData(["tasks", projectId], snapshot)
  }
}

export async function deleteTaskAction(args: {
  projectId: string
  taskId: string
  qc: QueryClient
}): Promise<void> {
  const { projectId, taskId, qc } = args

  const res = await fetch(`/api/tasks?id=${encodeURIComponent(taskId)}`, { method: "DELETE" })
  const json = (await readJsonSafe(res)) as { error?: string }
  if (!res.ok) throw new Error((json as any)?.error ?? "Errore delete task")

  await Promise.all([
    qc.invalidateQueries({ queryKey: ["tasks", projectId] }),
    qc.invalidateQueries({ queryKey: ["project", projectId] }),
    qc.invalidateQueries({ queryKey: ["projects"] }),
    qc.invalidateQueries({ queryKey: ["dashboardSummary"] }),
    qc.invalidateQueries({ queryKey: ["reports", "projects"] }),
  ])
}
