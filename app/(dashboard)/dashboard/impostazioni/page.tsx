"use client"

import { useState } from "react"
import { Save, User, Bell, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { GlassCard } from "@/components/ui-custom/glass-card"

export default function ImpostazioniPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
  })

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Impostazioni</h1>
        <p className="text-muted-foreground">Gestisci le preferenze del tuo account</p>
      </div>

      {/* Profile Settings */}
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
              <Input id="name" defaultValue="Admin" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname">Cognome</Label>
              <Input id="surname" defaultValue="Nexus" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="admin@nexus.it" />
          </div>
        </div>
      </GlassCard>

      {/* Notification Settings */}
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
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifiche Push</p>
              <p className="text-sm text-muted-foreground">Ricevi notifiche push nel browser</p>
            </div>
            <Switch
              checked={notifications.push}
              onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Report Settimanale</p>
              <p className="text-sm text-muted-foreground">Ricevi un riepilogo settimanale</p>
            </div>
            <Switch
              checked={notifications.weekly}
              onCheckedChange={(checked) => setNotifications({ ...notifications, weekly: checked })}
            />
          </div>
        </div>
      </GlassCard>

      {/* Security */}
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
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nuova Password</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Conferma Password</Label>
            <Input id="confirm-password" type="password" />
          </div>
        </div>
      </GlassCard>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="glow-button">
          <Save className="w-4 h-4 mr-2" />
          Salva Modifiche
        </Button>
      </div>
    </div>
  )
}
