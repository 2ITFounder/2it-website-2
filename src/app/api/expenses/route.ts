import { NextResponse } from "next/server"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"
import { createSupabaseServiceClient } from "@/src/lib/supabase/service"
import { ExpenseCreateSchema } from "@/src/lib/expenses/schema"

export async function GET(req: Request) {
  const supabase = await createSupabaseRouteClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabaseService = createSupabaseServiceClient()
  const { data: admin, error: adminErr } = await supabaseService
    .from("admin_users")
    .select("user_id")
    .eq("user_id", auth.user.id)
    .maybeSingle()
  if (adminErr) return NextResponse.json({ error: adminErr.message }, { status: 500 })
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const onlyActive = url.searchParams.get("active")

  let query = supabase
    .from("expenses")
    .select(
      "id,name,vendor,category,tags,amount,currency,cadence,first_due_date,next_due_date,active,expense_scope,personal_user_id,notes,created_by,created_at"
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

  const supabaseService = createSupabaseServiceClient()
  const { data: admin, error: adminErr } = await supabaseService
    .from("admin_users")
    .select("user_id")
    .eq("user_id", auth.user.id)
    .maybeSingle()
  if (adminErr) return NextResponse.json({ error: adminErr.message }, { status: 500 })
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: includedRows, error: includedErr } = await supabaseService
    .from("admin_users")
    .select("user_id")
    .eq("include_in_expenses", true)
  if (includedErr) return NextResponse.json({ error: includedErr.message }, { status: 500 })
  if (!includedRows || includedRows.length === 0) {
    return NextResponse.json({ error: "Nessun utente inserito nelle spese" }, { status: 400 })
  }
  const includedIds = new Set((includedRows ?? []).map((row: { user_id: string }) => row.user_id))

  const body = await req.json().catch(() => null)
  const parsed = ExpenseCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const incomingScope = parsed.data.expense_scope ?? (parsed.data.personal_user_id ? "personal" : "shared")
  const personalUserId = parsed.data.personal_user_id ?? null
  if (incomingScope === "personal") {
    if (!personalUserId) {
      return NextResponse.json({ error: "Seleziona un utente per la spesa personale" }, { status: 400 })
    }
    if (!includedIds.has(personalUserId)) {
      return NextResponse.json({ error: "Utente non incluso nelle spese" }, { status: 400 })
    }
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
    expense_scope: incomingScope,
    personal_user_id: incomingScope === "personal" ? personalUserId : null,
    notes: parsed.data.notes ?? null,
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert(payload)
    .select(
      "id,name,vendor,category,tags,amount,currency,cadence,first_due_date,next_due_date,active,expense_scope,personal_user_id,notes,created_by,created_at"
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
