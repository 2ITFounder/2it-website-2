import { apiGet } from "@/src/lib/api"
import { Expense, ExpenseCycle } from "@/src/lib/expenses/schema"
import type { ExpenseUser } from "./types"

export function extractErrorMessage(err: any) {
  if (!err) return null
  if (typeof err === "string") return err
  if (typeof err?.message === "string") return err.message
  return "Si e verificato un errore"
}

export async function apiGetExpenses(params?: { active?: boolean }, signal?: AbortSignal) {
  const query = params?.active === undefined ? "" : `?active=${params.active ? "true" : "false"}`
  return apiGet<Expense[]>(`/api/expenses${query}`, signal)
}


export async function apiGetExpenseCycles(expenseId: string, signal?: AbortSignal) {
  if (!expenseId || expenseId === "undefined" || expenseId === "null") {
    throw new Error("Missing expense id")
  }
  return apiGet<ExpenseCycle[]>(`/api/expenses/${encodeURIComponent(expenseId)}/cycles`, signal)
}

export async function apiGetExpenseUsers(signal?: AbortSignal) {
  return apiGet<ExpenseUser[]>(`/api/expenses/users`, signal)
}

export async function apiUpdateExpenseUser(userId: string, includeInExpenses: boolean) {
  const res = await fetch("/api/expenses/users", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, include_in_expenses: includeInExpenses }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error ?? "Errore aggiornamento utente")
  return json?.data ?? json
}

export async function apiPayExpenseCycle(cycleId: string) {
  const res = await fetch(`/api/expense-cycles/${cycleId}/pay`, { method: "PATCH" })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error ?? "Errore pagamento ciclo")
  return json?.data ?? json
}

export async function apiCreateExpense(payload: Partial<Expense>) {
  const res = await fetch("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error ?? "Errore creazione spesa")
  return json
}

export async function apiUpdateExpense(id: string, patch: Partial<Expense>) {
  if (!id || id === "undefined" || id === "null") {
    throw new Error("Missing id")
  }
  const res = await fetch(`/api/expenses/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error ?? "Errore aggiornamento spesa")
  return json
}

export async function apiDeleteExpense(id: string) {
  const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error(await res.text())
  return true
}
