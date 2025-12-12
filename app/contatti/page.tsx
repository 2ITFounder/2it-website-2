import type { Metadata } from "next"
import { Mail, MapPin, Phone } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Container } from "@/components/ui-custom/container"
import { Section } from "@/components/ui-custom/section"
import { GlassCard } from "@/components/ui-custom/glass-card"
import { ContactForm } from "@/components/contact/contact-form"

export const metadata: Metadata = {
  title: "Contatti |  2it Web Agency",
  description:
    "Contattaci per discutere del tuo prossimo progetto web. Siamo a tua disposizione per consulenze gratuite.",
}

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "info@nexusagency.it",
    href: "mailto:info@nexusagency.it",
  },
  {
    icon: Phone,
    title: "Telefono",
    value: "+39 02 1234 5678",
    href: "tel:+390212345678",
  },
  {
    icon: MapPin,
    title: "Indirizzo",
    value: "Via Roma 123, Milano",
    href: "https://maps.google.com",
  },
]

export default function ContattiPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <Section variant="gradient">
          <Container>
            <div className="max-w-3xl">
              <span className="text-sm font-medium text-accent uppercase tracking-wider">Contatti</span>
              <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                Parliamo del tuo progetto
              </h1>
              <p className="mt-6 text-lg text-muted-foreground text-pretty leading-relaxed">
                Hai un'idea da realizzare? Compila il form o contattaci direttamente. Ti risponderemo entro 24 ore.
              </p>
            </div>
          </Container>
        </Section>

        {/* Contact Section */}
        <Section>
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Contact Info */}
              <div className="lg:col-span-1 space-y-6">
                <h2 className="text-2xl font-bold">Informazioni di contatto</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Preferisci un contatto diretto? Chiamaci o inviaci un'email. Siamo disponibili dal lunedì al venerdì,
                  dalle 9:00 alle 18:00.
                </p>

                <div className="space-y-4 pt-4">
                  {contactInfo.map((info) => (
                    <a
                      key={info.title}
                      href={info.href}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <info.icon className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-medium">{info.title}</h3>
                        <p className="text-muted-foreground text-sm">{info.value}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <ContactForm />
              </div>
            </div>
          </Container>
        </Section>

        {/* FAQ Quick */}
        <Section variant="muted">
          <Container size="sm">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold">Domande frequenti</h2>
            </div>
            <div className="space-y-4">
              {[
                {
                  q: "Quanto costa un progetto?",
                  a: "Ogni progetto è unico. Dopo aver analizzato le tue esigenze, ti forniremo un preventivo dettagliato e trasparente.",
                },
                {
                  q: "Quanto tempo richiede un progetto?",
                  a: "I tempi variano in base alla complessità. Un sito web tipico richiede 4-8 settimane, mentre progetti più complessi possono richiedere 2-4 mesi.",
                },
                {
                  q: "Offrite supporto post-lancio?",
                  a: "Sì, offriamo piani di manutenzione e supporto continuo per garantire che il tuo progetto rimanga sempre aggiornato e performante.",
                },
              ].map((faq) => (
                <GlassCard key={faq.q} className="p-6">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
                </GlassCard>
              ))}
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  )
}
