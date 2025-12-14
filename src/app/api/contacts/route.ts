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

  // 🔔 NOTIFICA PUSH (contatto pubblico, niente exclude)
  await notifyAdmins({
    title: "Nuovo contatto dal sito",
    body: `${name} ha inviato una richiesta`,
    url: "/dashboard/contatti",
  })

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 })
}
