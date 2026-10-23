// Rafael Marques - 23/10/2026
// Janela do Kanban aberta por cima do quadro ("Equipes"). Não é salvo.

import { create } from "zustand"

export type PainelKanban = "equipes"

export const usePaineisKanban = create<{ aberto: PainelKanban | null }>(() => ({ aberto: null }))

export const abrirPainelKanban = (painel: PainelKanban) => usePaineisKanban.setState({ aberto: painel })
export const fecharPainelKanban = () => usePaineisKanban.setState({ aberto: null })
