"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/src/components/ui/button"
import { GlassCard } from "@/src/components/ui-custom/glass-card"

type Client = {
  id: string
  name: string
  email: string | null
  status: string | null
}

type Project = {
  id: string
  title: string
  status: string
  progress: number
  completed_at: string | null
  updated_at: string | null
  deadline: string | null
  due_date: string | null
}

export default function ReportClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [kpi, setKpi] = useState<any>(null)
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/reports/clients/${clientId}`, { cache: "no-store" })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.error || "Errore report cliente")

        setClient(json.data.client)
        setKpi(json.data.kpi)
        setProjects(Array.isArray(json.data.projects) ? json.data.projects : [])
      } catch (e: any) {
        setError(e?.message || "Errore di rete")
      } finally {
        setLoading(false)
      }
    })()
  }, [clientId])

  if (loading) return <div className="text-muted-foreground">Caricamento…</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/report")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate">{client?.name ?? "Cliente"}</h1>
          <p className="text-sm text-muted-foreground truncate">
            {client?.email ?? "—"} • Attivi {kpi?.projectsActive ?? 0} • Completati {kpi?.projectsCompleted ?? 0}
          </p>
        </div>
      </div>

      {error && <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard>
          <div className="text-sm text-muted-foreground">Progetti</div>
          <div className="text-2xl font-bold">{kpi?.projectsTotal ?? 0}</div>
        </GlassCard>
        <GlassCard>
          <div className="text-sm text-muted-foreground">Attivi</div>
          <div className="text-2xl font-bold">{kpi?.projectsActive ?? 0}</div>
        </GlassCard>
        <GlassCard>
          <div className="text-sm text-muted-foreground">Completati</div>
          <div className="text-2xl font-bold">{kpi?.projectsCompleted ?? 0}</div>
        </GlassCard>
        <GlassCard>
          <div className="text-sm text-muted-foreground">Progress medio</div>
          <div className="text-2xl font-bold">{kpi?.progressAvg ?? 0}%</div>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="font-semibold mb-4">Progetti del cliente</h2>

        {projects.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nessun progetto.</div>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => router.push(`/dashboard/progetti/${p.id}`)} // ✅ usa la tua pagina esistente
                className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.completed_at ? "COMPLETATO" : p.status}
                      {p.deadline ? ` • deadline ${p.deadline}` : ""}
                      {p.due_date ? ` • due ${p.due_date}` : ""}
                    </div>
                  </div>

                  <div className="w-28">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${p.progress ?? 0}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 text-right">{p.progress ?? 0}%</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
