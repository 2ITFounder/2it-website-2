export const formatCurrency = (amount: number, currency?: string) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)

export const formatDate = (value?: string | null) => {
  if (!value) return "N/D"
  const d = new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })
}
