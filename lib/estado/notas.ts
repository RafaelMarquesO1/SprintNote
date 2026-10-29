// Rafael Marques - 20/10/2026
// Estado da biblioteca: livros e notas (Zustand + localStorage do navegador).

import { create } from "zustand"
import { persist } from "zustand/middleware"

import { gerarId } from "@/lib/gerar-id"
import { alvoDaNota, reescreverLinks, resolverLink } from "@/lib/links-wiki"
import { limparTagDigitada, removerTagDoConteudo } from "@/lib/tags"
import type { AparenciaNota, Livro, Nota } from "@/lib/tipos"

type DadosNota = {
  titulo?: string
  livroId?: string | null
  paiId?: string | null
  conteudo?: string
  icone?: string
  // Rafael Marques - 23/10/2026: "quadro" cria um quadro interativo.
  tipo?: "quadro"
}

type EstadoNotas = {
  livros: Livro[]
  notas: Nota[]

  criarLivro: (dados?: { titulo?: string; descricao?: string }) => Livro
  atualizarLivro: (id: string, mudancas: Partial<Pick<Livro, "descricao" | "icone" | "cor" | "capa" | "fixado" | "vincularTarefas">>) => void
  renomearLivro: (id: string, titulo: string) => void
  // manterNotas = true: as notas viram notas soltas; false: são excluídas junto.
  excluirLivro: (id: string, manterNotas: boolean) => string[]

  criarNota: (dados?: DadosNota) => Nota
  atualizarNota: (id: string, mudancas: Partial<Pick<Nota, "conteudo" | "icone">>) => void
  atualizarAparencia: (id: string, mudancas: Partial<AparenciaNota>) => void
  renomearNota: (id: string, titulo: string) => void
  adicionarTag: (id: string, tag: string) => void
  removerTag: (id: string, tag: string) => void
  removerTagDoTexto: (id: string, tag: string) => void
  moverNota: (id: string, livroId: string | null, paiId?: string | null) => void
  excluirNota: (id: string) => string[]
}

export function coletarDescendentes(notas: Nota[], id: string): string[] {
  const filhas = notas.filter((nota) => nota.paiId === id)
  return filhas.flatMap((filha) => [filha.id, ...coletarDescendentes(notas, filha.id)])
}

export const useNotas = create<EstadoNotas>()(
  persist(
    (set, get) => ({
      livros: [],
      notas: [],

      criarLivro: (dados = {}) => {
        const momento = Date.now()
        const livro: Livro = {
          id: gerarId(),
          titulo: dados.titulo?.trim() || "Novo livro",
          descricao: dados.descricao ?? "",
          icone: "livro",
          criadoEm: momento,
          atualizadoEm: momento,
        }
        set({ livros: [...get().livros, livro] })
        return livro
      },

      atualizarLivro: (id, mudancas) =>
        set({
          livros: get().livros.map((livro) =>
            // Mudar só a aparência (cor, capa, fixar) não conta como edição.
            livro.id === id
              ? { ...livro, ...mudancas, atualizadoEm: "descricao" in mudancas || "icone" in mudancas ? Date.now() : livro.atualizadoEm }
              : livro
          ),
        }),

      // Renomear o livro atualiza [[Livro]] e [[Livro/Nota]] em todas as notas.
      // Só reescreve links que apontam de fato para este livro (ou suas notas),
      // então dá para renomear letra por letra sem bagunçar outros links.
      renomearLivro: (id, titulo) => {
        const antes = { notas: get().notas, livros: get().livros }
        const alvo = antes.livros.find((livro) => livro.id === id)
        const novo = titulo.trim()
        if (!alvo || !novo || alvo.titulo === novo) return
        set({
          livros: antes.livros.map((livro) =>
            livro.id === id ? { ...livro, titulo: novo, atualizadoEm: Date.now() } : livro
          ),
          notas: antes.notas.map((nota) => {
            const conteudo = reescreverLinks(nota.conteudo, (link) => {
              const destino = resolverLink(link, antes, nota.livroId)
              if (destino?.tipo === "livro" && destino.livro.id === id) return novo
              if (destino?.tipo === "nota" && destino.nota.livroId === id && link.includes("/")) {
                return `${novo}/${link.slice(link.indexOf("/") + 1)}`
              }
              return null
            })
            return conteudo === nota.conteudo ? nota : { ...nota, conteudo }
          }),
        })
      },

      excluirLivro: (id, manterNotas) => {
        const doLivro = get().notas.filter((nota) => nota.livroId === id).map((nota) => nota.id)
        set({
          livros: get().livros.filter((livro) => livro.id !== id),
          notas: manterNotas
            ? get().notas.map((nota) => (nota.livroId === id ? { ...nota, livroId: null } : nota))
            : get().notas.filter((nota) => nota.livroId !== id),
        })
        return manterNotas ? [] : doLivro
      },

      criarNota: (dados = {}) => {
        const momento = Date.now()
        const pai = dados.paiId ? get().notas.find((nota) => nota.id === dados.paiId) : undefined
        const nota: Nota = {
          id: gerarId(),
          titulo: dados.titulo?.trim() || "Sem título",
          conteudo: dados.conteudo ?? "",
          // Subnotas ficam sempre no mesmo livro da nota pai.
          livroId: pai ? pai.livroId : (dados.livroId ?? null),
          paiId: pai ? pai.id : null,
          icone: dados.icone ?? (dados.tipo === "quadro" ? "quadro" : "arquivo"),
          ...(dados.tipo ? { tipo: dados.tipo } : {}),
          criadoEm: momento,
          atualizadoEm: momento,
        }
        set({ notas: [...get().notas, nota] })
        return nota
      },

      atualizarAparencia: (id, mudancas) =>
        set({
          notas: get().notas.map((nota) =>
            nota.id === id ? { ...nota, aparencia: { ...nota.aparencia, ...mudancas } } : nota
          ),
        }),


      atualizarNota: (id, mudancas) =>
        set({
          notas: get().notas.map((nota) =>
            nota.id === id ? { ...nota, ...mudancas, atualizadoEm: Date.now() } : nota
          ),
        }),

      // Renomear atualiza os [[links]] que apontam para esta nota em todas as
      // outras. Funciona a cada letra digitada: só mexe nos links que hoje
      // levam a esta nota (nunca nos de outra nota com nome parecido).
      renomearNota: (id, titulo) => {
        const novo = titulo.trim()
        const antes = { notas: get().notas, livros: get().livros }
        const alvo = antes.notas.find((nota) => nota.id === id)
        if (!alvo || !novo || alvo.titulo === novo) return
        const comNovoTitulo = antes.notas.map((nota) =>
          nota.id === id ? { ...nota, titulo: novo, atualizadoEm: Date.now() } : nota
        )
        const depois = { notas: comNovoTitulo, livros: antes.livros }
        const renomeada = comNovoTitulo.find((nota) => nota.id === id)!
        set({
          notas: comNovoTitulo.map((nota) => {
            const conteudo = reescreverLinks(nota.conteudo, (link) => {
              const destino = resolverLink(link, antes, nota.livroId)
              if (destino?.tipo !== "nota" || destino.nota.id !== id) return null
              return alvoDaNota(renomeada, depois, nota.livroId)
            })
            return conteudo === nota.conteudo ? nota : { ...nota, conteudo }
          }),
        })
      },

      adicionarTag: (id, tag) => {
        // Rafael Marques - 29/10/2026: tag digitada é limpa (sem símbolos) para casar com as #tags do texto.
        const limpa = limparTagDigitada(tag)
        if (!limpa) return
        set({
          notas: get().notas.map((nota) =>
            nota.id === id && !(nota.tags ?? []).includes(limpa)
              ? { ...nota, tags: [...(nota.tags ?? []), limpa], atualizadoEm: Date.now() }
              : nota
          ),
        })
      },

      removerTag: (id, tag) =>
        set({
          notas: get().notas.map((nota) =>
            nota.id === id ? { ...nota, tags: (nota.tags ?? []).filter((item) => item !== tag), atualizadoEm: Date.now() } : nota
          ),
        }),

      // Rafael Marques - 29/10/2026: tira a #tag escrita no texto (o "x" da etiqueta pontilhada).
      removerTagDoTexto: (id, tag) =>
        set({
          notas: get().notas.map((nota) => {
            if (nota.id !== id) return nota
            const conteudo = removerTagDoConteudo(nota.conteudo, tag)
            return conteudo === nota.conteudo ? nota : { ...nota, conteudo, atualizadoEm: Date.now() }
          }),
        }),

      // Move a nota (com as subnotas) para outro livro ou para dentro de outra nota.
      moverNota: (id, livroId, paiId = null) => {
        const descendentes = coletarDescendentes(get().notas, id)
        if (paiId && (paiId === id || descendentes.includes(paiId))) return
        set({
          notas: get().notas.map((nota) => {
            if (nota.id === id) return { ...nota, livroId, paiId, atualizadoEm: Date.now() }
            if (descendentes.includes(nota.id)) return { ...nota, livroId }
            return nota
          }),
        })
      },

      // Exclui a nota e todas as subnotas. Retorna os ids removidos.
      excluirNota: (id) => {
        const removidas = [id, ...coletarDescendentes(get().notas, id)]
        set({ notas: get().notas.filter((nota) => !removidas.includes(nota.id)) })
        return removidas
      },
    }),
    {
      name: "sprintnote-notas",
      version: 3,
      // Versões antigas tinham notas de exemplo e não tinham livros:
      // a biblioteca começa zerada para o usuário montar a dele.
      migrate: () => ({ livros: [], notas: [] }) as unknown as EstadoNotas,
    }
  )
)
