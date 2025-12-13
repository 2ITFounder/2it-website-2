import { Navbar } from "@/src/components/layout/navbar"
import { Footer } from "@/src/components/layout/footer"
import { Hero } from "@/src/components/home/hero"
import { ServicesSection } from "@/src/components/home/services-section"
import { ProcessSection } from "@/src/components/home/process-section"
import { DemoShowcaseSection } from "@/src/components/home/demo-showcase"
import { PortfolioSection } from "@/src/components/home/portfolio-section"
import { CTASection } from "@/src/components/home/cta-section"

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ServicesSection />
        <ProcessSection />
        <DemoShowcaseSection />
        <PortfolioSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
