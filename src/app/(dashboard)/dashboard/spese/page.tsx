"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { computeBaseMonthly, computeSplitPercentages } from "./_lib/expense-math"
import { ExpensesPageView } from "./_components/ExpensesPageView"
import { defaultExpenseForm } from "./_lib/form-defaults"
import { Expense, ExpenseCycle } from "@/src/lib/expenses/schema"
import { useExpensesQuery } from "./_lib/useExpensesQuery"
import { useExpenseCycles } from "./_lib/useExpenseCycles"
import { useExpenseMutations } from "./_lib/useExpenseMutations"
import { useExpenseUIState } from "./_lib/useExpenseUIState"
import { useExpensesDerived } from "./_lib/useExpensesDerived"





import {
  apiGetExpenseCycles,
  apiGetExpenses,
  apiPayExpenseCycle,
  extractErrorMessage,
  apiCreateExpense,
  apiUpdateExpense,
  apiDeleteExpense,
} from "./_lib/expenses.api"

export default function ExpensesPage() {
  const qc = useQueryClient()
  const {
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
  } = useExpenseUIState()

  
  const { expensesQuery, allExpenses, activeExpenses, topError } = useExpensesQuery()

  const { cyclesKey, cyclesQuery, cycles, nextPending } = useExpenseCycles(selectedExpense?.id ?? null)

  const { visibleExpenses, totals } = useExpensesDerived({ allExpenses, activeExpenses, onlyActive, query })

  const { payMutation, createMutation, updateMutation, deleteMutation, toggleActiveMutation } = useExpenseMutations({
    qc,
    form,
    editingExpense,
    closeEdit,
    closeDetail,
    setFormError,
    setActionError,
  })

  return (
    <ExpensesPageView
      openCreate={openCreate}
      onlyActive={onlyActive}
      setOnlyActive={setOnlyActive}
      expensesQuery={expensesQuery}
      topError={topError}
      totals={totals}
      visibleExpenses={visibleExpenses}
      query={query}
      setQuery={setQuery}
      openDetail={openDetail}
      openEdit={openEdit}
      deleteMutation={deleteMutation}
      toggleActiveMutation={toggleActiveMutation}
      isOpen={isOpen}
      closeDetail={closeDetail}
      selectedExpense={selectedExpense}
      actionError={actionError}
      cyclesQuery={cyclesQuery}
      cycles={cycles}
      nextPending={nextPending}
      payMutation={payMutation}
      extractErrorMessage={extractErrorMessage}
      editOpen={editOpen}
      closeEdit={closeEdit}
      editingExpense={editingExpense}
      form={form}
      setForm={setForm}
      createMutation={createMutation}
      updateMutation={updateMutation}
    />
  )

}
