"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Container } from "@/components/ui-custom/container"
import { GlassCard } from "@/components/ui-custom/glass-card"

// =================================================================
// PLACEHOLDER: Autenticazione reale
// =================================================================
// Per implementare l'auth reale con Supabase:
// 1. Configura Supabase Auth
// 2. Usa supabase.auth.signInWithPassword()
// 3. Gestisci la sessione con cookies
//
// Per un'auth custom:
// 1. Crea una tabella users con password hashate (bcrypt)
// 2. Implementa JWT o session cookies
// 3. Usa middleware per proteggere le route
// =================================================================

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // =================================================================
    // PLACEHOLDER: Sostituire con autenticazione reale
    // =================================================================
    // Esempio con Supabase:
    // const { error } = await supabase.auth.signInWithPassword({
    //   email: formData.email,
    //   password: formData.password,
    // });
    // if (error) {
    //   setError(error.message);
    //   setIsLoading(false);
    //   return;
    // }
    // =================================================================

    // Simulazione login demo (rimuovere in produzione)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Demo credentials check
    if (formData.email === "admin@nexus.it" && formData.password === "demo123") {
      // Set a demo cookie (sostituire con session reale)
      document.cookie = "session=demo-token; path=/"
      router.push("/dashboard")
    } else {
      setError("Credenziali non valide. Demo: admin@nexus.it / demo123")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center p-4">
      <Container size="sm" className="max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold">
            Nexus<span className="text-accent">.</span>
          </Link>
          <p className="mt-2 text-muted-foreground">Accedi al gestionale</p>
        </div>

        <GlassCard className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="la-tua@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

            <Button type="submit" className="w-full glow-button" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accesso in corso...
                </>
              ) : (
                "Accedi"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Torna al sito
            </Link>
          </div>
        </GlassCard>

        {/* Demo credentials hint */}
        <p className="text-center text-sm text-muted-foreground mt-6">Demo: admin@nexus.it / demo123</p>
      </Container>
    </div>
  )
}
