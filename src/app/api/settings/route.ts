import { NextResponse } from "next/server"
import { z } from "zod"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"

const SettingsSchema = z.object({
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  notifications_email: z.boolean(),
  notifications_push: z.boolean(),
  notifications_weekly: z.boolean(),
})

async function requireUser(supabase: any) {
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user ?? null
}

export async function GET() {
  const supabase = await createSupabaseRouteClient()
  const user = await requireUser(supabase)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // ✅ 1) prova a prendere UNA riga; se non c’è torna null senza errore
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  // errore “vero”
  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // ✅ 2) se non esiste, crea la riga (assumendo defaults DB)
  if (!data) {
    const { data: created, error: insErr } = await supabase
      .from("user_settings")
      .insert({ user_id: user.id })
      .select("*")
      .single()

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 })
    return NextResponse.json({ data: created })
  }

  return NextResponse.json({ data })
}

export async function PUT(req: Request) {
  const supabase = await createSupabaseRouteClient()
  const user = await requireUser(supabase)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = SettingsSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const payload = { ...parsed.data, user_id: user.id, updated_at: new Date().toISOString() }

  const { data, error } = await supabase
    .from("user_settings")
    .upsert(payload, { onConflict: "user_id" }) // ✅ con UNIQUE in DB diventa affidabile
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
