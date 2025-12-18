import { NextResponse } from "next/server"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"

type RouteContext = {
  params: { id: string }
}

export async function PATCH(_req: Request, ctx: RouteContext) {
  const supabase = await createSupabaseRouteClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const cycleId = ctx.params?.id
  if (!cycleId) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { data, error } = await supabase.rpc("pay_expense_cycle", { p_cycle_id: cycleId }).single()

  if (error) {
    const msg = error.message || "Errore pagamento ciclo"
    const normalized = msg.toLowerCase()
    if (normalized.includes("not authorized")) {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    if (normalized.includes("not found")) {
      return NextResponse.json({ error: msg }, { status: 404 })
    }
    if (normalized.includes("already paid")) {
      return NextResponse.json({ error: msg }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json({ data })
}
