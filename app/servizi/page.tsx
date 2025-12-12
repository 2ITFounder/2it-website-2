import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Code, Palette, LineChart, Smartphone, Globe, Zap, CheckCircle } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Container } from "@/components/ui-custom/container"
import { Section } from "@/components/ui-custom/section"
import { GlassCard } from "@/components/ui-custom/glass-card"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Servizi | Nexus Agency",
  description:
    "Scopri i nostri servizi di web design, sviluppo, app mobile, SEO e marketing digitale per far crescere il tuo business online.",
}

const services = [
  {
    icon: Palette,
    title: "Web Design",
    description:
      "Creiamo design moderni, intuitivi e orientati alla conversione che riflettono l'identità del tuo brand.",
    features: [
      "UI/UX Design personalizzato",
      "Prototipazione interattiva",
      "Design System scalabili",
      "A/B Testing design",
    ],
  },
  {
    icon: Code,
    title: "Sviluppo Web",
    description: "Sviluppiamo applicazioni web performanti utilizzando le tecnologie più moderne e affidabili.",
    features: ["Next.js & React", "Backend scalabili", "API RESTful & GraphQL", "Database ottimizzati"],
  },
  {
    icon: Smartphone,
    title: "App Mobile",
    description: "Applicazioni native e cross-platform per iOS e Android con esperienza utente impeccabile.",
    features: ["React Native", "App native iOS/Android", "Push notifications", "Integrazione backend"],
  },
  {
    icon: LineChart,
    title: "SEO & Marketing",
    description: "Strategie di marketing digitale data-driven per aumentare visibilità e conversioni.",
    features: ["SEO tecnico e on-page", "Content marketing", "Social media strategy", "Analytics avanzati"],
  },
  {
    icon: Globe,
    title: "E-commerce",
    description: "Negozi online completi con tutti gli strumenti per vendere efficacemente online.",
    features: ["Shopify & WooCommerce", "Pagamenti sicuri", "Gestione inventario", "Automazione ordini"],
  },
  {
    icon: Zap,
    title: "Performance & Hosting",
    description: "Ottimizzazione delle performance e hosting gestito per siti veloci e sempre online.",
    features: ["Core Web Vitals", "CDN globale", "SSL & Sicurezza", "Backup automatici"],
  },
]

export default function ServiziPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <Section variant="gradient">
          <Container>
            <div className="max-w-3xl">
              <span className="text-sm font-medium text-accent uppercase tracking-wider">I Nostri Servizi</span>
              <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                Soluzioni digitali per ogni esigenza
              </h1>
              <p className="mt-6 text-lg text-muted-foreground text-pretty leading-relaxed">
                Dalla strategia all'esecuzione, offriamo servizi completi per trasformare la tua presenza digitale e
                raggiungere risultati concreti.
              </p>
            </div>
          </Container>
        </Section>

        {/* Services Grid */}
        <Section>
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {services.map((service) => (
                <GlassCard key={service.title} className="p-8">
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                    <service.icon className="w-7 h-7 text-accent" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">{service.title}</h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{service.description}</p>
                  <ul className="space-y-3">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm">
                        <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              ))}
            </div>
          </Container>
        </Section>

        {/* CTA */}
        <Section variant="dark">
          <Container size="sm">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-balance">Hai un progetto in mente?</h2>
              <p className="mt-4 text-primary-foreground/70 text-pretty">
                Contattaci per una consulenza gratuita e scopri come possiamo aiutarti.
              </p>
              <Button size="lg" variant="secondary" className="mt-8 glow-button" asChild>
                <Link href="/contatti">
                  Richiedi un preventivo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  )
}
