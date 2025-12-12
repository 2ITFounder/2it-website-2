"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui-custom/container"
import { Section } from "@/components/ui-custom/section"

export function CTASection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Section variant="dark" className="relative overflow-hidden">
      <div className="absolute inset-0">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full blur-3xl animate-morph"
            style={{
              width: `${Math.random() * 400 + 200}px`,
              height: `${Math.random() * 400 + 200}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
              background:
                i % 3 === 0
                  ? "bg-gradient-to-br from-primary/30 to-accent/30"
                  : i % 3 === 1
                    ? "bg-gradient-to-br from-secondary/30 to-primary/30"
                    : "bg-gradient-to-br from-accent/30 to-secondary/30",
            }}
          />
        ))}
      </div>

      <Container size="sm" className="relative z-10">
        <div
          className={cn(
            "text-center transition-all duration-1000",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
          )}
        >
          <h2
            className={cn(
              "text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance",
              "text-primary-foreground animate-fade-in-up",
            )}
          >
            Pronto a far <span className="gradient-text">crescere</span> il tuo business?
          </h2>
          <p
            className={cn(
              "mt-8 text-xl text-primary-foreground/80 max-w-2xl mx-auto text-pretty leading-relaxed",
              "animate-fade-in-up delay-200",
            )}
          >
            Parliamo del tuo prossimo progetto. Siamo qui per trasformare le tue idee in realtà digitali di successo.
          </p>

          <div
            className={cn(
              "mt-12 flex flex-col sm:flex-row items-center justify-center gap-6",
              "animate-fade-in-up delay-300",
            )}
          >
            <Button
              size="lg"
              variant="secondary"
              className={cn(
                "text-lg px-10 py-6 group relative overflow-hidden glow-button",
                "bg-gradient-to-r from-primary via-accent to-secondary text-white",
                "hover:scale-105 hover:shadow-2xl transition-all duration-500 active:scale-95",
              )}
              asChild
            >
              <Link href="/contatti">
                <span className="relative z-10 flex items-center font-semibold">
                  Contattaci ora
                  <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className={cn(
                "text-lg px-10 py-6 glass border-2 border-primary-foreground/30 text-primary-foreground group",
                "hover:bg-primary-foreground/10 hover:border-accent hover:scale-105",
                "transition-all duration-500 active:scale-95",
              )}
              asChild
            >
              <Link href="/servizi">
                <span className="group-hover:gradient-text transition-all duration-300 font-semibold">
                  Scopri i servizi
                </span>
              </Link>
            </Button>
          </div>

          <div className={cn("mt-20 flex flex-wrap items-center justify-center gap-12", "animate-fade-in delay-500")}>
            {[
              { label: "Trusted by 50+ Companies", icon: "✓" },
              { label: "98% Success Rate", icon: "★" },
              { label: "24/7 Support", icon: "●" },
            ].map((item, i) => (
              <div
                key={item.label}
                className="flex items-center gap-3 text-primary-foreground/70 hover:text-primary-foreground transition-all duration-300 cursor-default group"
                style={{ animationDelay: `${500 + i * 100}ms` }}
              >
                <span className="text-2xl group-hover:scale-125 transition-transform duration-300">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
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
