import { cn } from "@/lib/utils"

// Panel (seção 6): bloco com raio xl, borda line, fundo panel, sem sombra. "dashed" para vazio/área de soltar.
export function Panel({
  variant = "default",
  as: Tag = "section",
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { variant?: "default" | "dashed"; as?: "section" | "div" | "article" | "aside" }) {
  return (
    <Tag
      data-slot="panel"
      className={cn(
        "rounded-xl border",
        variant === "default" ? "border-line bg-panel" : "border-dashed border-line-strong bg-transparent",
        className
      )}
      {...props}
    />
  )
}

// Cabeçalho de bloco: título "section" + ação à direita ("Abrir rotina", "Ver todos").
export function PanelHeader({ title, titleId, action, className }: { title: string; titleId?: string; action?: React.ReactNode; className?: string }) {
  return (
    <header className={cn("flex items-center justify-between gap-3", className)}>
      <h2 id={titleId} className="font-display text-section text-paper">
        {title}
      </h2>
      {action ? <div className="flex shrink-0 items-center gap-2 text-small text-ink-soft">{action}</div> : null}
    </header>
  )
}
