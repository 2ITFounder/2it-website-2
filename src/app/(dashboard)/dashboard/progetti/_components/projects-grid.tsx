"use client"

import { ProjectRow } from "../_lib/projects.types"
import { ProjectCard } from "./project-card"

export function ProjectsGrid({
  loading,
  projects,
  clientNameById,
  onEdit,
  onDelete,
  onOpenDetail,
}: {
  loading: boolean
  projects: ProjectRow[]
  clientNameById: (clientId: string) => string
  onEdit: (p: ProjectRow) => void
  onDelete: (p: ProjectRow) => void
  onOpenDetail: (p: ProjectRow) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {loading ? (
        <div className="text-muted-foreground">Caricamento...</div>
      ) : projects.length === 0 ? (
        <div className="text-muted-foreground">Nessun progetto trovato.</div>
      ) : (
        projects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            clientName={clientNameById(p.client_id)}
            onEdit={onEdit}
            onDelete={onDelete}
            onOpenDetail={onOpenDetail}
          />
        ))
      )}
    </div>
  )
}
