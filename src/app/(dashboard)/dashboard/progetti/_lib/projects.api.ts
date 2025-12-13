import { ClientRow, ProjectRow, ProjectUpsertPayload } from "./projects.types"

export async function apiGetProjects(): Promise<ProjectRow[]> {
  const res = await fetch("/api/projects", { cache: "no-store" })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw json?.error || "Errore caricamento progetti"
  return Array.isArray(json?.data) ? json.data : []
}

export async function apiGetClients(): Promise<ClientRow[]> {
  const res = await fetch("/api/clients", { cache: "no-store" })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw json?.error || "Errore caricamento clienti"
  return Array.isArray(json?.data) ? json.data : []
}

export async function apiCreateProject(payload: ProjectUpsertPayload) {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw json?.error || "Errore creazione progetto"
  return json?.data
}

export async function apiUpdateProject(id: string, payload: Partial<ProjectUpsertPayload>) {
  const res = await fetch("/api/projects", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...payload }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw json?.error || "Errore aggiornamento progetto"
  return json?.data
}

export async function apiDeleteProject(id: string) {
  const res = await fetch(`/api/projects?id=${encodeURIComponent(id)}`, { method: "DELETE" })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw json?.error || "Errore eliminazione progetto"
  return true
}
