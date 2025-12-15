import { NextResponse } from "next/server"
import { z } from "zod"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"

const MarkReadSchema = z.union([
  z.object({ ids: z.array(z.string().uuid()).min(1) }),
  z.object({ all: z.literal(true) }),
])

const MAX_LIMIT = 50

export async function GET(req: Request) {
  const supabase = await createSupabaseRouteClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const limitRaw = Number(url.searchParams.get("limit") ?? "20")
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(1, limitRaw), MAX_LIMIT) : 20

  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,body,type,link,is_read,created_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { count: unreadCount, error: unreadErr } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id)
    .eq("is_read", false)

  if (unreadErr) return NextResponse.json({ error: unreadErr.message }, { status: 500 })

  return NextResponse.json({ data: { items: data, unreadCount: unreadCount ?? 0 } })
}

export async function PATCH(req: Request) {
  const supabase = await createSupabaseRouteClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = MarkReadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload non valido" }, { status: 400 })
  }

  const payload = parsed.data

  let query = supabase.from("notifications").update({ is_read: true }).eq("user_id", auth.user.id)
  if (!("all" in payload)) {
    query = query.in("id", payload.ids)
  }

  const { data, error } = await query.select("id")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ updated: data?.map((d: any) => d.id) ?? [] })
}
