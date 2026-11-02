// Regras puras dos quadros (redesign v2): progresso e forma de status de cada coluna.

import type { CartaoKanban, ColunaKanban } from "@/lib/tipos"

export type FormaStatus = "backlog" | "paused" | "todo" | "doing" | "done"

export const FORMAS_STATUS: { valor: FormaStatus; rotulo: string }[] = [
  { valor: "backlog", rotulo: "Backlog" },
  { valor: "paused", rotulo: "Pausado" },
  { valor: "todo", rotulo: "A fazer" },
  { valor: "doing", rotulo: "Em andamento" },
  { valor: "done", rotulo: "Concluído" },
]

const semAcento = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

// Forma do status de uma coluna. Usa a escolhida pela pessoa; senão deduz pelo nome.
export function formaDaColuna(coluna: Pick<ColunaKanban, "titulo" | "concluida"> & { forma?: FormaStatus | null }): FormaStatus {
  if (coluna.forma) return coluna.forma
  if (coluna.concluida) return "done"
  const nome = semAcento(coluna.titulo)
  if (/backlog|ideias|caixa de entrada/.test(nome)) return "backlog"
  if (/paus|bloque|espera|aguard/.test(nome)) return "paused"
  if (/andamento|fazendo|progresso|doing|revis|teste/.test(nome)) return "doing"
  if (/conclu|feito|pronto|done|entregue/.test(nome)) return "done"
  return "todo"
}

export type ProgressoQuadro = {
  total: number
  concluidos: number
  percentual: number
  porForma: Record<FormaStatus, number>
}

// Progresso de um quadro: só cartões não arquivados das colunas do quadro.
export function progressoQuadro(colunas: ColunaKanban[], cartoes: CartaoKanban[]): ProgressoQuadro {
  const porForma: Record<FormaStatus, number> = { backlog: 0, paused: 0, todo: 0, doing: 0, done: 0 }
  const formaPorColuna = new Map(colunas.map((coluna) => [coluna.id, formaDaColuna(coluna)]))
  let total = 0
  for (const cartao of cartoes) {
    if (cartao.arquivado) continue
    const forma = formaPorColuna.get(cartao.colunaId)
    if (!forma) continue
    total++
    porForma[forma]++
  }
  const concluidos = porForma.done
  return { total, concluidos, percentual: total ? Math.round((concluidos / total) * 100) : 0, porForma }
}

// "3 de 4 concluídos, 1 no backlog"
export function resumoProgresso({ total, concluidos, porForma }: ProgressoQuadro) {
  if (total === 0) return "Nenhum cartão ainda"
  const partes = [`${concluidos} de ${total} ${total === 1 ? "concluído" : "concluídos"}`]
  if (porForma.doing) partes.push(`${porForma.doing} em andamento`)
  if (porForma.todo) partes.push(`${porForma.todo} a fazer`)
  if (porForma.backlog) partes.push(`${porForma.backlog} no backlog`)
  if (porForma.paused) partes.push(`${porForma.paused} ${porForma.paused === 1 ? "pausado" : "pausados"}`)
  return partes.join(", ")
}
