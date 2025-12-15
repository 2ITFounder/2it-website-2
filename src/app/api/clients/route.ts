import { NextResponse } from "next/server"
import { z } from "zod"
import { createSupabaseRouteClient } from "../../../lib/supabase/route"
import { notifyAdmins } from "@/src/lib/push/server"

const ClientCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  status: z.enum(["ATTIVO", "INATTIVO"]).optional(),
})

const ClientUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal("")),
  status: z.enum(["ATTIVO", "INATTIVO"]).optional(),
})

const ClientStatusSchema = z.enum(["ATTIVO", "INATTIVO"])

export async function GET(req: Request) {
  const supabase = await createSupabaseRouteClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const q = url.searchParams.get("q")?.trim()
  const statusRaw = url.searchParams.get("status")?.trim()

  const statusParsed = statusRaw ? ClientStatusSchema.safeParse(statusRaw) : null
  if (statusRaw && !statusParsed?.success) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 })
  }

  let query = supabase
    .from("clients")
    .select("id,name,email,status,created_at,updated_at")
    .order("created_at", { ascending: false })

  if (statusParsed?.success) query = query.eq("status", statusParsed.data)
  if (q) query = query.ilike("name", `%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const supabase = await createSupabaseRouteClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = ClientCreateSchema.safeParse(body)
  if (!parsed.success) {
    const flat = parsed.error.flatten()
    const msgs = [
      ...(flat.formErrors ?? []),
      ...Object.values(flat.fieldErrors ?? {}).flat(),
    ].filter(Boolean)

    return NextResponse.json(
      { error: msgs.join(", ") || "Dati non validi" },
      { status: 400 }
    )
  }

  const { name, email, status } = parsed.data

  const { data, error } = await supabase
    .from("clients")
    .insert({
      user_id: auth.user.id,
      name,
      email: email || null,
      status: status ?? "ATTIVO",
    })
    .select("id,name,email,status,created_at,updated_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    await notifyAdmins(
      {
        title: "Nuovo cliente",
        body: `${auth.user.email} ha aggiunto ${data.name}`,
        url: "/dashboard/clienti",
      },
      { excludeUserId: auth.user.id }
    )
  } catch (e) {
    console.error("notifyAdmins failed:", e)
  }


  return NextResponse.json({ data }, { status: 201 })
}

export async function PATCH(req: Request) {
  const supabase = await createSupabaseRouteClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get("id")?.trim()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const body = await req.json().catch(() => null)
  const parsed = ClientUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, email, status } = parsed.data

  const payload: Record<string, any> = {}
  if (typeof name === "string") payload.name = name
  if (typeof email === "string") payload.email = email || null
  if (typeof status === "string") payload.status = status

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", id)
    .select("id,name,email,status,created_at,updated_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 200 })
}
export async function DELETE(req: Request) {
  const supabase = await createSupabaseRouteClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get("id")?.trim()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  // 1) verifica se ci sono progetti associati
  const { data: anyProject, error: projErr } = await supabase
    .from("projects")
    .select("id")
    .eq("client_id", id)
    .eq("user_id", auth.user.id)
    .limit(1)
    .maybeSingle()

  if (projErr) return NextResponse.json({ error: projErr.message }, { status: 400 })

  if (anyProject) {
    return NextResponse.json(
      { error: "Impossibile eliminare il cliente: elimina prima i progetti associati." },
      { status: 409 } // Conflict
    )
  }

  // 2) elimina cliente (solo se appartiene all’utente)
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

