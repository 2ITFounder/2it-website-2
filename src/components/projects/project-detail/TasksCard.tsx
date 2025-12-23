"use client"

import { useMemo, useState } from "react"
import { GlassCard } from "@/src/components/ui-custom/glass-card"
import { Button } from "@/src/components/ui/button"
import type { Task, TaskPatch, TaskStatus } from "../../../app/(dashboard)/dashboard/progetti/_lib/types"
import type { QueryClient } from "@tanstack/react-query"
import { TaskRow } from "./TaskRow"

type SortMode = "DEFAULT" | "CREATED_AT" | "WEIGHT"

type IndexedTask = {
  t: Task
  index: number
}

function parseDate(value?: string | null): number | null {
  if (!value) return null
  const ts = Date.parse(value)
  return Number.isNaN(ts) ? null : ts
}

export function TasksCard(props: {
  tasks: Task[]
  projectId: string
  qc: QueryClient
  weightDrafts: Record<string, string>
  setWeightDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onPatch: (id: string, payload: TaskPatch) => void
  onMove: (id: string, dir: "UP" | "DOWN") => void
  onAskDelete: (t: Task) => void
}) {
  const { tasks, projectId, qc, weightDrafts, setWeightDrafts, onPatch, onMove, onAskDelete } = props
  const [sortMode, setSortMode] = useState<SortMode>("DEFAULT")
  const [activeStatus, setActiveStatus] = useState<TaskStatus | null>("TODO")

  const indexed = useMemo<IndexedTask[]>(() => tasks.map((t, index) => ({ t, index })), [tasks])

  const sorted = useMemo<IndexedTask[]>(() => {
    if (sortMode === "DEFAULT") return indexed

    const next = [...indexed]
    if (sortMode === "CREATED_AT") {
      next.sort((a, b) => {
        const aTime = parseDate(a.t.created_at) ?? parseDate(a.t.updated_at)
        const bTime = parseDate(b.t.created_at) ?? parseDate(b.t.updated_at)

        if (aTime === null && bTime === null) return a.index - b.index
        if (aTime === null) return 1
        if (bTime === null) return -1
        if (aTime !== bTime) return bTime - aTime
        return a.index - b.index
      })
      return next
    }

    next.sort((a, b) => {
      const aWeight = Number(a.t.weight) || 0
      const bWeight = Number(b.t.weight) || 0
      if (aWeight !== bWeight) return bWeight - aWeight
      return a.index - b.index
    })
    return next
  }, [indexed, sortMode])

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, IndexedTask[]> = { TODO: [], DOING: [], DONE: [] }
    for (const item of sorted) {
      grouped[item.t.status].push(item)
    }
    return grouped
  }, [sorted])

  const columns: Array<{ status: TaskStatus; title: string }> = [
    { status: "TODO", title: "TO DO" },
    { status: "DOING", title: "DOING" },
    { status: "DONE", title: "DONE" },
  ]

  const statusButtonClasses: Record<TaskStatus, { active: string; inactive: string }> = {
    TODO: {
      active: "bg-gray-100 text-gray-900 border-gray-200 hover:bg-gray-100",
      inactive: "border-gray-200 text-gray-700 hover:bg-gray-50",
    },
    DOING: {
      active: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
      inactive: "border-blue-200 text-blue-700 hover:bg-blue-50",
    },
    DONE: {
      active: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
      inactive: "border-green-200 text-green-700 hover:bg-green-50",
    },
  }

  const enableMove = sortMode === "DEFAULT"

  return (
    <GlassCard>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold">Task</h2>
          <p className="text-sm text-muted-foreground">{tasks.length} totali</p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Ordina per</span>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
          >
            <option value="DEFAULT">Predefinito</option>
            <option value="CREATED_AT">Data creazione</option>
            <option value="WEIGHT">Peso</option>
          </select>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-muted-foreground text-sm">Nessuna task. Creane una per iniziare.</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {columns.map((col) => {
              const count = tasksByStatus[col.status].length
              const isActive = activeStatus === col.status
              return (
                <Button
                  key={col.status}
                  type="button"
                  variant="outline"
                  onClick={() => setActiveStatus(isActive ? null : col.status)}
                  className={`gap-2 ${isActive ? statusButtonClasses[col.status].active : statusButtonClasses[col.status].inactive}`}
                >
                  <span>{col.title}</span>
                  <span className={isActive ? "opacity-70" : "text-muted-foreground"}>({count})</span>
                </Button>
              )
            })}
          </div>

          {activeStatus === null ? (
            <div className="text-sm text-muted-foreground">Seleziona una categoria per vedere le task.</div>
          ) : tasksByStatus[activeStatus].length === 0 ? (
            <div className="text-sm text-muted-foreground">Nessuna task.</div>
          ) : (
            <div className="space-y-4">
              {tasksByStatus[activeStatus].map((item, idx) => (
                <TaskRow
                  key={item.t.id}
                  t={item.t}
                  idx={idx}
                  total={tasksByStatus[activeStatus].length}
                  projectId={projectId}
                  qc={qc}
                  weightDrafts={weightDrafts}
                  setWeightDrafts={setWeightDrafts}
                  onPatch={onPatch}
                  onMove={onMove}
                  onAskDelete={onAskDelete}
                  enableMove={enableMove}
                />
              ))}
            </div>
          )}
        </>
      )}
    </GlassCard>
  )
}
