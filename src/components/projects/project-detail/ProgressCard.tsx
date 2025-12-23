"use client"

import { GlassCard } from "@/src/components/ui-custom/glass-card"

export function ProgressCard({ computedProgress }: { computedProgress: number }) {
  return (
    <GlassCard>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Completamento</span>
          <span className="font-medium">{computedProgress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${computedProgress}%` }} />
        </div>
      </div>
    </GlassCard>
  )
}
