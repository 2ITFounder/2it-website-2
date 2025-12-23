"use client"

import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/src/components/ui/button"

export function ProjectHeader(props: {
  title: string
  computedProgress: number
  onBack: () => void
  onCreate: () => void
}) {
  const { title, computedProgress, onBack, onCreate } = props

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">
            Progresso calcolato da task: <span className="font-medium">{computedProgress}%</span>
          </p>
        </div>
      </div>

      <Button className="glow-button" onClick={onCreate}>
        <Plus className="w-4 h-4 mr-2" />
        Nuova task
      </Button>
    </div>
  )
}
