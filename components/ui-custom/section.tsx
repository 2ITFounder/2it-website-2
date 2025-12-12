import React, { forwardRef } from "react"
import { cn } from "@/lib/utils"

export interface SectionProps {
  children: React.ReactNode
  className?: string
  id?: string
  variant?: "default" | "muted" | "dark" | "gradient"
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ children, className, id, variant = "default" }, ref) => {
    return (
      <section
        ref={ref}
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
  },
)

Section.displayName = "Section"
