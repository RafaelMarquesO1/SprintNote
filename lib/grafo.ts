// Rafael Marques - 20/10/2026
// Monta o grafo de conexões (estilo Obsidian) a partir dos livros e notas.
//  - nós: livros, notas e "fantasmas" (links para notas que ainda não existem)
//  - arestas "link": [[links]] escritos nas notas
//  - arestas "estrutura": nota → livro e subnota → nota pai

import { extrairLinksWiki, normalizar, resolverLink, type Biblioteca } from "@/lib/links-wiki"
import { tagsDaNota } from "@/lib/tags"

export type TipoNo = "livro" | "nota" | "fantasma" | "tag"

export type NoGrafo = {
  id: string
  tipo: TipoNo
  titulo: string
  // Livro dono (para colorir). Num nó de livro, é o próprio id do livro.
  livroId: string | null
  icone: string
  grau: number
  // Rafael Marques - 29/10/2026: nota com notas dentro (seção).
  secao?: boolean
}

export type ArestaGrafo = {
  origem: string
  destino: string
  tipo: "link" | "estrutura" | "tag"
}

export type OpcoesGrafo = {
  estrutura: boolean
  fantasmas: boolean
  // Mostra cada #tag como um nó ligado às notas que a usam.
  tags?: boolean
  // Livros visíveis ("soltas" = notas fora de livros). undefined = todos.
  livros?: Set<string>
  // Grafo local: só o que está até "profundidade" passos deste nó.
  focoId?: string
  profundidade?: number
}

export const idLivro = (id: string) => `livro:${id}`
export const idNota = (id: string) => `nota:${id}`
export const idFantasma = (alvo: string) => `fantasma:${normalizar(alvo)}`
export const idTag = (tag: string) => `tag:${tag}`

export function montarGrafo(biblioteca: Biblioteca, opcoes: OpcoesGrafo) {
  const nos = new Map<string, NoGrafo>()
  const arestas: ArestaGrafo[] = []
  const chaves = new Set<string>()
  const visivel = (livroId: string | null) => !opcoes.livros || opcoes.livros.has(livroId ?? "soltas")

  function ligar(origem: string, destino: string, tipo: ArestaGrafo["tipo"]) {
    if (origem === destino) return
    const chave = [origem, destino].sort().join("|") + tipo
    if (chaves.has(chave)) return
    chaves.add(chave)
    arestas.push({ origem, destino, tipo })
  }

  for (const livro of biblioteca.livros) {
    if (!visivel(livro.id)) continue
    nos.set(idLivro(livro.id), { id: idLivro(livro.id), tipo: "livro", titulo: livro.titulo, livroId: livro.id, icone: livro.icone, grau: 0 })
  }

  for (const nota of biblioteca.notas) {
    if (!visivel(nota.livroId)) continue
    const secao = biblioteca.notas.some((item) => item.paiId === nota.id)
    nos.set(idNota(nota.id), { id: idNota(nota.id), tipo: "nota", titulo: nota.titulo, livroId: nota.livroId, icone: nota.icone, grau: 0, secao })
  }

  for (const nota of biblioteca.notas) {
    if (!visivel(nota.livroId)) continue
    const origem = idNota(nota.id)

    if (opcoes.estrutura) {
      if (nota.paiId) ligar(origem, idNota(nota.paiId), "estrutura")
      else if (nota.livroId) ligar(origem, idLivro(nota.livroId), "estrutura")
    }

    if (opcoes.tags) {
      for (const tag of tagsDaNota(nota)) {
        const id = idTag(tag)
        if (!nos.has(id)) nos.set(id, { id, tipo: "tag", titulo: `#${tag}`, livroId: null, icone: "marcador", grau: 0 })
        ligar(origem, id, "tag")
      }
    }

    for (const alvo of extrairLinksWiki(nota.conteudo)) {
      const destino = resolverLink(alvo, biblioteca, nota.livroId)
      if (destino?.tipo === "nota") ligar(origem, idNota(destino.nota.id), "link")
      else if (destino?.tipo === "livro") ligar(origem, idLivro(destino.livro.id), "link")
      else if (opcoes.fantasmas) {
        const id = idFantasma(alvo)
        if (!nos.has(id)) nos.set(id, { id, tipo: "fantasma", titulo: alvo, livroId: nota.livroId, icone: "arquivo", grau: 0 })
        ligar(origem, id, "link")
      }
    }
  }

  let arestasVisiveis = arestas.filter((aresta) => nos.has(aresta.origem) && nos.has(aresta.destino))

  // Grafo local: busca em largura a partir do nó em foco.
  if (opcoes.focoId && nos.has(opcoes.focoId)) {
    const alcancados = new Set([opcoes.focoId])
    let fronteira = [opcoes.focoId]
    for (let passo = 0; passo < (opcoes.profundidade ?? 1); passo++) {
      const proxima: string[] = []
      for (const aresta of arestasVisiveis) {
        for (const [de, para] of [[aresta.origem, aresta.destino], [aresta.destino, aresta.origem]]) {
          if (fronteira.includes(de) && !alcancados.has(para)) {
            alcancados.add(para)
            proxima.push(para)
          }
        }
      }
      fronteira = proxima
    }
    for (const id of [...nos.keys()]) if (!alcancados.has(id)) nos.delete(id)
    arestasVisiveis = arestasVisiveis.filter((aresta) => nos.has(aresta.origem) && nos.has(aresta.destino))
  }

  for (const aresta of arestasVisiveis) {
    nos.get(aresta.origem)!.grau++
    nos.get(aresta.destino)!.grau++
  }

  return { nos: [...nos.values()], arestas: arestasVisiveis }
}

// Notas sem nenhum [[link]] entrando ou saindo.
export function encontrarOrfas(biblioteca: Biblioteca) {
  const { nos } = montarGrafo(biblioteca, { estrutura: false, fantasmas: false })
  return biblioteca.notas.filter((nota) => (nos.find((no) => no.id === idNota(nota.id))?.grau ?? 0) === 0)
}

// Links para notas que ainda não existem, com as notas que os citam.
export function encontrarLinksQuebrados(biblioteca: Biblioteca) {
  const quebrados = new Map<string, { alvo: string; origens: { id: string; titulo: string; livroId: string | null }[] }>()
  for (const nota of biblioteca.notas) {
    for (const alvo of extrairLinksWiki(nota.conteudo)) {
      if (resolverLink(alvo, biblioteca, nota.livroId)) continue
      const chave = normalizar(alvo)
      const item = quebrados.get(chave) ?? { alvo, origens: [] }
      item.origens.push({ id: nota.id, titulo: nota.titulo, livroId: nota.livroId })
      quebrados.set(chave, item)
    }
  }
  return [...quebrados.values()]
}
