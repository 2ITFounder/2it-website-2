import { NextResponse } from "next/server"
import { z } from "zod"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"

const BodySchema = z.object({
  chatId: z.string().uuid(),
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

  const { chatId } = parsed.data

  const { error } = await supabase
    .from("chat_presence")
    .upsert(
      { user_id: user.id, chat_id: chatId, last_seen_at: new Date().toISOString() },
      { onConflict: "user_id,chat_id" }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (process.env.NODE_ENV !== "production") {
    console.info("[presence] heartbeat", { userId: user.id, chatId })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const supabase = await createSupabaseRouteClient()
  const user = await requireUser(supabase)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = BodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const { chatId } = parsed.data

  const { error } = await supabase
    .from("chat_presence")
    .delete()
    .eq("user_id", user.id)
    .eq("chat_id", chatId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (process.env.NODE_ENV !== "production") {
    console.info("[presence] clear", { userId: user.id, chatId })
  }
  return NextResponse.json({ ok: true })
}
