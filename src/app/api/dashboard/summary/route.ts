import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function GET() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )

  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // KPI base
  const [{ count: clientsTotal }, { count: tasksDoing }, { count: projectsCompleted }, { count: projectsActive }] =
    await Promise.all([
      supabase.from("clients").select("*", { count: "exact", head: true }),
      supabase.from("project_tasks").select("*", { count: "exact", head: true }).eq("status", "DOING"),
      supabase.from("projects").select("*", { count: "exact", head: true }).not("completed_at", "is", null),
      supabase.from("projects").select("*", { count: "exact", head: true }).is("completed_at", null),
    ])

  // Progetti recenti
  const { data: recentProjects, error: rpErr } = await supabase
    .from("projects")
    .select("id,title,progress,client_id,status,updated_at,completed_at")
    .order("updated_at", { ascending: false })
    .limit(5)

  if (rpErr) return NextResponse.json({ error: rpErr.message }, { status: 500 })

  // Nome cliente (lookup)
  const clientIds = Array.from(new Set((recentProjects ?? []).map((p) => p.client_id).filter(Boolean)))
  let clientNameById: Record<string, string> = {}
  if (clientIds.length) {
    const { data: clients, error: cErr } = await supabase.from("clients").select("id,name").in("id", clientIds)
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })
    clientNameById = Object.fromEntries((clients ?? []).map((c) => [c.id, c.name]))
  }

  return NextResponse.json({
    data: {
      kpi: {
        clientsTotal: clientsTotal ?? 0,
        projectsActive: projectsActive ?? 0,
        projectsCompleted: projectsCompleted ?? 0,
        tasksDoing: tasksDoing ?? 0,
      },
      recentProjects: (recentProjects ?? []).map((p) => ({
        id: p.id,
        name: p.title,
        client: clientNameById[p.client_id] ?? "—",
        status: p.completed_at ? "COMPLETATO" : p.status, // o lascia solo p.status
        progress: Number(p.progress ?? 0),
      })),
    },
  })
}
