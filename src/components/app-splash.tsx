"use client"

import { useEffect, useState } from "react"

const SPLASH_IMAGE = "/splash/splash.png"

export function AppSplash() {
  const [phase, setPhase] = useState<"show" | "exit" | "gone">("show")
  const [isPwa, setIsPwa] = useState(false)

  // Rende la splash solo in PWA/standalone
  useEffect(() => {
    const isStandalone = () => {
      const mediaStandalone = window.matchMedia?.("(display-mode: standalone)").matches
      const iosStandalone = (window.navigator as never as { standalone?: boolean })?.standalone === true
      const trustedOrigin = document.referrer?.startsWith("android-app://")
      return Boolean(mediaStandalone || iosStandalone || trustedOrigin)
    }

    const update = () => setIsPwa(isStandalone())
    update()

    const media = window.matchMedia?.("(display-mode: standalone)")
    media?.addEventListener("change", update)
    return () => media?.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (!isPwa) return
    // lascia 1 frame per evitare flicker, poi fai partire l'uscita
    const t1 = window.setTimeout(() => setPhase("exit"), 160)
    // durata animazione: 850ms
    const t2 = window.setTimeout(() => setPhase("gone"), 1050)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [isPwa])

  if (!isPwa || phase === "gone") return null
  const exiting = phase === "exit"

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#0b1220]" aria-hidden="true">
      {/* Immagine di sfondo full-screen */}
      <div className="absolute inset-0">
        <img
          src={SPLASH_IMAGE}
          alt=""
          className={[
            "absolute inset-0 w-full h-full object-cover",
            exiting ? "scale-[1.03] opacity-90 transition-all duration-700 ease-out" : "scale-100 opacity-100",
          ].join(" ")}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.08),rgba(0,0,0,0.35))]" />
      </div>

      {/* logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src="/icon.svg"
          alt=""
          className={[
            "w-24 h-24 object-contain drop-shadow-lg will-change-transform",
            exiting ? "opacity-0 scale-95 transition-all duration-500 ease-out" : "opacity-100 scale-100",
          ].join(" ")}
        />
      </div>

      {/* TRIANGOLO 1: dal centro verso alto-destra */}
      <div
        className={[
          "absolute inset-0 will-change-transform",
          "bg-[#0b1220] splash-tri-base",
          "splash-tri-1",
          exiting ? "splash-tri-1-exit" : "",
        ].join(" ")}
        style={{ backgroundImage: `url(${SPLASH_IMAGE})` }}
      />

      {/* TRIANGOLO 2: dal centro verso basso-sinistra */}
      <div
        className={[
          "absolute inset-0 will-change-transform",
          "bg-[#0b1220] splash-tri-base",
          "splash-tri-2",
          exiting ? "splash-tri-2-exit" : "",
        ].join(" ")}
        style={{ backgroundImage: `url(${SPLASH_IMAGE})` }}
      />

      {/* piccola vignettatura per renderla piu "app" */}
      <div className="absolute inset-0 pointer-events-none [box-shadow:inset_0_0_120px_rgba(0,0,0,0.35)]" />
    </div>
  )
}
