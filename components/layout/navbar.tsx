"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/servizi", label: "Servizi" },
  { href: "/progetti", label: "Progetti" },
  { href: "/contatti", label: "Contatti" },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 transition-all duration-500">
      <nav
        className={cn(
          "mx-auto glass rounded-full transition-all duration-500 border border-white/10",
          scrolled
            ? "max-w-5xl py-2 px-6 shadow-2xl shadow-accent/5"
            : "max-w-6xl py-3 px-8 shadow-xl shadow-accent/10",
        )}
      >
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className={cn(
              "font-bold tracking-tight transition-all duration-300 hover:scale-105",
              scrolled ? "text-lg" : "text-xl",
            )}
          >
            Nexus<span className="text-accent animate-pulse">.</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300",
                  "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-accent",
                  "after:transition-all after:duration-300 hover:after:w-full",
                  "transform hover:scale-110",
                )}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                {link.label}
              </Link>
            ))}
            <Button
              className={cn(
                "relative overflow-hidden group transition-all duration-300",
                "bg-accent hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/50",
                "hover:scale-105 active:scale-95",
                scrolled ? "text-sm px-4 py-2" : "text-sm px-5 py-2",
              )}
              asChild
            >
              <Link href="/contatti">
                <span className="relative z-10">Parliamone</span>
                <span className="absolute inset-0 bg-gradient-to-r from-accent/0 via-white/20 to-accent/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={cn(
              "md:hidden p-2 rounded-full transition-all duration-300",
              "hover:bg-accent/10 active:scale-90",
            )}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-500 ease-in-out",
            isOpen ? "max-h-80 opacity-100 mt-4 pt-4 border-t border-white/10" : "max-h-0 opacity-0",
          )}
        >
          <div className="flex flex-col gap-3">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300",
                  "hover:translate-x-2 hover:text-accent py-2",
                )}
                style={{
                  transitionDelay: isOpen ? `${index * 50}ms` : "0ms",
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? "translateX(0)" : "translateX(-10px)",
                }}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button className="w-full mt-2 bg-accent hover:bg-accent/90" asChild>
              <Link href="/contatti">Parliamone</Link>
            </Button>
          </div>
        </div>
      </nav>
    </header>
  )
}
