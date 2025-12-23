"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Container } from "@/src/components/ui-custom/container"

const footerLinks = {
  navigazione: [
    { href: "/", label: "Home" },
    { href: "/servizi", label: "Servizi" },
    { href: "/progetti", label: "Progetti" },
    { href: "/contatti", label: "Contatti" },
  ],
  legale: [{ href: "/privacy", label: "Privacy Policy" }],
  social: [
    { href: "https://linkedin.com", label: "LinkedIn" },
    { href: "https://instagram.com", label: "Instagram" },
    { href: "https://twitter.com", label: "Twitter" },
  ],
}

export function Footer() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.1 },
    )

    const footer = document.getElementById("footer")
    if (footer) observer.observe(footer)

    return () => observer.disconnect()
  }, [])

  return (
    <footer id="footer" className="bg-primary text-primary-foreground py-16 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-accent/20" />
      </div>

      <Container className="relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div
            className={cn(
              "md:col-span-1 transition-all duration-700",
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10",
            )}
          >
            <Link href="/" className="text-2xl font-bold group inline-block">
              2it
              <span className="text-accent group-hover:animate-pulse">.</span>
            </Link>
            <p className="mt-4 text-sm text-primary-foreground/70 leading-relaxed">
              Trasformiamo le tue idee in esperienze digitali straordinarie.
            </p>
          </div>

          {/* Navigation */}
          <div
            className={cn(
              "transition-all duration-700 delay-100",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
            )}
          >
            <h4 className="font-semibold mb-4">Navigazione</h4>
            <ul className="space-y-3">
              {footerLinks.navigazione.map((link, index) => (
                <li
                  key={link.href}
                  className={cn(
                    "transition-all duration-500",
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4",
                  )}
                  style={{ transitionDelay: `${200 + index * 50}ms` }}
                >
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/70 hover:text-accent hover:translate-x-1 inline-block transition-all duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div
            className={cn(
              "transition-all duration-700 delay-200",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
            )}
          >
            <h4 className="font-semibold mb-4">Legale</h4>
            <ul className="space-y-3">
              {footerLinks.legale.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/70 hover:text-accent hover:translate-x-1 inline-block transition-all duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div
            className={cn(
              "transition-all duration-700 delay-300",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
            )}
          >
            <h4 className="font-semibold mb-4">Social</h4>
            <ul className="space-y-3">
              {footerLinks.social.map((link, index) => (
                <li
                  key={link.href}
                  className={cn(
                    "transition-all duration-500",
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4",
                  )}
                  style={{ transitionDelay: `${400 + index * 50}ms` }}
                >
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-foreground/70 hover:text-accent hover:translate-x-1 inline-block transition-all duration-300 group"
                  >
                    <span className="relative">
                      {link.label}
                      <span className="absolute bottom-0 left-0 w-0 h-px bg-accent group-hover:w-full transition-all duration-300" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className={cn(
            "mt-12 pt-8 border-t border-primary-foreground/10 transition-all duration-700 delay-500",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
          )}
        >
          <p className="text-sm text-primary-foreground/50 text-center">
            © {new Date().getFullYear()} 2it. Tutti i diritti riservati.
          </p>
        </div>
      </Container>
    </footer>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
