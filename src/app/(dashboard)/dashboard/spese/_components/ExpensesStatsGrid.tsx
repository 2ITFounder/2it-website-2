"use client"

import { CalendarDays, CheckCircle2, CreditCard } from "lucide-react"
import { GlassCard } from "@/src/components/ui-custom/glass-card"
import { formatCurrency } from "../_lib/formatters"
import type { Totals } from "../_lib/types"

type Props = {
  totals: Totals
}

export function ExpensesStatsGrid({ totals }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Totale mensile stimato</p>
            <p className="text-2xl font-semibold">{formatCurrency(totals.monthly || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Annuali divise per 12 - Una tantum escluse</p>
          </div>
          <CreditCard className="w-8 h-8 text-accent" />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Totale annuo stimato</p>
            <p className="text-2xl font-semibold">{formatCurrency(totals.annual || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Una tantum: {formatCurrency(totals.oneTime || 0)}</p>
          </div>
          <CalendarDays className="w-8 h-8 text-accent" />
        </div>
      </GlassCard>

      {totals.users.map((user) => (
        <GlassCard key={user.userId}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Quota {user.label} (mensile)</p>
              <p className="text-2xl font-semibold">{formatCurrency(user.totalMonthly || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Comuni: {formatCurrency(user.sharedMonthly || 0)} · Personali: {formatCurrency(user.personalMonthly || 0)}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-accent" />
          </div>
        </GlassCard>
      ))}

      {totals.noIncluded ? (
        <div className="col-span-full text-xs text-destructive">Nessun utente inserito nelle spese.</div>
      ) : null}
    </div>
  )
}
