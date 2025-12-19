"use client"

import { useMemo, useState } from "react"
import type { ChangeEvent } from "react"
import { CalendarDays, CheckCircle2, CreditCard, RefreshCw, Search, XCircle } from "lucide-react"
import { useMutation, useQuery, useQueryClient, type UseQueryOptions  } from "@tanstack/react-query"
import { GlassCard } from "@/src/components/ui-custom/glass-card"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { Switch } from "@/src/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"

import { Expense, ExpenseCycle } from "@/src/lib/expenses/schema"
import {
  apiGetExpenseCycles,
  apiGetExpenses,
  apiPayExpenseCycle,
  extractErrorMessage,
  apiCreateExpense,
  apiUpdateExpense,
  apiDeleteExpense,
} from "./_lib/expenses.api"

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

type CycleStatus = "pending" | "late" | "paid"


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
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Create/Edit UI state (devono stare DENTRO al componente)
  const [editOpen, setEditOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    vendor: "",
    category: "",
    cadence: "monthly" as Expense["cadence"],
    amount: 0,
    currency: "EUR",
    active: true,
    next_due_date: "", // "YYYY-MM-DD"
    tags: "",
    notes: "",
  })

  const isOpen = Boolean(selectedExpense)

  const expensesQuery = useQuery<Expense[], Error>({
    queryKey: ["expenses", { active: onlyActive }],
    queryFn: ({ signal }) => apiGetExpenses(onlyActive, signal),
  })

  const cyclesKey = ["expense-cycles", selectedExpense?.id ?? null] as const

  const cyclesQuery = useQuery<ExpenseCycle[], Error>({
    queryKey: cyclesKey,
    enabled: Boolean(selectedExpense?.id),
    queryFn: async ({ queryKey, signal }) => {
      const expenseId = (queryKey[1] as string | null)
      if (!expenseId) return []
      return apiGetExpenseCycles(expenseId, signal)
    },
    placeholderData: [],
  })

  const cycles = cyclesQuery.data ?? []

  const nextPending = useMemo<ExpenseCycle | null>(() => {
    const pending = cycles.filter((c: ExpenseCycle) => c.status === "pending")
    if (pending.length === 0) return null
    return pending.reduce((earliest: ExpenseCycle, current: ExpenseCycle) => {
      return earliest && earliest.due_date <= current.due_date ? earliest : current
    })
  }, [cycles])

  // --- Mutations: Pay cycle (già c'era) ---
  const payMutation = useMutation<unknown, Error, { cycleId: string; expenseId?: string }>({
    mutationFn: async ({ cycleId }: { cycleId: string; expenseId?: string }) => {
      setActionError(null)
      return apiPayExpenseCycle(cycleId)
    },
    onSuccess: async (_data: unknown, variables: { cycleId: string; expenseId?: string }) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["expenses"] }),
        variables.expenseId ? qc.invalidateQueries({ queryKey: ["expense-cycles", variables.expenseId] }) : Promise.resolve(),
      ])
    },
    onError: (err: unknown) => {
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

  const visibleExpenses = useMemo<Expense[]>(() => {
    const list: Expense[] = onlyActive ? expenses.filter((e: Expense) => e.active) : expenses
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((e: Expense) => {
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

    for (const exp of onlyActive ? expenses.filter((e: Expense) => e.active) : expenses) {
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
  }

  const closeDetail = () => {
    setSelectedExpense(null)
    setActionError(null)
  }

  // --- Create/Edit helpers ---
  const openCreate = () => {
    setFormError(null)
    setEditingExpense(null)
    setForm({
      name: "",
      vendor: "",
      category: "",
      cadence: "monthly",
      amount: 0,
      currency: "EUR",
      active: true,
      next_due_date: "",
      tags: "",
      notes: "",
    })
    setEditOpen(true)
  }

  const openEdit = (exp: Expense) => {
    setFormError(null)
    setEditingExpense(exp)
    setForm({
      name: exp.name ?? "",
      vendor: exp.vendor ?? "",
      category: exp.category ?? "",
      cadence: exp.cadence,
      amount: Number(exp.amount ?? 0),
      currency: exp.currency ?? "EUR",
      active: Boolean(exp.active),
      next_due_date: (exp.next_due_date ?? "").slice(0, 10),
      tags: (exp.tags ?? []).join(", "),
      notes: exp.notes ?? "",
    })
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditingExpense(null)
    setFormError(null)
  }

  // --- Mutations: Create / Update / Delete / Toggle ---
  const createMutation = useMutation({
    mutationFn: async () => {
      setFormError(null)
      const payload = {
        name: form.name.trim(),
        vendor: form.vendor.trim() || null,
        category: form.category.trim() || null,
        cadence: form.cadence,
        amount: Number(form.amount),
        currency: form.currency || "EUR",
        active: Boolean(form.active),
        next_due_date: form.next_due_date || null,
        notes: form.notes.trim() || null,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }
      return apiCreateExpense(payload as any)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["expenses"] })
      closeEdit()
    },
    onError: (err: unknown) => setFormError(extractErrorMessage(err) ?? "Errore creazione"),
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingExpense?.id) throw new Error("Missing expense id")
      setFormError(null)
      const patch = {
        name: form.name.trim(),
        vendor: form.vendor.trim() || null,
        category: form.category.trim() || null,
        cadence: form.cadence,
        amount: Number(form.amount),
        currency: form.currency || "EUR",
        active: Boolean(form.active),
        next_due_date: form.next_due_date || null,
        notes: form.notes.trim() || null,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }
      return apiUpdateExpense(editingExpense.id, patch as any)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["expenses"] })
      closeEdit()
    },
    onError: (err: unknown) => setFormError(extractErrorMessage(err) ?? "Errore modifica"),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setFormError(null)
      return apiDeleteExpense(id)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["expenses"] })
      // se avevi aperto il dettaglio di quella spesa, lo chiudi
      closeDetail()
    },
    onError: (err: unknown) => setFormError(extractErrorMessage(err) ?? "Errore eliminazione"),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async (payload: { id: string; active: boolean }) => {
      return apiUpdateExpense(payload.id, { active: payload.active } as any)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["expenses"] })
    },
  })

  return (
    <div className="space-y-6">
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
              <p className="text-xs text-muted-foreground mt-1">Una tantum: {formatCurrency(totals.oneTime || 0)}</p>
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
              <div key={exp.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{exp.name}</p>
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

      {/* Dialog DETTAGLI (già esistente) */}
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
                    {!nextPending ? <div className="p-3 text-sm text-muted-foreground">Nessun ciclo pending da pagare.</div> : null}
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

      {/* Dialog CREATE/EDIT (nuovo) */}
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

          {formError ? (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">Nome</label>
              <Input value={form.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Vendor</label>
              <Input value={form.vendor} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, vendor: e.target.value }))} />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Categoria</label>
              <Input value={form.category} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, category: e.target.value }))} />
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
              <Input value={form.currency} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, currency: e.target.value }))} />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Prossimo rinnovo</label>
              <Input
                type="date"
                value={form.next_due_date}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, next_due_date: e.target.value }))}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">Tag (separati da virgola)</label>
              <Input value={form.tags} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, tags: e.target.value }))} />
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
                    if (!form.name.trim()) return setFormError("Il nome è obbligatorio")
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
    </div>
  )
}
