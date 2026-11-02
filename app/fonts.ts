import { Bricolage_Grotesque, Caveat, JetBrains_Mono, Literata, Schibsted_Grotesk } from "next/font/google"

// Redesign v2 (3.2): Bricolage para títulos e números, Schibsted para interface e texto,
// JetBrains Mono só para código e IDs. Literata e Caveat continuam para a "Aparência da nota".
export const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--fonte-display",
  axes: ["opsz", "wdth"],
  display: "swap",
})

export const sans = Schibsted_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--fonte-sans",
  display: "swap",
})

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--fonte-mono",
  weight: ["400", "500"],
  display: "swap",
})

export const serifada = Literata({ subsets: ["latin"], variable: "--font-literata", display: "swap" })

export const manuscrita = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" })

export const classesFontes = [display.variable, sans.variable, mono.variable, serifada.variable, manuscrita.variable].join(" ")
