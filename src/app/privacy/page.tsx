import type { Metadata } from "next"
import { Navbar } from "@/src/components/layout/navbar"
import { Footer } from "@/src/components/layout/footer"
import { Container } from "@/src/components/ui-custom/container"
import { Section } from "@/src/components/ui-custom/section"

export const metadata: Metadata = {
  title: "Privacy Policy | 2it",
  description: "Informativa sulla privacy e sul trattamento dei dati personali di 2it.",
}

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <Section>
          <Container size="sm">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                Ultimo aggiornamento:{" "}
                {new Date().toLocaleDateString("it-IT", { year: "numeric", month: "long", day: "numeric" })}
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-4">1. Titolare del trattamento</h2>
              <p className="text-muted-foreground leading-relaxed">
                Il titolare del trattamento dei dati personali è 2it S.r.l., con sede legale in Via Roma 123,
                20121 Milano (MI), Italia.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-4">2. Dati raccolti</h2>
              <p className="text-muted-foreground leading-relaxed">Raccogliamo i seguenti tipi di dati personali:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Dati di contatto (nome, email, telefono)</li>
                <li>Dati di navigazione (cookie tecnici e analitici)</li>
                <li>Informazioni fornite volontariamente tramite form di contatto</li>
              </ul>

              <h2 className="text-2xl font-semibold mt-12 mb-4">3. Finalità del trattamento</h2>
              <p className="text-muted-foreground leading-relaxed">
                I dati personali sono trattati per le seguenti finalità:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Rispondere alle richieste di contatto</li>
                <li>Fornire i servizi richiesti</li>
                <li>Migliorare l'esperienza di navigazione</li>
                <li>Adempiere a obblighi di legge</li>
              </ul>

              <h2 className="text-2xl font-semibold mt-12 mb-4">4. Base giuridica</h2>
              <p className="text-muted-foreground leading-relaxed">
                Il trattamento dei dati è basato sul consenso dell'interessato, sull'esecuzione di un contratto o su un
                legittimo interesse del titolare.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-4">5. Conservazione dei dati</h2>
              <p className="text-muted-foreground leading-relaxed">
                I dati personali sono conservati per il tempo necessario a conseguire le finalità per cui sono stati
                raccolti e comunque non oltre 10 anni.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-4">6. Diritti dell'interessato</h2>
              <p className="text-muted-foreground leading-relaxed">Ai sensi del GDPR, l'interessato ha diritto di:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Accedere ai propri dati personali</li>
                <li>Richiedere la rettifica o la cancellazione</li>
                <li>Limitare o opporsi al trattamento</li>
                <li>Richiedere la portabilità dei dati</li>
                <li>Revocare il consenso in qualsiasi momento</li>
              </ul>

              <h2 className="text-2xl font-semibold mt-12 mb-4">7. Contatti</h2>
              <p className="text-muted-foreground leading-relaxed">
                Per qualsiasi domanda relativa alla presente privacy policy o per esercitare i propri diritti, è
                possibile contattarci all'indirizzo: privacy@2itagency.it
              </p>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  )
}
