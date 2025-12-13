"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, FileBarChart, Settings, LogOut, FolderKanban } from "lucide-react"
import { cn } from "@/src/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clienti", label: "Clienti", icon: Users },
  { href: "/dashboard/progetti", label: "Progetti", icon: FolderKanban },
  { href: "/dashboard/report", label: "Report", icon: FileBarChart },
  { href: "/dashboard/impostazioni", label: "Impostazioni", icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  const handleLogout = () => {
    // =================================================================
    // PLACEHOLDER: Implementare logout reale
    // =================================================================
    // Per Supabase: await supabase.auth.signOut()
    // =================================================================
    document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
    window.location.href = "/login"
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border hidden lg:block">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <Link href="/dashboard" className="text-xl font-bold text-sidebar-foreground">
            2it<span className="text-sidebar-primary">.</span>
          </Link>
          <p className="text-xs text-sidebar-foreground/60 mt-1">Gestionale</p>
        </div>

        {/* Navigation */}
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

        {/* Logout */}
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
