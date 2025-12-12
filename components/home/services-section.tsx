"use client"

import { Code, Palette, LineChart, Smartphone, Globe, Zap } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Container } from "@/components/ui-custom/container"
import { Section } from "@/components/ui-custom/section"
import { GlassCard } from "@/components/ui-custom/glass-card"

const services = [
  {
    icon: Palette,
    title: "Web Design",
    description: "Design moderni e accattivanti che catturano l'attenzione e convertono i visitatori in clienti.",
    gradient: "from-blue-500 via-purple-500 to-violet-500",
  },
  {
    icon: Code,
    title: "Sviluppo Web",
    description: "Soluzioni tecniche performanti con le ultime tecnologie: React, Next.js, Node.js e molto altro.",
    gradient: "from-violet-500 via-purple-500 to-pink-500",
  },
  {
    icon: Smartphone,
    title: "App Mobile",
    description: "Applicazioni native e cross-platform per iOS e Android, ottimizzate per le migliori performance.",
    gradient: "from-purple-500 via-indigo-500 to-blue-500",
  },
  {
    icon: LineChart,
    title: "SEO & Marketing",
    description: "Strategie SEO e campagne di marketing digitale per aumentare la visibilità online del tuo brand.",
    gradient: "from-cyan-500 via-blue-500 to-indigo-500",
  },
  {
    icon: Globe,
    title: "E-commerce",
    description: "Negozi online completi con sistemi di pagamento sicuri e gestione inventario integrata.",
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
  },
  {
    icon: Zap,
    title: "Performance",
    description: "Ottimizzazione delle performance e velocità di caricamento per una user experience impeccabile.",
    gradient: "from-purple-500 via-fuchsia-500 to-pink-500",
  },
]

export function ServicesSection() {
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set())
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observers = cardRefs.current.map((card, index) => {
      if (!card) return null

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleCards((prev) => new Set(prev).add(index))
            }
          })
        },
        { threshold: 0.1 },
      )

      observer.observe(card)
      return observer
    })

    return () => {
      observers.forEach((observer) => observer?.disconnect())
    }
  }, [])

  return (
    <Section variant="muted" id="servizi" className="section-divider">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-medium gradient-text uppercase tracking-wider animate-fade-in">
            I Nostri Servizi
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-balance animate-fade-in-up">
            Soluzioni digitali <span className="gradient-text">complete</span> per il tuo business
          </h2>
          <p className="mt-6 text-lg text-muted-foreground text-pretty animate-fade-in-up delay-200">
            Offriamo una gamma completa di servizi per trasformare la tua presenza digitale e raggiungere i tuoi
            obiettivi di business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={service.title}
              ref={(el) => {
                cardRefs.current[index] = el
              }}
              className={cn(
                "transition-all duration-700 ease-out",
                visibleCards.has(index) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
              )}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <GlassCard hover className="h-full group cursor-pointer relative overflow-hidden shimmer-effect">
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10",
                    "transition-all duration-700 blur-xl",
                    service.gradient,
                  )}
                />

                <div className="relative z-10">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6",
                      service.gradient,
                      "transition-all duration-700 group-hover:scale-110 group-hover:rotate-12",
                      "shadow-lg group-hover:shadow-2xl animate-float-rotate",
                    )}
                    style={{ animationDuration: `${6 + index}s` }}
                  >
                    <service.icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-xl font-bold mb-3 group-hover:gradient-text transition-all duration-300">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                    {service.description}
                  </p>

                  <div
                    className="mt-6 h-1 w-0 bg-gradient-to-r rounded-full group-hover:w-full transition-all duration-700 opacity-0 group-hover:opacity-100 animate-gradient-x"
                    style={{ backgroundImage: `linear-gradient(90deg, var(--tw-gradient-stops))` }}
                    className={cn(
                      "mt-6 h-1 w-0 rounded-full group-hover:w-full transition-all duration-700",
                      service.gradient,
                    )}
                  />
                </div>
              </GlassCard>
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
