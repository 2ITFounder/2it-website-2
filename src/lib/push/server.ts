import webpush from "web-push"
import { createSupabaseServerClient } from "@/src/lib/supabase/server"
import { createSupabaseServiceClient } from "@/src/lib/supabase/service"

type PushPayload = {
  title: string
  body: string
  url?: string
  type?: string
  chatId?: string
}

let isConfigured = false
let isDisabled = false

const CHAT_PRESENCE_TTL_MS = 30_000

function configureWebPushOnce() {
  if (isConfigured || isDisabled) return

  const subject = process.env.VAPID_SUBJECT
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY

  // Se mancano env (tipico in locale), NON deve rompere le API
  if (!subject || !pub || !priv) {
    isDisabled = true
    console.warn(
      "[push] VAPID env mancanti: disabilito notifiche push (API continua a funzionare)."
    )
    return
  }

  webpush.setVapidDetails(subject, pub, priv)
  isConfigured = true
}

export async function notifyAdmins(payload: PushPayload, opts?: { excludeUserId?: string }) {
  configureWebPushOnce()
  if (isDisabled) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[push] notifyAdmins skipped: disabled")
    }
    return
  }

  const supabase = createSupabaseServiceClient()

  const { data: admins, error: adminErr } = await supabase.from("admin_users").select("user_id")
  if (adminErr) throw adminErr

  const adminIds = (admins ?? [])
    .map((a: any) => a.user_id)
    .filter((id: string) => id && id !== opts?.excludeUserId)

  if (!adminIds.length) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[push] notifyAdmins skipped: no recipients")
    }
    return
  }

  const { data: subs, error: subErr } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .in("user_id", adminIds)

  if (subErr) throw subErr
  if (!subs?.length) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[push] notifyAdmins skipped: no subscriptions")
    }
    return
  }

  // Insert a row in notifications for each admin (service role bypasses RLS)
  try {
    const svc = createSupabaseServiceClient()
    const rows = adminIds.map((userId: string) => ({
      user_id: userId,
      title: payload.title,
      body: payload.body,
      link: payload.url ?? null,
      type: payload.type ?? null,
    }))
    await svc.from("notifications").insert(rows)
  } catch (e) {
    console.warn("[push] insert notifications failed", e)
  }

  const body = JSON.stringify(payload)
  if (process.env.NODE_ENV !== "production") {
    console.info("[push] notifyAdmins send", { count: subs.length, type: payload.type })
  }

  await Promise.allSettled(
    subs.map(async (s: any) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          body
        )
      } catch (e: any) {
        const status = e?.statusCode
        if (status === 404 || status === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", s.id)
        }
      }
    })
  )
}

export async function notifyUsers(userIds: string[], payload: PushPayload, opts?: { excludeUserId?: string }) {
  configureWebPushOnce()
  if (isDisabled) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[push] notifyUsers skipped: disabled")
    }
    return
  }

  const recipients = userIds.filter((id) => id && id !== opts?.excludeUserId)
  if (recipients.length === 0) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[push] notifyUsers skipped: no recipients")
    }
    return
  }

  const supabase = createSupabaseServiceClient()

  let pushRecipients = recipients
  if (payload.type === "message" && payload.chatId) {
    const cutoff = new Date(Date.now() - CHAT_PRESENCE_TTL_MS).toISOString()
    const { data: presenceRows, error: presenceErr } = await supabase
      .from("chat_presence")
      .select("user_id")
      .eq("chat_id", payload.chatId)
      .in("user_id", recipients)
      .gte("last_seen_at", cutoff)

    if (presenceErr) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[push] presence lookup failed", presenceErr)
      }
    } else if (presenceRows?.length) {
      const activeIds = new Set(presenceRows.map((r: any) => r.user_id))
      pushRecipients = recipients.filter((id) => !activeIds.has(id))
      if (process.env.NODE_ENV !== "production") {
        activeIds.forEach((userId) => {
          console.info("[push] suppressed", { userId, chatId: payload.chatId, reason: "active_in_chat" })
        })
      }
    }
  }

  try {
    const svc = createSupabaseServiceClient()
    const rows = recipients.map((userId) => ({
      user_id: userId,
      title: payload.title,
      body: payload.body,
      link: payload.url ?? null,
      type: payload.type ?? null,
    }))
    await svc.from("notifications").insert(rows)
  } catch (e) {
    console.warn("[push] insert notifications failed", e)
  }

  if (pushRecipients.length === 0) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[push] notifyUsers skipped: all recipients active in chat")
    }
    return
  }

  const { data: subs, error: subErr } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .in("user_id", pushRecipients)

  if (subErr) throw subErr
  if (!subs?.length) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[push] notifyUsers skipped: no subscriptions")
    }
    return
  }

  const body = JSON.stringify(payload)
  if (process.env.NODE_ENV !== "production") {
    console.info("[push] notifyUsers send", { count: subs.length, type: payload.type, chatId: payload.chatId })
  }

  await Promise.allSettled(
    subs.map(async (s: any) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          body
        )
      } catch (e: any) {
        const status = e?.statusCode
        if (status === 404 || status === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", s.id)
        }
      }
    })
  )
}
