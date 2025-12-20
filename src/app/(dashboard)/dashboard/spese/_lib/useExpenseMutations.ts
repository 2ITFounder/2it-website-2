"use client"

import { useMutation, type QueryClient } from "@tanstack/react-query"

import type { Expense } from "@/src/lib/expenses/schema"
import {
  apiPayExpenseCycle,
  apiCreateExpense,
  apiUpdateExpense,
  apiDeleteExpense,
  extractErrorMessage,
} from "./expenses.api"

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

type Params = {
  qc: QueryClient
  form: ExpenseFormState
  editingExpense: Expense | null
  closeEdit: () => void
  closeDetail: () => void
  setFormError: (value: string | null) => void
  setActionError: (value: string | null) => void
}

export function useExpenseMutations({
  qc,
  form,
  editingExpense,
  closeEdit,
  closeDetail,
  setFormError,
  setActionError,
}: Params) {
  // --- Mutations: Pay cycle ---
  const payMutation = useMutation<unknown, Error, { cycleId: string; expenseId?: string }>({
    mutationFn: async ({ cycleId }: { cycleId: string; expenseId?: string }) => {
      setActionError(null)
      return apiPayExpenseCycle(cycleId)
    },
    onSuccess: async (_data: unknown, variables: { cycleId: string; expenseId?: string }) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["expenses"] }),
        variables.expenseId
          ? qc.invalidateQueries({ queryKey: ["expense-cycles", variables.expenseId] })
          : Promise.resolve(),
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

  return { payMutation, createMutation, updateMutation, deleteMutation, toggleActiveMutation }
}
