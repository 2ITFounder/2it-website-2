"use client"

import { ChangeEvent } from "react"
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { Label } from "@/src/components/ui/label"
import { taskBorder, taskStatusPill } from "../../../app/(dashboard)/dashboard/progetti/_lib/ui"
import type { Task, TaskStatus, TaskPatch } from "../../../app/(dashboard)/dashboard/progetti/_lib/types"
import type { QueryClient } from "@tanstack/react-query"

export function TaskRow(props: {
  t: Task
  idx: number
  total: number
  projectId: string
  qc: QueryClient
  weightDrafts: Record<string, string>
  setWeightDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onPatch: (id: string, payload: TaskPatch) => void
  onMove: (id: string, dir: "UP" | "DOWN") => void
  onAskDelete: (t: Task) => void
  enableMove: boolean
}) {
  const { t, idx, total, projectId, qc, weightDrafts, setWeightDrafts, onPatch, onMove, onAskDelete, enableMove } = props

  return (
    <div className={`rounded-lg border bg-background p-4 shadow-sm ${taskBorder(t.status)}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <Textarea
            rows={2}
            value={t.title}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
              const v = e.target.value
              qc.setQueryData<Task[]>(["tasks", projectId], (prev) => (prev ?? []).map((x) => (x.id === t.id ? { ...x, title: v } : x)))
            }}
            onBlur={(e: ChangeEvent<HTMLTextAreaElement>) => onPatch(t.id, { title: e.target.value })}
            className="font-medium leading-snug break-words whitespace-pre-wrap resize-none min-h-[52px]"
          />

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-6 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <Label>Status</Label>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${taskStatusPill(t.status)}`}>{t.status}</span>
              </div>

              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={t.status}
                onChange={(e) => {
                  const nextStatus = e.target.value as TaskStatus
                  qc.setQueryData<Task[]>(["tasks", projectId], (prev) =>
                    (prev ?? []).map((x) => (x.id === t.id ? { ...x, status: nextStatus } : x))
                  )
                  onPatch(t.id, { status: nextStatus })
                }}
              >
                <option value="TODO">TODO</option>
                <option value="DOING">DOING</option>
                <option value="DONE">DONE</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label>Peso</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={weightDrafts[t.id] ?? String(t.weight ?? "")}
                onChange={(e) => {
                  const raw = e.target.value
                  if (raw === "" || /^\d+$/.test(raw)) {
                    setWeightDrafts((prev) => ({ ...prev, [t.id]: raw }))
                  }
                }}
                onBlur={() => {
                  const draft = weightDrafts[t.id]
                  const parsed = Math.min(100, Math.max(1, parseInt(draft ?? String(t.weight ?? "1"), 10) || 1))

                  qc.setQueryData<Task[]>(["tasks", projectId], (prev) => (prev ?? []).map((x) => (x.id === t.id ? { ...x, weight: parsed } : x)))

                  setWeightDrafts((prev) => {
                    const next = { ...prev }
                    delete next[t.id]
                    return next
                  })

                  onPatch(t.id, { weight: parsed })
                }}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label>Scadenza</Label>
              <Input type="date" value={t.due_date ?? ""} onChange={(e) => onPatch(t.id, { due_date: e.target.value || null })} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onMove(t.id, "UP")}
            disabled={!enableMove || idx === 0}
            title={enableMove ? "Sposta su" : "Disponibile solo con ordine Predefinito"}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onMove(t.id, "DOWN")}
            disabled={!enableMove || idx === total - 1}
            title={enableMove ? "Sposta giu" : "Disponibile solo con ordine Predefinito"}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button variant="destructive" size="icon" onClick={() => onAskDelete(t)} title="Elimina">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
