import type { Expense } from "@/src/lib/expenses/schema"

export const computeBaseMonthly = (expense: Expense) => {
  if (expense.cadence === "monthly") return expense.amount
  if (expense.cadence === "yearly") return expense.amount / 12
  return 0
}

export const computeSplitPercentages = (expense: Expense): [number, number] => {
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
