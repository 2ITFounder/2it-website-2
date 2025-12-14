import type React from "react"
import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/src/components/dashboard/sidebar"
import { DashboardTopbar } from "@/src/components/dashboard/topbar"
import { createSupabaseServerClient } from "../../lib/supabase/server"
import { Providers } from "./providers"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) redirect("/login")

  return (
    <Providers>
      <div className="min-h-screen bg-muted/30">
        <DashboardSidebar />
        <div className="lg:pl-64">
          <DashboardTopbar />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </Providers>
  )
}
