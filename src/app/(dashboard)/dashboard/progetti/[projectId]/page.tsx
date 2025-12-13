"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, ChevronUp, ChevronDown, Trash2 } from "lucide-react"

import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { GlassCard } from "@/src/components/ui-custom/glass-card"
import { Label } from "@/src/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/src/components/ui/alert-dialog"

type ProjectStatus = "LEAD" | "IN_CORSO" | "IN_REVISIONE" | "COMPLETATO" | "IN_PAUSA" | "ANNULLATO"
type TaskStatus = "TODO" | "DOING" | "DONE"

type Project = {
  id: string
  title: string
  description: string | null
  status: ProjectStatus
  progress: number
  due_date: string | null
}

type Task = {
  id: string
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: number
  weight: number
  due_date: string | null
  position: number
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, n))
}

function taskStatusPill(status: "TODO" | "DOING" | "DONE") {
  if (status === "DONE") return "bg-green-100 text-green-700"
  if (status === "DOING") return "bg-blue-100 text-blue-700"
  return "bg-gray-100 text-gray-700"
}

function taskBorder(status: "TODO" | "DOING" | "DONE") {
  if (status === "DONE") return "border-green-200"
  if (status === "DOING") return "border-blue-200"
  return "border-gray-200"
}


export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>()
  const projectId = params.projectId
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [error, setError] = useState<string | null>(null)

  // create task dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newWeight, setNewWeight] = useState(1)

  // delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const computedProgress = useMemo(() => {
    const total = tasks.reduce((a, t) => a + (Number(t.weight) || 0), 0)
    const done = tasks.reduce((a, t) => a + (t.status === "DONE" ? (Number(t.weight) || 0) : 0), 0)
    return total <= 0 ? 0 : clamp(Math.round((done / total) * 100))
  }, [tasks])

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [pRes, tRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`, { cache: "no-store" }),
        fetch(`/api/tasks?project_id=${encodeURIComponent(projectId)}`, { cache: "no-store" }),
      ])

      const pJson = await pRes.json().catch(() => ({}))
      const tJson = await tRes.json().catch(() => ({}))

      if (!pRes.ok) throw new Error(pJson?.error || "Errore progetto")
      if (!tRes.ok) throw new Error(tJson?.error || "Errore tasks")

      setProject(pJson.data)
      setTasks(Array.isArray(tJson.data) ? tJson.data : [])
    } catch (e: any) {
      setError(e?.message || "Errore di rete")
      setProject(null)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

const fetchTasksSilently = async () => {
  try {
    const tRes = await fetch(`/api/tasks?project_id=${encodeURIComponent(projectId)}`, {
      cache: "no-store",
    })
    const tJson = await tRes.json().catch(() => ({}))
    if (!tRes.ok) throw new Error(tJson?.error || "Errore tasks")
    setTasks(Array.isArray(tJson.data) ? tJson.data : [])
  } catch (e: any) {
    setError(e?.message || "Errore di rete")
  }
}


  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const createTask = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          title: newTitle.trim(),
          weight: Number(newWeight || 1),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error?.message ?? json?.error ?? "Errore creazione task")

      setCreateOpen(false)
      setNewTitle("")
      setNewWeight(1)
      await fetchAll()
    } catch (e: any) {
      setError(e?.message || "Errore di rete")
    } finally {
      setCreating(false)
    }
  }

  const patchTask = async (id: string, payload: any) => {
  // 1) optimistic update
  setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...payload } : t)))

  try {
    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.error?.message ?? json?.error ?? "Errore update task")

    // 2) NON fetchAll qui (evita glitch)
    // opzionale: se vuoi riallineare ogni tot, lo faremo più avanti
  } catch (e: any) {
    setError(e?.message || "Errore di rete")
    // rollback semplice: ricarico solo se fallisce
    await fetchAll()
  }
}


  const moveTask = async (id: string, dir: "UP" | "DOWN") => {
  // snapshot per rollback
  const snapshot = tasks

  // 1) swap UI (optimistic)
  setTasks((prev) => {
    const i = prev.findIndex((t) => t.id === id)
    if (i === -1) return prev
    const j = dir === "UP" ? i - 1 : i + 1
    if (j < 0 || j >= prev.length) return prev

    const next = [...prev]
    ;[next[i], next[j]] = [next[j], next[i]]
    return next
  })

  // 2) persisti sul DB (background)
  try {
    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, move: dir }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.error?.message ?? json?.error ?? "Errore move task")

    // 3) riallineo in modo “silenzioso” (niente glitch)
    await fetchTasksSilently()
  } catch (e: any) {
    setError(e?.message || "Errore di rete")
    // rollback UI
    setTasks(snapshot)
  }
}



  const askDelete = (t: Task) => {
    setDeleteTarget({ id: t.id, title: t.title })
    setDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/tasks?id=${encodeURIComponent(deleteTarget.id)}`, { method: "DELETE" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || "Errore delete task")

      setDeleteOpen(false)
      setDeleteTarget(null)
      await fetchAll()
    } catch (e: any) {
      setError(e?.message || "Errore di rete")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <div className="text-muted-foreground">Caricamento…</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/progetti")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div>
            <h1 className="text-2xl font-bold">{project?.title ?? "Progetto"}</h1>
            <p className="text-muted-foreground">
              Progresso calcolato da task: <span className="font-medium">{computedProgress}%</span>
            </p>
          </div>
        </div>

        <Button className="glow-button" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuova task
        </Button>
      </div>

      {error && <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      {/* Progress bar */}
      <GlassCard>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Completamento</span>
            <span className="font-medium">{computedProgress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${computedProgress}%` }} />
          </div>
        </div>
      </GlassCard>

      {/* Tasks */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Task</h2>
          <p className="text-sm text-muted-foreground">{tasks.length} totali</p>
        </div>

        {tasks.length === 0 ? (
          <div className="text-muted-foreground text-sm">Nessuna task. Creane una per iniziare.</div>
        ) : (
          <div className="space-y-3">
            {tasks.map((t, idx) => (
              <div key={t.id} className={`rounded-lg border p-3 ${taskBorder(t.status)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <Input
                      value={t.title}
                      onChange={(e) => {
                        const v = e.target.value
                        setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, title: v } : x)))
                      }}
                      onBlur={() => patchTask(t.id, { title: t.title })}
                      className="font-medium"
                    />

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-6 gap-3">
                      <div className="space-y-1 sm:col-span-3">
                        <Label>Status</Label>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${taskStatusPill(t.status)}`}>
                                {t.status}
                            </span>
                        </div>

                        <select
                          className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                          value={t.status}
                          onChange={(e) => patchTask(t.id, { status: e.target.value })}
                        >
                          <option value="TODO">TODO</option>
                          <option value="DOING">DOING</option>
                          <option value="DONE">DONE</option>
                        </select>
                      </div>

                      <div className="space-y-1 sm:col-span-1">
                        <Label>Peso</Label>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={t.weight}
                          onChange={(e) => {
                            const v = Number(e.target.value || 1)
                            setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, weight: v } : x)))
                          }}
                          onBlur={() => patchTask(t.id, { weight: t.weight })}
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <Label>Scadenza</Label>
                        <Input
                          type="date"
                          value={t.due_date ?? ""}
                          onChange={(e) => patchTask(t.id, { due_date: e.target.value || null })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => moveTask(t.id, "UP")}
                      disabled={idx === 0}
                      title="Sposta su"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => moveTask(t.id, "DOWN")}
                      disabled={idx === tasks.length - 1}
                      title="Sposta giù"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => askDelete(t)} title="Elimina">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Create Task Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuova task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titolo</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Es. Setup hosting" />
            </div>

            <div className="space-y-2">
              <Label>Peso</Label>
              <Input type="number" min={1} max={100} value={newWeight} onChange={(e) => setNewWeight(Number(e.target.value || 1))} />
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Annulla
            </Button>
            <Button className="glow-button" onClick={createTask} disabled={creating || !newTitle.trim()}>
              {creating ? "Creazione..." : "Crea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare task?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? `Stai per eliminare "${deleteTarget.title}".` : "Questa azione è definitiva."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
