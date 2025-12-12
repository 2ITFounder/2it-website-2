import type React from "react"
import { cn } from "@/lib/utils"

interface ContainerProps {
  children: React.ReactNode
  className?: string
  size?: "default" | "sm" | "lg" | "full"
}

export function Container({ children, className, size = "default" }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        {
          "max-w-7xl": size === "default",
          "max-w-5xl": size === "sm",
          "max-w-[1400px]": size === "lg",
          "max-w-full": size === "full",
        },
        className,
      )}
    >
      {children}
    </div>
  )
}
