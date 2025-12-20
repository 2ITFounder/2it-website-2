"use client"

import type { Expense, ExpenseCycle } from "@/src/lib/expenses/schema"
import type { CycleStatus } from "../_lib/constants"
import { cadenceLabel, cycleStatusClass } from "../_lib/constants"
import { formatCurrency, formatDate } from "../_lib/formatters"
import { Button } from "@/src/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { XCircle } from "lucide-react"

type Props = {
  isOpen: boolean
  closeDetail: () => void
  selectedExpense: Expense | null
  actionError: string | null
  cyclesQuery: {
    isFetching: boolean
    error: unknown
  }
  cycles: ExpenseCycle[]
  nextPending: ExpenseCycle | null
  payMutation: {
    isPending: boolean
    mutate: (args: { cycleId: string; expenseId: string }) => void
  }
  extractErrorMessage: (err: unknown) => string | null | undefined
}

export function ExpenseDetailDialog({
  isOpen,
  closeDetail,
  selectedExpense,
  actionError,
  cyclesQuery,
  cycles,
  nextPending,
  payMutation,
  extractErrorMessage,
}: Props) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) closeDetail()
      }}
    >
      <DialogContent
        className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-4xl max-h-[calc(100dvh-2rem)] overflow-y-auto overflow-x-hidden p-4 sm:p-6"
        aria-describedby="expense-detail-description"
        onOpenAutoFocus={(e: Event) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{selectedExpense?.name ?? "Spesa"}</DialogTitle>
          <p id="expense-detail-description" className="text-sm text-muted-foreground">
            Dettaglio spesa, note e cicli di pagamento
          </p>
        </DialogHeader>

        {selectedExpense ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted/60">
                <p className="text-xs text-muted-foreground">Vendor</p>
                <p className="font-medium">{selectedExpense.vendor || "-"}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/60">
                <p className="text-xs text-muted-foreground">Categoria</p>
                <p className="font-medium">{selectedExpense.category || "-"}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/60">
                <p className="text-xs text-muted-foreground">Cadenza</p>
                <p className="font-medium">
                  {cadenceLabel[selectedExpense.cadence]} - Prossimo {formatDate(selectedExpense.next_due_date)}
                </p>
              </div>
            </div>

            {selectedExpense.notes ? (
              <div className="p-3 rounded-lg bg-muted/60">
                <p className="text-xs text-muted-foreground mb-1">Note</p>
                <p className="text-sm whitespace-pre-wrap">{selectedExpense.notes}</p>
              </div>
            ) : null}

            {selectedExpense.tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {selectedExpense.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded-full bg-muted text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            {actionError && (
              <div className="pl-3 pr-3 py-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="border rounded-lg divide-y">
              <div className="px-3 py-2 bg-muted/40 font-semibold text-sm">Cicli di pagamento</div>

              {cyclesQuery.isFetching ? (
                <div className="p-4 text-sm text-muted-foreground">Caricamento cicli...</div>
              ) : cyclesQuery.error ? (
                <div className="p-4 text-sm text-destructive">
                  {extractErrorMessage(cyclesQuery.error) ?? "Errore nel caricare i cicli"}
                </div>
              ) : cycles.length ? (
                <>
                  {!nextPending ? (
                    <div className="p-3 text-sm text-muted-foreground">Nessun ciclo pending da pagare.</div>
                  ) : null}

                  {cycles.map((cycle: ExpenseCycle) => {
                    const due = new Date(`${cycle.due_date}T00:00:00`)
                    const isLate = cycle.status === "pending" && due.getTime() < Date.now()
                    const normalizedStatus: CycleStatus = (isLate ? "late" : cycle.status) as CycleStatus
                    const isNextPending = nextPending && nextPending.id === cycle.id && cycle.status === "pending"

                    return (
                      <div
                        key={cycle.id}
                        className="px-3 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                      >
                        <div>
                          <p className="font-medium">{formatDate(cycle.due_date)}</p>
                          <p className="text-sm text-muted-foreground">
                            Importo: {formatCurrency(cycle.amount, selectedExpense.currency)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${cycleStatusClass[normalizedStatus]}`}>
                            {normalizedStatus === "late"
                              ? "In ritardo"
                              : normalizedStatus === "paid"
                                ? "Pagato"
                                : "Da pagare"}
                          </span>

                          {cycle.paid_at ? (
                            <span className="text-xs text-muted-foreground">
                              Pagato il {formatDate(cycle.paid_at?.slice(0, 10))}
                            </span>
                          ) : null}

                          {isNextPending ? (
                            <Button
                              size="sm"
                              disabled={payMutation.isPending}
                              onClick={() => payMutation.mutate({ cycleId: cycle.id, expenseId: cycle.expense_id })}
                            >
                              {payMutation.isPending ? "Aggiorno..." : "Segna come pagata"}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </>
              ) : (
                <div className="p-4 text-sm text-muted-foreground">Nessun ciclo disponibile.</div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
