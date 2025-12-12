import { Download, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui-custom/glass-card"

const monthlyData = [
  { month: "Lug", revenue: 32000, projects: 4 },
  { month: "Ago", revenue: 28000, projects: 3 },
  { month: "Set", revenue: 45000, projects: 6 },
  { month: "Ott", revenue: 38000, projects: 5 },
  { month: "Nov", revenue: 52000, projects: 7 },
  { month: "Dic", revenue: 45200, projects: 5 },
]

const topClients = [
  { name: "TechFlow Inc.", revenue: 125000, projects: 8 },
  { name: "Elegance Fashion", revenue: 89000, projects: 5 },
  { name: "HealthCare Plus", revenue: 67000, projects: 3 },
  { name: "Urban Architecture", revenue: 54000, projects: 4 },
]

export default function ReportPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Report</h1>
          <p className="text-muted-foreground">Analisi e statistiche del business</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Esporta Report
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard>
          <p className="text-sm text-muted-foreground">Revenue Totale (Anno)</p>
          <p className="text-3xl font-bold mt-2">€485.200</p>
          <div className="flex items-center gap-1 mt-2 text-green-600 text-sm">
            <TrendingUp className="w-4 h-4" />
            +23% vs anno precedente
          </div>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-muted-foreground">Progetti Completati</p>
          <p className="text-3xl font-bold mt-2">48</p>
          <div className="flex items-center gap-1 mt-2 text-green-600 text-sm">
            <TrendingUp className="w-4 h-4" />
            +15% vs anno precedente
          </div>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-muted-foreground">Valore Medio Progetto</p>
          <p className="text-3xl font-bold mt-2">€10.108</p>
          <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
            <TrendingDown className="w-4 h-4" />
            -3% vs anno precedente
          </div>
        </GlassCard>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <GlassCard>
          <h3 className="font-semibold mb-6">Revenue Mensile</h3>
          <div className="space-y-4">
            {monthlyData.map((data) => (
              <div key={data.month} className="flex items-center gap-4">
                <span className="w-8 text-sm text-muted-foreground">{data.month}</span>
                <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-lg flex items-center justify-end pr-3"
                    style={{ width: `${(data.revenue / 60000) * 100}%` }}
                  >
                    <span className="text-xs font-medium text-accent-foreground">
                      €{(data.revenue / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Top Clients */}
        <GlassCard>
          <h3 className="font-semibold mb-6">Top Clienti per Revenue</h3>
          <div className="space-y-4">
            {topClients.map((client, index) => (
              <div key={client.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.projects} progetti</p>
                  </div>
                </div>
                <p className="font-semibold">€{client.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
