import { Search, Plus, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlassCard } from "@/components/ui-custom/glass-card"

const clients = [
  { id: 1, name: "TechFlow Inc.", email: "info@techflow.com", projects: 3, status: "Attivo" },
  { id: 2, name: "Elegance Fashion", email: "contact@elegance.it", projects: 2, status: "Attivo" },
  { id: 3, name: "HealthCare Plus", email: "hello@healthcare.com", projects: 1, status: "Attivo" },
  { id: 4, name: "Urban Architecture", email: "studio@urban.it", projects: 4, status: "Inattivo" },
  { id: 5, name: "FoodDelivery Pro", email: "info@foodpro.it", projects: 1, status: "Attivo" },
  { id: 6, name: "EcoTravel", email: "booking@ecotravel.com", projects: 2, status: "Attivo" },
]

export default function ClientiPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clienti</h1>
          <p className="text-muted-foreground">Gestisci i tuoi clienti e le loro informazioni</p>
        </div>
        <Button className="glow-button">
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Cerca clienti..." className="pl-10" />
      </div>

      {/* Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Nome</th>
                <th className="text-left p-4 font-medium">Email</th>
                <th className="text-left p-4 font-medium">Progetti</th>
                <th className="text-left p-4 font-medium">Stato</th>
                <th className="text-right p-4 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-4 font-medium">{client.name}</td>
                  <td className="p-4 text-muted-foreground">{client.email}</td>
                  <td className="p-4">{client.projects}</td>
                  <td className="p-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        client.status === "Attivo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
