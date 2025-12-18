import { NextResponse } from "next/server"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"
import { ExpenseUpdateSchema } from "@/src/lib/expenses/schema"

type RouteContext = {
  params: { id: string }
}

export async function PATCH(req: Request, ctx: RouteContext) {
  const supabase = await createSupabaseRouteClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const expenseId = ctx.params?.id
  if (!expenseId) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const body = await req.json().catch(() => null)
  const parsed = ExpenseUpdateSchema.safeParse({ ...(body || {}), id: expenseId })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { id, ...updates } = parsed.data
  const cleaned: Record<string, any> = {
    ...updates,
  }

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

  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) delete cleaned[key]
  })

  if (Object.keys(cleaned).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("expenses")
    .update(cleaned)
    .eq("id", id)
    .select(
      "id,name,vendor,category,tags,amount,currency,cadence,first_due_date,next_due_date,active,split_mode,split_custom,notes,created_by,created_at"
    )
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const supabase = await createSupabaseRouteClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const expenseId = ctx.params?.id
  if (!expenseId) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { error } = await supabase.from("expenses").delete().eq("id", expenseId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
