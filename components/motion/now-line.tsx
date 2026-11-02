"use client"

import { useNow } from "@/hooks/use-now"
import { cn } from "@/lib/utils"

export function horaCurta(data: Date) {
  return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

// Linha do agora (5.5, M4): o componente de assinatura. A Brasa marca a hora atual.
// Horizontal: posicionada por startHour/pxPerHour dentro de um contêiner "relative".
// Vertical: linha no dia de hoje (calendários).
export function NowLine({
  startHour = 0,
  pxPerHour = 60,
  orientation = "horizontal",
  className,
}: {
  startHour?: number
  pxPerHour?: number
  orientation?: "horizontal" | "vertical"
  className?: string
}) {
  const agora = useNow(60_000)
  if (!agora) return null
  const rotulo = horaCurta(agora)

  if (orientation === "vertical") {
    return (
      <div role="presentation" className={cn("pointer-events-none absolute inset-y-0 flex w-0.5 flex-col items-center", className)}>
        <span className="size-2 rounded-full bg-ember motion-safe:animate-now-pulse" />
        <span className="w-0.5 flex-1 bg-ember" />
        <span className="sr-only">Agora, {rotulo}</span>
      </div>
    )
  }

  const minutos = (agora.getHours() - startHour) * 60 + agora.getMinutes()
  const y = (minutos / 60) * pxPerHour
  return (
    <div
      role="presentation"
      className={cn("pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 transition-transform duration-slow ease-out", className)}
      style={{ transform: `translateY(calc(${y}px - 50%))` }}
    >
      <NowMarker rotulo={rotulo} />
    </div>
  )
}

// Rótulo + ponto + linha, para usar em listas (entre itens) sem posicionamento absoluto.
export function NowMarker({ rotulo, className }: { rotulo: string; className?: string }) {
  return (
    <div role="presentation" className={cn("flex w-full items-center gap-2", className)}>
      <span className="rounded-xs bg-ember px-1.5 py-0.5 text-micro font-bold text-night tabular-nums">{rotulo}</span>
      <span className="size-2 shrink-0 rounded-full bg-ember motion-safe:animate-now-pulse" />
      <span className="h-0.5 flex-1 bg-ember" />
      <span className="sr-only">Agora, {rotulo}</span>
    </div>
  )
}
