"use client"

import { motion } from "motion/react"
import { useId, useRef } from "react"
import { cn } from "@/lib/utils"

import { spring } from "@/components/motion/presets"

export type SegmentedOption<T extends string> = {
  value: T
  label: string
  icon?: React.ReactNode
  // Mostra só o ícone; o rótulo fica para leitores de tela.
  iconOnly?: boolean
}

// Segmented (seção 6, M3): 2–4 opções, role="radiogroup", setas mudam a opção, pílula ativa desliza.
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "md",
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: SegmentedOption<T>[]
  label: string
  size?: "sm" | "md"
  className?: string
}) {
  const grupo = useId()
  const botoes = useRef<(HTMLButtonElement | null)[]>([])

  const mover = (passo: number) => {
    const atual = options.findIndex((opcao) => opcao.value === value)
    const proximo = (atual + passo + options.length) % options.length
    onChange(options[proximo].value)
    botoes.current[proximo]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-line bg-panel p-1",
        size === "sm" ? "h-control-sm" : "h-control",
        className
      )}
      onKeyDown={(evento) => {
        if (evento.key === "ArrowRight" || evento.key === "ArrowDown") {
          evento.preventDefault()
          mover(1)
        } else if (evento.key === "ArrowLeft" || evento.key === "ArrowUp") {
          evento.preventDefault()
          mover(-1)
        }
      }}
    >
      {options.map((opcao, indice) => {
        const ativo = opcao.value === value
        return (
          <button
            key={opcao.value}
            ref={(no) => {
              botoes.current[indice] = no
            }}
            type="button"
            role="radio"
            aria-checked={ativo}
            aria-label={opcao.iconOnly ? opcao.label : undefined}
            tabIndex={ativo ? 0 : -1}
            onClick={() => onChange(opcao.value)}
            className={cn(
              "relative inline-flex h-full items-center justify-center gap-1.5 rounded-sm font-semibold whitespace-nowrap transition-colors duration-fast outline-none",
              size === "sm" ? "px-2.5 text-small" : "px-3 text-ui",
              ativo ? "text-night" : "text-ink-soft hover:text-paper",
              "[&_svg]:size-4 [&_svg]:shrink-0"
            )}
          >
            {ativo ? <motion.span layoutId={`segmented-${grupo}`} transition={spring.snappy} className="absolute inset-0 rounded-sm bg-paper" /> : null}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {opcao.icon}
              {opcao.iconOnly ? null : opcao.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
