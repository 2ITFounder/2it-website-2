"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog"
import { Label } from "@/src/components/ui/label"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { ClientRow, ProjectStatus, STATUS_LABEL, extractErrorMessage } from "../_lib/projects.types"
import { useEffect, useState } from "react"

export function ProjectCreateDialog({
  open,
  onOpenChange,
  clients,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  clients: ClientRow[]
  onSubmit: (payload: {
    client_id: string
    title: string
    description: string | null
    status: ProjectStatus
    due_date: string | null
  }) => Promise<void>
}) {
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [clientId, setClientId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<ProjectStatus>("LEAD")
  const [dueDate, setDueDate] = useState("")

  useEffect(() => {
    if (!open) return
    setCreateError(null)
    setClientId(clients[0]?.id ?? "")
    setTitle("")
    setDescription("")
    setStatus("LEAD")
    setDueDate("")
  }, [open, clients])

  const submit = async () => {
    setCreateError(null)
    if (!clientId) return setCreateError("Seleziona un cliente")
    if (!title.trim() || title.trim().length < 2) return setCreateError("Il titolo deve essere di almeno 2 caratteri")

    setCreating(true)
    try {
      await onSubmit({
        client_id: clientId,
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        status,
        due_date: dueDate.trim() ? dueDate.trim() : null,
      })
      onOpenChange(false)
    } catch (e: any) {
      setCreateError(extractErrorMessage(e) || "Errore di rete. Riprova.")
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuovo Progetto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <select
              className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
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
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es. Gestionale Ristorante" />
          </div>

          <div className="space-y-2">
            <Label>Descrizione</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nota breve (opzionale)"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Stato</Label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
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
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          {createError && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{createError}</div>}
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Annulla
          </Button>
          <Button className="glow-button" onClick={submit} disabled={creating}>
            {creating ? "Creazione..." : "Crea Progetto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
