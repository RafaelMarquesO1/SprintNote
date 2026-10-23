// Rafael Marques - 23/10/2026
// Filtro do quadro por pessoa responsável. Liga de três jeitos: clicando na inicial/foto da
// pessoa dentro de um cartão, no botão "Atribuídos a mim" do cabeçalho ou pela busca (Ctrl+K).
// Cada vez que o filtro é aplicado, aparece um aviso com "Remover filtro". Não é salvo.

import { create } from "zustand"

import { oferecerDesfazer } from "@/lib/estado/desfazer-kanban"
import { useKanban } from "@/lib/estado/kanban"

export const useFiltroAtribuidos = create<{ responsavelId: string | null }>(() => ({ responsavelId: null }))

export const filtrarPorResponsavel = (responsavelId: string | null) => useFiltroAtribuidos.setState({ responsavelId })

// "nome" é como a pessoa aparece no aviso ("você" para quem está logado).
export function alternarFiltroPorResponsavel(responsavelId: string, nome: string) {
  if (useFiltroAtribuidos.getState().responsavelId === responsavelId) {
    filtrarPorResponsavel(null)
    oferecerDesfazer("Filtro removido: mostrando todos os cartões", null)
    return
  }
  filtrarPorResponsavel(responsavelId)
  oferecerDesfazer(`Filtro aplicado: cartões atribuídos a ${nome}`, () => filtrarPorResponsavel(null), "Remover filtro")
}

// Liga o filtro para mim e, se o quadro aberto não for de equipe, vai para um quadro de equipe
// (de preferência um que tenha cartões atribuídos a esta pessoa).
export function aplicarFiltroAtribuidosAMim(meuId: string | null) {
  if (!meuId) return
  const { quadros, colunas, cartoes, quadroAtivoId, definirQuadroAtivo } = useKanban.getState()
  if (useFiltroAtribuidos.getState().responsavelId !== meuId) alternarFiltroPorResponsavel(meuId, "você")
  const ativo = quadros.find((quadro) => quadro.id === quadroAtivoId)
  if (ativo?.equipeId) return
  const deEquipe = quadros.filter((quadro) => quadro.equipeId)
  const comMeusCartoes = deEquipe.find((quadro) => {
    const ids = new Set(colunas.filter((coluna) => coluna.quadroId === quadro.id).map((coluna) => coluna.id))
    return cartoes.some((cartao) => ids.has(cartao.colunaId) && !cartao.arquivado && cartao.responsavelId === meuId)
  })
  const alvo = comMeusCartoes ?? deEquipe[0]
  if (alvo) definirQuadroAtivo(alvo.id)
}
