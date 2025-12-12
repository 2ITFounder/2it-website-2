import type React from "react"
import { cn } from "@/lib/utils"

interface SectionProps {
  children: React.ReactNode
  className?: string
  id?: string
  variant?: "default" | "muted" | "dark" | "gradient"
}

export function Section({ children, className, id, variant = "default" }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "py-16 md:py-24 lg:py-32",
        {
          "bg-background": variant === "default",
          "bg-muted/50": variant === "muted",
          "bg-primary text-primary-foreground": variant === "dark",
          "animated-gradient": variant === "gradient",
        },
        className,
      )}
    >
      {children}
    </section>
  )
}
