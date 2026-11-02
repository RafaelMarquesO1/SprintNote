import { cn } from "@/lib/utils"

import { paletaCores } from "@/lib/cores"

// "Tinta de etiqueta" (redesign v2): a cor de uma etiqueta aparece só como um ponto de 8px dentro de um chip
// monocromático. Cor identifica categoria; nunca preenche, nunca indica estado. Laranja é da Brasa ("agora"),
// então tons alaranjados viram areia acinzentada.

const SEM_LARANJA = new Set(["laranja", "coral", "marrom"])
const AREIA = "oklch(0.74 0.035 85)"

// Cores que podem ser escolhidas para uma etiqueta (sem os tons alaranjados).
export const paletaEtiquetas = paletaCores.filter((cor) => !SEM_LARANJA.has(cor.id))

// Matiz (0–360) de uma cor "#rrggbb"; null se não for hexadecimal.
function matizHex(cor: string) {
  const achado = /^#([0-9a-f]{6})$/i.exec(cor.trim())
  if (!achado) return null
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(achado[1].slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max === min) return null
  const d = max - min
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return (h * 60 + 360) % 360
}

// Tinta suavizada de uma cor salva (paleta antiga, nova ou personalizada).
export function tintaEtiqueta(cor: string | null | undefined) {
  if (!cor) return null
  const daPaleta = paletaCores.find((item) => item.valor === cor)
  if (daPaleta && SEM_LARANJA.has(daPaleta.id)) return AREIA
  const matiz = matizHex(cor)
  if (matiz !== null && matiz >= 10 && matiz <= 50) return AREIA
  // Mesma matiz, luminosidade fixa e saturação limitada: lê bem nos dois temas sem gritar.
  return `oklch(from ${cor} 0.74 min(c, 0.11) h)`
}

export function PontoTinta({ cor, className }: { cor: string | null | undefined; className?: string }) {
  const tinta = tintaEtiqueta(cor)
  if (!tinta) return null
  return <span aria-hidden="true" className={cn("inline-block size-2 shrink-0 rounded-full", className)} style={{ background: tinta }} />
}

// Chip de etiqueta: monocromático, com o ponto de tinta antes do nome.
export function EtiquetaChip({ nome, cor, tamanho = "sm", className }: { nome: string; cor?: string | null; tamanho?: "sm" | "md"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line-strong font-medium whitespace-nowrap text-ink",
        tamanho === "sm" ? "h-6 px-2.5 text-micro" : "h-control-sm px-3 text-small",
        className
      )}
    >
      <PontoTinta cor={cor} />
      {nome}
    </span>
  )
}
