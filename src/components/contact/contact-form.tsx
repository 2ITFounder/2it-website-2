"use client"

import type React from "react"
import { useState } from "react"
import { Send, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { Label } from "@/src/components/ui/label"
import { GlassCard } from "@/src/components/ui-custom/glass-card"

type ContactFormData = {
  name: string
  email: string
  phone?: string
  service?: string
  message: string
}

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    message: "",
  })

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({})

  const validateField = (name: keyof ContactFormData, value: string) => {
    let err = ""

    switch (name) {
      case "name":
        if (!value || value.length < 2) err = "Il nome deve essere di almeno 2 caratteri"
        break
      case "email":
        if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) err = "Inserisci un'email valida"
        break
      case "message":
        if (!value || value.length < 10) err = "Il messaggio deve essere di almeno 10 caratteri"
        break
    }

    return err
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (fieldErrors[name as keyof ContactFormData]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const err = validateField(name as keyof ContactFormData, value)
    setFieldErrors((prev) => ({ ...prev, [name]: err }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate all fields
    const errors: Partial<Record<keyof ContactFormData, string>> = {}
    ;(Object.keys(formData) as Array<keyof ContactFormData>).forEach((key) => {
      const err = validateField(key, String(formData[key] ?? ""))
      if (err) errors[key] = err
    })

    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          // service: null, // se più avanti aggiungi campo "service" nel form lo passi qui
          message: formData.message,
        }),
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(json?.error?.message || json?.error || "Si è verificato un errore")
        return
      }

      setIsSuccess(true)
      setFormData({ name: "", email: "", phone: "", message: "" })
    } catch {
      setError("Errore di rete. Riprova.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <GlassCard className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Messaggio inviato!</h3>
        <p className="text-muted-foreground">Grazie per averci contattato. Ti risponderemo al più presto.</p>
        <Button variant="outline" className="mt-6 bg-transparent" onClick={() => setIsSuccess(false)}>
          Invia un altro messaggio
        </Button>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Il tuo nome"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={fieldErrors.name ? "border-destructive" : ""}
          />
          {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="la-tua@email.com"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={fieldErrors.email ? "border-destructive" : ""}
          />
          {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefono (opzionale)</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+39 123 456 7890"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Messaggio *</Label>
          <Textarea
            id="message"
            name="message"
            placeholder="Raccontaci il tuo progetto..."
            rows={5}
            value={formData.message}
            onChange={handleChange}
            onBlur={handleBlur}
            className={fieldErrors.message ? "border-destructive" : ""}
          />
          {fieldErrors.message && <p className="text-sm text-destructive">{fieldErrors.message}</p>}
        </div>

        {error && <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

        <Button type="submit" className="w-full glow-button" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Invio in corso...
            </>
          ) : (
            <>
              Invia messaggio
              <Send className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </form>
    </GlassCard>
  )
}
