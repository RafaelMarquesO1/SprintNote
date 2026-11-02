// Captura rápida de tarefa (8.4): "Estudar AWS @amanhã !alta #estudos".
// @prazo usa a mesma sintaxe das tarefas dentro das notas; !alta|!média|!baixa; #lista (uma palavra).

import { REGEX_PRAZO, interpretarPrazo } from "@/lib/tarefas-notas"
import type { Prioridade } from "@/lib/tipos"

export type Captura = {
  titulo: string
  prazo: string | null
  // O texto do prazo como foi escrito ("amanhã"), para a prévia.
  prazoEscrito: string | null
  prioridade: Prioridade | null
  lista: string | null
}

const REGEX_PRIORIDADE = /(^|\s)!(alta|m[eé]dia|baixa)(?=$|\s)/i
const REGEX_LISTA = /(^|\s)#([\p{L}\p{N}_-]+)(?=$|\s)/u

export function interpretarCaptura(texto: string, hoje: string): Captura {
  let resto = texto
  let prazo: string | null = null
  let prazoEscrito: string | null = null
  let prioridade: Prioridade | null = null
  let lista: string | null = null

  const comPrazo = REGEX_PRAZO.exec(resto)
  if (comPrazo) {
    prazo = interpretarPrazo(comPrazo[2], hoje)
    prazoEscrito = comPrazo[2]
    resto = resto.replace(REGEX_PRAZO, "$1")
  }
  const comPrioridade = REGEX_PRIORIDADE.exec(resto)
  if (comPrioridade) {
    const valor = comPrioridade[2].toLowerCase()
    prioridade = valor === "alta" ? "alta" : valor === "baixa" ? "baixa" : "media"
    resto = resto.replace(REGEX_PRIORIDADE, "$1")
  }
  const comLista = REGEX_LISTA.exec(resto)
  if (comLista) {
    lista = comLista[2]
    resto = resto.replace(REGEX_LISTA, "$1")
  }
  return { titulo: resto.replace(/\s+/g, " ").trim(), prazo, prazoEscrito, prioridade, lista }
}
