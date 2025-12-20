"use client"

import { RefreshCw } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Switch } from "@/src/components/ui/switch"

type ExpensesQueryShape = {
  refetch: () => void
  isFetching: boolean
}

type Props = {
  openCreate: () => void
  onlyActive: boolean
  setOnlyActive: (value: boolean) => void
  expensesQuery: ExpensesQueryShape
  topError: string | null
}

export function ExpensesHeader({ openCreate, onlyActive, setOnlyActive, expensesQuery, topError }: Props) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Spese</h1>
          <p className="text-muted-foreground">Abbonamenti e costi ricorrenti della gestione</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Button size="sm" onClick={openCreate}>
            Nuova spesa
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={onlyActive} onCheckedChange={(v: boolean) => setOnlyActive(Boolean(v))} id="only-active" />
            <label htmlFor="only-active">Mostra solo attive</label>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => expensesQuery.refetch()}
            disabled={expensesQuery.isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${expensesQuery.isFetching ? "animate-spin" : ""}`} />
            Aggiorna
          </Button>
        </div>
      </div>

      {topError && <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{topError}</div>}
    </>
  )
}
