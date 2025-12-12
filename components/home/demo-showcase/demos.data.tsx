import { Users, ShoppingCart, LayoutDashboard, BarChart3 } from "lucide-react"
import { AnalyticsPreview } from "./AnalyticsPreview"

export const demos = [
  {
    id: 1,
    title: "CRM Clienti",
    description: "Gestione completa dei contatti e delle relazioni",
    icon: Users,
    color: "from-blue-500 to-purple-500",
    preview: <CrmPreview />,
  },
  {
    id: 2,
    title: "Dashboard Analytics",
    description: "Metriche e KPI in tempo reale",
    icon: BarChart3,
    color: "from-purple-500 to-pink-500",
    preview: <AnalyticsPreview />,
  },
  {
    id: 3,
    title: "E-commerce",
    description: "Gestione prodotti e ordini online",
    icon: ShoppingCart,
    color: "from-cyan-500 to-blue-500",
    preview: <EcommercePreview />,
  },
  {
    id: 4,
    title: "Gestionale",
    description: "Controllo completo delle operazioni",
    icon: LayoutDashboard,
    color: "from-violet-500 to-purple-500",
    preview: <GestionalePreview />,
  },
] as const

function CrmPreview() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg">
      <div className="bg-white rounded-lg p-3 shadow-sm mb-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400" />
          <div className="flex-1">
            <div className="h-2 bg-gradient-to-r from-blue-300 to-purple-300 rounded w-2/3 mb-1" />
            <div className="h-1.5 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded p-2 shadow-sm">
            <div className="h-1.5 bg-gradient-to-r from-blue-200 to-purple-200 rounded w-3/4 mb-1" />
            <div className="h-1 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}

function EcommercePreview() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-lg">
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-2 shadow-sm">
            <div className="w-full h-12 bg-gradient-to-br from-cyan-200 to-blue-200 rounded mb-2" />
            <div className="h-1.5 bg-gray-200 rounded w-full mb-1" />
            <div className="h-1 bg-gray-200 rounded w-2/3" />
            <div className="mt-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

function GestionalePreview() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-violet-50 to-purple-50 p-4 rounded-lg">
      <div className="bg-white rounded-lg p-3 shadow-sm mb-2">
        <div className="flex gap-2 mb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 bg-gradient-to-r from-violet-300 to-purple-300 rounded flex-1"
            />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded p-2 shadow-sm flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-violet-400 to-purple-400 rounded" />
            <div className="flex-1">
              <div className="h-1.5 bg-gray-200 rounded w-3/4 mb-1" />
              <div className="h-1 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
