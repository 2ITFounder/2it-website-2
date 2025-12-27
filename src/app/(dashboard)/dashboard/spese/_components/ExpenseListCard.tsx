"use client"

import type { ChangeEvent } from "react"
import { Search } from "lucide-react"
import { GlassCard } from "@/src/components/ui-custom/glass-card"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { Switch } from "@/src/components/ui/switch"

import type { Expense } from "@/src/lib/expenses/schema"
import type { ExpenseUser } from "../_lib/types"
import { cadenceLabel, statusClass } from "../_lib/constants"
import { formatCurrency, formatDate } from "../_lib/formatters"

type ExpensesQueryShape = {
  isLoading: boolean
  isFetching: boolean
  refetch: () => void
}

type DeleteMutationShape = {
  mutate: (id: string) => void
}

type ToggleActiveMutationShape = {
  mutate: (args: { id: string; active: boolean }) => void
}

type Props = {
  expensesQuery: ExpensesQueryShape
  visibleExpenses: Expense[]
  query: string
  setQuery: (value: string) => void
  openDetail: (expense: Expense) => void
  openEdit: (expense: Expense) => void
  deleteMutation: DeleteMutationShape
  toggleActiveMutation: ToggleActiveMutationShape
  expenseUsers: ExpenseUser[]
}

export function ExpenseListCard({
  expensesQuery,
  visibleExpenses,
  query,
  setQuery,
  openDetail,
  openEdit,
  deleteMutation,
  toggleActiveMutation,
  expenseUsers,
}: Props) {
  const userLabelById = new Map(
    expenseUsers.map((user) => [user.user_id, user.username || user.email || user.user_id])
  )
  const labelForUser = (userId?: string | null) => (userId ? userLabelById.get(userId) || userId : null)

  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="border-b px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Totale spese</p>
          <p className="text-xl font-semibold">{expensesQuery.isLoading ? "..." : visibleExpenses.length}</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per nome, vendor, categoria, tag..."
            className="pl-10"
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* MOBILE: cards */}
      <div className="md:hidden divide-y">
        {expensesQuery.isLoading ? (
          <div className="p-4 text-muted-foreground text-sm">Caricamento...</div>
        ) : visibleExpenses.length === 0 ? (
          <div className="p-4 text-muted-foreground text-sm">Nessuna spesa trovata.</div>
        ) : (
          visibleExpenses.map((exp: Expense) => (
            <div key={exp.id} className={`p-4 space-y-3 ${exp.active ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium truncate">{exp.name}</p>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {exp.expense_scope === "personal"
                        ? `Personale${labelForUser(exp.personal_user_id) ? " · " + labelForUser(exp.personal_user_id) : ""}`
                        : "Comune"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{exp.vendor || "-"}</p>
                  {exp.tags?.length ? (
                    <p className="text-xs text-muted-foreground truncate">Tag: {exp.tags.join(", ")}</p>
                  ) : null}
                </div>

                <span
                  className={[
                    "shrink-0 inline-flex items-center justify-center",
                    "px-2 py-0.5 rounded-full text-[11px] font-medium",
                    "max-w-[90px] truncate",
                    exp.active ? statusClass.active : statusClass.inactive,
                  ].join(" ")}
                  title={exp.active ? "Attiva" : "Non attiva"}
                >
                  {exp.active ? "Attiva" : "Non attiva"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Categoria</p>
                  <p className="truncate">{exp.category || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cadenza</p>
                  <p className="truncate">{cadenceLabel[exp.cadence]}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prossimo rinnovo</p>
                  <p className="truncate">{formatDate(exp.next_due_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Importo</p>
                  <p className="font-semibold truncate">{formatCurrency(exp.amount, exp.currency)}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => openDetail(exp)}>
                  Dettagli
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(exp)}>
                  Modifica
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Eliminare questa spesa?")) deleteMutation.mutate(exp.id)
                  }}
                >
                  Elimina
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP: tabella */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[1000px]">
          <div className="grid grid-cols-[2fr,1.2fr,1fr,1fr,1fr,1fr,1fr,1fr] px-4 py-3 text-xs uppercase text-muted-foreground tracking-wide bg-muted/40">
            <span>Nome</span>
            <span>Vendor</span>
            <span>Categoria</span>
            <span>Cadenza</span>
            <span>Prossimo rinnovo</span>
            <span>Importo</span>
            <span>Stato</span>
            <span>Azioni</span>
          </div>

          {expensesQuery.isLoading ? (
            <div className="p-4 text-muted-foreground text-sm">Caricamento...</div>
          ) : visibleExpenses.length === 0 ? (
            <div className="p-4 text-muted-foreground text-sm">Nessuna spesa trovata.</div>
          ) : (
            visibleExpenses.map((exp: Expense) => (
              <div
                key={exp.id}
                className={`grid grid-cols-[2fr,1.2fr,1fr,1fr,1fr,1fr,1fr,1fr] px-4 py-3 items-center border-t border-border/50 hover:bg-muted/30 transition ${
                  exp.active ? "" : "opacity-60"
                }`}
              >
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{exp.name}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {exp.expense_scope === "personal"
                        ? `Personale${labelForUser(exp.personal_user_id) ? " · " + labelForUser(exp.personal_user_id) : ""}`
                        : "Comune"}
                    </span>
                  </div>
                  {exp.tags?.length ? (
                    <span className="text-xs text-muted-foreground truncate">Tag: {exp.tags.join(", ")}</span>
                  ) : null}
                </div>
                <span className="text-sm text-muted-foreground">{exp.vendor || "-"}</span>
                <span className="text-sm text-muted-foreground">{exp.category || "-"}</span>
                <span className="text-sm font-medium">{cadenceLabel[exp.cadence]}</span>
                <span className="text-sm text-muted-foreground">{formatDate(exp.next_due_date)}</span>
                <span className="text-sm font-semibold">{formatCurrency(exp.amount, exp.currency)}</span>

                <div className="flex items-center gap-2">
                  <span
                    className={[
                      "text-xs px-2 py-1 rounded-full text-center inline-flex items-center justify-center",
                      "max-w-[110px] truncate",
                      exp.active ? statusClass.active : statusClass.inactive,
                    ].join(" ")}
                    title={exp.active ? "Attiva" : "Non attiva"}
                  >
                    {exp.active ? "Attiva" : "Non attiva"}
                  </span>

                  <Switch
                    checked={Boolean(exp.active)}
                    onCheckedChange={(v: boolean) => toggleActiveMutation.mutate({ id: exp.id, active: v })}
                    aria-label="Attiva/Disattiva"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openDetail(exp)}>
                    Dettagli
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(exp)}>
                    Modifica
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm("Eliminare questa spesa?")) deleteMutation.mutate(exp.id)
                    }}
                  >
                    Elimina
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </GlassCard>
  )
}
