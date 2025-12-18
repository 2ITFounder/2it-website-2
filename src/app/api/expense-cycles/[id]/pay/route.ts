import { NextResponse } from "next/server"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseRouteClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Next ti garantisce params: { id: string } se la route è corretta.
  // Ma teniamo fallback in caso di runtime strani.
  let cycleId: string = params.id

  // fallback: query param
  if (!cycleId) {
    cycleId = new URL(req.url).searchParams.get("id") ?? ""
  }

  // fallback: path (/api/expense-cycles/<id>/pay)
  if (!cycleId) {
    const parts = new URL(req.url).pathname.split("/").filter(Boolean)
    const idx = parts.lastIndexOf("expense-cycles")
    if (idx >= 0 && parts[idx + 1]) cycleId = parts[idx + 1]
  }

  // fallback: body
  if (!cycleId) {
    try {
      const body = (await req.json()) as { id?: string }
      if (body?.id) cycleId = body.id
    } catch {}
  }

  if (!cycleId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  const { data, error } = await supabase
    .rpc("pay_expense_cycle", { p_cycle_id: cycleId })
    .single()

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
