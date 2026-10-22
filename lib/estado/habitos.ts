// Rafael Marques - 20/10/2026
// Estado dos hábitos (Zustand + persistência no localStorage do navegador).

import { create } from "zustand"
import { persist } from "zustand/middleware"

import { diaDaSemana, somarDias } from "@/lib/datas"
import { gerarId } from "@/lib/gerar-id"
import type { Habito } from "@/lib/tipos"

export const todosOsDias = [0, 1, 2, 3, 4, 5, 6]

type EstadoHabitos = {
  habitos: Habito[]
  adicionarHabito: (dados: { nome: string; icone: string; dias: number[] }) => void
  atualizarHabito: (id: string, mudancas: Partial<Pick<Habito, "nome" | "icone" | "dias">>) => void
  alternarFeito: (id: string, data: string) => void
  excluirHabito: (id: string) => void
}

export const useHabitos = create<EstadoHabitos>()(
  persist(
    (set, get) => ({
      habitos: [],

      adicionarHabito: ({ nome, icone, dias }) => {
        if (!nome.trim()) return
        const habito: Habito = {
          id: gerarId(),
          nome: nome.trim(),
          icone: icone || "feito",
          dias: dias.length ? dias : todosOsDias,
          feitos: [],
          criadoEm: Date.now(),
        }
        set({ habitos: [...get().habitos, habito] })
      },

      atualizarHabito: (id, mudancas) =>
        set({ habitos: get().habitos.map((habito) => (habito.id === id ? { ...habito, ...mudancas } : habito)) }),

      alternarFeito: (id, data) =>
        set({
          habitos: get().habitos.map((habito) => {
            if (habito.id !== id) return habito
            const feito = habito.feitos.includes(data)
            return {
              ...habito,
              feitos: feito ? habito.feitos.filter((item) => item !== data) : [...habito.feitos, data],
            }
          }),
        }),

      excluirHabito: (id) => set({ habitos: get().habitos.filter((habito) => habito.id !== id) }),
    }),
    {
      name: "sprintnote-habitos",
      version: 3,
      // Versões antigas tinham dados de exemplo: começa zerado.
      migrate: () => ({ habitos: [] }) as unknown as EstadoHabitos,
    }
  )
)

export function valeNoDia(habito: Habito, data: string) {
  return habito.dias.includes(diaDaSemana(data))
}

// Sequência atual: dias programados seguidos em que o hábito foi feito.
// Hoje só quebra a sequência depois que o dia acaba.
export function calcularSequencia(habito: Habito, hoje: string) {
  let sequencia = 0
  let data = hoje
  for (let passo = 0; passo < 366; passo++) {
    if (valeNoDia(habito, data)) {
      if (habito.feitos.includes(data)) sequencia++
      else if (data !== hoje) break
    }
    data = somarDias(data, -1)
  }
  return sequencia
}
