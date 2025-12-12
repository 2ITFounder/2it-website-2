import { Search, Plus, MoreHorizontal, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlassCard } from "@/components/ui-custom/glass-card"

const projects = [
  {
    id: 1,
    name: "TechFlow SaaS",
    client: "TechFlow Inc.",
    deadline: "15 Gen 2025",
    progress: 75,
    status: "In corso",
  },
  {
    id: 2,
    name: "Elegance E-commerce",
    client: "Elegance Fashion",
    deadline: "20 Gen 2025",
    progress: 90,
    status: "Review",
  },
  {
    id: 3,
    name: "Healthcare App",
    client: "HealthCare Plus",
    deadline: "10 Feb 2025",
    progress: 45,
    status: "In corso",
  },
  {
    id: 4,
    name: "Urban Website",
    client: "Urban Architecture",
    deadline: "01 Dic 2024",
    progress: 100,
    status: "Completato",
  },
  {
    id: 5,
    name: "Food Delivery App",
    client: "FoodDelivery Pro",
    deadline: "28 Feb 2025",
    progress: 20,
    status: "In corso",
  },
]

export default function ProgettiDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Progetti</h1>
          <p className="text-muted-foreground">Gestisci tutti i tuoi progetti attivi</p>
        </div>
        <Button className="glow-button">
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Progetto
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Cerca progetti..." className="pl-10" />
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <GlassCard key={project.id} hover>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold">{project.name}</h3>
                <p className="text-sm text-muted-foreground">{project.client}</p>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Calendar className="w-4 h-4" />
              {project.deadline}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progresso</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
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
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
