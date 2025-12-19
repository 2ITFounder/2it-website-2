import { apiGet } from "@/src/lib/api"
import { Expense, ExpenseCycle } from "@/src/lib/expenses/schema"

export function extractErrorMessage(err: any) {
  if (!err) return null
  if (typeof err === "string") return err
  if (typeof err?.message === "string") return err.message
  return "Si e verificato un errore"
}

export async function apiGetExpenses(activeOnly: boolean, signal?: AbortSignal) {
  const query = activeOnly ? "?active=true" : ""
  return apiGet<Expense[]>(`/api/expenses${query}`, signal)
}

export async function apiGetExpenseCycles(expenseId: string, signal?: AbortSignal) {
  return apiGet<ExpenseCycle[]>(`/api/expenses/${expenseId}/cycles`, signal)
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
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiUpdateExpense(id: string, patch: Partial<Expense>) {
  const res = await fetch(`/api/expenses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function apiDeleteExpense(id: string) {
  const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error(await res.text())
  return true
}
