import type { Expense } from "@/src/lib/expenses/schema"

export const defaultExpenseForm = {
  name: "",
  vendor: "",
  category: "",
  cadence: "monthly" as Expense["cadence"],
  amount: 0,
  currency: "EUR",
  active: true,
  next_due_date: "", // "YYYY-MM-DD"
  tags: "",
  notes: "",
}
