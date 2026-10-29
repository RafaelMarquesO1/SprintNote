// Rafael Marques - 21/10/2026
// Tags no texto das notas: #biologia, #prova, #projeto/fase-1.
// Só contam quando começam a linha ou vêm depois de um espaço
// (assim "site.com/#ancora" e títulos "# Título" não viram tag).

import type { Nota } from "@/lib/tipos"

export const REGEX_TAG = /(^|\s)#([\p{L}\p{N}_\-/]*[\p{L}_][\p{L}\p{N}_\-/]*)/gu

// Texto sem blocos de código e sem links, onde tags não contam.
function semCodigo(conteudo: string) {
  return conteudo
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`\n]*`/g, " ")
    .replace(/\[\[[^\]]*\]\]/g, " ")
    .replace(/\]\([^)]*\)/g, " ")
}

export function normalizarTag(tag: string) {
  return tag.toLowerCase().replace(/\/+$/, "")
}

export function extrairTags(conteudo: string): string[] {
  const tags = new Set<string>()
  for (const linha of semCodigo(conteudo).split("\n")) {
    // "# Título" é título de Markdown, não tag.
    const texto = linha.replace(/^#{1,6} /, "")
    for (const encontrado of texto.matchAll(REGEX_TAG)) tags.add(normalizarTag(encontrado[2]))
  }
  return [...tags]
}

// Tags da nota: as do botão "+" e as #tags escritas no texto.
export function tagsDaNota(nota: Nota): string[] {
  return [...new Set([...(nota.tags ?? []), ...extrairTags(nota.conteudo)])]
}

// Rafael Marques - 29/10/2026 (sugestão do Kaíke: consertar as tags)
// "projeto/fase-1/revisao" → ["projeto", "projeto/fase-1"]
export function tagsPais(tag: string) {
  const partes = tag.split("/").filter(Boolean)
  return partes.slice(0, -1).map((_, indice) => partes.slice(0, indice + 1).join("/"))
}

// Limpa o que a pessoa digitou no "+": sem "#", espaços viram "-" e só ficam letras, números, "_", "-" e "/".
export function limparTagDigitada(tag: string) {
  return normalizarTag(
    tag
      .trim()
      .replace(/^#+/, "")
      .replace(/[^\p{L}\p{N}_\-/\s]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/\/{2,}/g, "/")
      .replace(/-{2,}/g, "-")
      .replace(/^[-/]+|-+$/g, "")
  )
}

// Tira "#tag" do texto da nota (sem mexer em código, [[links]] e endereços).
export function removerTagDoConteudo(conteudo: string, tag: string) {
  const alvo = normalizarTag(tag)
  let dentroDeCodigo = false
  return conteudo
    .split("\n")
    .map((linha) => {
      if (/^\s*(```|~~~)/.test(linha)) {
        dentroDeCodigo = !dentroDeCodigo
        return linha
      }
      if (dentroDeCodigo) return linha
      const partes = linha.split(/(`[^`\n]*`|\[\[[^\]]*\]\]|\]\([^)]*\))/g)
      const nova = partes
        .map((parte, indice) =>
          indice % 2 === 1
            ? parte
            : parte.replace(new RegExp(REGEX_TAG.source, "gu"), (todo, antes: string, nome: string) => (normalizarTag(nome) === alvo ? antes : todo))
        )
        .join("")
      return nova === linha ? linha : nova.replace(/(\S) {2,}(?=\S)/g, "$1 ")
    })
    .join("\n")
}

// Todas as tags da biblioteca com quantas notas usam cada uma.
// "#projeto/fase-1" também conta para "#projeto" (e "#projeto" aparece na lista mesmo sem ser escrita sozinha).
export function contarTags(notas: Nota[]) {
  const contagem = new Map<string, number>()
  for (const nota of notas) {
    const daNota = new Set<string>()
    for (const tag of tagsDaNota(nota)) {
      daNota.add(tag)
      for (const pai of tagsPais(tag)) daNota.add(pai)
    }
    for (const tag of daNota) contagem.set(tag, (contagem.get(tag) ?? 0) + 1)
  }
  return [...contagem.entries()]
    .map(([tag, total]) => ({ tag, total }))
    .sort((a, b) => b.total - a.total || a.tag.localeCompare(b.tag, "pt-BR"))
}

export function notasComTag(notas: Nota[], tag: string) {
  const procurada = normalizarTag(tag)
  // "#projeto" também encontra "#projeto/fase-1".
  return notas.filter((nota) => tagsDaNota(nota).some((item) => item === procurada || item.startsWith(`${procurada}/`)))
}
