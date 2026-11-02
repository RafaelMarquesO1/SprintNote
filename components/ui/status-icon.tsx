import { cn } from "@/lib/utils"

import { FORMAS_STATUS, type FormaStatus } from "@/lib/domain/quadros"

// StatusIcon (seção 6): status por forma, sem arco-íris. Substitui as cores de status do quadro.
// desenhar: no "done", o círculo dá um pulo e o check se desenha (M8, ao soltar um cartão em Concluído).
export function StatusIcon({ status, className, label, desenhar = false }: { status: FormaStatus; className?: string; label?: boolean; desenhar?: boolean }) {
  const nome = FORMAS_STATUS.find((forma) => forma.valor === status)?.rotulo ?? status
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-4 shrink-0 text-paper", className)}
      role={label ? "img" : undefined}
      aria-label={label ? nome : undefined}
      aria-hidden={label ? undefined : true}
    >
      {status === "backlog" ? <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.2 2.2" /> : null}
      {status === "paused" ? (
        <>
          <rect x="4.5" y="3.5" width="2" height="9" rx="1" fill="currentColor" />
          <rect x="9.5" y="3.5" width="2" height="9" rx="1" fill="currentColor" />
        </>
      ) : null}
      {status === "todo" ? <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" /> : null}
      {status === "doing" ? (
        <>
          <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor" />
        </>
      ) : null}
      {status === "done" ? (
        <>
          <circle cx="8" cy="8" r="6.75" fill="currentColor" className={desenhar ? "status-pulo" : undefined} />
          <path
            d="m5.2 8.2 1.9 1.9 3.7-3.9"
            fill="none"
            stroke="var(--color-night)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={desenhar ? 1 : undefined}
            className={desenhar ? "status-desenhar" : undefined}
          />
        </>
      ) : null}
    </svg>
  )
}

// PriorityIcon (seção 6): 1, 2 ou 3 barras preenchidas.
export function PriorityIcon({ priority, className, label }: { priority: "baixa" | "media" | "alta"; className?: string; label?: boolean }) {
  const nivel = priority === "alta" ? 3 : priority === "media" ? 2 : 1
  const nome = priority === "alta" ? "Prioridade alta" : priority === "media" ? "Prioridade média" : "Prioridade baixa"
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-4 shrink-0", className)}
      role={label ? "img" : undefined}
      aria-label={label ? nome : undefined}
      aria-hidden={label ? undefined : true}
    >
      {[0, 1, 2].map((barra) => (
        <rect
          key={barra}
          x={3 + barra * 4}
          y={11 - barra * 3}
          width="2.4"
          height={3 + barra * 3}
          rx="0.8"
          fill={barra < nivel ? "var(--color-ink)" : "var(--color-line-strong)"}
        />
      ))}
    </svg>
  )
}
