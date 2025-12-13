"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Bell, User } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { cn } from "@/src/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/clienti", label: "Clienti" },
  { href: "/dashboard/progetti", label: "Progetti" },
  { href: "/dashboard/report", label: "Report" },
]

export function DashboardTopbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Mobile Menu Button */}
        <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Logo */}
        <Link href="/dashboard" className="lg:hidden text-lg font-bold">
          2it<span className="text-accent">.</span>
        </Link>

        {/* Breadcrumb / Title */}
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold capitalize">{pathname.split("/").pop() || "Dashboard"}</h1>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
          </Button>
          <Button variant="ghost" size="icon">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-300 border-b",
          mobileMenuOpen ? "max-h-64" : "max-h-0 border-b-0",
        )}
      >
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block px-4 py-2 rounded-lg text-sm font-medium",
                pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted",
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
