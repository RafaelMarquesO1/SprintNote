// Rafael Marques - 20/10/2026
// Editor em blocos (estilo Notion): o Markdown da nota é dividido em blocos
// (parágrafo, título, lista, tarefa...) e depois remontado ao salvar.
// Assim a nota continua sendo Markdown puro, mas é editada bloco a bloco.

import { gerarId } from "@/lib/gerar-id"

export type TipoBloco =
  | "paragrafo"
  | "titulo1"
  | "titulo2"
  | "titulo3"
  | "lista"
  | "numerada"
  | "tarefa"
  | "citacao"
  | "codigo"
  | "divisor"
  | "tabela"
  // Caixa colorida com ícone (callout). No Markdown: "> [!dica] texto".
  | "destaque"

export type VarianteDestaque = "info" | "dica" | "aviso" | "perigo" | "nota"
export const variantesDestaque: VarianteDestaque[] = ["info", "dica", "aviso", "perigo", "nota"]

// Nomes aceitos na hora de ler (inclui os do Obsidian em inglês).
const apelidosVariante: Record<string, VarianteDestaque> = {
  info: "info", note: "nota", nota: "nota", abstract: "info", summary: "info",
  tip: "dica", dica: "dica", hint: "dica", success: "dica", check: "dica",
  warning: "aviso", aviso: "aviso", caution: "aviso", attention: "aviso", question: "aviso",
  danger: "perigo", perigo: "perigo", error: "perigo", bug: "perigo", failure: "perigo",
}

export type Bloco = {
  id: string
  tipo: TipoBloco
  texto: string
  // Recuo de listas (0 = sem recuo).
  nivel: number
  // Só para tarefas.
  marcado: boolean
  // Só para blocos de código.
  linguagem: string
  // Só para destaques.
  variante?: VarianteDestaque
}

export const tiposLista: TipoBloco[] = ["lista", "numerada", "tarefa"]
// Blocos cujo texto é editado "cru" (sem formatação inline).
export const tiposTextoCru: TipoBloco[] = ["codigo", "tabela"]

export function novoBloco(tipo: TipoBloco = "paragrafo", texto = "", extra: Partial<Bloco> = {}): Bloco {
  return { id: gerarId(), tipo, texto, nivel: 0, marcado: false, linguagem: "", ...extra }
}

const REGEX_TAREFA = /^(\s*)[-*+] \[( |x|X)\] ?(.*)$/
const REGEX_LISTA = /^(\s*)[-*+] (.*)$/
const REGEX_NUMERADA = /^(\s*)\d+[.)] (.*)$/
const REGEX_TITULO = /^(#{1,6}) (.*)$/
const REGEX_DIVISOR = /^(---|\*\*\*|___)\s*$/
const REGEX_CODIGO = /^```(.*)$/

function nivelDe(espacos: string) {
  return Math.min(4, Math.floor(espacos.replace(/\t/g, "  ").length / 2))
}

function iniciaBloco(linha: string) {
  return (
    REGEX_TAREFA.test(linha) ||
    REGEX_LISTA.test(linha) ||
    REGEX_NUMERADA.test(linha) ||
    REGEX_TITULO.test(linha) ||
    REGEX_DIVISOR.test(linha) ||
    REGEX_CODIGO.test(linha) ||
    linha.startsWith(">") ||
    linha.startsWith("|")
  )
}

export function markdownParaBlocos(markdown: string): Bloco[] {
  const linhas = markdown.replace(/\r\n/g, "\n").split("\n")
  const blocos: Bloco[] = []
  let i = 0

  while (i < linhas.length) {
    const linha = linhas[i]
    let encontrado: RegExpExecArray | null

    if (!linha.trim()) {
      i++
      continue
    }

    if ((encontrado = REGEX_CODIGO.exec(linha))) {
      const conteudo: string[] = []
      i++
      while (i < linhas.length && !linhas[i].startsWith("```")) conteudo.push(linhas[i++])
      i++ // pula o ``` de fechamento
      blocos.push(novoBloco("codigo", conteudo.join("\n"), { linguagem: encontrado[1].trim() }))
      continue
    }

    if ((encontrado = REGEX_TAREFA.exec(linha))) {
      blocos.push(novoBloco("tarefa", encontrado[3], { nivel: nivelDe(encontrado[1]), marcado: encontrado[2] !== " " }))
      i++
      continue
    }

    if ((encontrado = REGEX_LISTA.exec(linha))) {
      blocos.push(novoBloco("lista", encontrado[2], { nivel: nivelDe(encontrado[1]) }))
      i++
      continue
    }

    if ((encontrado = REGEX_NUMERADA.exec(linha))) {
      blocos.push(novoBloco("numerada", encontrado[2], { nivel: nivelDe(encontrado[1]) }))
      i++
      continue
    }

    if ((encontrado = REGEX_TITULO.exec(linha))) {
      const nivel = Math.min(3, encontrado[1].length)
      blocos.push(novoBloco(`titulo${nivel}` as TipoBloco, encontrado[2]))
      i++
      continue
    }

    if (REGEX_DIVISOR.test(linha)) {
      blocos.push(novoBloco("divisor"))
      i++
      continue
    }

    if (linha.startsWith(">")) {
      const conteudo: string[] = []
      while (i < linhas.length && linhas[i].startsWith(">")) conteudo.push(linhas[i++].replace(/^> ?/, ""))
      const chamada = /^\[!([\p{L}]+)\][+-]? ?(.*)$/u.exec(conteudo[0] ?? "")
      if (chamada) {
        const variante = apelidosVariante[chamada[1].toLowerCase()] ?? "nota"
        const texto = [chamada[2], ...conteudo.slice(1)].join("\n").replace(/^\n+/, "")
        blocos.push(novoBloco("destaque", texto, { variante }))
      } else {
        blocos.push(novoBloco("citacao", conteudo.join("\n")))
      }
      continue
    }

    if (linha.startsWith("|")) {
      const conteudo: string[] = []
      while (i < linhas.length && linhas[i].startsWith("|")) conteudo.push(linhas[i++])
      blocos.push(novoBloco("tabela", conteudo.join("\n")))
      continue
    }

    // Parágrafo: linhas seguidas até uma linha vazia ou o começo de outro bloco.
    const conteudo: string[] = [linha]
    i++
    while (i < linhas.length && linhas[i].trim() && !iniciaBloco(linhas[i])) conteudo.push(linhas[i++])
    blocos.push(novoBloco("paragrafo", conteudo.join("\n")))
  }

  return blocos
}

function blocoParaMarkdown(bloco: Bloco): string {
  const recuo = "  ".repeat(bloco.nivel)
  switch (bloco.tipo) {
    case "titulo1":
      return `# ${bloco.texto}`
    case "titulo2":
      return `## ${bloco.texto}`
    case "titulo3":
      return `### ${bloco.texto}`
    case "lista":
      return `${recuo}- ${bloco.texto}`
    case "numerada":
      return `${recuo}1. ${bloco.texto}`
    case "tarefa":
      return `${recuo}- [${bloco.marcado ? "x" : " "}] ${bloco.texto}`
    case "citacao":
      return bloco.texto.split("\n").map((linha) => `> ${linha}`).join("\n")
    case "codigo":
      return `\`\`\`${bloco.linguagem}\n${bloco.texto}\n\`\`\``
    case "destaque": {
      const [primeira, ...resto] = bloco.texto.split("\n")
      return [`> [!${bloco.variante ?? "info"}] ${primeira}`.trimEnd(), ...resto.map((linha) => `> ${linha}`)].join("\n")
    }
    case "divisor":
      return "---"
    default:
      return bloco.texto
  }
}

export function blocosParaMarkdown(blocos: Bloco[]): string {
  // Parágrafos vazios só existem enquanto se edita: não vão para o Markdown.
  const uteis = blocos.filter((bloco) => !(bloco.tipo === "paragrafo" && !bloco.texto.trim()))
  let resultado = ""
  uteis.forEach((bloco, indice) => {
    if (indice > 0) {
      const anterior = uteis[indice - 1]
      const mesmaLista = tiposLista.includes(anterior.tipo) && tiposLista.includes(bloco.tipo)
      resultado += mesmaLista ? "\n" : "\n\n"
    }
    resultado += blocoParaMarkdown(bloco)
  })
  return resultado
}

// Atalhos de Markdown digitados no começo de um parágrafo (como no Notion).
// Ex.: "# " vira título, "- " vira lista, "[] " vira tarefa.
export function detectarAtalho(texto: string): { tipo: TipoBloco; resto: string; marcado?: boolean; linguagem?: string } | null {
  const atalhos: [RegExp, TipoBloco][] = [
    [/^### /, "titulo3"],
    [/^## /, "titulo2"],
    [/^# /, "titulo1"],
    [/^[-*+] \[[ ]?\] /, "tarefa"],
    [/^\[[ ]?\] /, "tarefa"],
    [/^[-*+] /, "lista"],
    [/^1[.)] /, "numerada"],
    [/^> /, "citacao"],
    [/^" /, "citacao"],
  ]
  for (const [regex, tipo] of atalhos) {
    const encontrado = regex.exec(texto)
    if (encontrado) return { tipo, resto: texto.slice(encontrado[0].length) }
  }
  const marcada = /^[-*+]? ?\[[xX]\] /.exec(texto)
  if (marcada) return { tipo: "tarefa", resto: texto.slice(marcada[0].length), marcado: true }
  const codigo = /^```(\w*)$/.exec(texto)
  if (codigo) return { tipo: "codigo", resto: "", linguagem: codigo[1] }
  if (/^(---|\*\*\*|___)$/.test(texto)) return { tipo: "divisor", resto: "" }
  return null
}

// Número de cada item de lista numerada (contando os vizinhos do mesmo nível).
export function numerarBlocos(blocos: Bloco[]) {
  const numeros = new Map<string, number>()
  const contadores: number[] = []
  for (const bloco of blocos) {
    if (bloco.tipo === "numerada") {
      contadores.length = bloco.nivel + 1
      contadores[bloco.nivel] = (contadores[bloco.nivel] ?? 0) + 1
      numeros.set(bloco.id, contadores[bloco.nivel])
    } else if (!tiposLista.includes(bloco.tipo)) {
      contadores.length = 0
    } else {
      contadores.length = bloco.nivel + 1
    }
  }
  return numeros
}
