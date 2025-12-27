"use client"

import { useMemo } from "react"
import type { Expense } from "@/src/lib/expenses/schema"
import { computeBaseMonthly } from "./expense-math"
import type { ExpenseUser, UserTotals } from "./types"

export function useExpensesDerived(params: {
  allExpenses: Expense[]
  activeExpenses: Expense[]
  onlyActive: boolean
  query: string
  includedUsers: ExpenseUser[]
}) {
  const { allExpenses, activeExpenses, onlyActive, query, includedUsers } = params

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
    if (includedUsers.length === 0) {
      return { monthly: 0, annual: 0, oneTime: 0, users: [], noIncluded: true }
    }

    const userMap = new Map<string, UserTotals>(
      includedUsers.map((user) => [
        user.user_id,
        {
          userId: user.user_id,
          label: user.username || user.email || user.user_id,
          sharedMonthly: 0,
          personalMonthly: 0,
          totalMonthly: 0,
        },
      ])
    )

    let monthly = 0
    let annual = 0
    let oneTime = 0

    for (const exp of activeExpenses) {
      const baseMonthly = computeBaseMonthly(exp)
      if (exp.cadence === "one_time") {
        oneTime += exp.amount
      } else {
        monthly += baseMonthly
        annual += baseMonthly * 12
      }

      if (exp.expense_scope === "personal") {
        const entry = exp.personal_user_id ? userMap.get(exp.personal_user_id) : null
        if (entry) entry.personalMonthly += baseMonthly
      } else {
        const share = includedUsers.length ? baseMonthly / includedUsers.length : 0
        for (const entry of userMap.values()) {
          entry.sharedMonthly += share
        }
      }
    }

    const users = Array.from(userMap.values()).map((entry) => ({
      ...entry,
      totalMonthly: entry.sharedMonthly + entry.personalMonthly,
    }))

    return { monthly, annual, oneTime, users, noIncluded: false }
  }, [activeExpenses, includedUsers])

  return { visibleExpenses, totals }
}
