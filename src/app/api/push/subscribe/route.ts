import { NextResponse } from "next/server"
import { z } from "zod"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"

const BodySchema = z.object({
  endpoint: z.string().min(10),
  keys: z.object({
    p256dh: z.string().min(10),
    auth: z.string().min(10),
  }),
})

async function requireUser(supabase: any) {
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user ?? null
}

export async function POST(req: Request) {
  const supabase = await createSupabaseRouteClient()
  const user = await requireUser(supabase)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = BodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const { endpoint, keys } = parsed.data

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      { onConflict: "endpoint" }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (process.env.NODE_ENV !== "production") {
    console.info("[push] subscribe ok", { userId: user.id, endpoint })
  }
  return NextResponse.json({ ok: true })
}
