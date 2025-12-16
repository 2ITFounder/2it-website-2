"use server"

import { NextResponse } from "next/server"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"
import { createSupabaseServiceClient } from "@/src/lib/supabase/service"

type ChatResponse = {
  id: string
  title: string | null
  is_group: boolean
  updated_at: string | null
  unread_count: number
  members: Array<{
    user_id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    username: string | null
  }>
  last_message?: {
    id: string
    body: string
    created_at: string
    sender_id: string
    status: string
  } | null
}

export async function GET() {
  const supabaseAuth = await createSupabaseRouteClient()
  const { data: auth } = await supabaseAuth.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createSupabaseServiceClient()

  const { data: memberRows, error: memberErr } = await supabase
    .from("chat_members")
    .select("chat_id")
    .eq("user_id", auth.user.id)
  if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 })

  const chatIds = (memberRows ?? []).map((m: any) => m.chat_id)
  if (!chatIds.length) return NextResponse.json({ data: { items: [], currentUserId: auth.user.id } })

  const { data: chats, error: chatsErr } = await supabase
    .from("chats")
    .select("id,title,is_group,updated_at")
    .in("id", chatIds)
  if (chatsErr) return NextResponse.json({ error: chatsErr.message }, { status: 500 })

  const { data: members, error: membersErr } = await supabase
    .from("chat_members")
    .select("chat_id,user_id")
    .in("chat_id", chatIds)
  if (membersErr) return NextResponse.json({ error: membersErr.message }, { status: 500 })

  const userIds = Array.from(new Set((members ?? []).map((m: any) => m.user_id)))
  // fetch profili (supporta sia user_setting che user_settings)
  const selectCols = "user_id,first_name,last_name,email,username"
  const fetchProfiles = async (table: string) =>
    await supabase.from(table).select(selectCols).in("user_id", userIds)

  let users = null as any[] | null
  let usersErr = null as any

  const attempt1 = await fetchProfiles("user_setting")
  if (!attempt1.error) {
    users = attempt1.data ?? []
  } else {
    const attempt2 = await fetchProfiles("user_settings")
    users = attempt2.data ?? []
    usersErr = attempt2.error
  }

  if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 })

  const { data: messages, error: msgErr } = await supabase
    .from("messages")
    .select("id,chat_id,body,created_at,sender_id,status")
    .in("chat_id", chatIds)
    .order("created_at", { ascending: false })
  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 })

  const { data: unreadNotifs, error: unreadErr } = await supabase
    .from("notifications")
    .select("link")
    .eq("user_id", auth.user.id)
    .eq("is_read", false)
    .eq("type", "message")
  if (unreadErr) return NextResponse.json({ error: unreadErr.message }, { status: 500 })

  const unreadByChat = new Map<string, number>()
  for (const n of unreadNotifs ?? []) {
    const link: string | null = (n as any)?.link ?? null
    if (!link) continue
    try {
      const url = new URL(link, "https://dummy.local")
      const chatId = url.searchParams.get("chatId")
      if (chatId) unreadByChat.set(chatId, (unreadByChat.get(chatId) ?? 0) + 1)
    } catch {
      continue
    }
  }

  const lastByChat = new Map<string, any>()
  for (const m of messages ?? []) {
    if (!lastByChat.has(m.chat_id)) lastByChat.set(m.chat_id, m)
  }

  const userMap = new Map<string, any>()
  for (const u of users ?? []) userMap.set(u.user_id, u)

  const result: ChatResponse[] = (chats ?? []).map((c: any) => ({
    id: c.id,
    title: c.title,
    is_group: c.is_group,
    updated_at: c.updated_at,
    unread_count: unreadByChat.get(c.id) ?? 0,
    members: (members ?? [])
      .filter((m: any) => m.chat_id === c.id)
      .map((m: any) => {
        const u = userMap.get(m.user_id) ?? {}
        return {
          user_id: m.user_id,
          first_name: u.first_name ?? null,
          last_name: u.last_name ?? null,
          email: u.email ?? null,
          username: u.username ?? null,
        }
      }),
    last_message: lastByChat.get(c.id) ?? null,
  }))

  result.sort((a, b) => {
    const aTime = a.last_message?.created_at ?? a.updated_at ?? ""
    const bTime = b.last_message?.created_at ?? b.updated_at ?? ""
    return bTime.localeCompare(aTime)
  })

  return NextResponse.json({ data: { items: result, currentUserId: auth.user.id } })
}
