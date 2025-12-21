import type { ExpenseFormState } from "./types"

export const defaultExpenseForm: ExpenseFormState = {
  name: "",
  vendor: "",
  category: "",
  cadence: "monthly",
  amount: "",
  currency: "EUR",
  active: true,
  next_due_date: "", // "YYYY-MM-DD"
  tags: "",
  notes: "",
}
