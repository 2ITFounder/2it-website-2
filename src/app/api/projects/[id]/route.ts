import { NextResponse } from "next/server"
import { createSupabaseRouteClient } from "../../../../lib/supabase/route"

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params

  const supabase = await createSupabaseRouteClient()

  const { data: auth, error: authErr } = await supabase.auth.getUser()
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id, client_id, title, description, type, status, priority, progress, due_date, created_at, updated_at")
    .eq("id", id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
