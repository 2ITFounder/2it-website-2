"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog"
import { Label } from "@/src/components/ui/label"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"

import {
  ClientRow,
  ProjectRow,
  ProjectStatus,
  STATUS_LABEL,
  extractErrorMessage,
} from "../_lib/projects.types"

export function ProjectEditDialog({
  open,
  onOpenChange,
  clients,
  project,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  clients: ClientRow[]
  project: ProjectRow | null
  onSubmit: (args: {
    id: string
    payload: {
      client_id: string
      title: string
      description: string | null
      status: ProjectStatus
      due_date: string | null
    }
  }) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [clientId, setClientId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<ProjectStatus>("LEAD")
  const [dueDate, setDueDate] = useState("")

  useEffect(() => {
    if (!open) return
    setErr(null)

    if (!project) return

    setClientId(project.client_id ?? clients[0]?.id ?? "")
    setTitle(project.title ?? "")
    setDescription(project.description ?? "")
    setStatus((project.status ?? "LEAD") as ProjectStatus)
    setDueDate(project.due_date ?? "")
  }, [open, project, clients])

  const submit = async () => {
    setErr(null)
    if (!project) return

    if (!clientId) return setErr("Seleziona un cliente")
    if (!title.trim() || title.trim().length < 2) return setErr("Il titolo deve essere di almeno 2 caratteri")

    setSaving(true)
    try {
      await onSubmit({
        id: project.id,
        payload: {
          client_id: clientId,
          title: title.trim(),
          description: description.trim() ? description.trim() : null,
          status,
          due_date: dueDate.trim() ? dueDate.trim() : null,
        },
      })
      onOpenChange(false)
    } catch (e: any) {
      setErr(extractErrorMessage(e) || "Errore di rete. Riprova.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifica Progetto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <select
              className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={!project}
            >
              <option value="" disabled>
                Seleziona cliente...
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Titolo *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={!project} />
          </div>

          <div className="space-y-2">
            <Label>Descrizione</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} disabled={!project} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Stato</Label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                disabled={!project}
              >
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Scadenza</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={!project}
              />
            </div>
          </div>

          {err && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{err}</div>}
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annulla
          </Button>
          <Button className="glow-button" onClick={submit} disabled={saving || !project}>
            {saving ? "Salvataggio..." : "Salva Modifiche"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
