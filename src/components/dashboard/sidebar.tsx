"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Users, FileBarChart, Settings, LogOut, FolderKanban } from "lucide-react"
import { cn } from "@/src/lib/utils"
import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { apiGet } from "@/src/lib/api"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clienti", label: "Clienti", icon: Users },
  { href: "/dashboard/progetti", label: "Progetti", icon: FolderKanban },
  { href: "/dashboard/report", label: "Report", icon: FileBarChart },
  { href: "/dashboard/impostazioni", label: "Impostazioni", icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const qc = useQueryClient()

  // ✅ Prefetch 1 volta quando entri in dashboard (migliora primo ingresso nelle pagine)
  useEffect(() => {
    qc.prefetchQuery({ queryKey: ["dashboardSummary"], queryFn: () => apiGet("/api/dashboard/summary") })
    qc.prefetchQuery({ queryKey: ["clients"], queryFn: () => apiGet("/api/clients") })
    qc.prefetchQuery({ queryKey: ["projects"], queryFn: () => apiGet("/api/projects") })
    qc.prefetchQuery({ queryKey: ["reports", "clients"], queryFn: () => apiGet("/api/reports/clients") })
    qc.prefetchQuery({ queryKey: ["reports", "projects"], queryFn: () => apiGet("/api/reports/projects") })
    qc.prefetchQuery({ queryKey: ["settings"], queryFn: () => apiGet("/api/settings") })

    // ✅ Prefetch rotte (secondario, ma gratis)
    router.prefetch("/dashboard/clienti")
    router.prefetch("/dashboard/progetti")
    router.prefetch("/dashboard/report")
    router.prefetch("/dashboard/impostazioni")
  }, [qc, router])

  const handleLogout = () => {
    document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
    window.location.href = "/login"
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border hidden lg:block">
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-sidebar-border">
          <Link href="/dashboard" className="text-xl font-bold text-sidebar-foreground">
            2it<span className="text-sidebar-primary">.</span>
          </Link>
          <p className="text-xs text-sidebar-foreground/60 mt-1">Gestionale</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Esci
          </button>
        </div>
      </div>
    </aside>
  )
}
