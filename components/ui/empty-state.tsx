import { cn } from "@/lib/utils"

// EmptyState (seção 6): o que é + por que está vazio + uma ação. "inline" é compacto (uma faixa tracejada).
export function EmptyState({
  title,
  description,
  action,
  icon,
  variant = "block",
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  icon?: React.ReactNode
  variant?: "inline" | "block"
  className?: string
}) {
  if (variant === "inline") {
    return (
      <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-dashed border-line-strong px-4 py-3.5", className)}>
        <p className="min-w-0 flex-1 text-ui text-ink">
          {title}
          {description ? <span className="text-ink-soft"> {description}</span> : null}
        </p>
        {action}
      </div>
    )
  }
  return (
    <div className={cn("flex flex-col items-start gap-3 rounded-xl border border-dashed border-line-strong px-6 py-8", className)}>
      {icon ? <div className="text-ink-soft [&_svg]:size-5">{icon}</div> : null}
      <div className="space-y-1">
        <p className="font-display text-section text-paper">{title}</p>
        {description ? <p className="max-w-[52ch] text-body text-ink-soft">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2 pt-1">{action}</div> : null}
    </div>
  )
}
