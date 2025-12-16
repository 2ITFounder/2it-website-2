import "server-only"

import { createSupabaseServiceClient } from "@/src/lib/supabase/service"

export async function ensureChatMembership(chatId: string, userId: string) {
  const supabase = createSupabaseServiceClient()
  const { data, error } = await supabase.from("chat_members").select("user_id").eq("chat_id", chatId)
  if (error) throw new Error(error.message)
  const members = (data ?? []).map((r: any) => r.user_id)
  if (!members.includes(userId)) {
    const err: any = new Error("Forbidden")
    err.status = 403
    throw err
  }
  return members
}
