import { NextResponse } from "next/server"
import { z } from "zod"
import { createSupabaseRouteClient } from "../../../lib/supabase/route"

const ProjectTypeSchema = z.enum([
  "SITO_VETRINA",
  "ECOMMERCE",
  "GESTIONALE",
  "DASHBOARD",
  "APP",
  "ALTRO",
])

const ProjectStatusSchema = z.enum([
  "LEAD",
  "IN_CORSO",
  "IN_REVISIONE",
  "COMPLETATO",
  "IN_PAUSA",
  "ANNULLATO",
])

const ProjectCreateSchema = z.object({
  client_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),

  type: ProjectTypeSchema.optional(),
  status: ProjectStatusSchema.optional(),

  priority: z.number().int().min(1).max(5).optional(),
  progress: z.number().int().min(0).max(100).optional(),

  budget_cents: z.number().int().nonnegative().optional().nullable(),
  tech_stack: z.array(z.string()).optional(),

  start_date: z.string().optional().nullable(), // YYYY-MM-DD
  due_date: z.string().optional().nullable(),   // YYYY-MM-DD
  meta: z.record(z.any()).optional(),
})

const ProjectPatchSchema = ProjectCreateSchema.partial().extend({
  id: z.string().uuid(),
})

// ✅ helper: NON prende argomenti, crea lui il client (await!)
async function requireUser() {
  const supabase = await createSupabaseRouteClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) return null

  return { supabase, user: data.user }
}

export async function GET() {
  const ctx = await requireUser()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { supabase } = ctx

  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, client_id, title, description, type, status, priority, progress, budget_cents, tech_stack, start_date, due_date, completed_at, meta, created_at, updated_at"
    )
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const ctx = await requireUser()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { supabase, user } = ctx

  const body = await req.json().catch(() => ({}))
  const parsed = ProjectCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const payload = {
    user_id: user.id,
    client_id: parsed.data.client_id,
    title: parsed.data.title,
    description: parsed.data.description ?? null,

    type: parsed.data.type ?? "ALTRO",
    status: parsed.data.status ?? "LEAD",

    priority: parsed.data.priority ?? 3,
    progress: parsed.data.progress ?? 0,

    budget_cents: parsed.data.budget_cents ?? null,
    tech_stack: parsed.data.tech_stack ?? [],

    start_date: parsed.data.start_date ?? null,
    due_date: parsed.data.due_date ?? null,

    meta: parsed.data.meta ?? {},
  }

  const { data, error } = await supabase
    .from("projects")
    .insert(payload)
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function PATCH(req: Request) {
  const ctx = await requireUser()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { supabase } = ctx

  const body = await req.json().catch(() => ({}))
  const parsed = ProjectPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { id, ...updates } = parsed.data

  // pulizia opzionale: stringa vuota => null
  const cleaned: Record<string, any> = { ...updates }
  if (cleaned.description === "") cleaned.description = null
  if (cleaned.start_date === "") cleaned.start_date = null
  if (cleaned.due_date === "") cleaned.due_date = null

  const { data, error } = await supabase
    .from("projects")
    .update(cleaned)
    .eq("id", id)
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function DELETE(req: Request) {
  const ctx = await requireUser()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { supabase } = ctx

  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { error } = await supabase.from("projects").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
