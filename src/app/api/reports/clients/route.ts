import { NextResponse } from "next/server"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"

export async function GET() {
  const supabase = await createSupabaseRouteClient()

  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [{ data: clients, error: cErr }, { data: projects, error: pErr }] = await Promise.all([
    supabase.from("clients").select("id,name,status,created_at"),
    supabase.from("projects").select("id,client_id,progress,completed_at"),
  ])

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 })
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 })

  const map = new Map<string, { total: number; active: number; completed: number; progressSum: number }>()
  for (const p of projects ?? []) {
    const cur = map.get(p.client_id) ?? { total: 0, active: 0, completed: 0, progressSum: 0 }
    cur.total += 1
    const isCompleted = !!p.completed_at
    if (isCompleted) cur.completed += 1
    else cur.active += 1
    cur.progressSum += Number(p.progress ?? 0)
    map.set(p.client_id, cur)
  }

  const rows = (clients ?? []).map((c) => {
    const agg = map.get(c.id) ?? { total: 0, active: 0, completed: 0, progressSum: 0 }
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      projectsTotal: agg.total,
      projectsActive: agg.active,
      projectsCompleted: agg.completed,
      progressAvg: agg.total ? Math.round(agg.progressSum / agg.total) : 0,
    }
  })

  rows.sort((a, b) => b.projectsActive - a.projectsActive)

  return NextResponse.json({ data: rows })
}
