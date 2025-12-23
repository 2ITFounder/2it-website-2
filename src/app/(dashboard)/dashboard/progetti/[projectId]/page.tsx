"use client"

import { useMemo, useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { apiGet } from "@/src/lib/api"

import { clamp } from "../_lib/ui"
import { extractErrorMessage } from "../_lib/errors"
import type { Project, Task, TaskPatch } from "../_lib/types"
import type { ProjectRow } from "../_lib/projects.types"
import { createTaskAction, patchTaskAction, moveTaskAction, deleteTaskAction } from "../_lib/task-actions"

import { ProjectHeader } from "../../../../../components/projects/project-detail/ProjectHeader"
import { ProgressCard } from "../../../../../components/projects/project-detail/ProgressCard"
import { TasksCard } from "../../../../../components/projects/project-detail/TasksCard"
import { CreateTaskDialog } from "../../../../../components/projects/project-detail/CreateTaskDialog"
import { DeleteTaskDialog } from "../../../../../components/projects/project-detail/DeleteTaskDialog"

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>()
  const projectId = params.projectId
  const router = useRouter()
  const qc = useQueryClient()

  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newWeight, setNewWeight] = useState<string>("1")
  const [weightDrafts, setWeightDrafts] = useState<Record<string, string>>({})

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: project, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ["project", projectId],
    enabled: Boolean(projectId),
    queryFn: ({ signal }) => apiGet<Project>(`/api/projects/${projectId}`, signal),
  })

  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ["tasks", projectId],
    enabled: Boolean(projectId),
    queryFn: ({ signal }) => apiGet<Task[]>(`/api/tasks?project_id=${encodeURIComponent(projectId)}`, signal),
  })

  const loading = projectLoading || tasksLoading
  const queryError = extractErrorMessage(projectError) || extractErrorMessage(tasksError)
  const topError = error || queryError

  const computedProgress = useMemo(() => {
    const total = tasks.reduce((a, t) => a + (Number(t.weight) || 0), 0)
    const done = tasks.reduce((a, t) => a + (t.status === "DONE" ? (Number(t.weight) || 0) : 0), 0)
    return total <= 0 ? 0 : clamp(Math.round((done / total) * 100))
  }, [tasks])

  useEffect(() => {
    if (!projectId || tasksLoading) return
    qc.setQueryData<ProjectRow[]>(["projects"], (prev) =>
      (prev ?? []).map((p) => (p.id === projectId ? { ...p, progress: computedProgress } : p))
    )
    qc.setQueryData<Project | undefined>(["project", projectId], (prev) =>
      prev ? { ...prev, progress: computedProgress } : prev
    )
  }, [projectId, tasksLoading, computedProgress, qc])

  const createTask = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    setError(null)

    try {
      const weightNumber = Math.min(100, Math.max(1, parseInt(newWeight || "1", 10)))
      await createTaskAction({
        projectId,
        title: newTitle.trim(),
        weight: weightNumber,
        qc,
      })
      setCreateOpen(false)
      setNewTitle("")
      setNewWeight("1")
    } catch (e: unknown) {
      setError(extractErrorMessage(e) ?? "Errore di rete")
    } finally {
      setCreating(false)
    }
  }

  const patchTask = (id: string, payload: TaskPatch) =>
    patchTaskAction({
      projectId,
      id,
      payload,
      qc,
      setError: (msg) => setError(msg),
    })

  const moveTask = (id: string, dir: "UP" | "DOWN") =>
    moveTaskAction({
      projectId,
      id,
      dir,
      qc,
      setError: (msg) => setError(msg),
    })

  const askDelete = (t: Task) => {
    setDeleteTarget({ id: t.id, title: t.title })
    setDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setError(null)

    try {
      await deleteTaskAction({ projectId, taskId: deleteTarget.id, qc })
      setDeleteOpen(false)
      setDeleteTarget(null)
    } catch (e: unknown) {
      setError(extractErrorMessage(e) ?? "Errore di rete")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <div className="text-muted-foreground">Caricamento…</div>

  return (
    <div className="space-y-6">
      <ProjectHeader
        title={project?.title ?? "Progetto"}
        computedProgress={computedProgress}
        onBack={() => router.push("/dashboard/progetti")}
        onCreate={() => setCreateOpen(true)}
      />

      {topError && <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{topError}</div>}

      <ProgressCard computedProgress={computedProgress} />

      <TasksCard
        tasks={tasks}
        projectId={projectId}
        qc={qc}
        weightDrafts={weightDrafts}
        setWeightDrafts={setWeightDrafts}
        onPatch={patchTask}
        onMove={moveTask}
        onAskDelete={askDelete}
      />

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        creating={creating}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newWeight={newWeight}
        setNewWeight={setNewWeight}
        onCreate={createTask}
      />

      <DeleteTaskDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        deleting={deleting}
        title={deleteTarget?.title ?? null}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
