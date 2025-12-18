import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id?: string } }
) {
  const supabase = await createSupabaseRouteClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 1) prova params
  let cycleId = params?.id

  // 2) prova query
  if (!cycleId) cycleId = req.nextUrl.searchParams.get("id") ?? undefined

  // 3) prova parse pathname: /api/expense-cycles/<id>/pay  => <id> è il penultimo segmento
  if (!cycleId) {
    const parts = req.nextUrl.pathname.split("/").filter(Boolean)
    const payIdx = parts.lastIndexOf("pay")
    if (payIdx > 0) cycleId = parts[payIdx - 1]
  }

  // 4) prova body
  if (!cycleId) {
    try {
      const body = (await req.json()) as { id?: string }
      if (body?.id) cycleId = body.id
    } catch {}
  }

  if (!cycleId) {
    // DEBUG utile se ricapita: ti dice che url sta vedendo davvero il server
    return NextResponse.json(
      {
        error: "Missing id",
        debug: { params, pathname: req.nextUrl.pathname, url: req.url },
      },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .rpc("pay_expense_cycle", { p_cycle_id: cycleId })
    .single()

  if (error) {
    const msg = error.message || "Errore pagamento ciclo"
    const normalized = msg.toLowerCase()
    if (normalized.includes("already paid")) return NextResponse.json({ error: msg }, { status: 409 })
    if (normalized.includes("not authorized")) return NextResponse.json({ error: msg }, { status: 403 })
    if (normalized.includes("not found")) return NextResponse.json({ error: msg }, { status: 404 })
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json({ data })
}
