import type React from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardTopbar } from "@/components/dashboard/topbar"

// =================================================================
// PLACEHOLDER: Protezione route con auth reale
// =================================================================
// Per implementare la protezione con Supabase:
// import { createServerClient } from '@supabase/ssr'
//
// const supabase = createServerClient(...)
// const { data: { user } } = await supabase.auth.getUser()
// if (!user) redirect('/login')
// =================================================================

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check for demo session cookie
  const cookieStore = await cookies()
  const session = cookieStore.get("session")

  // =================================================================
  // PLACEHOLDER: Sostituire con controllo auth reale
  // =================================================================
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardTopbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
