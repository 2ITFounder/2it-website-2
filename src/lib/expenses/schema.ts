import { z } from "zod"

export const ExpenseCadenceEnum = z.enum(["monthly", "yearly", "one_time"])
export const ExpenseCycleStatusEnum = z.enum(["pending", "paid", "late"])
export const ExpenseScopeEnum = z.enum(["shared", "personal"])

const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida")

export const ExpenseCreateSchema = z.object({
  name: z.string().min(2),
  vendor: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  amount: z.coerce.number().positive(),
  currency: z.string().min(1).optional(),
  cadence: ExpenseCadenceEnum.optional(),
  first_due_date: isoDateString,
  active: z.boolean().optional(),
  expense_scope: ExpenseScopeEnum.optional(),
  personal_user_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const ExpenseUpdateSchema = ExpenseCreateSchema.partial().extend({
  id: z.string().uuid(),
  next_due_date: isoDateString.optional(),
})

export type ExpenseCadence = z.infer<typeof ExpenseCadenceEnum>
export type ExpenseCycleStatus = z.infer<typeof ExpenseCycleStatusEnum>
export type ExpenseScope = z.infer<typeof ExpenseScopeEnum>

export type Expense = {
  id: string
  name: string
  vendor: string | null
  category: string | null
  tags: string[]
  amount: number
  currency: string
  cadence: ExpenseCadence
  first_due_date: string
  next_due_date: string
  active: boolean
  expense_scope: ExpenseScope
  personal_user_id: string | null
  notes: string | null
  created_by: string
  created_at: string
}

export type ExpenseCycle = {
  id: string
  expense_id: string
  due_date: string
  amount: number
  status: ExpenseCycleStatus
  paid_at: string | null
  created_at: string
}

export function computeNextDueDate(from: string, cadence: ExpenseCadence): string | null {
  if (cadence === "one_time") return null
  const base = new Date(`${from}T00:00:00Z`)
  if (Number.isNaN(base.getTime())) return null

  if (cadence === "monthly") {
    base.setUTCMonth(base.getUTCMonth() + 1)
  } else if (cadence === "yearly") {
    base.setUTCFullYear(base.getUTCFullYear() + 1)
  }

  return base.toISOString().slice(0, 10)
}
