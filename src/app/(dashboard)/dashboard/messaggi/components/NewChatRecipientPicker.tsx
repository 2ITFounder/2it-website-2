"use client"

import { ChatUser } from "@/src/hooks/useChatUsers"
import { cn } from "@/src/lib/utils"

type Props = {
  users: ChatUser[]
  recipient: string
  onSelectRecipient: (id: string) => void
}

export function NewChatRecipientPicker({ users, recipient, onSelectRecipient }: Props) {
  return (
    <div className="p-4 border-b space-y-3">
      <div className="text-sm text-muted-foreground">Seleziona il destinatario</div>
      <div className="rounded-lg border bg-background">
        {users.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">Nessun utente trovato. Aggiungi un altro admin.</p>
        ) : (
          users.map((u) => {
            const label = u.username || `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email
            const active = recipient === u.user_id
            return (
              <button
                key={u.user_id}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm transition flex items-center justify-between",
                  active ? "bg-accent/20 text-accent-foreground" : "hover:bg-muted/70"
                )}
                onClick={() => onSelectRecipient(u.user_id)}
              >
                <span>{label || "Senza nome"}</span>
                {active ? <span className="text-xs text-accent">Selezionato</span> : null}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
