import type { Expense } from "@/src/lib/expenses/schema"

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
}

export type Totals = {
  monthly: number
  annual: number
  oneTime: number
  myMonthly: number
  colleagueMonthly: number
}
