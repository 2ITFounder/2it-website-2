"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { ExpenseCycle } from "@/src/lib/expenses/schema"
import { apiGetExpenseCycles } from "./expenses.api"

export function useExpenseCycles(selectedExpenseId: string | null) {
  const cyclesKey = ["expense-cycles", selectedExpenseId ?? null] as const

  const cyclesQuery = useQuery<ExpenseCycle[], Error>({
    queryKey: cyclesKey,
    enabled: Boolean(selectedExpenseId),
    queryFn: async ({ queryKey, signal }) => {
      const expenseId = queryKey[1] as string | null
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

  return { cyclesKey, cyclesQuery, cycles, nextPending }
}
