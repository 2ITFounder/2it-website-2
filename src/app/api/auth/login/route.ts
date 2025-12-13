import { NextResponse } from "next/server"
import { z } from "zod"
import { createSupabaseRouteClient } from "../../../../lib/supabase/route"

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(req: Request) {
  const supabase = await createSupabaseRouteClient()

  const body = await req.json().catch(() => null)
  const parsed = LoginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { email, password } = parsed.data

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  // Se sign-in OK, @supabase/ssr scrive i cookie via setAll()
  return NextResponse.json({ ok: true }, { status: 200 })
}
