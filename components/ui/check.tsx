"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"

import { dur, ease, spring } from "@/components/motion/presets"

// Checkbox de tarefa (quadrada, raio 6) e de hábito (raio 10, 36px visíveis com área de 44px).
// M5: a caixa preenche com escala 0.85 → 1 e o check desenha (pathLength 0 → 1).
export function CheckButton({
  checked,
  onCheckedChange,
  label,
  variant = "task",
  disabled,
  className,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  // Nome acessível: "Concluir Estudar", "Leitura, sexta 30".
  label: string
  variant?: "task" | "habit"
  disabled?: boolean
  className?: string
}) {
  const habito = variant === "habit"
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "group/check relative inline-flex shrink-0 items-center justify-center outline-none disabled:opacity-40",
        // Área clicável maior que o desenho.
        habito ? "size-11 max-[360px]:size-10" : "size-6 after:absolute after:-inset-2.5 after:content-['']",
        className
      )}
    >
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{ scale: checked ? [0.85, 1] : 1 }}
        transition={spring.snappy}
        className={cn(
          "flex items-center justify-center border transition-colors duration-fast",
          habito ? "size-9 rounded-md max-[360px]:size-8" : "size-4.5 rounded-xs",
          checked ? "border-paper bg-paper text-night" : "border-line-strong bg-transparent text-transparent group-hover/check:border-ink-muted"
        )}
      >
        <svg viewBox="0 0 16 16" className={habito ? "size-4.5" : "size-3.5"}>
          <motion.path
            d="m3.5 8.4 2.9 2.9 6.1-6.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0 }}
            transition={{ duration: dur.fast, ease: ease.out }}
          />
        </svg>
      </motion.span>
    </button>
  )
}
