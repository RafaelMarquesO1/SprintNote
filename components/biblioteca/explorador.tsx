"use client"

// Rafael Marques - 26/10/2026
// Conteúdo da Biblioteca ao lado da árvore (que fica na barra lateral): a "Visão geral" mostra os
// livros em cartões; escolher um livro (ou as notas soltas) mostra o conteúdo dele. A escolha
// fica no endereço (?livro=ID), então a barra lateral e esta tela concordam.

import { useSearchParams } from "next/navigation"

import { PaginaLivro } from "@/components/livros/pagina-livro"
import { selecaoDaUrl } from "@/components/biblioteca/selecao"
import { ListaNotas } from "@/components/notas/lista-notas"
import { Skeleton } from "@/components/ui/skeleton"
import { useHidratado } from "@/hooks/use-hidratado"
import { useNotas } from "@/lib/estado/notas"

export function ExploradorBiblioteca() {
  const hidratado = useHidratado()
  const escolha = selecaoDaUrl(useSearchParams())
  const existe = useNotas((estado) => escolha.tipo !== "livro" || estado.livros.some((livro) => livro.id === escolha.id))

  if (!hidratado) return <Skeleton className="h-96 w-full" />

  // Livro excluído (ou endereço antigo): mostra a visão geral.
  if (escolha.tipo !== "livro" || !existe) return <ListaNotas />
  return <PaginaLivro key={escolha.id} id={escolha.id} />
}
