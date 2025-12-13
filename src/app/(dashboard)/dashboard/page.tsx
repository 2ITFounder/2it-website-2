import { Users, FolderKanban, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { GlassCard } from "@/src/components/ui-custom/glass-card"

const stats = [
  {
    title: "Clienti Totali",
    value: "128",
    change: "+12%",
    trend: "up",
    icon: Users,
  },
  {
    title: "Progetti Attivi",
    value: "24",
    change: "+4",
    trend: "up",
    icon: FolderKanban,
  },
  {
    title: "Revenue Mensile",
    value: "€45.2k",
    change: "+8%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "Tasso Conversione",
    value: "68%",
    change: "-2%",
    trend: "down",
    icon: TrendingUp,
  },
]

const recentProjects = [
  { name: "TechFlow SaaS", client: "TechFlow Inc.", status: "In corso", progress: 75 },
  { name: "Elegance E-commerce", client: "Elegance Fashion", status: "Review", progress: 90 },
  { name: "Healthcare App", client: "HealthCare Plus", status: "In corso", progress: 45 },
  { name: "Urban Website", client: "Urban Architecture", status: "Completato", progress: 100 },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <GlassCard key={stat.title}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <div
                  className={`flex items-center gap-1 mt-2 text-sm ${
                    stat.trend === "up" ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {stat.trend === "up" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {stat.change}
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-accent" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Recent Projects */}
      <GlassCard>
        <h2 className="text-lg font-semibold mb-6">Progetti Recenti</h2>
        <div className="space-y-4">
          {recentProjects.map((project) => (
            <div key={project.name} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">{project.name}</p>
                <p className="text-sm text-muted-foreground">{project.client}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      project.status === "Completato"
                        ? "bg-green-100 text-green-700"
                        : project.status === "Review"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
                <div className="w-24">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-right">{project.progress}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
