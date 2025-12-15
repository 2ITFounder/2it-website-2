import { NextResponse } from "next/server"
import { z } from "zod"
import { createSupabaseRouteClient } from "../../../lib/supabase/route"
import { notifyAdmins } from "@/src/lib/push/server"

const ContactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  service: z.string().optional().nullable(),
  message: z.string().min(10),
})

const ContactUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  service: z.string().optional().nullable(),
  message: z.string().min(10).optional(),
})

export async function GET(req: Request) {
  const supabase = await createSupabaseRouteClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const qRaw = url.searchParams.get("q")?.trim()

  let query = supabase
    .from("contacts")
    .select("id,name,email,phone,service,message,created_at")
    .order("created_at", { ascending: false })

  if (qRaw) {
    // simple search on name/email/message
    query = query.or(`name.ilike.%${qRaw}%,email.ilike.%${qRaw}%,message.ilike.%${qRaw}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const supabase = await createSupabaseRouteClient()

  const body = await req.json().catch(() => null)
  const parsed = ContactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, email, phone, service, message } = parsed.data

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      name,
      email,
      phone: phone || null,
      service: service || null,
      message,
    })
    .select("id,name")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ĐY"" NOTIFICA PUSH (contatto pubblico, niente exclude)
  try {
    await notifyAdmins({
      title: "Nuovo contatto dal sito",
      body: `${name} ha inviato una richiesta dal form contatti.`,
      url: "/dashboard/contatti",
    })
  } catch (e) {
    console.error("notifyAdmins failed:", e)
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 })
}

export async function PATCH(req: Request) {
  const supabase = await createSupabaseRouteClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = ContactUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { id, ...updates } = parsed.data
  const cleaned: Record<string, any> = { ...updates }
  if (cleaned.phone === "") cleaned.phone = null
  if (cleaned.service === "") cleaned.service = null

  if (Object.keys(cleaned).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("contacts")
    .update(cleaned)
    .eq("id", id)
    .select("id,name,email,phone,service,message,created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: Request) {
  const supabase = await createSupabaseRouteClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { error } = await supabase.from("contacts").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
