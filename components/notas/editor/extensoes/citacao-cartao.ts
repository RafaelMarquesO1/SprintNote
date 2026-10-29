// Rafael Marques - 29/10/2026
// Citação de cartão do Kanban dentro da nota: um link para /kanban?quadro=…&cartao=12 que aparece
// como etiqueta "#12 Título". Aqui ficam a busca dos cartões (para o "[[") e o clique que abre o cartão.

import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"

import { ganchosDo } from "@/components/notas/editor/ganchos"
import { localDoCartao, numeroDoCartao, useKanban } from "@/lib/estado/kanban"

export const PREFIXO_CITACAO_CARTAO = "/kanban?"

export const ehCitacaoCartao = (href: string | null | undefined) => Boolean(href?.startsWith(PREFIXO_CITACAO_CARTAO) && href.includes("cartao="))

export type CartaoCitavel = { id: string; numero: number; titulo: string; href: string; local: string }

// Cartões que combinam com o que foi digitado depois de "[[" (título ou número: "12", "#12").
export function buscarCartoesCitaveis(consulta: string, limite = 5): CartaoCitavel[] {
  const estado = useKanban.getState()
  const procurada = consulta.trim().toLowerCase().replace(/^#/, "")
  const resultado: CartaoCitavel[] = []
  const ordenados = [...estado.cartoes].filter((cartao) => !cartao.arquivado).sort((a, b) => b.criadoEm - a.criadoEm)
  for (const cartao of ordenados) {
    const numero = numeroDoCartao(estado, cartao.id)
    const quadroId = estado.colunas.find((coluna) => coluna.id === cartao.colunaId)?.quadroId
    if (!numero || !quadroId) continue
    const combina = !procurada || cartao.titulo.toLowerCase().includes(procurada) || String(numero) === procurada
    if (!combina) continue
    resultado.push({
      id: cartao.id,
      numero,
      titulo: cartao.titulo,
      href: `/kanban?quadro=${encodeURIComponent(quadroId)}&cartao=${numero}`,
      local: localDoCartao(cartao, estado.colunas, estado.quadros),
    })
    if (resultado.length >= limite) break
  }
  return resultado
}

// Clique numa citação de cartão abre o cartão no Kanban (o editor não abre links sozinho).
export const CitacaoCartao = Extension.create({
  name: "citacaoCartao",
  addProseMirrorPlugins() {
    const editor = this.editor
    return [
      new Plugin({
        key: new PluginKey("citacao-cartao"),
        props: {
          handleClick(_vista, _posicao, evento) {
            const link = (evento.target as HTMLElement | null)?.closest?.("a")
            const href = link?.getAttribute("href")
            if (!ehCitacaoCartao(href)) return false
            evento.preventDefault()
            const navegar = ganchosDo(editor).navegar
            if (navegar) navegar(href!)
            else window.location.assign(href!)
            return true
          },
        },
      }),
    ]
  },
})

// Rafael Marques - 29/10/2026: caminho inverso — notas que citam um cartão. Uma nota que tem notas
// dentro é uma seção: a citação nela vale para a seção inteira; nas outras, só para aquela nota.
export type CitacaoDoCartao = {
  notaId: string
  titulo: string
  icone: string
  ehSecao: boolean
  // Seção onde a nota está (null = nota fora de seção).
  secao: { id: string; titulo: string } | null
}

export function notasQueCitamCartao(
  notas: { id: string; titulo: string; icone: string; conteudo: string; paiId: string | null }[],
  quadroId: string,
  numero: number
): CitacaoDoCartao[] {
  const escapar = (texto: string) => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const procura = new RegExp(`/kanban\\?quadro=${escapar(encodeURIComponent(quadroId))}&cartao=${numero}(?!\\d)`)
  const comFilhas = new Set(notas.map((nota) => nota.paiId).filter((id): id is string => Boolean(id)))
  return notas
    .filter((nota) => procura.test(nota.conteudo))
    .map((nota) => {
      const pai = nota.paiId ? notas.find((item) => item.id === nota.paiId) : undefined
      return {
        notaId: nota.id,
        titulo: nota.titulo,
        icone: nota.icone,
        ehSecao: comFilhas.has(nota.id),
        secao: pai ? { id: pai.id, titulo: pai.titulo } : null,
      }
    })
    .sort((a, b) => Number(b.ehSecao) - Number(a.ehSecao) || a.titulo.localeCompare(b.titulo, "pt-BR"))
}
