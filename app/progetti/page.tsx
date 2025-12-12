import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Container } from "@/components/ui-custom/container"
import { Section } from "@/components/ui-custom/section"

export const metadata: Metadata = {
  title: "Progetti | Nexus Agency",
  description:
    "Scopri il nostro portfolio di progetti web: e-commerce, SaaS, siti corporate e applicazioni web innovative.",
}

const projects = [
  {
    title: "TechFlow SaaS",
    category: "Web App",
    description: "Dashboard SaaS per la gestione di progetti e team con analytics avanzati.",
    image: "/modern-saas-dashboard-dark-theme.jpg",
    tags: ["Next.js", "React", "PostgreSQL"],
    href: "/progetti/techflow",
  },
  {
    title: "Elegance Fashion",
    category: "E-commerce",
    description: "E-commerce di lusso per brand di moda con esperienza d'acquisto premium.",
    image: "/luxury-fashion-ecommerce.png",
    tags: ["Shopify", "Custom Theme", "SEO"],
    href: "/progetti/elegance",
  },
  {
    title: "HealthCare Plus",
    category: "Healthcare",
    description: "Piattaforma di telemedicina con prenotazioni e consulenze online.",
    image: "/healthcare-medical-app-interface-clean.jpg",
    tags: ["React", "Node.js", "WebRTC"],
    href: "/progetti/healthcare",
  },
  {
    title: "Urban Architecture",
    category: "Corporate",
    description: "Sito corporate per studio di architettura con portfolio interattivo.",
    image: "/architecture-studio-website-minimal.jpg",
    tags: ["Next.js", "Framer Motion", "CMS"],
    href: "/progetti/urban",
  },
  {
    title: "FoodDelivery Pro",
    category: "Mobile App",
    description: "App di food delivery con tracking in tempo reale e sistema di recensioni.",
    image: "/food-delivery-app-mobile-interface.jpg",
    tags: ["React Native", "Firebase", "Maps API"],
    href: "/progetti/fooddelivery",
  },
  {
    title: "EcoTravel",
    category: "Travel",
    description: "Piattaforma di prenotazione viaggi eco-sostenibili con carbon footprint.",
    image: "/travel-booking-website-nature-eco.jpg",
    tags: ["Next.js", "Stripe", "API Integration"],
    href: "/progetti/ecotravel",
  },
]

export default function ProgettiPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <Section variant="gradient">
          <Container>
            <div className="max-w-3xl">
              <span className="text-sm font-medium text-accent uppercase tracking-wider">Portfolio</span>
              <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                I nostri lavori
              </h1>
              <p className="mt-6 text-lg text-muted-foreground text-pretty leading-relaxed">
                Una selezione dei progetti più significativi che abbiamo realizzato per i nostri clienti. Ogni progetto
                racconta una storia di innovazione.
              </p>
            </div>
          </Container>
        </Section>

        {/* Projects Grid */}
        <Section>
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project) => (
                <Link key={project.title} href={project.href} className="group block">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4">
                    <Image
                      src={project.image || "/placeholder.svg"}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="w-5 h-5 text-foreground" />
                    </div>
                  </div>
                  <span className="text-sm text-accent font-medium">{project.category}</span>
                  <h3 className="text-xl font-semibold mt-1 group-hover:text-accent transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {project.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 text-xs font-medium bg-muted rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  )
}
