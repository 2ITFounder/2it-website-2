import type { Expense } from "@/src/lib/expenses/schema"

export const computeBaseMonthly = (expense: Expense) => {
  if (expense.cadence === "monthly") return expense.amount
  if (expense.cadence === "yearly") return expense.amount / 12
  return 0
}
