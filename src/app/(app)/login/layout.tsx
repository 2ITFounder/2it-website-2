import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { ServiceWorkerRegister } from "@/src/components/ServiceWorkerRegister"

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "2IT",
  },
}

export const viewport: Viewport = {
  themeColor: "#0b1220",
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="font-sans antialiased">
        <ServiceWorkerRegister />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
