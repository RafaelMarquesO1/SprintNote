"use client"

import { useSyncExternalStore } from "react"
import { cn } from "@/lib/utils"

// Kbd (seção 6): mostra ⌘ no macOS e Ctrl nos outros sistemas quando o texto usa "Mod".
const ehMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

export function useTeclaModificadora() {
  return useSyncExternalStore(
    () => () => {},
    () => (ehMac() ? "⌘" : "Ctrl"),
    () => "Ctrl"
  )
}

function Kbd({ className, children, ...props }: React.ComponentProps<"kbd">) {
  const mod = useTeclaModificadora()
  const conteudo = typeof children === "string" ? children.replace(/\bMod\b/g, mod) : children
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-xs border border-line-strong px-1.5 font-sans text-micro font-medium text-ink-soft select-none [&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    >
      {conteudo}
    </kbd>
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <kbd data-slot="kbd-group" className={cn("inline-flex items-center gap-1", className)} {...props} />
}

export { Kbd, KbdGroup }
