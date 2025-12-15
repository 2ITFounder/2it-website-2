"use client"

import { useMemo, useState } from "react"
import { Search, Mail, Phone, MessageSquare, Trash2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useContacts } from "@/src/hooks/useContacts"
import { GlassCard } from "@/src/components/ui-custom/glass-card"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog"

type Contact = {
  id: string
  name: string
  email: string
  phone: string | null
  service: string | null
  message: string
  created_at: string
}

const extractErrorMessage = (err: any) => {
  if (!err) return null
  if (typeof err === "string") return err
  if (typeof err?.message === "string") return err.message
  return "Si e verificato un errore"
}

export default function ContattiPage() {
  const [query, setQuery] = useState("")
  const qc = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { data = [], isLoading, error } = useContacts()

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data as Contact[]).filter((c) => {
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.service ?? "").toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q)
      )
    })
  }, [data, query])

  const errorMsg = extractErrorMessage(error)
  const topError = errorMsg

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contatti</h1>
          <p className="text-muted-foreground">Richieste inviate dal form pubblico</p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per nome, email, testo..."
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {topError && <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{topError}</div>}

      <GlassCard className="overflow-hidden p-0">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Totale contatti</p>
            <p className="text-xl font-semibold">{isLoading ? "..." : rows.length}</p>
          </div>
          <div className="text-sm text-muted-foreground">{isLoading ? "Caricamento..." : "Aggiornato ora"}</div>
        </div>

        <div className="divide-y">
          {isLoading ? (
            <div className="p-4 text-muted-foreground text-sm">Caricamento...</div>
          ) : rows.length === 0 ? (
            <div className="p-4 text-muted-foreground text-sm">Nessun contatto trovato.</div>
          ) : (
            rows.map((c) => {
              const created = c.created_at ? new Date(c.created_at) : null
              const createdLabel = created ? created.toLocaleString() : "N/D"

              return (
                <div key={c.id} className="p-4 hover:bg-muted/40 transition">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold leading-tight break-words">{c.name}</p>
                        <span className="text-xs text-muted-foreground">{createdLabel}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {c.email}
                        </span>
                        {c.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {c.phone}
                          </span>
                        ) : null}
                        {c.service ? (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {c.service}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
                        {c.message}
                      </p>
                    </div>
                    <div className="flex sm:flex-col gap-2 sm:items-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setDeleteTarget(c)
                          setDeleteOpen(true)
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Elimina
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </GlassCard>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(v) => {
          setDeleteOpen(v)
          if (!v) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare contatto?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Stai per eliminare "${deleteTarget.name}". Questa azione non puo essere annullata.`
                : "Questa azione non puo essere annullata."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={async (e) => {
                e.preventDefault()
                if (!deleteTarget) return
                setDeleting(true)
                try {
                  const res = await fetch(`/api/contacts?id=${encodeURIComponent(deleteTarget.id)}`, { method: "DELETE" })
                  const json = await res.json().catch(() => ({}))
                  if (!res.ok) throw new Error(json?.error ?? "Errore eliminazione contatto")
                  setDeleteOpen(false)
                  setDeleteTarget(null)
                  await qc.invalidateQueries({ queryKey: ["contacts"] })
                } catch (err: any) {
                  alert(err?.message || "Errore di rete")
                } finally {
                  setDeleting(false)
                }
              }}
            >
              {deleting ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
