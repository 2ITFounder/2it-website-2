"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { Expense } from "@/src/lib/expenses/schema"
import { apiGetExpenses, extractErrorMessage } from "./expenses.api"

export function useExpensesQuery() {
  // ✅ LISTA: sempre tutte (nessun filtro server-side)
  const expensesQuery = useQuery<Expense[], Error>({
    queryKey: ["expenses"],
    queryFn: ({ signal }) => apiGetExpenses(undefined, signal),
  })

  const allExpenses = expensesQuery.data ?? []
  // ✅ CALCOLI: sempre e solo attive
  const activeExpenses = useMemo(() => allExpenses.filter((e) => e.active), [allExpenses])

  const topError = extractErrorMessage(expensesQuery.error)

  return { expensesQuery, allExpenses, activeExpenses, topError }
}
