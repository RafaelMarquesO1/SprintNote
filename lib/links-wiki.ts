// Rafael Marques - 20/10/2026
// Links entre notas e livros, no estilo Obsidian:
//   [[Nota]]             → nota com esse título (prioriza o mesmo livro)
//   [[Livro]]            → o livro inteiro
//   [[Livro/Nota]]       → nota de um livro específico
//   [[alvo|texto]]       → mesmo link, mostrando outro texto

import { REGEX_TAG } from "@/lib/tags"
import { REGEX_PRAZO } from "@/lib/tarefas-notas"
import type { Livro, Nota } from "@/lib/tipos"

const REGEX_LINK_WIKI = /\[\[([^\[\]|]+)(?:\|([^\[\]]+))?\]\]/g

export const PREFIXO_LINK_WIKI = "#wiki="
export const PREFIXO_TAG = "#tag="
export const PREFIXO_PRAZO = "#prazo="
export const PREFIXO_MARCA = "#marca-texto"

export type Biblioteca = { notas: Nota[]; livros: Livro[] }

export type Destino =
  | { tipo: "nota"; nota: Nota }
  | { tipo: "livro"; livro: Livro }

export function normalizar(texto: string) {
  return texto.trim().toLowerCase()
}

export function semAcento(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

// Lista os alvos citados em um texto (sem repetição), ignorando blocos de código.
export function extrairLinksWiki(conteudo: string): string[] {
  const alvos = new Set<string>()
  for (const trecho of conteudo.split(/```[\s\S]*?```|`[^`\n]*`/g)) {
    for (const encontrado of trecho.matchAll(REGEX_LINK_WIKI)) {
      alvos.add(encontrado[1].trim())
    }
  }
  return [...alvos]
}

// Descobre para onde um [[alvo]] aponta, a partir do livro da nota de origem.
export function resolverLink(
  alvo: string,
  { notas, livros }: Biblioteca,
  livroAtualId: string | null = null
): Destino | null {
  const procurado = normalizar(alvo)
  if (!procurado) return null

  const barra = procurado.indexOf("/")
  if (barra > 0) {
    const livro = livros.find((item) => normalizar(item.titulo) === procurado.slice(0, barra).trim())
    const tituloNota = procurado.slice(barra + 1).trim()
    if (livro) {
      const nota = notas.find((item) => item.livroId === livro.id && normalizar(item.titulo) === tituloNota)
      if (nota) return { tipo: "nota", nota }
    }
  }

  const candidatas = notas.filter((item) => normalizar(item.titulo) === procurado)
  const nota = candidatas.find((item) => item.livroId === livroAtualId) ?? candidatas[0]
  if (nota) return { tipo: "nota", nota }

  const livro = livros.find((item) => normalizar(item.titulo) === procurado)
  if (livro) return { tipo: "livro", livro }

  return null
}

// Texto do [[link]] mais curto que aponta sem ambiguidade para a nota.
export function alvoDaNota(nota: Nota, { notas, livros }: Biblioteca, livroAtualId: string | null = null) {
  const homonimas = notas.filter((item) => normalizar(item.titulo) === normalizar(nota.titulo))
  const conflitaComLivro = livros.some((livro) => normalizar(livro.titulo) === normalizar(nota.titulo))
  const ambigua = homonimas.length > 1 && nota.livroId !== livroAtualId
  if ((ambigua || conflitaComLivro) && nota.livroId) {
    const livro = livros.find((item) => item.id === nota.livroId)
    if (livro) return `${livro.titulo}/${nota.titulo}`
  }
  return nota.titulo
}

// Notas que apontam para a nota (ou o livro) alvo — os "backlinks".
export function obterReferencias(biblioteca: Biblioteca, alvo: Destino): Nota[] {
  const idAlvo = alvo.tipo === "nota" ? alvo.nota.id : alvo.livro.id
  return biblioteca.notas.filter((nota) => {
    if (alvo.tipo === "nota" && nota.id === alvo.nota.id) return false
    return extrairLinksWiki(nota.conteudo).some((texto) => {
      const destino = resolverLink(texto, biblioteca, nota.livroId)
      if (!destino) return false
      return destino.tipo === alvo.tipo && (destino.tipo === "nota" ? destino.nota.id : destino.livro.id) === idAlvo
    })
  })
}

// Converte [[alvo]] em links Markdown que a visualização sabe interpretar.
// Links dentro de blocos de código são preservados.
export function linksWikiParaMarkdown(conteudo: string): string {
  return conteudo
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((trecho, indice) => {
      if (indice % 2 === 1) return trecho
      // Separa os [[links]] do resto para não criar tags/prazos dentro deles.
      return trecho
        .split(/(\[\[[^\[\]]+\]\])/g)
        .map((parte, posicao) => {
          if (posicao % 2 === 1) {
            return parte.replace(REGEX_LINK_WIKI, (_, alvo: string, rotulo?: string) => {
              const limpo = alvo.trim()
              const texto = (rotulo ?? limpo.split("/").pop() ?? limpo).trim()
              return `[${texto.replace(/[\[\]]/g, "")}](${PREFIXO_LINK_WIKI}${encodeURIComponent(limpo)})`
            })
          }
          return parte
            .replace(/==([^=\n]+)==/g, (_, texto: string) => `[${texto}](${PREFIXO_MARCA})`)
            .replace(new RegExp(REGEX_TAG.source, "gu"), (_, antes: string, tag: string) => `${antes}[#${tag}](${PREFIXO_TAG}${encodeURIComponent(tag)})`)
            .replace(new RegExp(REGEX_PRAZO.source, "gi"), (_, antes: string, token: string) => `${antes}[@${token}](${PREFIXO_PRAZO}${encodeURIComponent(token)})`)
        })
        .join("")
    })
    .join("")
}

// Reescreve os alvos dos [[links]] de um texto. "trocar" devolve o novo alvo
// (ou null para manter). Usado ao renomear notas e livros.
export function reescreverLinks(conteudo: string, trocar: (alvo: string) => string | null) {
  return conteudo.replace(REGEX_LINK_WIKI, (completo, alvo: string, rotulo?: string) => {
    const novo = trocar(alvo.trim())
    if (novo === null) return completo
    return rotulo ? `[[${novo}|${rotulo}]]` : `[[${novo}]]`
  })
}

// Menções sem link: a nota cita o título de outra nota no texto, mas sem [[ ]].
export type MencaoSemLink = { origem: Nota; destino: Nota }

function escaparRegex(texto: string) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function regexMencao(titulo: string) {
  return new RegExp(`(^|[^\\p{L}\\p{N}\\[|/])(${escaparRegex(titulo)})(?=$|[^\\p{L}\\p{N}\\]])`, "iu")
}

// Remove trechos onde uma menção não deve virar link (código e links existentes).
function textoLivre(conteudo: string) {
  return conteudo
    .replace(/```[\s\S]*?```/g, (trecho) => " ".repeat(trecho.length))
    .replace(/`[^`\n]*`/g, (trecho) => " ".repeat(trecho.length))
    .replace(/\[\[[^\]]*\]\]/g, (trecho) => " ".repeat(trecho.length))
    .replace(/\]\([^)]*\)/g, (trecho) => " ".repeat(trecho.length))
}

export function encontrarMencoesSemLink(biblioteca: Biblioteca, apenasOrigemId?: string): MencaoSemLink[] {
  const resultado: MencaoSemLink[] = []
  const origens = apenasOrigemId
    ? biblioteca.notas.filter((nota) => nota.id === apenasOrigemId)
    : biblioteca.notas
  const destinos = biblioteca.notas.filter((nota) => nota.titulo.trim().length >= 3 && nota.titulo !== "Sem título")

  for (const origem of origens) {
    const livre = textoLivre(origem.conteudo)
    const jaLigadas = new Set(
      extrairLinksWiki(origem.conteudo)
        .map((alvo) => resolverLink(alvo, biblioteca, origem.livroId))
        .flatMap((destino) => (destino?.tipo === "nota" ? [destino.nota.id] : []))
    )
    for (const destino of destinos) {
      if (destino.id === origem.id || jaLigadas.has(destino.id)) continue
      if (regexMencao(destino.titulo.trim()).test(livre)) resultado.push({ origem, destino })
    }
  }
  return resultado
}

// Transforma a primeira menção sem link em [[link]].
export function linkarMencao(conteudo: string, titulo: string, alvo: string) {
  const livre = textoLivre(conteudo)
  const encontrado = regexMencao(titulo.trim()).exec(livre)
  if (!encontrado) return conteudo
  const inicio = encontrado.index + encontrado[1].length
  const fim = inicio + encontrado[2].length
  const original = conteudo.slice(inicio, fim)
  // Mantém o texto como estava escrito (ex.: "célula" minúsculo vira [[Célula|célula]]).
  const link = original === alvo ? `[[${alvo}]]` : `[[${alvo}|${original}]]`
  return conteudo.slice(0, inicio) + link + conteudo.slice(fim)
}

// Acrescenta [[alvo]] na seção "## Conexões" da nota (cria a seção se preciso).
export function adicionarConexao(conteudo: string, alvo: string) {
  const linha = `- [[${alvo}]]`
  const titulo = /^## Conexões[ \t]*$/m.exec(conteudo)
  if (!titulo) {
    const base = conteudo.replace(/\s+$/, "")
    return `${base}${base ? "\n\n" : ""}## Conexões\n${linha}`
  }
  const depois = conteudo.slice(titulo.index + titulo[0].length)
  const proximoTitulo = /\n#{1,6} /.exec(depois)
  const fimSecao = titulo.index + titulo[0].length + (proximoTitulo ? proximoTitulo.index : depois.length)
  const antes = conteudo.slice(0, fimSecao).replace(/\s+$/, "")
  return `${antes}\n${linha}${conteudo.slice(fimSecao)}`
}

// Sugestões para o menu "[[": notas e livros cujo nome combina com o que foi digitado.
export type SugestaoLink = {
  chave: string
  rotulo: string
  detalhe: string
  icone: string
  alvo: string
  // true = a nota ainda não existe e será criada ao escolher.
  criar?: boolean
}

export function sugerirLinks(
  biblioteca: Biblioteca,
  consulta: string,
  origem: { notaId: string | null; livroId: string | null }
): SugestaoLink[] {
  const procurado = semAcento(consulta.trim())
  const nomeLivro = (id: string | null) => biblioteca.livros.find((livro) => livro.id === id)?.titulo ?? "Notas soltas"

  const notas = biblioteca.notas
    .filter((nota) => nota.id !== origem.notaId)
    .filter((nota) => {
      const livro = nomeLivro(nota.livroId)
      return semAcento(nota.titulo).includes(procurado) || semAcento(`${livro}/${nota.titulo}`).includes(procurado)
    })
    // Notas do mesmo livro primeiro.
    .sort((a, b) => Number(b.livroId === origem.livroId) - Number(a.livroId === origem.livroId))
    .slice(0, 7)
    .map((nota) => ({
      chave: nota.id,
      rotulo: nota.titulo,
      detalhe: nomeLivro(nota.livroId),
      icone: nota.icone,
      alvo: alvoDaNota(nota, biblioteca, origem.livroId),
    }))

  const livros = biblioteca.livros
    .filter((livro) => semAcento(livro.titulo).includes(procurado))
    .slice(0, 3)
    .map((livro) => ({ chave: `livro-${livro.id}`, rotulo: livro.titulo, detalhe: "Livro", icone: livro.icone, alvo: livro.titulo }))

  const sugestoes: SugestaoLink[] = [...notas, ...livros]
  const titulo = consulta.trim()
  if (titulo && !resolverLink(titulo, biblioteca, origem.livroId)) {
    sugestoes.push({
      chave: "criar",
      rotulo: `Criar nota “${titulo.split("/").pop()}”`,
      detalhe: titulo.includes("/") ? titulo.split("/")[0] : nomeLivro(origem.livroId),
      icone: "arquivo",
      alvo: titulo,
      criar: true,
    })
  }
  return sugestoes
}

// Título e livro de uma nota criada a partir de um [[alvo]] que ainda não existe.
export function dadosNovaNota(alvo: string, { livros }: Biblioteca, livroAtualId: string | null) {
  const barra = alvo.indexOf("/")
  const livro = barra > 0 ? livros.find((item) => normalizar(item.titulo) === normalizar(alvo.slice(0, barra))) : undefined
  return { titulo: livro ? alvo.slice(barra + 1).trim() : alvo.trim(), livroId: livro?.id ?? livroAtualId }
}
