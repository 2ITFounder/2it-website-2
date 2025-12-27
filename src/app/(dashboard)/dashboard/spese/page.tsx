"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ExpensesPageView } from "./_components/ExpensesPageView"
import { useExpensesQuery } from "./_lib/useExpensesQuery"
import { useExpenseCycles } from "./_lib/useExpenseCycles"
import { useExpenseMutations } from "./_lib/useExpenseMutations"
import { useExpenseUIState } from "./_lib/useExpenseUIState"
import { useExpensesDerived } from "./_lib/useExpensesDerived"
import { useExpenseUsers } from "./_lib/useExpenseUsers"
import { extractErrorMessage } from "./_lib/expenses.api"

export default function ExpensesPage() {
  const qc = useQueryClient()
  const [userError, setUserError] = useState<string | null>(null)
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
  const { usersQuery, allUsers, includedUsers, updateUserMutation } = useExpenseUsers({ qc, setUserError })

  const { cyclesQuery, cycles, nextPending } = useExpenseCycles(selectedExpense?.id ?? null)

  const { visibleExpenses, totals } = useExpensesDerived({
    allExpenses,
    activeExpenses,
    onlyActive,
    query,
    includedUsers,
  })

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
      userError={userError}
      usersQuery={usersQuery}
      expenseUsers={allUsers}
      updateUserMutation={updateUserMutation}
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
      formError={formError}
      includedUsers={includedUsers}
      expenseUsers={allUsers}
      createMutation={createMutation}
      updateMutation={updateMutation}
    />
  )

}
