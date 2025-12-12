import type React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className, hover = false }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-xl p-6 border border-white/5",
        hover &&
          "transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-accent/20 hover:border-accent/30 hover:-translate-y-1",
        className,
      )}
    >
      {children}
    </div>
  )
}
