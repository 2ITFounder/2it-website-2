"use client"

import { Calendar, MoreHorizontal } from "lucide-react"
import { GlassCard } from "@/src/components/ui-custom/glass-card"
import { Button } from "@/src/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu"

import { ProjectRow, STATUS_LABEL, clampProgress, formatDueDate, statusPillClasses } from "../_lib/projects.types"

export function ProjectCard({
  project,
  clientName,
  onEdit,
  onDelete,
  onOpenDetail, 
}: {
  project: ProjectRow
  clientName: string
  onEdit: (p: ProjectRow) => void
  onDelete: (p: ProjectRow) => void
  onOpenDetail: (p: ProjectRow) => void
}) {
  const statusLabel = STATUS_LABEL[project.status] ?? project.status
  const progress = clampProgress(project.progress)
  const deadline = formatDueDate(project.due_date)

  return (
    <GlassCard hover>
      <div
        className="cursor-pointer"
        onClick={() => onOpenDetail(project)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onOpenDetail(project)} 
      >
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0">
            <h3
              className="font-semibold leading-tight break-words whitespace-pre-line text-foreground"
              tabIndex={0}
              title={project.title}
            >
              {project.title}
            </h3>
            <p className="text-sm text-muted-foreground">{clientName}</p>
          </div>

          {/* fermiamo il click per non aprire il dettaglio */}
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(project)}>Modifica</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(project)}
                  className="text-destructive focus:text-destructive"
                >
                  Elimina
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Calendar className="w-4 h-4" />
          {deadline}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progresso</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <span className={`text-xs px-2 py-1 rounded-full ${statusPillClasses(statusLabel)}`}>{statusLabel}</span>
        </div>
      </div>
    </GlassCard>
  )
}
