"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { ProjectsToolbar } from "./_components/projects-toolbar"
import { ProjectsGrid } from "./_components/projects-grid"
import { ProjectCreateDialog } from "./_components/project-create-dialog"
import { ProjectEditDialog } from "./_components/project-edit-dialog"
import { ProjectDeleteDialog } from "./_components/project-delete-dialog"

import { apiCreateProject, apiDeleteProject, apiGetClients, apiGetProjects, apiUpdateProject } from "./_lib/projects.api"
import { ClientRow, ProjectRow, ProjectStatus, STATUS_LABEL, extractErrorMessage } from "./_lib/projects.types"

export default function ProgettiDashboardPage() {
  const router = useRouter()
  const qc = useQueryClient()

  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  // dialogs
  const [createOpen, setCreateOpen] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editProject, setEditProject] = useState<ProjectRow | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

  const {
    data: clients = [],
    isLoading: clientsLoading,
    error: clientsError,
  } = useQuery({
    queryKey: ["clients"],
    queryFn: () => apiGetClients(),
  })

  const {
    data: projects = [],
    isLoading: projectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiGetProjects(),
  })

  const loading = clientsLoading || projectsLoading

  const queryError = extractErrorMessage(clientsError) || extractErrorMessage(projectsError)
  const topError = error || queryError

  const clientNameById = useMemo(() => {
    const map = new Map(clients.map((c) => [c.id, c.name] as const))
    return (id: string) => map.get(id) ?? "—"
  }, [clients])

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase()
    if (!s) return projects
    return projects.filter((p) => {
      const clientName = clientNameById(p.client_id).toLowerCase()
      const status = (STATUS_LABEL[p.status] ?? p.status).toLowerCase()
      return (
        p.title.toLowerCase().includes(s) ||
        (p.description ?? "").toLowerCase().includes(s) ||
        clientName.includes(s) ||
        status.includes(s)
      )
    })
  }, [projects, query, clientNameById])

  // actions
  const handleCreate = async (payload: {
    client_id: string
    title: string
    description: string | null
    status: ProjectStatus
    due_date: string | null
  }) => {
    await apiCreateProject({
      client_id: payload.client_id,
      title: payload.title,
      description: payload.description,
      status: payload.status,
      due_date: payload.due_date,
    })
    await qc.invalidateQueries({ queryKey: ["projects"] })
  }

  const handleEditOpen = (p: ProjectRow) => {
    setEditProject(p)
    setEditOpen(true)
  }

  const handleUpdate = async (args: {
    id: string
    payload: {
      client_id: string
      title: string
      description: string | null
      status: ProjectStatus
      due_date: string | null
    }
  }) => {
    await apiUpdateProject(args.id, {
      client_id: args.payload.client_id,
      title: args.payload.title,
      description: args.payload.description,
      status: args.payload.status,
      due_date: args.payload.due_date,
    })
    await qc.invalidateQueries({ queryKey: ["projects"] })
  }

  const handleAskDelete = (p: ProjectRow) => {
    setDeleteTarget({ id: p.id, title: p.title })
    setDeleteOpen(true)
  }

  const handleDelete = async (id: string) => {
    await apiDeleteProject(id)
    await qc.invalidateQueries({ queryKey: ["projects"] })
  }

  const openDetail = (p: ProjectRow) => {
    router.push(`/dashboard/progetti/${p.id}`)
  }

  return (
    <div className="space-y-6">
      <ProjectsToolbar query={query} onQueryChange={setQuery} onOpenCreate={() => setCreateOpen(true)} />

      {topError && <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{topError}</div>}

      <ProjectsGrid
        loading={loading}
        projects={filtered}
        clientNameById={clientNameById}
        onEdit={handleEditOpen}
        onDelete={handleAskDelete}
        onOpenDetail={openDetail}
      />

      <ProjectCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients}
        onSubmit={handleCreate}
      />

      <ProjectEditDialog
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v)
          if (!v) setEditProject(null)
        }}
        clients={clients}
        project={editProject}
        onSubmit={handleUpdate}
      />

      <ProjectDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        target={deleteTarget}
        onConfirm={handleDelete}
        onError={(msg) => setError(msg)}
      />
    </div>
  )
}
