import type { Expense } from "@/src/lib/expenses/schema"

export const cadenceLabel: Record<Expense["cadence"], string> = {
  monthly: "Mensile",
  yearly: "Annuale",
  one_time: "Una tantum",
}

export const statusClass: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-200 text-slate-700",
}

export const cycleStatusClass: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  late: "bg-red-100 text-red-800",
  paid: "bg-emerald-100 text-emerald-800",
}

export type CycleStatus = "pending" | "late" | "paid"
