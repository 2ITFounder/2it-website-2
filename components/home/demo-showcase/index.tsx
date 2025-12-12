// components/home/demo-showcase/index.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { Container } from "@/components/ui-custom/container"
import { Section } from "@/components/ui-custom/section"
import { demos } from "./demos.data"
import { DemoCard } from "./DemoCard"
import { cn } from "@/lib/utils"

export function DemoShowcaseSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && setIsVisible(true),
      { threshold: 0.2 }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  // Duplico per loop seamless
  const trackItems = [...demos, ...demos]

  return (
    <Section ref={sectionRef} className="section-divider overflow-hidden">
      <Container>
        <div className={cn(
          "text-center max-w-3xl mx-auto mb-16 transition-all duration-1000",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        )}>
          <span className="text-sm font-medium gradient-text uppercase tracking-wider">Demo Interattive</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight">
            Scopri le nostre <span className="gradient-text">soluzioni</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            CRM, dashboard, e-commerce e gestionali su misura
          </p>
        </div>

        {/* viewport */}
        <div className="relative">
          <div className="overflow-hidden">
            {/* track */}
            <div
              className="marquee gap-6"
              style={{ ["--marquee-duration" as any]: "38s" }}
            >
              {trackItems.map((demo, idx) => (
                <div
                  key={`${demo.id}-${idx}`}
                  className="w-[85vw] sm:w-[380px] md:w-[420px] flex-shrink-0"
                >
                  <DemoCard demo={demo as any} />
                </div>
              ))}
            </div>
          </div>

          {/* fade edges (optional ma fa “premium”) */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
        </div>
      </Container>
    </Section>
  )
}
