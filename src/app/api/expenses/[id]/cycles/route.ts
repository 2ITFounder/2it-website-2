import { NextResponse } from "next/server"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"

type Params = { id?: string }

export async function GET(req: Request, { params }: { params: Params }) {
  const supabase = await createSupabaseRouteClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const expenseId = params?.id
  if (!expenseId) return NextResponse.json({ error: "Missing expense id" }, { status: 400 })

  const { data, error } = await supabase
    .from("expense_cycles")
    .select("id,expense_id,due_date,amount,status,paid_at,created_at")
    .eq("expense_id", expenseId)
    .order("due_date", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
