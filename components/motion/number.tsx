"use client"

import NumberFlow from "@number-flow/react"

import { cn } from "@/lib/utils"

// Contadores animados (M6, M8, M15): os dígitos rolam ao mudar. Sempre tabular.
export function AnimatedNumber({ value, suffix, className }: { value: number; suffix?: string; className?: string }) {
  return (
    <NumberFlow
      value={value}
      suffix={suffix}
      locales="pt-BR"
      className={cn("tabular-nums", className)}
      transformTiming={{ duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" }}
      spinTiming={{ duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" }}
      respectMotionPreference
    />
  )
}
