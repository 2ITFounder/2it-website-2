"use client"

import { Plus, Search } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"

export function ProjectsToolbar({
  query,
  onQueryChange,
  onOpenCreate,
}: {
  query: string
  onQueryChange: (v: string) => void
  onOpenCreate: () => void
}) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Progetti</h1>
          <p className="text-muted-foreground">Gestisci tutti i tuoi progetti attivi</p>
        </div>

        <Button className="glow-button" onClick={onOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Progetto
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cerca progetti."
          className="pl-10"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>
    </>
  )
}
