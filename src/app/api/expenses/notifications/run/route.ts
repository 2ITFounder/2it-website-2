import { NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/src/lib/supabase/service"
import { notifyUsers } from "@/src/lib/push/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

type ExpenseScope = "shared" | "personal"
type NotifyKind = "due_0d" | "due_1d" | "due_7d"

type ExpenseJoin = {
  id: string
  name: string
  currency: string
  expense_scope: ExpenseScope
  personal_user_id: string | null
  active: boolean
}

type CycleRow = {
  id: string
  expense_id: string
  due_date: string
  amount: number
  status: string
  expenses: ExpenseJoin | ExpenseJoin[] | null
}

const ROME_TZ = "Europe/Rome"

function getRomeDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ROME_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date)

  const map = new Map(parts.map((p) => [p.type, p.value]))
  const year = map.get("year") ?? "1970"
  const month = map.get("month") ?? "01"
  const day = map.get("day") ?? "01"
  const hour = Number(map.get("hour") ?? "0")
  return { dateStr: `${year}-${month}-${day}`, hour }
}

function addDays(dateStr: string, days: number) {
  const [year, month, day] = dateStr.split("-").map((v) => Number(v))
  const base = new Date(Date.UTC(year, month - 1, day))
  base.setUTCDate(base.getUTCDate() + days)
  return base.toISOString().slice(0, 10)
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0))
}

function formatDueDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return dateStr
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short" }).format(d)
}

function pickExpense(raw: CycleRow["expenses"]): ExpenseJoin | null {
  if (!raw) return null
  if (Array.isArray(raw)) return raw[0] ?? null
  if (typeof raw === "object") return raw
  return null
}

function kindFromDueDate(dueDate: string, date0: string, date1: string, date7: string): NotifyKind | null {
  if (dueDate === date0) return "due_0d"
  if (dueDate === date1) return "due_1d"
  if (dueDate === date7) return "due_7d"
  return null
}

export async function POST(req: Request) {
  const secret = process.env.EXPENSE_NOTIFICATIONS_SECRET
  if (!secret) return NextResponse.json({ error: "Missing secret" }, { status: 500 })

  const incoming = req.headers.get("x-expense-secret")
  if (!incoming || incoming !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { dateStr, hour } = getRomeDateParts()
  const force = req.headers.get("x-force-run") === "1"
  if (!force && hour !== 9) {
    return NextResponse.json({ ok: true, skipped: "not-0900", date: dateStr, hour })
  }

  const date0 = dateStr
  const date1 = addDays(dateStr, 1)
  const date7 = addDays(dateStr, 7)
  const targetDates = [date0, date1, date7]

  const supabase = createSupabaseServiceClient()

  const { data: cyclesRaw, error: cyclesErr } = await supabase
    .from("expense_cycles")
    .select(
      "id,expense_id,due_date,amount,status,expenses!inner(id,name,currency,expense_scope,personal_user_id,active)"
    )
    .eq("status", "pending")
    .eq("expenses.active", true)
    .in("due_date", targetDates)

  if (cyclesErr) return NextResponse.json({ error: cyclesErr.message }, { status: 500 })

  const cycles = (cyclesRaw ?? []) as unknown as CycleRow[]
  if (cycles.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, cycles: 0, date: dateStr })
  }

  const { data: includedRows, error: includedErr } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("include_in_expenses", true)

  if (includedErr) return NextResponse.json({ error: includedErr.message }, { status: 500 })

  const includedIds = (includedRows ?? [])
    .map((row: { user_id: string }) => row.user_id)
    .filter(Boolean)

  const candidates: Array<{
    userId: string
    cycleId: string
    kind: NotifyKind
    dueDate: string
    name: string
    amount: number
    currency: string
  }> = []

  for (const cycle of cycles) {
    const exp = pickExpense(cycle.expenses)
    if (!exp) continue

    const kind = kindFromDueDate(cycle.due_date, date0, date1, date7)
    if (!kind) continue

    const recipients =
      exp.expense_scope === "personal"
        ? exp.personal_user_id
          ? [exp.personal_user_id]
          : []
        : includedIds

    for (const userId of recipients) {
      if (!userId) continue
      candidates.push({
        userId,
        cycleId: cycle.id,
        kind,
        dueDate: cycle.due_date,
        name: exp.name,
        amount: cycle.amount,
        currency: exp.currency || "EUR",
      })
    }
  }

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, cycles: cycles.length, date: dateStr })
  }

  const cycleIds = Array.from(new Set(candidates.map((c) => c.cycleId)))
  const userIds = Array.from(new Set(candidates.map((c) => c.userId)))
  const kinds = Array.from(new Set(candidates.map((c) => c.kind)))

  const { data: existingRows, error: existingErr } = await supabase
    .from("expense_notification_log")
    .select("expense_cycle_id,user_id,notify_kind")
    .in("expense_cycle_id", cycleIds)
    .in("user_id", userIds)
    .in("notify_kind", kinds)

  if (existingErr) return NextResponse.json({ error: existingErr.message }, { status: 500 })

  const existing = new Set(
    (existingRows ?? []).map(
      (row: { expense_cycle_id: string; user_id: string; notify_kind: string }) =>
        `${row.expense_cycle_id}|${row.user_id}|${row.notify_kind}`
    )
  )

  const pending = candidates.filter((c) => !existing.has(`${c.cycleId}|${c.userId}|${c.kind}`))
  if (pending.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, cycles: cycles.length, date: dateStr })
  }

  const groups = new Map<
    string,
    {
      recipients: Set<string>
      kind: NotifyKind
      payload: { title: string; body: string; url: string; type: string }
    }
  >()

  for (const item of pending) {
    const key = `${item.cycleId}|${item.kind}`
    const existingGroup = groups.get(key)
    if (existingGroup) {
      existingGroup.recipients.add(item.userId)
      continue
    }

    const dueLabel = formatDueDate(item.dueDate)
    const amountLabel = formatCurrency(item.amount, item.currency)

    const prefix =
      item.kind === "due_0d" ? "Oggi scade" :
      item.kind === "due_1d" ? "Domani scade" :
      "Tra 7 giorni scade"

    const type =
      item.kind === "due_0d" ? "expense-due-0d" :
      item.kind === "due_1d" ? "expense-due-1d" :
      "expense-due-7d"

    const payload = {
      title: "Scadenza spesa",
      body: `${prefix} ${item.name} · ${amountLabel} · ${dueLabel}`,
      url: "/dashboard/spese",
      type,
    }

    groups.set(key, {
      recipients: new Set([item.userId]),
      kind: item.kind,
      payload,
    })
  }

  const sentGroupKeys = new Set<string>()
  for (const [key, group] of groups.entries()) {
    const recipients = Array.from(group.recipients)
    if (recipients.length === 0) continue
    try {
      await notifyUsers(recipients, group.payload)
      sentGroupKeys.add(key)
    } catch (e) {
      console.error("[expense notifications] notifyUsers failed", e)
    }
  }

  const toLog = pending
    .filter((item) => sentGroupKeys.has(`${item.cycleId}|${item.kind}`))
    .map((item) => ({
      expense_cycle_id: item.cycleId,
      user_id: item.userId,
      notify_kind: item.kind,
    }))

  if (toLog.length > 0) {
    const { error: logErr } = await supabase.from("expense_notification_log").insert(toLog)
    if (logErr) console.error("[expense notifications] log insert failed", logErr)
  }

  const res = NextResponse.json({
    ok: true,
    sent: toLog.length,
    cycles: cycles.length,
    date: dateStr,
    debug: {
      includedIds: includedIds.length,
      candidates: candidates.length,
      pending: pending.length,
      groups: groups.size,
      sentGroups: sentGroupKeys.size,
    },
  })

  return res
}
