"use client"

import type { Expense, ExpenseCycle } from "@/src/lib/expenses/schema"

import { ExpenseDialog } from "./ExpenseDialog"
import { ExpenseDetailDialog } from "./ExpenseDetailDialog"
import { ExpenseListCard } from "./ExpenseListCard"
import { ExpensesHeader } from "./ExpensesHeader"
import { ExpensesStatsGrid } from "./ExpensesStatsGrid"
import type { ExpenseFormState, ExpenseUser, Totals } from "../_lib/types"


type ExpensesQueryShape = {
  isLoading: boolean
  isFetching: boolean
  error: unknown
  refetch: () => void
}

type UsersQueryShape = {
  isLoading: boolean
  isFetching: boolean
  error: unknown
  refetch: () => void
}

type CyclesQueryShape = {
  isFetching: boolean
  error: unknown
}

type PayMutationShape = {
  isPending: boolean
  mutate: (args: { cycleId: string; expenseId: string }) => void
}

type CreateOrUpdateMutationShape = {
  isPending: boolean
  mutate: () => void
}

type DeleteMutationShape = {
  mutate: (id: string) => void
}

type ToggleActiveMutationShape = {
  mutate: (args: { id: string; active: boolean }) => void
}

type UpdateUserMutationShape = {
  isPending: boolean
  mutate: (args: { userId: string; includeInExpenses: boolean }) => void
}

type Props = {
  // header
  openCreate: () => void
  onlyActive: boolean
  setOnlyActive: (value: boolean) => void
  expensesQuery: ExpensesQueryShape
  topError: string | null
  userError: string | null
  usersQuery: UsersQueryShape
  expenseUsers: ExpenseUser[]
  updateUserMutation: UpdateUserMutationShape

  // stats
  totals: Totals

  // list
  visibleExpenses: Expense[]
  query: string
  setQuery: (value: string) => void
  openDetail: (expense: Expense) => void
  openEdit: (expense: Expense) => void
  deleteMutation: DeleteMutationShape
  toggleActiveMutation: ToggleActiveMutationShape

  // detail dialog
  isOpen: boolean
  closeDetail: () => void
  selectedExpense: Expense | null
  actionError: string | null
  cyclesQuery: CyclesQueryShape
  cycles: ExpenseCycle[]
  nextPending: ExpenseCycle | null
  payMutation: PayMutationShape
  extractErrorMessage: (err: unknown) => string | null | undefined

  // create/edit dialog
  editOpen: boolean
  closeEdit: () => void
  editingExpense: Expense | null
  form: ExpenseFormState
  setForm: React.Dispatch<React.SetStateAction<ExpenseFormState>>
  formError: string | null
  includedUsers: ExpenseUser[]
  createMutation: CreateOrUpdateMutationShape
  updateMutation: CreateOrUpdateMutationShape
}

export function ExpensesPageView(props: Props) {
  const {
    openCreate,
    onlyActive,
    setOnlyActive,
    expensesQuery,
    topError,
    userError,
    usersQuery,
    expenseUsers,
    updateUserMutation,
    totals,
    visibleExpenses,
    query,
    setQuery,
    openDetail,
    openEdit,
    deleteMutation,
    toggleActiveMutation,
    isOpen,
    closeDetail,
    selectedExpense,
    actionError,
    cyclesQuery,
    cycles,
    nextPending,
    payMutation,
    extractErrorMessage,
    editOpen,
    closeEdit,
    editingExpense,
    form,
    setForm,
    formError,
    includedUsers,
    createMutation,
    updateMutation,
  } = props

  return (
    <div className="space-y-6">
      <ExpensesHeader
        openCreate={openCreate}
        onlyActive={onlyActive}
        setOnlyActive={setOnlyActive}
        expensesQuery={expensesQuery}
        topError={topError}
        userError={userError}
        usersQuery={usersQuery}
        expenseUsers={expenseUsers}
        updateUserMutation={updateUserMutation}
      />

      <ExpensesStatsGrid totals={totals} />

      <ExpenseListCard
        expensesQuery={expensesQuery}
        visibleExpenses={visibleExpenses}
        query={query}
        setQuery={setQuery}
        openDetail={openDetail}
        openEdit={openEdit}
        deleteMutation={deleteMutation}
        toggleActiveMutation={toggleActiveMutation}
        expenseUsers={expenseUsers}
      />

      {/* Dialog DETTAGLI */}
      <ExpenseDetailDialog
        isOpen={isOpen}
        closeDetail={closeDetail}
        selectedExpense={selectedExpense}
        actionError={actionError}
        cyclesQuery={cyclesQuery}
        cycles={cycles}
        nextPending={nextPending}
        payMutation={payMutation}
        extractErrorMessage={extractErrorMessage}
        expenseUsers={expenseUsers}
      />

      {/* Dialog CREATE/EDIT */}
      <ExpenseDialog
        editOpen={editOpen}
        closeEdit={closeEdit}
        editingExpense={editingExpense}
        form={form}
        setForm={setForm}
        formError={formError}
        includedUsers={includedUsers}
        expenseUsers={expenseUsers}
        createMutation={createMutation}
        updateMutation={updateMutation}
      />
    </div>
  )
}
