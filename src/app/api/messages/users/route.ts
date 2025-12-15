"use server"

import { NextResponse } from "next/server"
import { createSupabaseRouteClient } from "@/src/lib/supabase/route"
import { createSupabaseServiceClient } from "@/src/lib/supabase/service"

export async function GET() {
  const supabaseAuth = await createSupabaseRouteClient()
  const { data: auth } = await supabaseAuth.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createSupabaseServiceClient()

  // Prendi gli admin e i relativi profili (escludendo te stesso)
  const { data: admins, error: adminErr } = await supabase.from("admin_users").select("user_id")
  if (adminErr) return NextResponse.json({ error: adminErr.message }, { status: 500 })

  const ids = (admins ?? []).map((a: any) => a.user_id).filter((id: string) => id && id !== auth.user.id)
  if (!ids.length) return NextResponse.json({ data: [] })

  // fetch profili (supporta sia user_setting che user_settings)
  const selectCols = "user_id,first_name,last_name,email,username"
  const fetchProfiles = async (table: string) => await supabase.from(table).select(selectCols).in("user_id", ids)

  let profiles: any[] | null = null
  let profileErr: any = null

  const attempt1 = await fetchProfiles("user_setting")
  if (!attempt1.error) {
    profiles = attempt1.data ?? []
  } else {
    const attempt2 = await fetchProfiles("user_settings")
    profiles = attempt2.data ?? []
    profileErr = attempt2.error
  }

  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })

  // merge admin ids con profili (anche se mancanti)
  const profileMap = new Map<string, any>()
  for (const p of profiles ?? []) profileMap.set(p.user_id, p)

  const users = ids.map((id) => {
    const p = profileMap.get(id) ?? {}
    return {
      user_id: id,
      first_name: p.first_name ?? null,
      last_name: p.last_name ?? null,
      email: p.email ?? null,
      username: p.username ?? null,
    }
  })

  return NextResponse.json({ data: users })
}
