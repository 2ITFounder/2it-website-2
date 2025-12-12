// components/home/demo-showcase/AnalyticsPreview.tsx
"use client"

import { useEffect, useState } from "react"

export function AnalyticsPreview() {
  const [heights, setHeights] = useState<number[]>([])

  useEffect(() => {
    setHeights(Array.from({ length: 12 }, () => Math.random() * 100))
  }, [])

  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
      <div className="bg-white rounded p-3 shadow-sm h-full">
        <div className="flex gap-1 items-end h-20">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-purple-400 to-pink-400 rounded-t"
              style={{ height: `${heights[i] ?? 50}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
