"use client"

import { RefreshCw } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Switch } from "@/src/components/ui/switch"
import type { ExpenseUser } from "../_lib/types"

type ExpensesQueryShape = {
  refetch: () => void
  isFetching: boolean
}

type UsersQueryShape = {
  isLoading: boolean
  isFetching: boolean
  refetch: () => void
  error: unknown
}

type Props = {
  openCreate: () => void
  onlyActive: boolean
  setOnlyActive: (value: boolean) => void
  expensesQuery: ExpensesQueryShape
  topError: string | null
  userError: string | null
  usersQuery: UsersQueryShape
  expenseUsers: ExpenseUser[]
  updateUserMutation: {
    isPending: boolean
    mutate: (args: { userId: string; includeInExpenses: boolean }) => void
  }
}

function formatUserLabel(user: ExpenseUser) {
  return user.username || user.email || user.user_id
}

export function ExpensesHeader({
  openCreate,
  onlyActive,
  setOnlyActive,
  expensesQuery,
  topError,
  userError,
  usersQuery,
  expenseUsers,
  updateUserMutation,
}: Props) {
  const includedCount = expenseUsers.filter((user) => user.include_in_expenses).length

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

      <div className="mt-4 rounded-lg border bg-background/60 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">Utenti inclusi nelle spese</p>
            <p className="text-xs text-muted-foreground">Seleziona chi partecipa ai calcoli e alle spese personali</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => usersQuery.refetch()}
            disabled={usersQuery.isFetching}
          >
            Aggiorna utenti
          </Button>
        </div>

        {usersQuery.isLoading ? (
          <div className="mt-3 text-sm text-muted-foreground">Caricamento utenti...</div>
        ) : expenseUsers.length === 0 ? (
          <div className="mt-3 text-sm text-muted-foreground">Nessun utente disponibile.</div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-4">
            {expenseUsers.map((user) => (
              <label key={user.user_id} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch
                  checked={user.include_in_expenses}
                  onCheckedChange={(value: boolean) =>
                    updateUserMutation.mutate({ userId: user.user_id, includeInExpenses: Boolean(value) })
                  }
                  disabled={updateUserMutation.isPending}
                />
                <span>{formatUserLabel(user)}</span>
              </label>
            ))}
          </div>
        )}

        {includedCount === 0 ? (
          <div className="mt-3 text-xs text-destructive">Nessun utente inserito nelle spese.</div>
        ) : null}

        {usersQuery.error ? (
          <div className="mt-3 text-xs text-destructive">Errore nel caricamento degli utenti.</div>
        ) : null}

        {userError ? <div className="mt-3 text-xs text-destructive">{userError}</div> : null}
      </div>
    </>
  )
}
