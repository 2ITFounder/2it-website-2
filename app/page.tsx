import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Hero } from "@/components/home/hero"
import { ServicesSection } from "@/components/home/services-section"
import { ProcessSection } from "@/components/home/process-section"
import { DemoShowcaseSection } from "@/components/home/demo-showcase-section"
import { PortfolioSection } from "@/components/home/portfolio-section"
import { CTASection } from "@/components/home/cta-section"

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
