"use client"

import { useState } from "react"
import type { Expense } from "@/src/lib/expenses/schema"
import { defaultExpenseForm } from "./form-defaults"
import type { ExpenseFormState } from "./types"


export function useExpenseUIState() {
  const [query, setQuery] = useState("")
  const [onlyActive, setOnlyActive] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Create/Edit UI state
  const [editOpen, setEditOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState<ExpenseFormState>({ ...defaultExpenseForm })

  const isOpen = Boolean(selectedExpense)

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
    setForm({ ...defaultExpenseForm })
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
      amount: exp.amount != null ? String(exp.amount) : "",
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

  return {
    query,
    setQuery,
    onlyActive,
    setOnlyActive,
    selectedExpense,
    setSelectedExpense,
    actionError,
    setActionError,
    editOpen,
    setEditOpen,
    editingExpense,
    setEditingExpense,
    formError,
    setFormError,
    form,
    setForm,
    isOpen,
    openDetail,
    closeDetail,
    openCreate,
    openEdit,
    closeEdit,
  }
}
