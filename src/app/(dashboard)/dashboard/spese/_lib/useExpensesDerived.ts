"use client"

import { useMemo } from "react"
import type { Expense } from "@/src/lib/expenses/schema"
import { computeBaseMonthly, computeSplitPercentages } from "./expense-math"

export function useExpensesDerived(params: {
  allExpenses: Expense[]
  activeExpenses: Expense[]
  onlyActive: boolean
  query: string
}) {
  const { allExpenses, activeExpenses, onlyActive, query } = params

  // ✅ LISTA VISIBILE: toggle solo UI (attive vs tutte)
  const visibleExpenses = useMemo<Expense[]>(() => {
    const base: Expense[] = onlyActive ? activeExpenses : allExpenses
    const q = query.trim().toLowerCase()
    if (!q) return base
    return base.filter((e: Expense) => {
      const tags = (e.tags ?? []).join(" ").toLowerCase()
      return (
        e.name.toLowerCase().includes(q) ||
        (e.vendor ?? "").toLowerCase().includes(q) ||
        (e.category ?? "").toLowerCase().includes(q) ||
        tags.includes(q)
      )
    })
  }, [allExpenses, activeExpenses, onlyActive, query])

  // ✅ KPI/TOTALI: sempre e solo attive (anche se stai mostrando tutte)
  const totals = useMemo(() => {
    let monthly = 0
    let annual = 0
    let oneTime = 0
    let myMonthly = 0
    let colleagueMonthly = 0

    for (const exp of activeExpenses) {
      const baseMonthly = computeBaseMonthly(exp)
      if (exp.cadence === "one_time") {
        oneTime += exp.amount
      } else {
        monthly += baseMonthly
        annual += baseMonthly * 12
      }

      const [myPct, colleaguePct] = computeSplitPercentages(exp)
      myMonthly += baseMonthly * (myPct / 100)
      colleagueMonthly += baseMonthly * (colleaguePct / 100)
    }

    return { monthly, annual, oneTime, myMonthly, colleagueMonthly }
  }, [activeExpenses])

  return { visibleExpenses, totals }
}
