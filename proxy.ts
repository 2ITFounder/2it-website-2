import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// =================================================================
// PLACEHOLDER: Middleware per autenticazione reale
// =================================================================
// Per implementare con Supabase:
// import { createServerClient } from '@supabase/ssr'
//
// const supabase = createServerClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//   { cookies: { ... } }
// )
// const { data: { user } } = await supabase.auth.getUser()
// =================================================================

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Proteggi le route della dashboard
  if (pathname.startsWith("/dashboard")) {
    const session = request.cookies.get("session")

    // =================================================================
    // PLACEHOLDER: Sostituire con verifica session reale
    // =================================================================
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // Redirect da login se già autenticato
  if (pathname === "/login") {
    const session = request.cookies.get("session")
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}
