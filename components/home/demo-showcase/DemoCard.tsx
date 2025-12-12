// components/home/demo-showcase/DemoCard.tsx
"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Demo = {
  id: number
  title: string
  description: string
  icon: LucideIcon
  color: string
  preview: React.ReactNode
}

export function DemoCard({
  demo,
  className,
}: {
  demo: Demo
  className?: string
}) {
  const Icon = demo.icon

  return (
    <div className={cn("group relative glass rounded-2xl overflow-hidden h-[400px]", className)}>
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity", demo.color)} />
      <div className="relative z-10 p-6 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center", demo.color)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">{demo.title}</h3>
            <p className="text-sm text-muted-foreground">{demo.description}</p>
          </div>
        </div>

        <div className="flex-1 relative rounded-xl overflow-hidden">
          {demo.preview}
        </div>
      </div>
    </div>
  )
}
