import "server-only"

import { createSupabaseServiceClient } from "@/src/lib/supabase/service"

type MemberRow = { chat_id: string; user_id: string }

type ProfileRow = {
  user_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  username: string | null
}

type MessageRow = {
  id: string
  chat_id: string
  body: string
  created_at: string
  sender_id: string
  status: string
}

export async function fetchChatMembers(chatIds: string[]) {
  const supabase = createSupabaseServiceClient()
  const { data, error } = await supabase.from("chat_members").select("chat_id,user_id").in("chat_id", chatIds)
  if (error) throw new Error(error.message)
  return (data ?? []) as MemberRow[]
}

export async function fetchProfiles(userIds: string[]) {
  const supabase = createSupabaseServiceClient()
  const selectCols = "user_id,first_name,last_name,email,username"
  const fetchTable = async (table: string) => supabase.from(table).select(selectCols).in("user_id", userIds)

  const attempt1 = await fetchTable("user_setting")
  if (!attempt1.error) return (attempt1.data ?? []) as ProfileRow[]

  const attempt2 = await fetchTable("user_settings")
  if (attempt2.error) throw new Error(attempt2.error.message)
  return (attempt2.data ?? []) as ProfileRow[]
}

export async function fetchMessages(chatIds: string[]) {
  const supabase = createSupabaseServiceClient()
  const { data, error } = await supabase
    .from("messages")
    .select("id,chat_id,body,created_at,sender_id,status")
    .in("chat_id", chatIds)
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as MessageRow[]
}

export function mapLastMessageByChat(messages: MessageRow[]) {
  const lastByChat = new Map<string, MessageRow>()
  for (const m of messages ?? []) {
    if (!lastByChat.has(m.chat_id)) lastByChat.set(m.chat_id, m)
  }
  return lastByChat
}

export function buildUserMap(profiles: ProfileRow[]) {
  const userMap = new Map<string, ProfileRow>()
  for (const u of profiles ?? []) userMap.set(u.user_id, u)
  return userMap
}

export function parseUnreadByChat(unreadNotifs: Array<{ link: string | null }>) {
  const unreadByChat = new Map<string, number>()
  for (const n of unreadNotifs ?? []) {
    const link = n.link
    if (!link) continue
    try {
      const url = new URL(link, "https://dummy.local")
      const chatId = url.searchParams.get("chatId")
      if (chatId) unreadByChat.set(chatId, (unreadByChat.get(chatId) ?? 0) + 1)
    } catch {
      continue
    }
  }
  return unreadByChat
}
