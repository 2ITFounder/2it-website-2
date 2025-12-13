import { NextResponse } from "next/server"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"

export async function GET() {
  const supabase = await createSupabaseRouteClient()

  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [{ data: projects, error: pErr }, { data: tasks, error: tErr }] = await Promise.all([
    supabase
      .from("projects")
      .select("id,title,client_id,progress,status,deadline,due_date,completed_at,updated_at")
      .order("updated_at", { ascending: false }),
    supabase
      .from("project_tasks")
      .select("id,project_id,status,due_date,weight"),
  ])

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 })
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 400 })

  const now = new Date()

  const byProject = new Map<
    string,
    { total: number; doing: number; done: number; overdue: number; nextDue: string | null }
  >()

  for (const t of tasks ?? []) {
    const cur = byProject.get(t.project_id) ?? { total: 0, doing: 0, done: 0, overdue: 0, nextDue: null }
    cur.total += 1
    if (t.status === "DOING") cur.doing += 1
    if (t.status === "DONE") cur.done += 1

    if (t.due_date) {
      const d = new Date(t.due_date)
      const isOverdue = d < now && t.status !== "DONE"
      if (isOverdue) cur.overdue += 1

      // prossima scadenza (solo task non DONE)
      if (t.status !== "DONE") {
        if (!cur.nextDue || new Date(t.due_date) < new Date(cur.nextDue)) cur.nextDue = t.due_date
      }
    }

    byProject.set(t.project_id, cur)
  }

  const clientIds = Array.from(new Set((projects ?? []).map((p) => p.client_id).filter(Boolean)))
  let clientNameById: Record<string, string> = {}
  if (clientIds.length) {
    const { data: clients } = await supabase.from("clients").select("id,name").in("id", clientIds)
    clientNameById = Object.fromEntries((clients ?? []).map((c) => [c.id, c.name]))
  }

  const rows = (projects ?? []).map((p) => {
    const agg = byProject.get(p.id) ?? { total: 0, doing: 0, done: 0, overdue: 0, nextDue: null }
    return {
      id: p.id,
      title: p.title,
      client: clientNameById[p.client_id] ?? "—",
      status: p.completed_at ? "COMPLETATO" : p.status,
      progress: Number(p.progress ?? 0),
      tasksTotal: agg.total,
      tasksDoing: agg.doing,
      tasksDone: agg.done,
      overdue: agg.overdue,
      nextDue: agg.nextDue,
    }
  })

  return NextResponse.json({ data: rows })
}
