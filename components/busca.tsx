"use client"

// Redesign v2: a busca virou a paleta de comando (components/shell/command-palette.tsx).
// Estes nomes continuam para quem já importava daqui.
import { abrirPaleta, CommandPalette } from "@/components/shell/command-palette"

export const abrirBusca = abrirPaleta
export const DialogoBusca = CommandPalette
