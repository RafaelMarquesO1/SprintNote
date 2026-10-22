"use client"

import { MoonIcon, SunIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { alternarTema } from "@/lib/theme"

export function ThemeToggle() {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={alternarTema}
      aria-label="Alternar tema"
    >
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
    </Button>
  )
}
