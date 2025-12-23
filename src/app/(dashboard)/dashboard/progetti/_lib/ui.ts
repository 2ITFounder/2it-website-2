export function clamp(n: number) {
  return Math.max(0, Math.min(100, n))
}

export function taskStatusPill(status: "TODO" | "DOING" | "DONE") {
  if (status === "DONE") return "bg-green-100 text-green-700"
  if (status === "DOING") return "bg-blue-100 text-blue-700"
  return "bg-gray-100 text-gray-700"
}

export function taskBorder(status: "TODO" | "DOING" | "DONE") {
  if (status === "DONE") return "border-green-200"
  if (status === "DOING") return "border-blue-200"
  return "border-gray-200"
}
