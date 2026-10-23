// Rafael Marques - 23/10/2026
// Estado das equipes no navegador: a lista que veio do servidor e o papel da
// pessoa em cada quadro de equipe. Não é salvo em lugar nenhum (o servidor é a fonte).

import { create } from "zustand"

import type { Equipe, PapelEquipe } from "@/lib/tipos-equipe"

type EstadoEquipes = {
  equipes: Equipe[]
  carregado: boolean
  // Papel da pessoa em cada quadro de equipe, por id do quadro.
  papelDoQuadro: Record<string, PapelEquipe>
  // Mensagem curta para mostrar no quadro (ex.: "Você é leitor desta equipe").
  aviso: string | null
}

export const useEquipes = create<EstadoEquipes>(() => ({ equipes: [], carregado: false, papelDoQuadro: {}, aviso: null }))

export const definirAvisoEquipe = (aviso: string | null) => useEquipes.setState({ aviso })

export function equipeDoQuadro(equipes: Equipe[], equipeId: string | undefined) {
  return equipes.find((equipe) => equipe.id === equipeId)
}

export function membroPorId(equipes: Equipe[], usuarioId: string | null | undefined) {
  if (!usuarioId) return undefined
  for (const equipe of equipes) {
    const membro = equipe.membros.find((item) => item.id === usuarioId)
    if (membro) return membro
  }
  return undefined
}
