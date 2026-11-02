"use client"

import { cn } from "@/lib/utils"

import { AnimatedNumber } from "@/components/motion/number"

export type Stat = {
  label: string
  // Número animado; use "text" para valores como "0/0".
  value?: number
  suffix?: string
  text?: string
}

// StatList (seção 6): <dl> semântico. "inline" (texto corrido) ou "highlight" (números grandes).
export function StatList({ stats, variant = "inline", className }: { stats: Stat[]; variant?: "inline" | "highlight"; className?: string }) {
  if (variant === "highlight") {
    return (
      <dl className={cn("flex flex-wrap gap-x-10 gap-y-4", className)}>
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse gap-1">
            <dt className="text-small text-ink-soft">{stat.label}</dt>
            <dd className="font-display text-number text-paper tabular-nums">
              {stat.text ?? <AnimatedNumber value={stat.value ?? 0} suffix={stat.suffix} />}
            </dd>
          </div>
        ))}
      </dl>
    )
  }
  return (
    <dl className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-ui text-ink-soft", className)}>
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-baseline gap-1">
          <dd className="text-paper tabular-nums">{stat.text ?? <AnimatedNumber value={stat.value ?? 0} suffix={stat.suffix} />}</dd>
          <dt>{stat.label}</dt>
        </div>
      ))}
    </dl>
  )
}
