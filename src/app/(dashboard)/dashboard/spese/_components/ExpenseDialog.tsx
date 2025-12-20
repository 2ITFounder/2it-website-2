"use client"

import type { ChangeEvent, Dispatch, SetStateAction } from "react"
import type { Expense } from "@/src/lib/expenses/schema"
import { Button } from "@/src/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { Input } from "@/src/components/ui/input"
import { Switch } from "@/src/components/ui/switch"

type ExpenseFormState = {
  name: string
  vendor: string
  category: string
  cadence: Expense["cadence"]
  amount: number
  currency: string
  active: boolean
  next_due_date: string
  tags: string
  notes: string
}


type Props = {
  editOpen: boolean
  closeEdit: () => void
  editingExpense: null | { id: string }
  form: ExpenseFormState
  setForm: Dispatch<SetStateAction<ExpenseFormState>>
  createMutation: {
    mutate: () => void
    isPending: boolean
  }
  updateMutation: {
    mutate: () => void
    isPending: boolean
  }
}


export function ExpenseDialog({
  editOpen,
  closeEdit,
  editingExpense,
  form,
  setForm,
  createMutation,
  updateMutation,
}: Props) {
  return (
    <Dialog
      open={editOpen}
      onOpenChange={(open: boolean) => {
        if (!open) closeEdit()
      }}
    >
      <DialogContent
        className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto overflow-x-hidden p-4 sm:p-6"
        onOpenAutoFocus={(e: Event) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{editingExpense ? "Modifica spesa" : "Nuova spesa"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground">Nome</label>
            <Input
              value={form.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Vendor</label>
            <Input
              value={form.vendor}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, vendor: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Categoria</label>
            <Input
              value={form.category}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, category: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Cadenza</label>
            <select
              className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              value={form.cadence}
              onChange={(e) => setForm((p) => ({ ...p, cadence: e.target.value as Expense["cadence"] }))}
            >
              <option value="monthly">Mensile</option>
              <option value="yearly">Annuale</option>
              <option value="one_time">Una tantum</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Importo</label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, amount: Number(e.target.value) }))}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Valuta</label>
            <Input
              value={form.currency}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, currency: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Prossima scadenza</label>
            <Input
              type="date"
              value={form.next_due_date}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, next_due_date: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Tags</label>
            <Input
              value={form.tags}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, tags: e.target.value }))}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground">Note</label>
            <textarea
              className="w-full min-h-24 rounded-md border bg-background px-3 py-2 text-sm"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>

          <div className="sm:col-span-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch
                checked={form.active}
                onCheckedChange={(v: boolean) => setForm((p) => ({ ...p, active: Boolean(v) }))}
                id="form-active"
              />
              <label htmlFor="form-active">Attiva</label>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={closeEdit}>
                Annulla
              </Button>

              <Button
                onClick={() => {
                  if (editingExpense) updateMutation.mutate()
                  else createMutation.mutate()
                }}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingExpense
                  ? updateMutation.isPending
                    ? "Salvo..."
                    : "Salva"
                  : createMutation.isPending
                    ? "Creo..."
                    : "Crea"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
