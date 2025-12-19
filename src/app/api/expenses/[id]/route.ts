import { NextResponse } from "next/server"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"
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

  if (cleaned.split_mode && cleaned.split_mode !== "custom") {
    cleaned.split_custom = null
  } else if (cleaned.split_mode === "custom" && !cleaned.split_custom) {
    cleaned.split_custom = {}
  } else if (cleaned.split_custom && !cleaned.split_mode) {
    cleaned.split_mode = "custom"
  }

  Object.keys(cleaned).forEach((k) => cleaned[k] === undefined && delete cleaned[k])

  if (Object.keys(cleaned).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("expenses")
    .update(cleaned)
    .eq("id", expenseId)
    .select(
      "id,name,vendor,category,tags,amount,currency,cadence,first_due_date,next_due_date,active,split_mode,split_custom,notes,created_by,created_at"
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

  // <--- Await params
  const { id: expenseId } = await params

  if (!expenseId) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { error } = await supabase.from("expenses").delete().eq("id", expenseId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}