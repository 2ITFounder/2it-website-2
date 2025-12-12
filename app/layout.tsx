import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AnimatedBackground } from "@/components/animated-background"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Nexus Agency | Web Agency B2B",
  description:
    "Trasformiamo le tue idee in esperienze digitali straordinarie. Web design, sviluppo e strategie digitali per il tuo business.",
  generator: "Next.js",
  keywords: ["web agency", "sviluppo web", "design", "B2B", "digital marketing", "Italia"],
  authors: [{ name: "Nexus Agency" }],
  openGraph: {
    title: "Nexus Agency | Web Agency B2B",
    description: "Trasformiamo le tue idee in esperienze digitali straordinarie.",
    url: "https://nexusagency.it",
    siteName: "Nexus Agency",
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus Agency | Web Agency B2B",
    description: "Trasformiamo le tue idee in esperienze digitali straordinarie.",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
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
