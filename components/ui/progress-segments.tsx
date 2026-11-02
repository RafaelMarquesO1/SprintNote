"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"

import { dur, ease } from "@/components/motion/presets"
import { resumoProgresso, type ProgressoQuadro } from "@/lib/domain/quadros"

// ProgressSegments (seção 6, M15): concluído paper, em andamento ink-soft, a fazer cinza, backlog/pausado escuro.
// A legenda textual vem sempre junto (cor nunca é o único sinal).
const SEGMENTOS = [
  { chave: "done", classe: "bg-paper" },
  { chave: "doing", classe: "bg-ink-soft" },
  { chave: "todo", classe: "bg-progress-todo" },
  { chave: "idle", classe: "bg-progress-idle" },
] as const

export function ProgressSegments({ progress, className, showLegend = true }: { progress: ProgressoQuadro; className?: string; showLegend?: boolean }) {
  const { total, porForma } = progress
  const valores = { done: porForma.done, doing: porForma.doing, todo: porForma.todo, idle: porForma.backlog + porForma.paused }
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex h-1.5 gap-1 overflow-hidden" aria-hidden="true">
        {total === 0 ? <span className="h-full flex-1 rounded-full bg-progress-idle" /> : null}
        {SEGMENTOS.map(({ chave, classe }) =>
          valores[chave] > 0 ? (
            <motion.span
              key={chave}
              className={cn("h-full origin-left rounded-full", classe)}
              style={{ flexGrow: valores[chave] }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: dur.slow, ease: ease.out }}
            />
          ) : null
        )}
      </div>
      {showLegend ? <p className="text-small text-ink-soft">{resumoProgresso(progress)}</p> : null}
    </div>
  )
}
