import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AnimatedBackground } from "@/src/components/animated-background"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "2it | Web Agency B2B",
  description:
    "Trasformiamo le tue idee in esperienze digitali straordinarie. Web design, sviluppo e strategie digitali per il tuo business.",
  generator: "Next.js",
  keywords: ["web agency", "sviluppo web", "design", "B2B", "digital marketing", "Italia"],
  authors: [{ name: "2it" }],
  openGraph: {
    title: "2it Website",
    description: "Trasformiamo le tue idee in esperienze digitali straordinarie.",
    siteName: "2it Website",
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "2it | Web Agency B2B",
    description: "Trasformiamo le tue idee in esperienze digitali straordinarie.",
  },
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0b1220",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="font-sans antialiased">
        <AnimatedBackground />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
