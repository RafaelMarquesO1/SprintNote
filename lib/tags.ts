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

// Todas as tags da biblioteca com quantas notas usam cada uma.
export function contarTags(notas: Nota[]) {
  const contagem = new Map<string, number>()
  for (const nota of notas) {
    for (const tag of tagsDaNota(nota)) contagem.set(tag, (contagem.get(tag) ?? 0) + 1)
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
