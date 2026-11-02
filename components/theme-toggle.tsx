"use client"

import { MoonIcon, SunIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { alternarTema } from "@/lib/theme"

export function ThemeToggle() {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={(evento) => {
        const caixa = evento.currentTarget.getBoundingClientRect()
        alternarTema({ x: caixa.left + caixa.width / 2, y: caixa.top + caixa.height / 2 })
      }}
      aria-label="Alternar tema"
    >
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
    </Button>
  )
}
