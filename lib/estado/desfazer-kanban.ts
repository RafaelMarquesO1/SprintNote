// Rafael Marques - 23/10/2026 (avisos com outro botão ou sem botão em 23/10/2026)
// Aviso do Kanban no canto da tela: guarda só a última ação que pode ser revertida
// ("Desfazer") ou um recado simples (ex.: "Filtro aplicado"). Não é salvo.

import { create } from "zustand"

type Aviso = { id: number; mensagem: string; acao: (() => void) | null; rotulo: string } | null

export const useDesfazerKanban = create<{ atual: Aviso }>(() => ({ atual: null }))

let contador = 0

// Com "desfazer" o aviso ganha um botão (padrão "Desfazer"); sem ele é só um recado.
export function oferecerDesfazer(mensagem: string, desfazer: (() => void) | null, rotulo = "Desfazer") {
  useDesfazerKanban.setState({ atual: { id: ++contador, mensagem, acao: desfazer, rotulo } })
}

export function dispensarDesfazer() {
  useDesfazerKanban.setState({ atual: null })
}
