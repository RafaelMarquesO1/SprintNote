"use client"

import { useEffect } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"

// Estado de interface do shell (seção 4.5: Zustand só para UI efêmera).
// Fica só neste navegador; não é sincronizado com a conta.
type EstadoShell = {
  recolhido: boolean
  alternarRecolhido: () => void
  definirRecolhido: (recolhido: boolean) => void
}

export const useShell = create<EstadoShell>()(
  persist(
    (set, get) => ({
      recolhido: false,
      alternarRecolhido: () => set({ recolhido: !get().recolhido }),
      definirRecolhido: (recolhido) => set({ recolhido }),
    }),
    { name: "sprintnote-shell", version: 1 }
  )
)

// ---------- Topbar: trilha e ações da página ----------
export type ItemTrilha = { rotulo: string; href?: string }

type EstadoTopbar = {
  trilha: ItemTrilha[] | null
  acoes: React.ReactNode
  // Ocupa a largura toda (Quadro, Grafo) em vez da coluna de 1120px.
  largura: "content" | "bleed"
}

export const useTopbar = create<EstadoTopbar>(() => ({ trilha: null, acoes: null, largura: "content" }))

// Páginas chamam isto para pôr a trilha e as ações no topo. Ao sair da página, limpa.
export function useDefinirTopbar({ trilha, acoes, largura = "content" }: { trilha?: ItemTrilha[] | null; acoes?: React.ReactNode; largura?: "content" | "bleed" }) {
  useEffect(() => {
    useTopbar.setState({ trilha: trilha ?? null, acoes: acoes ?? null, largura })
  })
  useEffect(
    () => () => {
      useTopbar.setState({ trilha: null, acoes: null, largura: "content" })
    },
    []
  )
}

// Componente equivalente, para páginas que preferem JSX.
export function TopbarSlot(props: { trilha?: ItemTrilha[] | null; acoes?: React.ReactNode; largura?: "content" | "bleed" }) {
  useDefinirTopbar(props)
  return null
}

// ---------- Criar (atalho C e botão + do celular) ----------
type EstadoCriar = { aberto: boolean }
export const useCriar = create<EstadoCriar>(() => ({ aberto: false }))
export const abrirCriar = () => useCriar.setState({ aberto: true })
