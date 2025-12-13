import { NextResponse } from "next/server"
import { z } from "zod"
import { createSupabaseRouteClient } from "../../../lib/supabase/route"

const TaskStatusSchema = z.enum(["TODO", "DOING", "DONE"])

const TaskCreateSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  status: TaskStatusSchema.optional(),
  priority: z.number().int().min(1).max(5).optional(),
  weight: z.number().int().min(1).max(100).optional(),
  due_date: z.string().optional().nullable(), // YYYY-MM-DD
})

const TaskPatchSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    status: TaskStatusSchema.optional(),
    priority: z.number().int().min(1).max(5).optional(),
    weight: z.number().int().min(1).max(100).optional(),
    due_date: z.string().optional().nullable(),

    // ordinamento "su/giù"
    move: z.enum(["UP", "DOWN"]).optional(),

    // pronto per drag&drop: passerai un array di {id, position}
    reorder: z
      .array(
        z.object({
          id: z.string().uuid(),
          position: z.number().int(),
        })
      )
      .optional(),
  })
  .strict()

async function requireUser(supabase: any) {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) return null
  return data.user
}

async function recomputeProjectProgress(supabase: any, projectId: string) {
  const { data: tasks, error } = await supabase
    .from("project_tasks")
    .select("status, weight")
    .eq("project_id", projectId)

  if (error) return

  const total = (tasks ?? []).reduce((a: number, t: any) => a + (Number(t.weight) || 0), 0)
  const done = (tasks ?? []).reduce(
    (a: number, t: any) => a + (t.status === "DONE" ? (Number(t.weight) || 0) : 0),
    0
  )

  const progress = total <= 0 ? 0 : Math.round((done / total) * 100)
  const isCompleted = progress >= 100

  await supabase
    .from("projects")
    .update({
      progress,
      completed_at: isCompleted ? new Date().toISOString() : null,
      status: isCompleted ? "COMPLETATO" : "IN_CORSO",
    })
    .eq("id", projectId)
}


export async function GET(req: Request) {
  const supabase = await createSupabaseRouteClient()
  const user = await requireUser(supabase)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const project_id = url.searchParams.get("project_id")
  if (!project_id) return NextResponse.json({ error: "Missing project_id" }, { status: 400 })

  const { data, error } = await supabase
    .from("project_tasks")
    .select("id, project_id, title, description, status, priority, weight, due_date, position, created_at, updated_at")
    .eq("project_id", project_id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const supabase = await createSupabaseRouteClient()
  const user = await requireUser(supabase)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = TaskCreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  // posizione: append in fondo
  const { data: last, error: lastErr } = await supabase
    .from("project_tasks")
    .select("position")
    .eq("project_id", parsed.data.project_id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastErr) return NextResponse.json({ error: lastErr.message }, { status: 400 })

  const nextPos = (last?.position ?? -1) + 1

  const payload = {
    user_id: user.id,
    project_id: parsed.data.project_id,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    status: parsed.data.status ?? "TODO",
    priority: parsed.data.priority ?? 3,
    weight: parsed.data.weight ?? 1,
    due_date: parsed.data.due_date ?? null,
    position: nextPos,
  }

  const { data, error } = await supabase.from("project_tasks").insert(payload).select("*").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await recomputeProjectProgress(supabase, parsed.data.project_id)

  return NextResponse.json({ data })
}

export async function PATCH(req: Request) {
  const supabase = await createSupabaseRouteClient()
  const user = await requireUser(supabase)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = TaskPatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { id, move, reorder, ...updates } = parsed.data

  // carico task (serve per project_id e per posizione)
  const { data: current, error: curErr } = await supabase
    .from("project_tasks")
    .select("id, project_id, position")
    .eq("id", id)
    .single()

  if (curErr) return NextResponse.json({ error: curErr.message }, { status: 400 })

  // ✅ Reorder batch (per drag&drop futuro)
  if (Array.isArray(reorder) && reorder.length > 0) {
    // semplice: update per ogni task (ok per piccole liste; se vuoi lo facciamo RPC dopo)
    for (const item of reorder) {
      await supabase
        .from("project_tasks")
        .update({ position: item.position })
        .eq("id", item.id)
        .eq("project_id", current.project_id)
    }

    await recomputeProjectProgress(supabase, current.project_id)
    return NextResponse.json({ ok: true })
  }

  // ✅ Move UP/DOWN (swap position col vicino)
  if (move) {
    const direction = move

    if (direction === "UP") {
      const { data: prev } = await supabase
        .from("project_tasks")
        .select("id, position")
        .eq("project_id", current.project_id)
        .lt("position", current.position)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (prev) {
        await supabase.from("project_tasks").update({ position: prev.position }).eq("id", current.id)
        await supabase.from("project_tasks").update({ position: current.position }).eq("id", prev.id)
      }
    }

    if (direction === "DOWN") {
      const { data: next } = await supabase
        .from("project_tasks")
        .select("id, position")
        .eq("project_id", current.project_id)
        .gt("position", current.position)
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle()

      if (next) {
        await supabase.from("project_tasks").update({ position: next.position }).eq("id", current.id)
        await supabase.from("project_tasks").update({ position: current.position }).eq("id", next.id)
      }
    }

    await recomputeProjectProgress(supabase, current.project_id)
    return NextResponse.json({ ok: true })
  }

  // ✅ normal update
  const cleaned: any = { ...updates }
  if (cleaned.description === "") cleaned.description = null
  if (cleaned.due_date === "") cleaned.due_date = null

  const { data, error } = await supabase
    .from("project_tasks")
    .update(cleaned)
    .eq("id", id)
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await recomputeProjectProgress(supabase, current.project_id)

  return NextResponse.json({ data })
}

export async function DELETE(req: Request) {
  const supabase = await createSupabaseRouteClient()
  const user = await requireUser(supabase)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { data: current, error: curErr } = await supabase
    .from("project_tasks")
    .select("id, project_id")
    .eq("id", id)
    .single()

  if (curErr) return NextResponse.json({ error: curErr.message }, { status: 400 })

  const { error } = await supabase.from("project_tasks").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await recomputeProjectProgress(supabase, current.project_id)

  return NextResponse.json({ ok: true })
}
