"use client"

import { useMemo } from "react"
import { Users, FolderKanban, CheckCircle2, ListTodo, ArrowUpRight } from "lucide-react"
import { GlassCard } from "@/src/components/ui-custom/glass-card"
import { useQuery } from "@tanstack/react-query"
import { apiGet } from "@/src/lib/api"
import { computeBaseMonthly } from "@/src/app/(dashboard)/dashboard/spese/_lib/expense-math"
import { formatCurrency } from "@/src/app/(dashboard)/dashboard/spese/_lib/formatters"
import type { Expense } from "@/src/lib/expenses/schema"

type DashboardSummaryData = {
  kpi: {
    clientsTotal: number
    projectsActive: number
    projectsCompleted: number
    tasksDoing: number
  }
  recentProjects: { id: string; name: string; client: string; status: string; progress: number }[]
}

const statusBadge = (status: string) => {
  const s = status.toLowerCase()
  if (s.includes("compl")) return "bg-green-100 text-green-700"
  if (s.includes("review")) return "bg-yellow-100 text-yellow-700"
  return "bg-blue-100 text-blue-700"
}

const extractErrorMessage = (err: any) => {
  if (!err) return null
  if (typeof err === "string") return err
  if (typeof err?.message === "string") return err.message
  return "Si è verificato un errore"
}

export default function DashboardPage() {
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: ({ signal }) => apiGet<DashboardSummaryData>("/api/dashboard/summary", signal),
  })

  const {
    data: expenses = [],
    isLoading: expensesLoading,
    error: expensesError,
  } = useQuery({
    queryKey: ["expenses", "summary"],
    queryFn: ({ signal }) => apiGet<Expense[]>("/api/expenses", signal),
  })

  const kpi = data?.kpi ?? {
    clientsTotal: 0,
    projectsActive: 0,
    projectsCompleted: 0,
    tasksDoing: 0,
  }
  const recentProjects = data?.recentProjects ?? []
  const errorMsg = extractErrorMessage(error) || extractErrorMessage(expensesError)

  const stats = useMemo(
    () => [
      { title: "Clienti Totali", value: kpi.clientsTotal, icon: Users },
      { title: "Progetti Attivi", value: kpi.projectsActive, icon: FolderKanban },
      { title: "Progetti Completati", value: kpi.projectsCompleted, icon: CheckCircle2 },
      { title: "Task in Corso", value: kpi.tasksDoing, icon: ListTodo },
    ],
    [kpi]
  )

  const expensesSummary = useMemo(() => {
    let active = 0
    let inactive = 0
    let monthly = 0
    let annual = 0

    for (const exp of expenses) {
      if (exp.active) {
        active += 1
        const baseMonthly = computeBaseMonthly(exp)
        monthly += baseMonthly
        if (exp.cadence !== "one_time") {
          annual += baseMonthly * 12
        }
      } else {
        inactive += 1
      }
    }

    return { active, inactive, monthly, annual }
  }, [expenses])

  return (
    <div className="space-y-8">
      {errorMsg && <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{errorMsg}</div>}

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Spese</p>
            <p className="text-lg font-semibold">
              {expensesLoading ? "..." : `${expensesSummary.active} attive / ${expensesSummary.inactive} non attive`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Mensile (attive)</p>
            <p className="text-xl font-bold">
              {expensesLoading ? "..." : formatCurrency(expensesSummary.monthly)}
            </p>
            <p className="text-xs text-muted-foreground">Annuale (attive)</p>
            <p className="text-sm font-semibold">
              {expensesLoading ? "..." : formatCurrency(expensesSummary.annual)}
            </p>
          </div>
        </div>
      </GlassCard>

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
