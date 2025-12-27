import { NextResponse } from "next/server"
import { z } from "zod"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"
import { createSupabaseServiceClient } from "@/src/lib/supabase/service"

const UpdateSchema = z.object({
  user_id: z.string().uuid(),
  include_in_expenses: z.boolean(),
})

type ExpenseUserRow = {
  user_id: string
  username: string | null
  email: string | null
  include_in_expenses: boolean
}

function sortExpenseUsers(a: ExpenseUserRow, b: ExpenseUserRow) {
  const aLabel = (a.username || a.email || a.user_id).toLowerCase()
  const bLabel = (b.username || b.email || b.user_id).toLowerCase()
  return aLabel.localeCompare(bLabel)
}

export async function GET() {
  const supabaseAuth = await createSupabaseRouteClient()
  const { data: auth } = await supabaseAuth.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createSupabaseServiceClient()
  const { data: admin, error: adminErr } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", auth.user.id)
    .maybeSingle()
  if (adminErr) return NextResponse.json({ error: adminErr.message }, { status: 500 })
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("expense_users")
    .select("user_id,username,email,include_in_expenses")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const items = (data ?? []).slice().sort(sortExpenseUsers)
  return NextResponse.json({ data: items })
}

export async function PATCH(req: Request) {
  const supabaseAuth = await createSupabaseRouteClient()
  const { data: auth } = await supabaseAuth.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createSupabaseServiceClient()
  const { data: admin, error: adminErr } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", auth.user.id)
    .maybeSingle()
  if (adminErr) return NextResponse.json({ error: adminErr.message }, { status: 500 })
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { error } = await supabase
    .from("admin_users")
    .update({ include_in_expenses: parsed.data.include_in_expenses })
    .eq("user_id", parsed.data.user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data: { user_id: parsed.data.user_id, include_in_expenses: parsed.data.include_in_expenses },
  })
}
