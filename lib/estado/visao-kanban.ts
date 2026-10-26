// Rafael Marques - 26/10/2026
// Como cada quadro do Kanban é mostrado neste aparelho: em colunas, em lista ou em calendário,
// e se o quadro é agrupado em raias. É só preferência de tela (não vai para a conta nem para equipes).

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type VisaoKanban = "quadro" | "lista" | "calendario"
export type RaiaKanban = "nenhuma" | "responsavel" | "prioridade" | "etiqueta"

type Estado = {
  visoes: Record<string, VisaoKanban>
  raias: Record<string, RaiaKanban>
  definirVisao: (quadroId: string, visao: VisaoKanban) => void
  definirRaia: (quadroId: string, raia: RaiaKanban) => void
}

export const useVisaoKanban = create<Estado>()(
  persist(
    (set, get) => ({
      visoes: {},
      raias: {},
      definirVisao: (quadroId, visao) => set({ visoes: { ...get().visoes, [quadroId]: visao } }),
      definirRaia: (quadroId, raia) => set({ raias: { ...get().raias, [quadroId]: raia } }),
    }),
    { name: "sprintnote-kanban-visao", version: 1 }
  )
)

export const rotulosVisao: Record<VisaoKanban, string> = { quadro: "Quadro", lista: "Lista", calendario: "Calendário" }
export const rotulosRaia: Record<RaiaKanban, string> = { nenhuma: "Sem raias", responsavel: "Por pessoa", prioridade: "Por prioridade", etiqueta: "Por etiqueta" }
