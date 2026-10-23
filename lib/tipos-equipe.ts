// Rafael Marques - 23/10/2026
// Tipos de equipes e quadros compartilhados, usados no servidor e no navegador.

import type { CartaoKanban, ColunaKanban, EtiquetaKanban, ExibicaoCartao, QuadroKanban } from "@/lib/tipos"

export type PapelEquipe = "dono" | "editor" | "leitor"
export type PapelConvite = Exclude<PapelEquipe, "dono">

export const rotulosPapel: Record<PapelEquipe, string> = { dono: "Dono", editor: "Editor", leitor: "Leitor" }

export const descricoesPapel: Record<PapelEquipe, string> = {
  dono: "Faz tudo, inclusive convidar e remover pessoas.",
  editor: "Cria, edita, move e comenta cartões.",
  leitor: "Só vê os quadros.",
}

// Limites (evitam abuso e mantêm o quadro leve).
export const LIMITES_EQUIPE = {
  membros: 25,
  equipesPorPessoa: 5,
  quadrosPorEquipe: 20,
  convitesPendentes: 20,
  convitesDias: 7,
  cartoesPorQuadro: 2000,
  colunasPorQuadro: 60,
  etiquetasPorQuadro: 60,
}

export type MembroEquipe = {
  id: string
  nome: string
  email: string
  foto: string | null
  papel: PapelEquipe
  entrouEm: string
}

export type ResumoQuadroEquipe = { id: string; titulo: string; icone: string }

export type Equipe = {
  id: string
  nome: string
  meuPapel: PapelEquipe
  membros: MembroEquipe[]
  quadros: ResumoQuadroEquipe[]
}

export type ConviteEquipe = {
  id: string
  papel: PapelConvite
  email: string | null
  criadoEm: string
  expiraEm: string
}

// O que a pessoa vê antes de aceitar um convite.
export type PrevisaoConvite = {
  equipeNome: string
  papel: PapelConvite
  convidadoPor: string | null
  restritoAoEmail: boolean
}

// Um quadro de equipe inteiro, como o servidor entrega.
export type QuadroEquipeBaixado = {
  versao: number
  meuPapel: PapelEquipe
  quadro: QuadroKanban
  colunas: ColunaKanban[]
  cartoes: CartaoKanban[]
}

// ---------- Gravação por operação ----------
// O navegador compara o quadro com a última versão do servidor e manda só o
// que mudou. Ordem das listas = posição (ordem) no servidor.

export type CartaoGravar = Omit<CartaoKanban, "comentarios" | "atividade" | "notaId" | "criadoEm">

export type OperacoesQuadro = {
  quadro?: { titulo?: string; icone?: string; fundo?: string | null; exibicao?: Partial<ExibicaoCartao> }
  colunas?: { gravar: (ColunaKanban & { ordem: number })[]; excluir: string[] }
  etiquetas?: { gravar: (EtiquetaKanban & { ordem: number })[]; excluir: string[] }
  cartoes?: { gravar: (CartaoGravar & { ordem: number })[]; excluir: string[] }
  comentarios?: { inserir: { id: string; cartaoId: string; texto: string }[]; excluir: string[] }
  atividade?: { inserir: { id: string; cartaoId: string; texto: string }[] }
}
