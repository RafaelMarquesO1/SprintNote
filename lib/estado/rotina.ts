// Rafael Marques - 20/10/2026
// Estado da rotina diária (Zustand + persistência no localStorage do navegador).

import { create } from "zustand"
import { persist } from "zustand/middleware"

import { gerarId } from "@/lib/gerar-id"
import type { ExibicaoRotina, ItemRotina } from "@/lib/tipos"

const todosOsDias = [0, 1, 2, 3, 4, 5, 6]

export const exibicaoRotinaPadrao: ExibicaoRotina = {
  visao: "linha",
  estiloCor: "icone",
  mostrarDias: true,
  mostrarObservacao: true,
  mostrarDuracao: true,
  ocultarFeitas: false,
  destacarAgora: true,
}

type EstadoRotina = {
  itens: ItemRotina[]
  // Itens marcados como feitos, por data: { "2026-10-20": ["id1", "id2"] }
  feitosPorDia: Record<string, string[]>
  adicionarItem: (dados: Omit<ItemRotina, "id">) => void
  atualizarItem: (id: string, mudancas: Partial<Omit<ItemRotina, "id">>) => void
  excluirItem: (id: string) => void
  alternarFeito: (id: string, data: string) => void
  exibicao: ExibicaoRotina
  definirExibicao: (mudancas: Partial<ExibicaoRotina>) => void
}

export const useRotina = create<EstadoRotina>()(
  persist(
    (set, get) => ({
      itens: [],
      feitosPorDia: {},
      exibicao: exibicaoRotinaPadrao,

      definirExibicao: (mudancas) => set({ exibicao: { ...exibicaoRotinaPadrao, ...get().exibicao, ...mudancas } }),

      adicionarItem: (dados) => {
        if (!dados.titulo.trim()) return
        const item: ItemRotina = {
          ...dados,
          id: gerarId(),
          titulo: dados.titulo.trim(),
          dias: dados.dias.length ? dados.dias : todosOsDias,
        }
        set({ itens: [...get().itens, item] })
      },

      atualizarItem: (id, mudancas) => {
        if (mudancas.titulo !== undefined && !mudancas.titulo.trim()) return
        const limpas = {
          ...mudancas,
          ...(mudancas.titulo !== undefined && { titulo: mudancas.titulo.trim() }),
          ...(mudancas.dias && { dias: mudancas.dias.length ? mudancas.dias : todosOsDias }),
        }
        set({ itens: get().itens.map((item) => (item.id === id ? { ...item, ...limpas } : item)) })
      },

      excluirItem: (id) => set({ itens: get().itens.filter((item) => item.id !== id) }),

      alternarFeito: (id, data) => {
        const feitos = get().feitosPorDia[data] ?? []
        const proximos = feitos.includes(id) ? feitos.filter((item) => item !== id) : [...feitos, id]
        set({ feitosPorDia: { ...get().feitosPorDia, [data]: proximos } })
      },
    }),
    {
      name: "sprintnote-rotina",
      version: 2,
      // Versões antigas tinham dados de exemplo: começa zerado.
      migrate: () => ({ itens: [], feitosPorDia: {} }) as unknown as EstadoRotina,
    }
  )
)

export function itensDoDia(itens: ItemRotina[], diaSemana: number) {
  return itens
    .filter((item) => item.dias.includes(diaSemana))
    .sort((a, b) => a.horario.localeCompare(b.horario))
}

// Duração em texto, ex.: "1h30". Vazio quando não há horário de término.
export function duracao(item: ItemRotina) {
  if (!item.fim) return ""
  const [h1, m1] = item.horario.split(":").map(Number)
  const [h2, m2] = item.fim.split(":").map(Number)
  let minutos = h2 * 60 + m2 - (h1 * 60 + m1)
  if (minutos <= 0) minutos += 24 * 60
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return horas ? `${horas}h${resto ? String(resto).padStart(2, "0") : ""}` : `${resto} min`
}

export function horarioAtual() {
  const agora = new Date()
  return `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`
}
