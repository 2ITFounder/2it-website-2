import webpush from "web-push"
import { createSupabaseServerClient } from "@/src/lib/supabase/server"
import { createSupabaseServiceClient } from "@/src/lib/supabase/service"

type PushPayload = {
  title: string
  body: string
  url?: string
  type?: string
}

let isConfigured = false
let isDisabled = false

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
  if (isDisabled) return

  const supabase = await createSupabaseServerClient()

  const { data: admins, error: adminErr } = await supabase.from("admin_users").select("user_id")
  if (adminErr) throw adminErr

  const adminIds = (admins ?? [])
    .map((a: any) => a.user_id)
    .filter((id: string) => id && id !== opts?.excludeUserId)

  if (!adminIds.length) return

  const { data: subs, error: subErr } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .in("user_id", adminIds)

  if (subErr) throw subErr
  if (!subs?.length) return

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
