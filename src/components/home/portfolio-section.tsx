"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Container } from "@/src/components/ui-custom/container"
import { Section } from "@/src/components/ui-custom/section"

const projects = [
  {
    title: "TechFlow SaaS",
    category: "Web App",
    image: "/modern-saas-dashboard-dark-theme.jpg",
    href: "/progetti/techflow",
  },
  {
    title: "Elegance Fashion",
    category: "E-commerce",
    image: "/luxury-fashion-ecommerce.png",
    href: "/progetti/elegance",
  },
  {
    title: "HealthCare Plus",
    category: "Healthcare",
    image: "/healthcare-medical-app-interface-clean.jpg",
    href: "/progetti/healthcare",
  },
  {
    title: "Urban Architecture",
    category: "Corporate",
    image: "/architecture-studio-website-minimal.jpg",
    href: "/progetti/urban",
  },
]

export function PortfolioSection() {
  const [visibleProjects, setVisibleProjects] = useState<Set<number>>(new Set())
  const projectRefs = useRef<(HTMLAnchorElement | null)[]>([])

  useEffect(() => {
    const observers = projectRefs.current.map((project, index) => {
      if (!project) return null

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleProjects((prev) => new Set(prev).add(index))
            }
          })
        },
        { threshold: 0.2 },
      )

      observer.observe(project)
      return observer
    })

    return () => {
      observers.forEach((observer) => observer?.disconnect())
    }
  }, [])

  return (
    <Section variant="muted" id="portfolio" className="section-divider">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <span className="text-sm font-medium gradient-text uppercase tracking-wider animate-fade-in">
              Portfolio
            </span>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-balance animate-fade-in-up">
              Progetti che parlano <span className="gradient-text">da soli</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground text-pretty animate-fade-in-up delay-200">
              Una selezione dei nostri lavori più recenti che dimostrano la nostra passione per il design e
              l'innovazione.
            </p>
          </div>
          <Link
            href="/progetti"
            className={cn(
              "text-sm font-medium gradient-text hover:underline underline-offset-4",
              "inline-flex items-center gap-1 group transition-all duration-300",
              "hover:gap-2 animate-fade-in-up delay-300 hover:scale-105",
            )}
          >
            Vedi tutti i progetti
            <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <Link
              key={project.title}
              href={project.href}
              ref={(el) => {
                projectRefs.current[index] = el
              }}
              className={cn(
                "group relative aspect-[4/3] rounded-2xl overflow-hidden",
                "border-2 border-transparent hover:border-primary/50 glass",
                "transition-all duration-700 ease-out hover:scale-105 shimmer-effect",
                visibleProjects.has(index) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
              )}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <Image
                src={project.image || "/placeholder.svg"}
                alt={project.title}
                fill
                className="object-cover transition-all duration-1000 group-hover:scale-110 group-hover:rotate-2"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-secondary/50 to-transparent opacity-70 group-hover:opacity-100 transition-all duration-500" />

              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

              <div className="absolute bottom-0 left-0 right-0 p-8 translate-y-6 group-hover:translate-y-0 transition-all duration-500">
                <span className="text-sm text-white/90 font-semibold tracking-wider uppercase backdrop-blur-sm px-3 py-1 rounded-full bg-white/10">
                  {project.category}
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-white mt-4 flex items-center gap-3 group-hover:gap-4 transition-all">
                  {project.title}
                  <ArrowUpRight className="w-6 h-6 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300" />
                </h3>
              </div>

              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-bl-full" />
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
