import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: paramId } = await ctx.params

  const supabase = await createSupabaseRouteClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 1) params
  let cycleId: string | undefined = paramId

  // 2) query
  if (!cycleId) cycleId = req.nextUrl.searchParams.get("id") ?? undefined

  // 3) parse pathname: /api/expense-cycles/<id>/pay
  if (!cycleId) {
    const parts = req.nextUrl.pathname.split("/").filter(Boolean)
    const payIdx = parts.lastIndexOf("pay")
    if (payIdx > 0) cycleId = parts[payIdx - 1]
  }

  // 4) body
  if (!cycleId) {
    try {
      const body = (await req.json()) as { id?: string }
      if (body?.id) cycleId = body.id
    } catch {}
  }

  if (!cycleId) {
    return NextResponse.json(
      { error: "Missing id", debug: { paramId, pathname: req.nextUrl.pathname, url: req.url } },
      { status: 400 }
    )
  }

  // ✅ UNA SOLA RPC + debug completo
  const rpcRes = await supabase.rpc("pay_expense_cycle", { p_cycle_id: cycleId })

  if (rpcRes.error) {
    const msg = rpcRes.error.message || "Errore pagamento ciclo"
    const normalized = msg.toLowerCase()

    // se vuoi mantenere mapping status:
    if (normalized.includes("already paid")) {
      return NextResponse.json({ error: msg, debug: rpcRes.error }, { status: 409 })
    }
    if (normalized.includes("not authorized")) {
      return NextResponse.json({ error: msg, debug: rpcRes.error }, { status: 403 })
    }
    if (normalized.includes("not found")) {
      return NextResponse.json({ error: msg, debug: rpcRes.error }, { status: 404 })
    }

    return NextResponse.json({ error: msg, debug: rpcRes.error }, { status: 400 })
  }

  return NextResponse.json({ data: rpcRes.data })
}
