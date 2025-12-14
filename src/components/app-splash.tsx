"use client"

import { useEffect, useState } from "react"

export function AppSplash() {
  const [phase, setPhase] = useState<"show" | "exit" | "gone">("show")

  useEffect(() => {
    // lascia 1 frame per evitare flicker, poi fai partire l’uscita
    const t1 = window.setTimeout(() => setPhase("exit"), 120)
    // durata animazione: 850ms
    const t2 = window.setTimeout(() => setPhase("gone"), 950)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [])

  if (phase === "gone") return null
  const exiting = phase === "exit"

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden" aria-hidden="true">
      {/* fondo (dietro ai triangoli) */}
      <div className="absolute inset-0 bg-[#0b1220]" />

      {/* logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src="/splash/splash.png"
          alt=""
          className={[
            "w-44 h-44 object-contain will-change-transform",
            exiting ? "opacity-0 scale-95 transition-all duration-500 ease-out" : "opacity-100 scale-100",
          ].join(" ")}
        />
      </div>

      {/* TRIANGOLO 1: dal centro verso alto-destra */}
      <div
        className={[
          "absolute inset-0 will-change-transform",
          "bg-[#0b1220]",
          "splash-tri-1",
          exiting ? "splash-tri-1-exit" : "",
        ].join(" ")}
      />

      {/* TRIANGOLO 2: dal centro verso basso-sinistra */}
      <div
        className={[
          "absolute inset-0 will-change-transform",
          "bg-[#0b1220]",
          "splash-tri-2",
          exiting ? "splash-tri-2-exit" : "",
        ].join(" ")}
      />

      {/* piccola vignettatura per renderla più “app” */}
      <div className="absolute inset-0 pointer-events-none [box-shadow:inset_0_0_120px_rgba(0,0,0,0.35)]" />
    </div>
  )
}
