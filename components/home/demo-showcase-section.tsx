"use client"

import { useState, useEffect, useRef } from "react"
import { Container } from "@/components/ui-custom/container"
import { Section } from "@/components/ui-custom/section"
import { Users, BarChart3, ShoppingCart, LayoutDashboard } from "lucide-react"

const demos = [
  {
    id: 1,
    title: "CRM Clienti",
    description: "Gestione completa dei contatti e delle relazioni",
    icon: Users,
    color: "from-blue-500 to-purple-500",
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg">
        <div className="bg-white rounded-lg p-3 shadow-sm mb-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400" />
            <div className="flex-1">
              <div className="h-2 bg-gradient-to-r from-blue-300 to-purple-300 rounded w-2/3 mb-1" />
              <div className="h-1.5 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded p-2 shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-blue-200 to-purple-200 rounded w-3/4 mb-1" />
              <div className="h-1 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: "Dashboard Analytics",
    description: "Metriche e KPI in tempo reale",
    icon: BarChart3,
    color: "from-purple-500 to-pink-500",
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
        <div className="grid grid-cols-3 gap-2 mb-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded p-2 shadow-sm">
              <div className="h-1 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gradient-to-r from-purple-300 to-pink-300 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded p-3 shadow-sm">
          <div className="flex gap-1 items-end justify-between h-16">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-purple-400 to-pink-400 rounded-t"
                style={{ height: `${Math.random() * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "E-commerce",
    description: "Gestione prodotti e ordini online",
    icon: ShoppingCart,
    color: "from-cyan-500 to-blue-500",
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-lg">
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-2 shadow-sm">
              <div className="w-full h-12 bg-gradient-to-br from-cyan-200 to-blue-200 rounded mb-2" />
              <div className="h-1.5 bg-gray-200 rounded w-full mb-1" />
              <div className="h-1 bg-gray-200 rounded w-2/3" />
              <div className="mt-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "Gestionale",
    description: "Controllo completo delle operazioni",
    icon: LayoutDashboard,
    color: "from-violet-500 to-purple-500",
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-violet-50 to-purple-50 p-4 rounded-lg">
        <div className="bg-white rounded-lg p-3 shadow-sm mb-2">
          <div className="flex gap-2 mb-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-1.5 bg-gradient-to-r from-violet-300 to-purple-300 rounded flex-1" />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded p-2 shadow-sm flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-violet-400 to-purple-400 rounded" />
              <div className="flex-1">
                <div className="h-1.5 bg-gray-200 rounded w-3/4 mb-1" />
                <div className="h-1 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

export function DemoShowcaseSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % demos.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const cardWidth = container.offsetWidth / 3
      container.scrollTo({
        left: currentIndex * cardWidth,
        behavior: "smooth",
      })
    }
  }, [currentIndex])

  return (
    <Section ref={sectionRef} className="section-divider">
      <Container>
        <div
          className={cn(
            "text-center max-w-3xl mx-auto mb-16 transition-all duration-1000",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
          )}
        >
          <span className="text-sm font-medium gradient-text uppercase tracking-wider">Demo Interattive</span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-balance animate-text-reveal">
            Scopri le nostre <span className="gradient-text">soluzioni</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg text-pretty">
            Esplora le interfacce che creiamo: CRM, dashboard, e-commerce e gestionali su misura per il tuo business
          </p>
        </div>

        <div className="relative">
          {/* Scrolling Cards Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {demos.map((demo, index) => {
              const Icon = demo.icon
              return (
                <div
                  key={demo.id}
                  className={cn(
                    "flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] snap-center",
                    "transition-all duration-700",
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20",
                  )}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div
                    className={cn(
                      "group relative glass rounded-2xl overflow-hidden h-[400px]",
                      "hover:scale-105 transition-all duration-500 cursor-pointer",
                      "hover:shadow-2xl shimmer-effect",
                    )}
                    onClick={() => setCurrentIndex(index)}
                  >
                    <div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity",
                        demo.color,
                      )}
                    />

                    <div className="relative z-10 p-6 h-full flex flex-col">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                            demo.color,
                            "group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 animate-pulse-glow",
                          )}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{demo.title}</h3>
                          <p className="text-sm text-muted-foreground">{demo.description}</p>
                        </div>
                      </div>

                      <div className="flex-1 relative rounded-xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                        {demo.preview}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Clicca per esplorare</span>
                        <div className="flex gap-1">
                          {demos.map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "h-1 rounded-full transition-all duration-300",
                                i === index ? "w-8 bg-gradient-to-r " + demo.color : "w-2 bg-gray-300",
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {demos.map((demo, index) => (
              <button
                key={demo.id}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === currentIndex ? "w-12 bg-gradient-to-r " + demo.color : "w-2 bg-gray-300 hover:bg-gray-400",
                )}
                aria-label={`Go to ${demo.title}`}
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
