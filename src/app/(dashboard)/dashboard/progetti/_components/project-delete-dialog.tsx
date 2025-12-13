"use client"

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
import { useState } from "react"
import { extractErrorMessage } from "../_lib/projects.types"

export function ProjectDeleteDialog({
  open,
  onOpenChange,
  target,
  onConfirm,
  onError,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  target: { id: string; title: string } | null
  onConfirm: (id: string) => Promise<void>
  onError?: (msg: string) => void
}) {
  const [deleting, setDeleting] = useState(false)

  const confirm = async () => {
    if (!target) return
    setDeleting(true)
    try {
      await onConfirm(target.id)
      onOpenChange(false)
    } catch (e: any) {
      const msg = extractErrorMessage(e) || "Errore di rete. Riprova."
      onError?.(msg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare progetto?</AlertDialogTitle>
          <AlertDialogDescription>
            {target
              ? `Stai per eliminare "${target.title}". Questa azione è definitiva.`
              : "Questa azione è definitiva."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Annulla</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              confirm()
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleting || !target}
          >
            {deleting ? "Eliminazione..." : "Elimina"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
