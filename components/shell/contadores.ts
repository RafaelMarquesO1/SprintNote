"use client"

import { useConta } from "@/components/conta/portao-conta"
import { useHoje } from "@/hooks/use-hoje"
import { itensDeHoje, useTarefasUnificadas } from "@/hooks/use-tarefas-unificadas"
import { useHabitos, valeNoDia } from "@/lib/estado/habitos"
import { cartaoConcluido, cartoesRelevantes, useKanban } from "@/lib/estado/kanban"

// Contagens do menu (7.1): tarefas de hoje pendentes e cartões seus em aberto.
export function useContadores(): Record<string, string | null> {
  const hoje = useHoje()
  const { itens: tarefas } = useTarefasUnificadas(hoje)
  const habitos = useHabitos((estado) => estado.habitos)
  const cartoes = useKanban((estado) => estado.cartoes)
  const colunas = useKanban((estado) => estado.colunas)
  const quadros = useKanban((estado) => estado.quadros)
  const meuId = useConta()?.usuario.id ?? null

  if (!hoje) return {}
  const tarefasHoje = itensDeHoje(tarefas, hoje).filter((item) => !item.concluida).length
  const habitosHoje = habitos.filter((habito) => valeNoDia(habito, hoje))
  const habitosFeitos = habitosHoje.filter((habito) => habito.feitos.includes(hoje)).length
  const emAberto = cartoesRelevantes(cartoes, colunas, quadros, meuId).filter((cartao) => !cartaoConcluido(cartao, colunas)).length

  return {
    "/tarefas": tarefasHoje > 0 ? String(tarefasHoje) : null,
    "/habitos": habitosHoje.length > 0 && habitosFeitos < habitosHoje.length ? `${habitosFeitos}/${habitosHoje.length}` : null,
    "/kanban": emAberto > 0 ? String(emAberto) : null,
  }
}
