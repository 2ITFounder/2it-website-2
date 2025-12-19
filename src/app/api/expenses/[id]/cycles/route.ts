import { NextResponse } from "next/server"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"

type Params = { id: string } // Togli il ? opzionale, l'id c'è sempre nella rotta

export async function GET(
  req: Request,
  // 1. Modifica qui: params è una Promise
  { params }: { params: Promise<Params> }
) {
  const supabase = await createSupabaseRouteClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // 2. Modifica qui: devi fare AWAIT di params
  const { id: expenseId } = await params

  if (!expenseId) return NextResponse.json({ error: "Missing expense id" }, { status: 400 })

  const { data, error } = await supabase
    .from("expense_cycles")
    .select("id,expense_id,due_date,amount,status,paid_at,created_at")
    .eq("expense_id", expenseId)
    .order("due_date", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}