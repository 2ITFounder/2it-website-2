"use client"

import { useEffect, useMemo, useState } from "react"
import { Users, FolderKanban, CheckCircle2, ListTodo, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { GlassCard } from "@/src/components/ui-custom/glass-card"

type SummaryResponse = {
  data: {
    kpi: {
      clientsTotal: number
      projectsActive: number
      projectsCompleted: number
      tasksDoing: number
    }
    recentProjects: { id: string; name: string; client: string; status: string; progress: number }[]
  }
  error?: string
}

const statusBadge = (status: string) => {
  const s = status.toLowerCase()
  if (s.includes("compl")) return "bg-green-100 text-green-700"
  if (s.includes("review")) return "bg-yellow-100 text-yellow-700"
  return "bg-blue-100 text-blue-700"
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kpi, setKpi] = useState<SummaryResponse["data"]["kpi"]>({
    clientsTotal: 0,
    projectsActive: 0,
    projectsCompleted: 0,
    tasksDoing: 0,
  })
  const [recentProjects, setRecentProjects] = useState<SummaryResponse["data"]["recentProjects"]>([])

  const fetchSummary = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/dashboard/summary", { cache: "no-store" })
      const json = (await res.json().catch(() => ({}))) as SummaryResponse
      if (!res.ok) {
        setError(json?.error || "Errore nel caricamento KPI")
        return
      }
      setKpi(json.data.kpi)
      setRecentProjects(json.data.recentProjects)
    } catch {
      setError("Errore di rete. Riprova.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  const stats = useMemo(
    () => [
      { title: "Clienti Totali", value: kpi.clientsTotal, icon: Users },
      { title: "Progetti Attivi", value: kpi.projectsActive, icon: FolderKanban },
      { title: "Progetti Completati", value: kpi.projectsCompleted, icon: CheckCircle2 },
      { title: "Task in Corso", value: kpi.tasksDoing, icon: ListTodo },
    ],
    [kpi]
  )

  return (
    <div className="space-y-8">
      {error && <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <GlassCard key={stat.title}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{loading ? "—" : stat.value}</p>
                <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                  {loading ? null : <ArrowUpRight className="w-4 h-4" />}
                  {loading ? "Caricamento..." : "Aggiornato ora"}
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-accent" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <h2 className="text-lg font-semibold mb-6">Progetti Recenti</h2>

        {loading ? (
          <div className="text-sm text-muted-foreground">Caricamento...</div>
        ) : recentProjects.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nessun progetto.</div>
        ) : (
          <div className="space-y-4">
            {recentProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-sm text-muted-foreground">{project.client}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusBadge(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="w-24">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-right">{project.progress}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
