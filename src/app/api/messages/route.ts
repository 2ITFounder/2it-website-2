"use server"

import { NextResponse } from "next/server"
import { z } from "zod"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"
import { createSupabaseServiceClient } from "@/src/lib/supabase/service"
import { ensureChatMembership } from "@/src/features/messages/server/message-service"
import { notifyUsers } from "@/src/lib/push/server"

const MessagePostSchema = z.object({
  chat_id: z.string().uuid().optional(),
  receiver_id: z.string().uuid().optional(),
  body: z.string().min(1, "Messaggio vuoto").max(5000),
  client_temp_id: z.string().min(4).max(128).optional(),
})

const MessageQuerySchema = z.object({
  chat_id: z.string().uuid(),
  limit: z.coerce.number().min(1).max(200).optional(),
  // Postgres timestamp può avere microsecondi: evitare valida rigidissima ISO
  before: z.string().optional(),
})

const MessageUpdateSchema = z.object({
  id: z.string().uuid(),
  tag: z.enum(["important", "idea", "none"]),
})

const MessageDeleteSchema = z.object({
  id: z.string().uuid(),
})

export async function GET(req: Request) {
  const supabaseAuth = await createSupabaseRouteClient()
  const { data: auth } = await supabaseAuth.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const limitParam = url.searchParams.get("limit")
  const beforeParam = url.searchParams.get("before")
  const parsed = MessageQuerySchema.safeParse({
    chat_id: url.searchParams.get("chat_id"),
    limit: limitParam ? limitParam : undefined,
    before: beforeParam || undefined,
  })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const supabase = createSupabaseServiceClient()

  try {
    const members = await ensureChatMembership(parsed.data.chat_id, auth.user.id)

    const limit = parsed.data.limit ?? 50
    let query = supabase
      .from("messages")
      .select("id, chat_id, sender_id, body, status, created_at, tag, client_temp_id")
      .eq("chat_id", parsed.data.chat_id)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (parsed.data.before) {
      query = query.lt("created_at", parsed.data.before)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // ordina cronologico crescente per il client
    const sorted = (data ?? []).slice().sort((a, b) => a.created_at.localeCompare(b.created_at))
    const nextCursor = sorted.length === limit ? sorted[0]?.created_at ?? null : null

    return NextResponse.json({
      data: {
        items: sorted,
        members,
        nextCursor,
      },
    })
  } catch (e: any) {
    const status = e?.status ?? 500
    return NextResponse.json({ error: e?.message ?? "Errore caricamento chat" }, { status })
  }
}

export async function POST(req: Request) {
  const supabaseAuth = await createSupabaseRouteClient()
  const { data: auth } = await supabaseAuth.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = MessagePostSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const supabase = createSupabaseServiceClient()

  let chatId = parsed.data.chat_id ?? null
  let members: string[] = []

  try {
    if (chatId) {
      members = await ensureChatMembership(chatId, auth.user.id)
    } else {
      const receiverId = parsed.data.receiver_id
      if (!receiverId) return NextResponse.json({ error: "receiver_id richiesto" }, { status: 400 })

      // trova chat 1:1 esistente
      const { data: existingMembers, error: memberErr } = await supabase
        .from("chat_members")
        .select("chat_id, user_id")
        .in("user_id", [auth.user.id, receiverId])
      if (memberErr) throw memberErr

      const chatCounts = new Map<string, Set<string>>()
      for (const row of existingMembers ?? []) {
        if (!chatCounts.has(row.chat_id)) chatCounts.set(row.chat_id, new Set<string>())
        chatCounts.get(row.chat_id)!.add(row.user_id)
      }
      const foundChat = Array.from(chatCounts.entries()).find(([, set]) => set.has(auth.user.id) && set.has(receiverId))
      if (foundChat) {
        chatId = foundChat[0]
        members = Array.from(chatCounts.get(chatId) ?? [])
      } else {
        const { data: chatRow, error: chatErr } = await supabase
          .from("chats")
          .insert({ is_group: false })
          .select("id")
          .single()
        if (chatErr) throw chatErr
        chatId = chatRow.id
        const toInsert = [
          { chat_id: chatId, user_id: auth.user.id },
          { chat_id: chatId, user_id: receiverId },
        ]
        const { error: memErr } = await supabase.from("chat_members").insert(toInsert)
        if (memErr) throw memErr
        members = [auth.user.id, receiverId]
      }
    }

    if (!chatId) throw new Error("Chat non trovata")

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        sender_id: auth.user.id,
        body: parsed.data.body,
        status: "sent",
        tag: null,
        client_temp_id: parsed.data.client_temp_id ?? null,
      })
      .select("id, chat_id, sender_id, body, status, created_at, tag, client_temp_id")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // aggiorna updated_at chat
    await supabase.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", chatId)

    // Notifiche agli altri membri
    const recipients = members.filter((id) => id !== auth.user.id)
    if (recipients.length > 0) {
      await notifyUsers(recipients, {
        title: "Nuovo messaggio",
        body: parsed.data.body.slice(0, 140),
        url: `/dashboard/messaggi?chatId=${chatId}`,
        type: "message",
        chatId,
      })
    }

    return NextResponse.json({ data: message })
  } catch (e: any) {
    const status = e?.status ?? 500
    return NextResponse.json({ error: e?.message ?? "Errore invio messaggio" }, { status })
  }
}

export async function PATCH(req: Request) {
  const supabaseAuth = await createSupabaseRouteClient()
  const { data: auth } = await supabaseAuth.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = MessageUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const supabase = createSupabaseServiceClient()

  try {
    const { data: messageRow, error: fetchErr } = await supabase
      .from("messages")
      .select("id, chat_id")
      .eq("id", parsed.data.id)
      .maybeSingle()
    if (fetchErr) throw fetchErr
    if (!messageRow) return NextResponse.json({ error: "Messaggio non trovato" }, { status: 404 })

    await ensureChatMembership(messageRow.chat_id, auth.user.id)

    const nextTag = parsed.data.tag === "none" ? null : parsed.data.tag
    const { data, error } = await supabase
      .from("messages")
      .update({ tag: nextTag })
      .eq("id", parsed.data.id)
      .select("id, chat_id, sender_id, body, status, created_at, tag, client_temp_id")
      .single()
    if (error) throw error

    return NextResponse.json({ data })
  } catch (e: any) {
    const status = e?.status ?? 500
    return NextResponse.json({ error: e?.message ?? "Errore aggiornamento messaggio" }, { status })
  }
}

export async function DELETE(req: Request) {
  const supabaseAuth = await createSupabaseRouteClient()
  const { data: auth } = await supabaseAuth.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = MessageDeleteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const supabase = createSupabaseServiceClient()

  try {
    const { data: messageRow, error: fetchErr } = await supabase
      .from("messages")
      .select("id, chat_id")
      .eq("id", parsed.data.id)
      .maybeSingle()
    if (fetchErr) throw fetchErr
    if (!messageRow) return NextResponse.json({ error: "Messaggio non trovato" }, { status: 404 })

    await ensureChatMembership(messageRow.chat_id, auth.user.id)

    const { error } = await supabase.from("messages").delete().eq("id", parsed.data.id)
    if (error) throw error

    return NextResponse.json({ deleted: parsed.data.id })
  } catch (e: any) {
    const status = e?.status ?? 500
    return NextResponse.json({ error: e?.message ?? "Errore eliminazione messaggio" }, { status })
  }
}
