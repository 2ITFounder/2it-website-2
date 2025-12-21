"use client"

import { Search, Plus, MoreHorizontal } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { GlassCard } from "@/src/components/ui-custom/glass-card"
import { useMemo, useState, ReactNode } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useClients } from "@/src/hooks/useClients"
import Link from "next/link"
import { apiGet } from "@/src/lib/api"

// ⬇️ shadcn dialog + label
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/src/components/ui/dialog"
import { Label } from "@/src/components/ui/label"

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/src/components/ui/alert-dialog"

type ClientRow = {
  id: string
  name: string
  email: string | null
  status: "ATTIVO" | "INATTIVO" | string
  created_at?: string
  updated_at?: string
}

type CreateClientPayload = {
  name: string
  email?: string
  status?: "ATTIVO" | "INATTIVO"
}

const extractErrorMessage = (err: any) => {
  if (!err) return null
  if (typeof err === "string") return err
  if (typeof err?.message === "string") return err.message
  if (Array.isArray(err?.formErrors) && err.formErrors.length) return err.formErrors.join(", ")
  if (err?.fieldErrors && typeof err.fieldErrors === "object") {
    const msgs = Object.values(err.fieldErrors).flat().filter(Boolean) as string[]
    if (msgs.length) return msgs.join(", ")
  }
  return "Si è verificato un errore"
}

export default function ClientiPage() {
  const qc = useQueryClient()

  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [pageError, setPageError] = useState<ReactNode | null>(null)

  // Query (cache condivisa)
  const { data, isLoading, error } = useClients()
  const clients: ClientRow[] = useMemo(() => (Array.isArray(data) ? (data as ClientRow[]) : []), [data])
  const loading = isLoading
  const queryErrorMsg = extractErrorMessage(error)

  // Report clients (per conteggio progetti)
  const { data: clientReports = [] } = useQuery({
    queryKey: ["reports", "clients", "for-clients-page"],
    queryFn: ({ signal }) => apiGet<{ id: string; projectsTotal: number }[]>("/api/reports/clients", signal),
  })

  const projectsCountByClient = useMemo(() => {
    const map = new Map<string, number>()
    clientReports.forEach((r) => {
      if (r?.id) map.set(r.id, r.projectsTotal ?? 0)
    })
    return map
  }, [clientReports])

  // modal state
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState<CreateClientPayload>({
    name: "",
    email: "",
    status: "ATTIVO",
  })

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editClientId, setEditClientId] = useState<string | null>(null)
  const [confirmEditOpen, setConfirmEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<CreateClientPayload>({
    name: "",
    email: "",
    status: "ATTIVO",
  })

  const openEdit = (client: ClientRow) => {
    setPageError(null)
    setEditError(null)
    setEditClientId(client.id)
    setEditForm({
      name: client.name,
      email: client.email ?? "",
      status: (client.status === "INATTIVO" ? "INATTIVO" : "ATTIVO") as "ATTIVO" | "INATTIVO",
    })
    setEditOpen(true)
  }

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const askDelete = (client: ClientRow) => {
    setPageError(null)
    setDeleteTarget({ id: client.id, name: client.name })
    setDeleteOpen(true)
  }

  const confirmDeleteById = async (id: string) => {
    setDeleting(true)
    setPageError(null)

    try {
      const res = await fetch(`/api/clients?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        let errorMsg: ReactNode = extractErrorMessage(json?.error) || "Errore nell'eliminazione cliente"
        if (res.status === 409) {
          errorMsg = (
            <>
              {json?.error ?? "Impossibile eliminare il cliente: elimina prima i progetti associati gg."}{" "}
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="ml-2 whitespace-nowrap shadow-sm"
              >
                <Link href={`/dashboard/progetti?clientId=${encodeURIComponent(id)}`}> 
                  Vai ai progetti associati
                </Link>
              </Button>
            </>
          )
        }
        setPageError(errorMsg)
        return
      }

      await qc.invalidateQueries({ queryKey: ["clients"] }) 
    } catch {
      setPageError("Errore di rete. Riprova.")
    } finally {
      setDeleting(false)
    }
  }

  const submitUpdate = async () => {
    setEditError(null)
    if (!editClientId) return

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    if (!editForm.name || editForm.name.trim().length < 2) {
      setEditError("Il nome deve essere di almeno 2 caratteri")
      return
    }

    if (editForm.email?.trim() && !isValidEmail(editForm.email.trim())) {
      setEditError("Inserisci un'email valida")
      return
    }

    setEditing(true)
    try {
      const res = await fetch(`/api/clients?id=${encodeURIComponent(editClientId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email?.trim() || "",
          status: editForm.status || "ATTIVO",
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setEditError(extractErrorMessage(json?.error) || "Errore nella modifica cliente")
        return
      }

      setConfirmEditOpen(false)
      setEditOpen(false)
      setEditClientId(null)
      await qc.invalidateQueries({ queryKey: ["clients"] })
    } catch {
      setEditError("Errore di rete. Riprova.")
    } finally {
      setEditing(false)
    }
  }

  const onUpdate = () => {
    setEditError(null)
    setConfirmEditOpen(true)
  }

  const resetForm = () => {
    setCreateError(null)
    setForm({ name: "", email: "", status: "ATTIVO" })
  }

  const onCreate = async () => {
    setCreateError(null)
    setPageError(null)

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    if (!form.name || form.name.trim().length < 2) {
      setCreateError("Il nome deve essere di almeno 2 caratteri")
      return
    }

    if (form.email?.trim() && !isValidEmail(form.email.trim())) {
      setCreateError("Inserisci un'email valida")
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email?.trim() || "",
          status: form.status || "ATTIVO",
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCreateError(extractErrorMessage(json?.error) || "Errore nella creazione cliente")
        return
      }

      setOpen(false)
      resetForm()
      await qc.invalidateQueries({ queryKey: ["clients"] })
    } catch {
      setCreateError("Errore di rete. Riprova.")
    } finally {
      setCreating(false)
    }
  }

  // Filtri lato client (per ora)
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return clients.filter((c) => {
      const okQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)

      const okStatus = !statusFilter || c.status === statusFilter
      return okQ && okStatus
    })
  }, [clients, query, statusFilter])

  const topError = pageError || queryErrorMsg

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clienti</h1>
          <p className="text-muted-foreground">Gestisci i tuoi clienti e le loro informazioni</p>
        </div>

        <Dialog
          open={open}
          onOpenChange={(v: boolean) => {
            setOpen(v)
            if (v) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button className="glow-button">
              <Plus className="w-4 h-4 mr-2" />
              Nuovo Cliente
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nuovo Cliente</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client-name">Nome *</Label>
                <Input
                  id="client-name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Es. Mario Rossi SRL"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-email">Email</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="info@azienda.it"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-status">Stato</Label>
                <select
                  id="client-status"
                  className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "ATTIVO" | "INATTIVO" }))}
                >
                  <option value="ATTIVO">Attivo</option>
                  <option value="INATTIVO">Inattivo</option>
                </select>
              </div>

              {createError && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {createError}
                </div>
              )}
            </div>

            <DialogFooter className="mt-6 gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>
                Annulla
              </Button>
              <Button className="glow-button" onClick={onCreate} disabled={creating}>
                {creating ? "Creazione..." : "Crea Cliente"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={(v: boolean) => setEditOpen(v)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Modifica Cliente</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-client-name">Nome *</Label>
                <Input
                  id="edit-client-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-client-email">Email</Label>
                <Input
                  id="edit-client-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-client-status">Stato</Label>
                <select
                  id="edit-client-status"
                  className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                  value={editForm.status}
                  onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value as "ATTIVO" | "INATTIVO" }))}
                >
                  <option value="ATTIVO">Attivo</option>
                  <option value="INATTIVO">Inattivo</option>
                </select>
              </div>

              {editError && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {editError}
                </div>
              )}
            </div>

            <DialogFooter className="mt-6 gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editing}>
                Annulla
              </Button>
              <Button className="glow-button" onClick={onUpdate} disabled={editing}>
                {editing ? "Salvataggio..." : "Salva Modifiche"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={confirmEditOpen} onOpenChange={(v: boolean) => setConfirmEditOpen(v)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Conferma modifiche</DialogTitle>
            </DialogHeader>

            <p className="text-sm text-muted-foreground">Vuoi applicare le modifiche a questo cliente?</p>

            <DialogFooter className="mt-6 gap-2">
              <Button variant="outline" onClick={() => setConfirmEditOpen(false)} disabled={editing}>
                Annulla
              </Button>
              <Button className="glow-button" onClick={submitUpdate} disabled={editing}>
                {editing ? "Salvataggio..." : "Conferma"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cerca clienti..."
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {topError && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{topError}</div>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={(v: boolean) => {
        setDeleteOpen(v)
        if (!v) {
          setDeleteTarget(null)
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Stai per eliminare "${deleteTarget.name}". Questa azione è definitiva.`
                : "Questa azione è definitiva."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDeleteOpen(false)
                const id = deleteTarget?.id
                setDeleteTarget(null)
                if (id) void confirmDeleteById(id)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Nome</th>
                <th className="text-left p-4 font-medium">Email</th>
                <th className="text-left p-4 font-medium">Progetti</th>
                <th className="text-left p-4 font-medium">Stato</th>
                <th className="text-right p-4 font-medium">Azioni</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4 text-muted-foreground" colSpan={5}>
                    Caricamento...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="p-4 text-muted-foreground" colSpan={5}>
                    Nessun cliente trovato.
                  </td>
                </tr>
              ) : (
                rows.map((client) => {
                  const isActive = client.status === "ATTIVO" || client.status === "Attivo"
                  const projectsCount = projectsCountByClient.get(client.id) ?? 0
                  return (
                    <tr key={client.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-4 font-medium">{client.name}</td>
                      <td className="p-4 text-muted-foreground">{client.email ?? "—"}</td>
                      <td className="p-4">{projectsCount}</td>
                      <td className="p-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {isActive ? "Attivo" : "Inattivo"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(client)}>Modifica</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => askDelete(client)}
                              className="text-destructive focus:text-destructive"
                            >
                              Elimina
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
