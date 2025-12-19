"use client"

import { useMemo, useState } from "react"
import { CalendarDays, CheckCircle2, CreditCard, RefreshCw, Search, XCircle } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { GlassCard } from "@/src/components/ui-custom/glass-card"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { Switch } from "@/src/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"

import { Expense, ExpenseCycle } from "@/src/lib/expenses/schema"
import { apiGetExpenseCycles, apiGetExpenses, apiPayExpenseCycle, extractErrorMessage } from "./_lib/expenses.api"

const cadenceLabel: Record<Expense["cadence"], string> = {
  monthly: "Mensile",
  yearly: "Annuale",
  one_time: "Una tantum",
}

const statusClass: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-200 text-slate-700",
}

const cycleStatusClass: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  late: "bg-red-100 text-red-800",
  paid: "bg-emerald-100 text-emerald-800",
}

const formatCurrency = (amount: number, currency?: string) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)

const formatDate = (value?: string | null) => {
  if (!value) return "N/D"
  const d = new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })
}

const computeBaseMonthly = (expense: Expense) => {
  if (expense.cadence === "monthly") return expense.amount
  if (expense.cadence === "yearly") return expense.amount / 12
  return 0
}

const computeSplitPercentages = (expense: Expense): [number, number] => {
  if (expense.split_mode === "custom" && expense.split_custom && Object.keys(expense.split_custom).length > 0) {
    const entries = Object.entries(expense.split_custom)
    const myRaw = entries[0]?.[1]
    const colleagueRaw = entries[1]?.[1]
    const myPct = typeof myRaw === "number" ? Math.max(0, Math.min(100, myRaw)) : 50
    const colleaguePct =
      typeof colleagueRaw === "number" ? Math.max(0, Math.min(100, colleagueRaw)) : Math.max(0, 100 - myPct)
    const total = myPct + colleaguePct
    if (total > 0 && total !== 100) {
      return [Math.round((myPct / total) * 100), Math.round((colleaguePct / total) * 100)]
    }
    return [myPct, colleaguePct]
  }
  return [50, 50]
}

export default function ExpensesPage() {
  const qc = useQueryClient()
  const [query, setQuery] = useState("")
  const [onlyActive, setOnlyActive] = useState(true)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const expensesQuery = useQuery({
    queryKey: ["expenses", { active: onlyActive }],
    queryFn: ({ signal }) => apiGetExpenses(onlyActive, signal),
  })

  const cyclesQuery = useQuery({
    queryKey: ["expense-cycles", selectedExpense?.id],
    queryFn: ({ signal }) => {
      if (!selectedExpense?.id) return []
      return apiGetExpenseCycles(selectedExpense.id, signal)
    },
    enabled: Boolean(selectedExpense?.id),
  })
  const cycles = (cyclesQuery.data as ExpenseCycle[] | undefined) ?? []
  const nextPending = useMemo(() => {
    const pending = cycles.filter((c) => c.status === "pending")
    if (pending.length === 0) return null
    return pending.reduce((earliest, current) => {
      return earliest && earliest.due_date <= current.due_date ? earliest : current
    })
  }, [cycles])

  const payMutation = useMutation({
    mutationFn: async (payload: { cycleId: string; expenseId?: string }) => {
      setActionError(null)
      return apiPayExpenseCycle(payload.cycleId)
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["expenses"] }),
        variables.expenseId ? qc.invalidateQueries({ queryKey: ["expense-cycles", variables.expenseId] }) : Promise.resolve(),
      ])
    },
    onError: (err: any) => {
      const msg = extractErrorMessage(err)
      const normalized = (msg ?? "").toLowerCase()
      if (normalized.includes("already paid")) {
        setActionError("Questo ciclo e gia stato pagato")
      } else {
        setActionError(msg)
      }
    },
  })

  const expenses = expensesQuery.data ?? []

  const visibleExpenses = useMemo(() => {
    const list = onlyActive ? expenses.filter((e) => e.active) : expenses
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((e) => {
      const tags = (e.tags ?? []).join(" ").toLowerCase()
      return (
        e.name.toLowerCase().includes(q) ||
        (e.vendor ?? "").toLowerCase().includes(q) ||
        (e.category ?? "").toLowerCase().includes(q) ||
        tags.includes(q)
      )
    })
  }, [expenses, onlyActive, query])

  const totals = useMemo(() => {
    let monthly = 0
    let annual = 0
    let oneTime = 0
    let myMonthly = 0
    let colleagueMonthly = 0

    for (const exp of onlyActive ? expenses.filter((e) => e.active) : expenses) {
      const baseMonthly = computeBaseMonthly(exp)
      if (exp.cadence === "one_time") {
        oneTime += exp.amount
      } else {
        monthly += baseMonthly
        annual += baseMonthly * 12
      }

      const [myPct, colleaguePct] = computeSplitPercentages(exp)
      myMonthly += baseMonthly * (myPct / 100)
      colleagueMonthly += baseMonthly * (colleaguePct / 100)
    }

    return { monthly, annual, oneTime, myMonthly, colleagueMonthly }
  }, [expenses, onlyActive])

  const topError = extractErrorMessage(expensesQuery.error)

  const openDetail = (expense: Expense) => {
    setSelectedExpense(expense)
    setActionError(null)
    setDetailOpen(true)
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setSelectedExpense(null)
    setActionError(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Spese</h1>
          <p className="text-muted-foreground">Abbonamenti e costi ricorrenti della gestione</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={onlyActive} onCheckedChange={(v) => setOnlyActive(Boolean(v))} id="only-active" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Totale mensile stimato</p>
              <p className="text-2xl font-semibold">{formatCurrency(totals.monthly || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Annuali divise per 12 - Una tantum escluse</p>
            </div>
            <CreditCard className="w-8 h-8 text-accent" />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Totale annuo stimato</p>
              <p className="text-2xl font-semibold">{formatCurrency(totals.annual || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Una tantum: {formatCurrency(totals.oneTime || 0)}
              </p>
            </div>
            <CalendarDays className="w-8 h-8 text-accent" />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Quota mia (mensile)</p>
              <p className="text-2xl font-semibold">{formatCurrency(totals.myMonthly || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Calcolata in base allo split</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-accent" />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Quota collega (mensile)</p>
              <p className="text-2xl font-semibold">{formatCurrency(totals.colleagueMonthly || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Basata su split_mode</p>
            </div>
            <CreditCard className="w-8 h-8 text-accent" />
          </div>
        </GlassCard>
      </div>

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
              onChange={(e) => setQuery(e.target.value)}
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
            visibleExpenses.map((exp) => (
              <div key={exp.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{exp.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{exp.vendor || "-"}</p>
                    {exp.tags?.length ? (
                      <p className="text-xs text-muted-foreground truncate">Tag: {exp.tags.join(", ")}</p>
                    ) : null}
                  </div>

                  {/* Stato: piccolo, non espande */}
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

                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => openDetail(exp)}>
                    Dettagli
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
              visibleExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="grid grid-cols-[2fr,1.2fr,1fr,1fr,1fr,1fr,1fr,1fr] px-4 py-3 items-center border-t border-border/50 hover:bg-muted/30 transition"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{exp.name}</span>
                    {exp.tags?.length ? (
                      <span className="text-xs text-muted-foreground truncate">Tag: {exp.tags.join(", ")}</span>
                    ) : null}
                  </div>
                  <span className="text-sm text-muted-foreground">{exp.vendor || "-"}</span>
                  <span className="text-sm text-muted-foreground">{exp.category || "-"}</span>
                  <span className="text-sm font-medium">{cadenceLabel[exp.cadence]}</span>
                  <span className="text-sm text-muted-foreground">{formatDate(exp.next_due_date)}</span>
                  <span className="text-sm font-semibold">{formatCurrency(exp.amount, exp.currency)}</span>
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
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openDetail(exp)}>
                      Dettagli
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </GlassCard>

      <Dialog open={detailOpen} onOpenChange={(v) => (v ? setDetailOpen(true) : closeDetail())}>
        <DialogContent
          className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-4xl max-h-[85vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6"
          aria-describedby="expense-detail-description"
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
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="border rounded-lg divide-y">
                <div className="px-3 py-2 bg-muted/40 font-semibold text-sm">Cicli di pagamento</div>
                {cyclesQuery.isLoading ? (
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
                    {cycles.map((cycle) => {
                      const due = new Date(`${cycle.due_date}T00:00:00`)
                      const isLate = cycle.status === "pending" && due.getTime() < Date.now()
                      const normalizedStatus = isLate ? "late" : cycle.status
                      const isNextPending = nextPending && nextPending.id === cycle.id && cycle.status === "pending"
                      return (
                        <div key={cycle.id} className="px-3 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <p className="font-medium">{formatDate(cycle.due_date)}</p>
                            <p className="text-sm text-muted-foreground">
                              Importo: {formatCurrency(cycle.amount, selectedExpense.currency)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${cycleStatusClass[normalizedStatus]}`}>
                              {normalizedStatus === "late" ? "In ritardo" : normalizedStatus === "paid" ? "Pagato" : "Da pagare"}
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
    </div>
  )
}
