// Rafael Marques - 21/10/2026
// Tarefas escritas dentro das notas ("- [ ] Estudar @amanhã") aparecem na
// página de Tarefas. Marcar em qualquer um dos dois lugares altera a nota.

import { chaveData, diaDaSemana, lerChave, somarDias } from "@/lib/datas"
import { REGEX_TAG, extrairTags } from "@/lib/tags"
import type { Livro, Nota } from "@/lib/tipos"

export type TarefaDeNota = {
  id: string
  notaId: string
  // Posição da tarefa dentro da nota (0 = primeira caixinha).
  indice: number
  texto: string
  marcada: boolean
  prazo: string | null
  tags: string[]
  notaTitulo: string
  livroTitulo: string | null
}

const REGEX_TAREFA = /^(\s*[-*+] \[)( |x|X)(\] ?)(.*)$/
// @hoje, @amanhã, @ontem, @seg...@dom, @25/10, @25/10/2026, @2026-10-25
export const REGEX_PRAZO = /(^|\s)@(hoje|amanh[aã]|ontem|seg|ter|qua|qui|sex|s[aá]b|dom|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\d{4}-\d{2}-\d{2})(?=$|[\s.,;!?)])/i

const diasSemana: Record<string, number> = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6, "sáb": 6 }

// Converte "@amanhã", "@sex" ou "@25/10" em data AAAA-MM-DD a partir de "referencia".
export function interpretarPrazo(token: string, referencia: string): string | null {
  const valor = token.toLowerCase()
  if (valor === "hoje") return referencia
  if (valor === "amanha" || valor === "amanhã") return somarDias(referencia, 1)
  if (valor === "ontem") return somarDias(referencia, -1)
  if (valor in diasSemana) {
    // Próxima ocorrência do dia (hoje conta).
    const atual = diaDaSemana(referencia)
    return somarDias(referencia, (diasSemana[valor] - atual + 7) % 7)
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  if (iso) return valor
  const br = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/.exec(valor)
  if (br) {
    const base = lerChave(referencia)
    let ano = br[3] ? Number(br[3].length === 2 ? `20${br[3]}` : br[3]) : base.getFullYear()
    const data = new Date(ano, Number(br[2]) - 1, Number(br[1]))
    // Sem ano e já passou: entende como o ano que vem.
    if (!br[3] && chaveData(data) < referencia) {
      ano += 1
      data.setFullYear(ano)
    }
    return chaveData(data)
  }
  return null
}

export function extrairTarefasDaNota(nota: Nota, livros: Livro[], hoje: string): TarefaDeNota[] {
  const tarefas: TarefaDeNota[] = []
  let dentroDeCodigo = false
  let indice = 0
  const livroTitulo = livros.find((livro) => livro.id === nota.livroId)?.titulo ?? null
  for (const linha of nota.conteudo.split("\n")) {
    if (linha.trimStart().startsWith("```")) dentroDeCodigo = !dentroDeCodigo
    if (dentroDeCodigo) continue
    const encontrado = REGEX_TAREFA.exec(linha)
    if (!encontrado) continue
    const textoCompleto = encontrado[4]
    // Caixinha vazia ainda não é tarefa.
    if (!textoCompleto.trim()) {
      indice++
      continue
    }
    const prazoEscrito = REGEX_PRAZO.exec(textoCompleto)
    const prazo = prazoEscrito ? interpretarPrazo(prazoEscrito[2], hoje) : null
    tarefas.push({
      id: `${nota.id}:${indice}`,
      notaId: nota.id,
      indice,
      // Prazo e tags saem do texto: aparecem como etiquetas ao lado.
      texto:
        textoCompleto
          .replace(REGEX_PRAZO, "$1")
          .replace(new RegExp(REGEX_TAG.source, "gu"), "$1")
          .replace(/\s+/g, " ")
          .trim() || textoCompleto.trim(),
      marcada: encontrado[2] !== " ",
      prazo,
      tags: extrairTags(textoCompleto),
      notaTitulo: nota.titulo,
      livroTitulo,
    })
    indice++
  }
  return tarefas
}

export function extrairTarefasDasNotas(notas: Nota[], livros: Livro[], hoje: string) {
  // Rafael Marques - 29/10/2026: livros com "vincular às tarefas" desligado ficam de fora.
  const sem = new Set(livros.filter((livro) => livro.vincularTarefas === false).map((livro) => livro.id))
  return notas.filter((nota) => !nota.livroId || !sem.has(nota.livroId)).flatMap((nota) => extrairTarefasDaNota(nota, livros, hoje))
}

// Marca/desmarca a tarefa número "indice" no Markdown da nota.
export function alternarTarefaNoConteudo(conteudo: string, indice: number) {
  let dentroDeCodigo = false
  let atual = 0
  return conteudo
    .split("\n")
    .map((linha) => {
      if (linha.trimStart().startsWith("```")) dentroDeCodigo = !dentroDeCodigo
      if (dentroDeCodigo) return linha
      const encontrado = REGEX_TAREFA.exec(linha)
      if (!encontrado) return linha
      if (atual++ !== indice) return linha
      return `${encontrado[1]}${encontrado[2] === " " ? "x" : " "}${encontrado[3]}${encontrado[4]}`
    })
    .join("\n")
}

// Texto curto para mostrar um prazo: "hoje", "amanhã", "sex., 24 out."
export function rotuloPrazo(prazo: string, hoje: string) {
  if (prazo === hoje) return "hoje"
  if (prazo === somarDias(hoje, 1)) return "amanhã"
  if (prazo === somarDias(hoje, -1)) return "ontem"
  return lerChave(prazo).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })
}
