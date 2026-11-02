import { cn } from "@/lib/utils"

// Logotipo (2.3), versão 2: o "S de fio".
// Uma linha de texto da nota (em cima) desce em curva e vira a linha de uma tarefa (embaixo), terminando no
// ponto Brasa: o "agora". É o mesmo fio que liga a nota ao cartão na página inicial, e desenha o S de SprintNote.
// Os traços são grossos e curtos para continuar legível em 16px; o desenho é centrado pelo peso visual.

// Caminho do fio no quadro de 28×28 (usado também em app/icon.svg, apple-icon e opengraph-image).
export const CAMINHO_FIO = "M20.25 7.75H12a2.875 2.875 0 0 0 0 5.75h5a2.875 2.875 0 0 1 0 5.75H11.5"
export const PONTO_AGORA = { cx: 8.75, cy: 19.25, r: 2.5 }

export function LogoMark({ size = 28, animated = false, className }: { size?: number; animated?: boolean; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" className={cn("shrink-0", animated && "logo-animado", className)}>
      <rect width="28" height="28" rx="8" fill="var(--color-paper)" />
      <path d={CAMINHO_FIO} fill="none" stroke="var(--color-night)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="logo-fio" />
      <circle {...PONTO_AGORA} fill="var(--color-ember)" className="logo-ponto" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return <span className={cn("logo-wordmark font-display text-[17px] font-bold tracking-[-0.025em] text-paper", className)}>SprintNote</span>
}

export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <Wordmark />
      <span className="sr-only">SprintNote</span>
    </span>
  )
}
