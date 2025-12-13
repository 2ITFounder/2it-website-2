import { NextResponse } from "next/server"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {

  const supabase = await createSupabaseRouteClient()

  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: clientId } = await ctx.params

  const { data: client, error: cErr } = await supabase
    .from("clients")
    .select("id,name,email,status,created_at,updated_at")
    .eq("id", clientId)
    .single()
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 })

  const { data: projects, error: pErr } = await supabase
    .from("projects")
    .select("id,title,status,progress,completed_at,deadline,due_date,updated_at")
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false })
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 })

  const total = projects?.length ?? 0
  const completed = (projects ?? []).filter((p) => !!p.completed_at).length
  const active = total - completed
  const progressAvg = total ? Math.round((projects ?? []).reduce((a, p) => a + Number(p.progress ?? 0), 0) / total) : 0

  return NextResponse.json({
    data: {
      client,
      kpi: { projectsTotal: total, projectsActive: active, projectsCompleted: completed, progressAvg },
      projects,
    },
  })
}
