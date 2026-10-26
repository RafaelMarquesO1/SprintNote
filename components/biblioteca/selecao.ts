// Rafael Marques - 26/10/2026
// A escolha feita na árvore da Biblioteca (visão geral, um livro ou as notas soltas) vive no
// endereço (/notas?livro=ID ou /notas?soltas), assim a barra lateral e o explorador concordam.

import type { SelecaoBiblioteca } from "@/components/biblioteca/arvore"

export function selecaoDaUrl(parametros: { get: (nome: string) => string | null; has: (nome: string) => boolean }): SelecaoBiblioteca {
  const livro = parametros.get("livro")
  if (livro) return { tipo: "livro", id: livro }
  if (parametros.has("soltas")) return { tipo: "soltas" }
  return { tipo: "raiz" }
}

export function enderecoDaSelecao(selecao: SelecaoBiblioteca) {
  if (selecao.tipo === "livro") return `/notas?livro=${encodeURIComponent(selecao.id)}`
  if (selecao.tipo === "soltas") return "/notas?soltas"
  return "/notas"
}
