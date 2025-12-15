"use client"

import { useMemo, useState } from "react"
import { GlassCard } from "@/src/components/ui-custom/glass-card"
import { Button } from "@/src/components/ui/button"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { apiGet } from "@/src/lib/api"

type ClientRow = {
  id: string
  name: string
  status: string | null
  projectsTotal: number
  projectsActive: number
  projectsCompleted: number
  progressAvg: number
}

type ProjectRow = {
  id: string
  title: string
  client: string
  status: string
  progress: number
  tasksTotal: number
  tasksDoing: number
  tasksDone: number
  overdue: number
  nextDue: string | null
}

const extractErrorMessage = (err: any) => {
  if (!err) return null
  if (typeof err === "string") return err
  if (typeof err?.message === "string") return err.message
  return "Si è verificato un errore"
}

export default function ReportPage() {
  const [tab, setTab] = useState<"clients" | "projects">("clients")
  const router = useRouter()

  const { data: clients = [], isLoading: loadingClients, error: clientsError } = useQuery({
    queryKey: ["reports", "clients"],
    queryFn: ({ signal }) => apiGet<ClientRow[]>("/api/reports/clients", signal),
  })

  const { data: projects = [], isLoading: loadingProjects, error: projectsError } = useQuery({
    queryKey: ["reports", "projects"],
    queryFn: ({ signal }) => apiGet<ProjectRow[]>("/api/reports/projects", signal),
  })

  const loading = loadingClients || loadingProjects
  const errorMsg = extractErrorMessage(clientsError) || extractErrorMessage(projectsError)

  const clientsTop = useMemo(() => clients.slice(0, 5), [clients])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Report</h1>

        <div className="flex gap-2">
          <Button variant={tab === "clients" ? "default" : "outline"} onClick={() => setTab("clients")}>
            Clienti
          </Button>
          <Button variant={tab === "projects" ? "default" : "outline"} onClick={() => setTab("projects")}>
            Progetti
          </Button>
        </div>
      </div>

      {errorMsg && <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{errorMsg}</div>}

      {loading ? (
        <div className="text-muted-foreground">Caricamento…</div>
      ) : tab === "clients" ? (
        <div className="space-y-6">
          <GlassCard>
            <h2 className="font-semibold mb-4">Top clienti (più progetti attivi)</h2>
            {clientsTop.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nessun dato.</div>
            ) : (
              <div className="space-y-3">
                {clientsTop.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => router.push(`/dashboard/clienti/${c.id}/report`)}
                    className="w-full text-left flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium leading-tight break-words line-clamp-2">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Attivi: {c.projectsActive} • Completati: {c.projectsCompleted} • Totali: {c.projectsTotal}
                      </div>
                    </div>

                    <div className="w-full sm:w-28 sm:flex-shrink-0 text-right">
                      <div className="text-xs text-muted-foreground">Progress medio</div>
                      <div className="font-semibold">{c.progressAvg}%</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <h2 className="font-semibold mb-4">Tutti i clienti</h2>

            {clients.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nessun cliente.</div>
            ) : (
              <div className="space-y-2">
                {clients.map((c) => (
                  <button
                    key={c.id}
                    className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                    onClick={() => router.push(`/dashboard/clienti/${c.id}/report`)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium leading-tight break-words line-clamp-2">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Attivi: {c.projectsActive} • Completati: {c.projectsCompleted} • Totali: {c.projectsTotal}
                      </div>
                    </div>

                    <div className="w-full sm:w-28 sm:flex-shrink-0 text-right">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${c.progressAvg}%` }} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 text-right">{c.progressAvg}%</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      ) : (
        <GlassCard>
          <h2 className="font-semibold mb-4">Progetti</h2>

          {projects.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nessun progetto.</div>
          ) : (
            <div className="space-y-2">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => router.push(`/dashboard/progetti/${p.id}`)}
                  className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium leading-tight break-words line-clamp-2">{p.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.client} • {p.status} • Doing: {p.tasksDoing} • Overdue: {p.overdue}
                      {p.nextDue ? ` • Next: ${p.nextDue}` : ""}
                    </div>
                  </div>

                  <div className="w-full sm:w-32 sm:flex-shrink-0">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${p.progress}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 text-right">{p.progress}%</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  )
}
