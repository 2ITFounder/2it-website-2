import type { Expense } from "@/src/lib/expenses/schema"

export type ExpenseUser = {
  user_id: string
  username: string | null
  email: string | null
  include_in_expenses: boolean
}

export type ExpenseFormState = {
  name: string
  vendor: string
  category: string
  cadence: Expense["cadence"]
  amount: string
  currency: string
  active: boolean
  next_due_date: string
  tags: string
  notes: string
  expense_scope: Expense["expense_scope"]
  personal_user_id: string
}

export type UserTotals = {
  userId: string
  label: string
  sharedMonthly: number
  personalMonthly: number
  totalMonthly: number
}

export type Totals = {
  monthly: number
  annual: number
  oneTime: number
  users: UserTotals[]
  noIncluded: boolean
}
