// Rafael Marques - 20/10/2026
// Estado das tarefas (Zustand + persistência no localStorage do navegador).

import { create } from "zustand"
import { persist } from "zustand/middleware"

import { gerarId } from "@/lib/gerar-id"
import type { Prioridade, Tarefa } from "@/lib/tipos"

type DadosTarefa = Partial<Pick<Tarefa, "titulo" | "descricao" | "prazo" | "prioridade" | "lista">>

type EstadoTarefas = {
  tarefas: Tarefa[]
  adicionarTarefa: (dados: DadosTarefa & { titulo: string }) => void
  atualizarTarefa: (id: string, mudancas: DadosTarefa) => void
  alternarConcluida: (id: string) => void
  excluirTarefa: (id: string) => void
  limparConcluidas: () => void
}

export const prioridades: { id: Prioridade; titulo: string; peso: number }[] = [
  { id: "alta", titulo: "Alta", peso: 0 },
  { id: "media", titulo: "Média", peso: 1 },
  { id: "baixa", titulo: "Baixa", peso: 2 },
]

export const useTarefas = create<EstadoTarefas>()(
  persist(
    (set, get) => ({
      tarefas: [],

      adicionarTarefa: (dados) => {
        if (!dados.titulo.trim()) return
        const tarefa: Tarefa = {
          id: gerarId(),
          titulo: dados.titulo.trim(),
          descricao: dados.descricao ?? "",
          concluida: false,
          prazo: dados.prazo ?? null,
          prioridade: dados.prioridade ?? "media",
          lista: dados.lista?.trim() ?? "",
          criadoEm: Date.now(),
          concluidaEm: null,
        }
        set({ tarefas: [...get().tarefas, tarefa] })
      },

      atualizarTarefa: (id, mudancas) =>
        set({
          tarefas: get().tarefas.map((tarefa) => (tarefa.id === id ? { ...tarefa, ...mudancas } : tarefa)),
        }),

      alternarConcluida: (id) =>
        set({
          tarefas: get().tarefas.map((tarefa) =>
            tarefa.id === id
              ? { ...tarefa, concluida: !tarefa.concluida, concluidaEm: tarefa.concluida ? null : Date.now() }
              : tarefa
          ),
        }),

      excluirTarefa: (id) => set({ tarefas: get().tarefas.filter((tarefa) => tarefa.id !== id) }),

      limparConcluidas: () => set({ tarefas: get().tarefas.filter((tarefa) => !tarefa.concluida) }),
    }),
    {
      name: "sprintnote-tarefas",
      version: 2,
      // Versões antigas tinham dados de exemplo: começa zerado.
      migrate: () => ({ tarefas: [] }) as unknown as EstadoTarefas,
    }
  )
)

// Pendentes com prazo até hoje (inclui atrasadas).
export function tarefasDeHoje(tarefas: Tarefa[], hoje: string) {
  return tarefas.filter((tarefa) => !tarefa.concluida && tarefa.prazo !== null && tarefa.prazo <= hoje)
}

// Ordena por: atrasadas/prazo mais próximo, depois prioridade, depois criação.
export function ordenarTarefas(tarefas: Tarefa[]) {
  const peso = (prioridade: Prioridade) => prioridades.find((item) => item.id === prioridade)?.peso ?? 1
  return [...tarefas].sort((a, b) => {
    if (a.concluida !== b.concluida) return a.concluida ? 1 : -1
    const prazoA = a.prazo ?? "9999-99-99"
    const prazoB = b.prazo ?? "9999-99-99"
    if (prazoA !== prazoB) return prazoA < prazoB ? -1 : 1
    if (a.prioridade !== b.prioridade) return peso(a.prioridade) - peso(b.prioridade)
    return a.criadoEm - b.criadoEm
  })
}
