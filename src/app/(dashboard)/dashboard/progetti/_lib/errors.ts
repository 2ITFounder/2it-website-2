export function extractErrorMessage(err: unknown): string | null {
  if (!err) return null
  if (typeof err === "string") return err
  if (typeof err === "object" && err && "message" in err && typeof (err as { message?: unknown }).message === "string") {
    return (err as { message: string }).message
  }
  return "Si è verificato un errore"
}
