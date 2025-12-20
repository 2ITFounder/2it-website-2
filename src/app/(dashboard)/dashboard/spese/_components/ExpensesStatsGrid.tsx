"use client"

import { CalendarDays, CheckCircle2, CreditCard } from "lucide-react"
import { GlassCard } from "@/src/components/ui-custom/glass-card"
import { formatCurrency } from "../_lib/formatters"

type Totals = {
  monthly: number
  annual: number
  oneTime: number
  myMonthly: number
  colleagueMonthly: number
}

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

      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Quota mia (mensile)</p>
            <p className="text-2xl font-semibold">{formatCurrency(totals.myMonthly || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Calcolata in base allo split</p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-accent" />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Quota collega (mensile)</p>
            <p className="text-2xl font-semibold">{formatCurrency(totals.colleagueMonthly || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Basata su split_mode</p>
          </div>
          <CreditCard className="w-8 h-8 text-accent" />
        </div>
      </GlassCard>
    </div>
  )
}
