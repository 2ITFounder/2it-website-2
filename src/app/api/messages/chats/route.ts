"use server"

import { NextResponse } from "next/server"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"
import { createSupabaseServiceClient } from "@/src/lib/supabase/service"
import {
  buildUserMap,
  fetchChatMembers,
  fetchMessages,
  fetchProfiles,
  mapLastMessageByChat,
  parseUnreadByChat,
} from "@/src/features/messages/server/chats-helpers"

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

  try {
    const members = await fetchChatMembers(chatIds)
    const userIds = Array.from(new Set(members.map((m) => m.user_id)))
    const users = await fetchProfiles(userIds)
    const messages = await fetchMessages(chatIds)

    const { data: unreadNotifs, error: unreadErr } = await supabase
      .from("notifications")
      .select("link")
      .eq("user_id", auth.user.id)
      .eq("is_read", false)
      .eq("type", "message")
    if (unreadErr) throw new Error(unreadErr.message)

    const unreadByChat = parseUnreadByChat(unreadNotifs ?? [])
    const lastByChat = mapLastMessageByChat(messages)
    const userMap = buildUserMap(users)

    const result: ChatResponse[] = (chats ?? []).map((c: any) => ({
      id: c.id,
      title: c.title,
      is_group: c.is_group,
      updated_at: c.updated_at,
      unread_count: unreadByChat.get(c.id) ?? 0,
      members: members
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
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Errore caricamento chat" }, { status: 500 })
  }
}
