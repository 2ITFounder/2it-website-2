"use client"

import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog"

export function CreateTaskDialog(props: {
  open: boolean
  onOpenChange: (v: boolean) => void
  creating: boolean
  newTitle: string
  setNewTitle: (v: string) => void
  newWeight: string
  setNewWeight: (v: string) => void
  onCreate: () => void
}) {
  const { open, onOpenChange, creating, newTitle, setNewTitle, newWeight, setNewWeight, onCreate } = props

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuova task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Titolo</Label>
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Es. Setup hosting" />
          </div>

          <div className="space-y-2">
            <Label>Peso</Label>
            <Input
              inputMode="numeric"
              pattern="[0-9]*"
              value={newWeight}
              onChange={(e) => {
                const v = e.target.value
                if (v === "" || /^\d+$/.test(v)) setNewWeight(v)
              }}
              onBlur={() => {
                if (newWeight === "") setNewWeight("1")
              }}
            />
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Annulla
          </Button>
          <Button className="glow-button" onClick={onCreate} disabled={creating || !newTitle.trim()}>
            {creating ? "Creazione..." : "Crea"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
