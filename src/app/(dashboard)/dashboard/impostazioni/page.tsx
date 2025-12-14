"use client"

import { useEffect, useMemo, useState } from "react"
import { Save, User, Bell, Shield } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Switch } from "@/src/components/ui/switch"
import { GlassCard } from "@/src/components/ui-custom/glass-card"
import { createSupabaseBrowserClient } from "@/src/lib/supabase/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiGet } from "@/src/lib/api"

type SettingsDTO = {
  user_id?: string
  first_name: string | null
  last_name: string | null
  email: string | null
  notifications_email: boolean
  notifications_push: boolean
  notifications_weekly: boolean
}

const DEFAULT_SETTINGS: SettingsDTO = {
  first_name: null,
  last_name: null,
  email: null,
  notifications_email: true,
  notifications_push: false,
  notifications_weekly: true,
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

async function ensureServiceWorkerReady(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) throw new Error("Service Worker non supportato")
  return await navigator.serviceWorker.ready
}

async function subscribePush(): Promise<PushSubscription> {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidPublicKey) throw new Error("Manca NEXT_PUBLIC_VAPID_PUBLIC_KEY")

  if (!("Notification" in window)) throw new Error("Notifiche non supportate")
  if (!("PushManager" in window)) throw new Error("Push non supportato")

  const permission = await Notification.requestPermission()
  if (permission !== "granted") throw new Error("Permesso notifiche negato")

  const reg = await ensureServiceWorkerReady()
  const existing = await reg.pushManager.getSubscription()
  if (existing) return existing

  return await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  })
}

async function unsubscribePush(): Promise<void> {
  const reg = await ensureServiceWorkerReady()
  const sub = await reg.pushManager.getSubscription()
  if (sub) await sub.unsubscribe()
}

export default function ImpostazioniPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const qc = useQueryClient()

  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const [profile, setProfile] = useState({
    first_name: "Admin",
    last_name: "2it",
    email: "admin@2it.it",
  })

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
  })

  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" })

  // ✅ usa la stessa chiave che prefetchi nella sidebar
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiGet<{ data: SettingsDTO }>("/api/settings"),
    staleTime: 60_000,
    retry: 1,
  })

  // In base a come apiGet ritorna, qui normalizziamo.
  const settings: SettingsDTO = useMemo(() => {
    const raw = (settingsQuery.data as any)?.data ?? (settingsQuery.data as any)
    return (raw?.data ?? raw ?? DEFAULT_SETTINGS) as SettingsDTO
  }, [settingsQuery.data])

  // sync states quando arrivano i dati (1 volta per cambio settings)
  useEffect(() => {
    if (!settingsQuery.data) return

    setProfile({
      first_name: settings.first_name ?? "Admin",
      last_name: settings.last_name ?? "2it",
      email: settings.email ?? "admin@2it.it",
    })

    setNotifications({
      email: Boolean(settings.notifications_email),
      push: Boolean(settings.notifications_push),
      weekly: Boolean(settings.notifications_weekly),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsQuery.data])

  const saveMutation = useMutation({
    mutationFn: async (payload: SettingsDTO) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? "Errore salvataggio impostazioni")
      return json
    },
    onSuccess: (json) => {
      // aggiorna cache così non rifetchi e non fai flicker
      qc.setQueryData(["settings"], json?.data ? { data: json.data } : json)
      setOk("Salvato ✅")
    },
    onError: (e: any) => setError(e?.message || "Errore di rete"),
  })

  function buildPayload(overrides?: Partial<SettingsDTO>): SettingsDTO {
    return {
      first_name: profile.first_name || null,
      last_name: profile.last_name || null,
      email: profile.email || null,
      notifications_email: notifications.email,
      notifications_push: notifications.push,
      notifications_weekly: notifications.weekly,
      ...(overrides ?? {}),
    }
  }

  async function handleToggleEmail(checked: boolean) {
    setOk(null); setError(null)
    const prev = notifications.email
    setNotifications((s) => ({ ...s, email: checked }))
    try {
      await saveMutation.mutateAsync(buildPayload({ notifications_email: checked }))
      setOk("Notifiche email aggiornate ✅")
    } catch (e: any) {
      setNotifications((s) => ({ ...s, email: prev }))
      setError(e?.message || "Errore aggiornamento notifiche email")
    }
  }

  async function handleToggleWeekly(checked: boolean) {
    setOk(null); setError(null)
    const prev = notifications.weekly
    setNotifications((s) => ({ ...s, weekly: checked }))
    try {
      await saveMutation.mutateAsync(buildPayload({ notifications_weekly: checked }))
      setOk("Report settimanale aggiornato ✅")
    } catch (e: any) {
      setNotifications((s) => ({ ...s, weekly: prev }))
      setError(e?.message || "Errore aggiornamento report settimanale")
    }
  }

  async function handleTogglePush(checked: boolean) {
  setOk(null)
  setError(null)

  const prev = notifications.push

  // UI ottimistica
  setNotifications((s) => ({ ...s, push: checked }))

  try {
    if (checked) {
      // 1) subscribe browser
      const sub = await subscribePush()

      // 2) salva subscription
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? "Errore subscribe push")

      // 3) 🔴 SALVA ESPLICITAMENTE push = true
      await saveMutation.mutateAsync({
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        email: profile.email || null,
        notifications_email: notifications.email,
        notifications_push: true,
        notifications_weekly: notifications.weekly,
      })
    } else {
      // unsubscribe
      const reg = await ensureServiceWorkerReady()
      const sub = await reg.pushManager.getSubscription()
      const endpoint = sub?.endpoint

      await unsubscribePush()

      if (endpoint) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        }).catch(() => {})
      }

      // 🔴 SALVA ESPLICITAMENTE push = false
      await saveMutation.mutateAsync({
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        email: profile.email || null,
        notifications_email: notifications.email,
        notifications_push: false,
        notifications_weekly: notifications.weekly,
      })
    }

    setOk("Notifiche push aggiornate ✅")
  } catch (e: any) {
    // rollback UI
    setNotifications((s) => ({ ...s, push: prev }))
    setError(e?.message || "Errore gestione notifiche push")
  }
}


  async function handleSaveAll() {
    setOk(null); setError(null)
    try {
      await saveMutation.mutateAsync(buildPayload())
      setOk("Impostazioni salvate ✅")
    } catch (e: any) {
      setError(e?.message || "Errore salvataggio")
    }
  }

  async function handleChangePassword() {
    setOk(null)
    setError(null)

    const current = pwd.current.trim()
    const next = pwd.next.trim()
    const confirm = pwd.confirm.trim()

    if (!current) return setError("Inserisci la password attuale")
    if (!next || next.length < 8) return setError("La nuova password deve avere almeno 8 caratteri")
    if (next !== confirm) return setError("Conferma password non coincide")

    setPwdSaving(true)
    try {
      const { data: u, error: uErr } = await supabase.auth.getUser()
      if (uErr || !u?.user?.email) throw new Error("Utente non valido")

      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: u.user.email,
        password: current,
      })
      if (signErr) throw new Error("Password attuale errata")

      const { error: upErr } = await supabase.auth.updateUser({ password: next })
      if (upErr) throw new Error(upErr.message)

      setPwd({ current: "", next: "", confirm: "" })
      setOk("Password aggiornata ✅")
    } catch (e: any) {
      setError(e?.message || "Errore aggiornamento password")
    } finally {
      setPwdSaving(false)
    }
  }

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold">Impostazioni</h1>
          <p className="text-muted-foreground">Caricamento…</p>
        </div>
      </div>
    )
  }

  const loadErr = settingsQuery.error as any
  const showErr = error || (loadErr?.message ? String(loadErr.message) : null)

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Impostazioni</h1>
        <p className="text-muted-foreground">Gestisci le preferenze del tuo account</p>
        {showErr ? <p className="text-sm text-red-500 mt-2">{showErr}</p> : null}
        {ok ? <p className="text-sm text-green-500 mt-2">{ok}</p> : null}
        {settingsQuery.isFetching ? <p className="text-xs text-muted-foreground mt-1">Sync…</p> : null}
      </div>

      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <User className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold">Profilo</h2>
            <p className="text-sm text-muted-foreground">Informazioni del tuo account</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={profile.first_name ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname">Cognome</Label>
              <Input
                id="surname"
                value={profile.last_name ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email ?? ""}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold">Notifiche</h2>
            <p className="text-sm text-muted-foreground">Gestisci le tue preferenze di notifica</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifiche Email</p>
              <p className="text-sm text-muted-foreground">Ricevi aggiornamenti via email</p>
            </div>
            <Switch checked={notifications.email} onCheckedChange={handleToggleEmail} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifiche Push</p>
              <p className="text-sm text-muted-foreground">Ricevi notifiche push nella PWA</p>
            </div>
            <Switch checked={notifications.push} onCheckedChange={handleTogglePush} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Report Settimanale</p>
              <p className="text-sm text-muted-foreground">Ricevi un riepilogo settimanale</p>
            </div>
            <Switch checked={notifications.weekly} onCheckedChange={handleToggleWeekly} />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold">Sicurezza</h2>
            <p className="text-sm text-muted-foreground">Gestisci password e sicurezza</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Password Attuale</Label>
            <Input
              id="current-password"
              type="password"
              value={pwd.current}
              onChange={(e) => setPwd((s) => ({ ...s, current: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nuova Password</Label>
            <Input
              id="new-password"
              type="password"
              value={pwd.next}
              onChange={(e) => setPwd((s) => ({ ...s, next: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Conferma Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={pwd.confirm}
              onChange={(e) => setPwd((s) => ({ ...s, confirm: e.target.value }))}
            />
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" onClick={handleChangePassword} disabled={pwdSaving}>
              {pwdSaving ? "Aggiornamento..." : "Aggiorna Password"}
            </Button>
          </div>
        </div>
      </GlassCard>

      <div className="flex justify-end">
        <Button className="glow-button" onClick={handleSaveAll} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
        </Button>
      </div>
    </div>
  )
}
