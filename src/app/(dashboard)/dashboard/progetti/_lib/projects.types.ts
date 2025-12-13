export type ClientRow = {
  id: string
  name: string
}

export type ProjectType = "SITO_VETRINA" | "ECOMMERCE" | "GESTIONALE" | "DASHBOARD" | "APP" | "ALTRO"
export type ProjectStatus = "LEAD" | "IN_CORSO" | "IN_REVISIONE" | "COMPLETATO" | "IN_PAUSA" | "ANNULLATO"

export type ProjectRow = {
  id: string
  client_id: string
  title: string
  description: string | null
  type: ProjectType
  status: ProjectStatus
  priority: number
  progress: number
  start_date: string | null
  due_date: string | null
  created_at?: string
  updated_at?: string
}

export type ProjectUpsertPayload = {
  client_id: string
  title: string
  description?: string | null
  type?: ProjectType
  status?: ProjectStatus
  priority?: number
  progress?: number
  due_date?: string | null
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  LEAD: "Lead",
  IN_CORSO: "In corso",
  IN_REVISIONE: "Review",
  COMPLETATO: "Completato",
  IN_PAUSA: "In pausa",
  ANNULLATO: "Annullato",
}

export function extractErrorMessage(err: any) {
  if (!err) return null
  if (typeof err === "string") return err
  if (typeof err?.message === "string") return err.message
  if (Array.isArray(err?.formErrors) && err.formErrors.length) return err.formErrors.join(", ")
  if (err?.fieldErrors && typeof err.fieldErrors === "object") {
    const msgs = Object.values(err.fieldErrors).flat().filter(Boolean) as string[]
    if (msgs.length) return msgs.join(", ")
  }
  return "Si è verificato un errore"
}

export function clampProgress(v: any) {
  const n = Number(v ?? 0)
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(100, n))
}

export function formatDueDate(due: string | null) {
  if (!due) return "—"
  const [y, m, d] = due.split("-").map((x) => Number(x))
  if (!y || !m || !d) return due
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function statusPillClasses(statusLabel: string) {
  if (statusLabel === "Completato") return "bg-green-100 text-green-700"
  if (statusLabel === "Review") return "bg-yellow-100 text-yellow-700"
  if (statusLabel === "In corso") return "bg-blue-100 text-blue-700"
  return "bg-gray-100 text-gray-700"
}
