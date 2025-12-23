export type ProjectStatus = "LEAD" | "IN_CORSO" | "IN_REVISIONE" | "COMPLETATO" | "IN_PAUSA" | "ANNULLATO"
export type TaskStatus = "TODO" | "DOING" | "DONE"

export type Project = {
  id: string
  title: string
  description: string | null
  status: ProjectStatus
  progress: number
  due_date: string | null
}

export type Task = {
  id: string
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: number
  weight: number
  due_date: string | null
  position: number
  created_at?: string | null
  updated_at?: string | null
}

export type TaskPatch = Partial<Pick<Task, "title" | "status" | "weight" | "due_date" | "priority">>
