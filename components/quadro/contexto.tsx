"use client"

// Rafael Marques - 23/10/2026
// Ações do quadro que formas, cartões e setas chamam (editar texto, trocar cor, excluir...).

import { createContext, useContext } from "react"

import type { LadoQuadro, NoQuadro, SetaQuadro } from "@/lib/quadro/modelo"

export type AcoesQuadro = {
  // false = só leitura (sem edição).
  editavel: boolean
  // Id da forma/seta cujo texto está sendo editado agora.
  editandoId: string | null
  comecarEdicao: (id: string | null) => void
  mudarNo: (id: string, mudancas: Partial<Pick<NoQuadro, "texto" | "forma" | "cor">>) => void
  mudarSeta: (id: string, mudancas: Partial<Pick<SetaQuadro, "rotulo" | "tracejada" | "ponta" | "cor">>) => void
  excluir: (ids: string[]) => void
  duplicar: (id: string) => void
  // Rafael Marques - 26/10/2026: cria uma peça nova ao lado de outra, já ligada por uma seta.
  adicionarLigada: (id: string, lado: LadoQuadro) => void
  abrirNota: (notaId: string) => void
}

export const ContextoQuadro = createContext<AcoesQuadro | null>(null)

export function useAcoesQuadro() {
  const acoes = useContext(ContextoQuadro)
  if (!acoes) throw new Error("ContextoQuadro ausente")
  return acoes
}
