// Rafael Marques - 23/10/2026
// Cores do quadro: cinza por padrão; colorido só quando a pessoa escolhe. Funciona no claro e no escuro.

import type { CSSProperties } from "react"

import { coresQuadro } from "@/lib/quadro/modelo"

export function valorDaCor(cor: string | undefined) {
  return coresQuadro.find((item) => item.id === cor)?.valor
}

// Borda e fundo de uma forma/cartão.
export function estiloDaCor(cor: string | undefined): CSSProperties {
  const valor = valorDaCor(cor)
  if (!valor) return { borderColor: "color-mix(in oklch, var(--foreground) 45%, transparent)", background: "var(--card)" }
  return { borderColor: valor, background: `color-mix(in oklch, ${valor} 18%, var(--background))` }
}

export function corDaLinha(cor: string | undefined) {
  return valorDaCor(cor) ?? "color-mix(in oklch, var(--foreground) 60%, transparent)"
}
