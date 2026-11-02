import { cn } from "@/lib/utils"

// PageHeader (seção 6): título display-lg, descrição em ink-soft, ações ou estatísticas à direita. Sem rótulo acima.
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  stats,
  size = "lg",
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  // Linha pequena acima do título só quando é informação (ex.: a data no Hoje), nunca rótulo de seção.
  eyebrow?: React.ReactNode
  actions?: React.ReactNode
  stats?: React.ReactNode
  size?: "lg" | "md"
  className?: string
}) {
  return (
    <header className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0 space-y-3">
        {eyebrow ? <p className="text-small text-ink-soft">{eyebrow}</p> : null}
        <h1
          className={cn(
            "font-display text-paper [view-transition-name:page-title]",
            size === "lg" ? "text-4xl leading-none font-bold tracking-tight md:text-display-lg" : "text-display-md"
          )}
        >
          {title}
        </h1>
        {description ? <p className="max-w-[60ch] text-body text-ink-soft">{description}</p> : null}
      </div>
      {stats || actions ? (
        <div className="flex shrink-0 flex-wrap items-end gap-3">
          {stats}
          {actions}
        </div>
      ) : null}
    </header>
  )
}
