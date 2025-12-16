"use client"

import { useRef } from "react"
import { Button } from "@/src/components/ui/button"
import { cn } from "@/src/lib/utils"
import { MessageItem } from "@/src/hooks/useMessages"

type Props = {
  message: MessageItem
  isMine: boolean
  isActive: boolean
  dimmed: boolean
  onOpenActions: (message: MessageItem) => void
  onUpdateTag: (message: MessageItem, tag: "important" | "idea" | "none") => void
  onDelete: (message: MessageItem) => void
  onRetry: (message: MessageItem) => void
}

export function MessageItemBubble({
  message,
  isMine,
  isActive,
  dimmed,
  onOpenActions,
  onUpdateTag,
  onDelete,
  onRetry,
}: Props) {
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const tagClass =
    message.tag === "important"
      ? "border border-red-200 bg-red-50 text-red-900"
      : message.tag === "idea"
        ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
        : isMine
          ? "bg-accent text-accent-foreground"
          : "bg-muted text-foreground"

  return (
    <div
      className={cn(
        "relative flex py-0.5",
        isMine ? "justify-end" : "justify-start",
        dimmed ? "opacity-40 blur-[1px] pointer-events-none" : ""
      )}
    >
      {isActive ? (
        <div className="absolute z-60 -top-12 right-0 flex gap-2 bg-background border rounded-lg shadow-lg px-3 py-2">
          {message.tag === "important" ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => onUpdateTag(message, "none")}>
                Normale
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onUpdateTag(message, "idea")}>
                Idea
              </Button>
            </>
          ) : message.tag === "idea" ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => onUpdateTag(message, "important")}>
                Importante
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onUpdateTag(message, "none")}>
                Normale
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => onUpdateTag(message, "important")}>
                Importante
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onUpdateTag(message, "idea")}>
                Idea
              </Button>
            </>
          )}
          <Button size="sm" variant="destructive" onClick={() => onDelete(message)}>
            Elimina
          </Button>
        </div>
      ) : null}

      <div
        className={cn(
          "px-3 py-2 rounded-lg max-w-lg text-sm border",
          tagClass,
          isActive ? "ring-2 ring-offset-2 ring-accent" : ""
        )}
        onClick={() => onOpenActions(message)}
        onPointerDown={(e) => {
          if (e.button !== 0) return
          if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current)
          holdTimeoutRef.current = setTimeout(() => onOpenActions(message), 350)
        }}
        onPointerUp={() => {
          if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current)
        }}
        onPointerCancel={() => {
          if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current)
        }}
        onPointerLeave={() => {
          if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current)
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          onOpenActions(message)
        }}
      >
        <div className="whitespace-pre-wrap">{message.body}</div>
        <div className="text-[11px] opacity-80 mt-1 flex items-center gap-2">
          <span>{new Date(message.created_at).toLocaleTimeString()}</span>
          {message.tag ? <span className="uppercase font-semibold">{message.tag}</span> : null}
          {message.sendStatus === "sending" ? <span>Invio...</span> : null}
          {message.sendStatus === "failed" ? (
            <button
              className="text-destructive underline underline-offset-2"
              onClick={(e) => {
                e.stopPropagation()
                onRetry(message)
              }}
            >
              Ritenta
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
