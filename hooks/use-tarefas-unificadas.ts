import { useMemo } from "react"
import { useShallow } from "zustand/react/shallow"

import { useNotas } from "@/lib/estado/notas"
import { useTarefas } from "@/lib/estado/tarefas"
import { alternarTarefaNoConteudo, extrairTarefasDasNotas, type TarefaDeNota } from "@/lib/tarefas-notas"
import type { Tarefa } from "@/lib/tipos"

// Rafael Marques - 21/10/2026
// Tarefas da página de Tarefas + tarefas escritas nas notas, num formato só.
export type ItemTarefa =
  | { origem: "lista"; id: string; titulo: string; concluida: boolean; prazo: string | null; tarefa: Tarefa }
  | { origem: "nota"; id: string; titulo: string; concluida: boolean; prazo: string | null; daNota: TarefaDeNota }

export function useTarefasUnificadas(hoje: string) {
  const tarefas = useTarefas((estado) => estado.tarefas)
  const alternarConcluida = useTarefas((estado) => estado.alternarConcluida)
  const { notas, livros } = useNotas(useShallow((estado) => ({ notas: estado.notas, livros: estado.livros })))
  const atualizarNota = useNotas((estado) => estado.atualizarNota)

  const itens = useMemo<ItemTarefa[]>(() => {
    if (!hoje) return []
    const daLista: ItemTarefa[] = tarefas.map((tarefa) => ({
      origem: "lista",
      id: tarefa.id,
      titulo: tarefa.titulo,
      concluida: tarefa.concluida,
      prazo: tarefa.prazo,
      tarefa,
    }))
    const dasNotas: ItemTarefa[] = extrairTarefasDasNotas(notas, livros, hoje).map((daNota) => ({
      origem: "nota",
      id: daNota.id,
      titulo: daNota.texto,
      concluida: daNota.marcada,
      prazo: daNota.prazo,
      daNota,
    }))
    return [...daLista, ...dasNotas]
  }, [tarefas, notas, livros, hoje])

  function alternar(item: ItemTarefa) {
    if (item.origem === "lista") {
      alternarConcluida(item.tarefa.id)
      return
    }
    const nota = notas.find((atual) => atual.id === item.daNota.notaId)
    if (nota) atualizarNota(nota.id, { conteudo: alternarTarefaNoConteudo(nota.conteudo, item.daNota.indice) })
  }

  return { itens, alternar }
}

// Pendentes com prazo até hoje (inclui atrasadas).
export function itensDeHoje(itens: ItemTarefa[], hoje: string) {
  return itens.filter((item) => !item.concluida && item.prazo !== null && item.prazo <= hoje)
}
