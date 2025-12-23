"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Container } from "@/src/components/ui-custom/container";

export function Hero() {
  const [displayedText, setDisplayedText] = useState("");
  const fullText = "esperienze digitali";
  const [mounted, setMounted] = useState(false);

  // State to store the blob styles
  const [blobs, setBlobs] = useState<BlobStyle[]>([]);

  // Function to generate random values
  const rand = (min: number, max: number) => Math.random() * (max - min) + min;

  // Effect to generate random styles for the blobs after mount
  useEffect(() => {
    setMounted(true);
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 80);

    // Generate blob styles after mount
    setBlobs(
      Array.from({ length: 8 }).map(() => ({
        width: rand(200, 600),
        height: rand(200, 600),
        left: rand(0, 100),
        top: rand(0, 100),
        delay: rand(0, 8),
        duration: 8 + rand(0, 4),
      }))
    );

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

      {/* Blob animation */}
      <div className="absolute inset-0">
        {blobs.map((blob, i) => (
          <div
            key={i}
            className={`absolute rounded-full blur-3xl animate-morph ${
              i % 3 === 0
                ? "bg-primary/20"
                : i % 3 === 1
                ? "bg-secondary/20"
                : "bg-accent/20"
            }`}
            style={{
              width: `${blob.width}px`,
              height: `${blob.height}px`,
              left: `${blob.left}%`,
              top: `${blob.top}%`,
              animationDelay: `${blob.delay}s`,
              animationDuration: `${blob.duration}s`,
            }}
          />
        ))}
      </div>

      <Container className="relative z-10">
        <div
          className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full glass mb-8 transition-all duration-700 delay-200 animate-pulse-glow ${
              mounted ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent animate-pulse" />
            <span className="text-sm font-medium gradient-text">Web Agency B2B</span>
          </div>

          <h1
            className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-balance transition-all duration-1000 delay-300 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            Trasformiamo idee in
            <span className="block gradient-text mt-4 relative">
              {displayedText}
              <span className="inline-block w-1 h-12 md:h-20 bg-accent ml-2 animate-pulse" />
            </span>
          </h1>

          <p
            className={`mt-8 text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed text-pretty transition-all duration-1000 delay-500 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            Creiamo <span className="text-primary font-semibold">soluzioni web innovative</span> per aziende che
            vogliono crescere nel mondo digitale. Design, sviluppo e strategie su misura per il tuo business.
          </p>

          <div
            className={`mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-1000 delay-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <Button
              size="lg"
              className={`text-lg px-10 py-6 group relative overflow-hidden glow-button bg-gradient-to-r from-primary via-accent to-secondary hover:shadow-2xl hover:scale-105 transition-all duration-500 active:scale-95`}
              asChild
            >
              <Link href="/contatti">
                <span className="relative z-10 flex items-center font-semibold">
                  Inizia un progetto
                  <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className={`text-lg px-10 py-6 glass border-2 border-primary/30 group hover:border-accent hover:bg-accent/10 hover:scale-105 transition-all duration-500 active:scale-95`}
              asChild
            >
              <Link href="/progetti">
                <span className="group-hover:gradient-text transition-all duration-300 font-semibold">
                  Scopri i nostri lavori
                </span>
              </Link>
            </Button>
          </div>

          <div
            className={`mt-20 grid grid-cols-3 gap-12 max-w-2xl mx-auto transition-all duration-1000 delay-1000 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            {[
              { value: "50+", label: "Progetti" },
              { value: "98%", label: "Clienti soddisfatti" },
              { value: "5+", label: "Anni esperienza" },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className={`text-center group cursor-default transition-all duration-500 hover:scale-110 animate-bounce-in`}
                style={{ animationDelay: `${1000 + index * 100}ms` }}
              >
                <div className="text-3xl md:text-4xl font-bold gradient-text group-hover:scale-125 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-2 group-hover:text-foreground transition-colors">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

// Helper function to concatenate class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type BlobStyle = {
  width: number;
  height: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
};
