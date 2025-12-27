import { NextResponse } from "next/server"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"
import { createSupabaseServiceClient } from "@/src/lib/supabase/service"
import { ExpenseUpdateSchema } from "@/src/lib/expenses/schema"

type Params = { id: string }

// --- PATCH ---
export async function PATCH(
  req: Request, 
  { params }: { params: Promise<Params> } // <--- Promise
) {
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

  // <--- Await params
  const { id: expenseId } = await params

  if (!expenseId) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const body = await req.json().catch(() => null)
  const parsed = ExpenseUpdateSchema.safeParse({ ...(body || {}), id: expenseId })
  
  // ... resto del codice identico ...
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { id: _id, ...updates } = parsed.data
  const cleaned: Record<string, unknown> = { ...updates }

  // ... logica pulizia ...
  if (cleaned.vendor === "") cleaned.vendor = null
  if (cleaned.category === "") cleaned.category = null
  if (cleaned.notes === "") cleaned.notes = null
  if (!Array.isArray(cleaned.tags)) delete cleaned.tags

  if (cleaned.expense_scope === "shared") {
    cleaned.personal_user_id = null
  } else if (cleaned.expense_scope === "personal" && !cleaned.personal_user_id) {
    return NextResponse.json({ error: "Seleziona un utente per la spesa personale" }, { status: 400 })
  } else if (cleaned.personal_user_id && !cleaned.expense_scope) {
    cleaned.expense_scope = "personal"
  }

  Object.keys(cleaned).forEach((k) => cleaned[k] === undefined && delete cleaned[k])

  if (Object.keys(cleaned).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  if (cleaned.personal_user_id || cleaned.expense_scope === "personal") {
    const { data: includedRows, error: includedErr } = await supabaseService
      .from("admin_users")
      .select("user_id")
      .eq("include_in_expenses", true)
    if (includedErr) return NextResponse.json({ error: includedErr.message }, { status: 500 })
    if (!includedRows || includedRows.length === 0) {
      return NextResponse.json({ error: "Nessun utente inserito nelle spese" }, { status: 400 })
    }
    const includedIds = new Set((includedRows ?? []).map((row: { user_id: string }) => row.user_id))
    const personalUserId = cleaned.personal_user_id as string | undefined | null
    if (!personalUserId || !includedIds.has(personalUserId)) {
      return NextResponse.json({ error: "Utente non incluso nelle spese" }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from("expenses")
    .update(cleaned)
    .eq("id", expenseId)
    .select(
      "id,name,vendor,category,tags,amount,currency,cadence,first_due_date,next_due_date,active,expense_scope,personal_user_id,notes,created_by,created_at"
    )
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

// --- DELETE ---
export async function DELETE(
  _req: Request, 
  { params }: { params: Promise<Params> } // <--- Promise anche qui
) {
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

  // <--- Await params
  const { id: expenseId } = await params

  if (!expenseId) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { error } = await supabase.from("expenses").delete().eq("id", expenseId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
