"use client"

import { useEffect, useRef, useState } from "react"
import { Container } from "@/src/components/ui-custom/container"
import { Section } from "@/src/components/ui-custom/section"

const steps = [
  {
    number: "01",
    title: "Scoperta",
    description:
      "Analizziamo le tue esigenze, obiettivi e il mercato di riferimento per definire la strategia migliore.",
  },
  {
    number: "02",
    title: "Design",
    description: "Progettiamo wireframe e mockup interattivi, iterando insieme a te fino al risultato perfetto.",
  },
  {
    number: "03",
    title: "Sviluppo",
    description: "Trasformiamo il design in codice pulito e performante, con test rigorosi in ogni fase.",
  },
  {
    number: "04",
    title: "Lancio",
    description: "Deploy ottimizzato, formazione e supporto continuo per garantire il successo del progetto.",
  },
]

export function ProcessSection() {
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set())
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observers = stepRefs.current.map((step, index) => {
      if (!step) return null

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleSteps((prev) => new Set(prev).add(index))
            }
          })
        },
        { threshold: 0.2 },
      )

      observer.observe(step)
      return observer
    })

    return () => {
      observers.forEach((observer) => observer?.disconnect())
    }
  }, [])

  return (
    <Section id="processo" className="section-divider">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-sm font-medium gradient-text uppercase tracking-wider">Il Nostro Processo</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-balance">
            Un approccio <span className="gradient-text">strutturato</span> per risultati eccellenti
          </h2>
          <p className="mt-6 text-lg text-muted-foreground text-pretty">
            Il nostro metodo collaudato garantisce progetti consegnati in tempo, rispettando budget e aspettative.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {steps.map((step, index) => (
            <div
              key={step.number}
              ref={(el) => {
                stepRefs.current[index] = el
              }}
              className={cn(
                "relative group transition-all duration-700",
                visibleSteps.has(index) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16",
              )}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "hidden lg:block absolute top-12 left-full w-full h-0.5",
                    "bg-gradient-to-r from-primary via-accent to-secondary",
                    "-translate-x-6 transition-all duration-1000 opacity-30",
                    visibleSteps.has(index) ? "scale-x-100" : "scale-x-0",
                    "origin-left group-hover:opacity-100",
                  )}
                  style={{ transitionDelay: `${index * 150 + 300}ms` }}
                />
              )}

              <div className="relative p-8 rounded-2xl glass border-2 border-transparent hover:border-primary/30 transition-all duration-500 hover:scale-105 shimmer-effect">
                <div
                  className={cn(
                    "text-6xl font-bold mb-6 transition-all duration-700",
                    "gradient-text animate-text-reveal",
                    "group-hover:scale-125 group-hover:rotate-3",
                    "drop-shadow-[0_0_30px_rgba(99,102,241,0.3)]",
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {step.number}
                </div>

                <h3 className="text-2xl font-bold mb-4 group-hover:gradient-text transition-all duration-300">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">
                  {step.description}
                </p>

                <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary via-accent to-secondary group-hover:w-full transition-all duration-700 rounded-full" />

                <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-accent/0 group-hover:border-accent/50 rounded-tr-2xl transition-all duration-500" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
