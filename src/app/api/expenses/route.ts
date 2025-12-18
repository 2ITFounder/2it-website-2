import { NextResponse } from "next/server"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"
import { ExpenseCreateSchema } from "@/src/lib/expenses/schema"

export async function GET(req: Request) {
  const supabase = await createSupabaseRouteClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const onlyActive = url.searchParams.get("active")

  let query = supabase
    .from("expenses")
    .select(
      "id,name,vendor,category,tags,amount,currency,cadence,first_due_date,next_due_date,active,split_mode,split_custom,notes,created_by,created_at"
    )
    .order("next_due_date", { ascending: true })
    .order("created_at", { ascending: false })

  if (onlyActive === "true") {
    query = query.eq("active", true)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const supabase = await createSupabaseRouteClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = ExpenseCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const payload = {
    created_by: auth.user.id,
    name: parsed.data.name,
    vendor: parsed.data.vendor ?? null,
    category: parsed.data.category ?? null,
    tags: parsed.data.tags ?? [],
    amount: parsed.data.amount,
    currency: parsed.data.currency ?? "EUR",
    cadence: parsed.data.cadence ?? "monthly",
    first_due_date: parsed.data.first_due_date,
    active: parsed.data.active ?? true,
    split_mode: parsed.data.split_mode ?? "equal",
    split_custom: parsed.data.split_mode === "custom" ? parsed.data.split_custom ?? {} : null,
    notes: parsed.data.notes ?? null,
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert(payload)
    .select(
      "id,name,vendor,category,tags,amount,currency,cadence,first_due_date,next_due_date,active,split_mode,split_custom,notes,created_by,created_at"
    )
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: firstCycle } = await supabase
    .from("expense_cycles")
    .select("id,expense_id,due_date,amount,status,paid_at,created_at")
    .eq("expense_id", data.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ data: { ...data, first_cycle: firstCycle ?? null } }, { status: 201 })
}
