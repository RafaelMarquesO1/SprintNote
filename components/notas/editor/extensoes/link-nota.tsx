"use client"

// Rafael Marques - 23/10/2026
// Link entre notas ([[Nota]], [[Livro/Nota|apelido]]) como uma "pílula" dentro do texto,
// como as menções do Notion. No Markdown continua sendo [[alvo|apelido]].

import { InputRule, mergeAttributes, Node } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react"

import { ganchosDo } from "@/components/notas/editor/ganchos"
import { LinkWiki } from "@/components/notas/visualizacao-markdown"

export const rotuloDoLink = (alvo: string, rotulo: string | null | undefined) => rotulo || alvo.split("/").pop() || alvo

function VisaoLinkNota({ node, editor }: NodeViewProps) {
  const alvo = String(node.attrs.alvo ?? "")
  const livroId = ganchosDo(editor).livroId
  return (
    <NodeViewWrapper as="span" className="inline" data-link-nota={alvo}>
      <LinkWiki alvo={alvo} livroId={livroId}>
        {rotuloDoLink(alvo, node.attrs.rotulo as string | null)}
      </LinkWiki>
    </NodeViewWrapper>
  )
}

export const LinkNota = Node.create({
  name: "wikiLink",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return { alvo: { default: "" }, rotulo: { default: null } }
  },

  parseHTML() {
    return [{ tag: "span[data-link-nota]", getAttrs: (elemento) => ({ alvo: (elemento as HTMLElement).getAttribute("data-link-nota") ?? "" }) }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return ["span", mergeAttributes({ "data-link-nota": node.attrs.alvo, class: "link-wiki" }, HTMLAttributes), rotuloDoLink(node.attrs.alvo, node.attrs.rotulo)]
  },

  renderText({ node }) {
    return node.attrs.rotulo ? `[[${node.attrs.alvo}|${node.attrs.rotulo}]]` : `[[${node.attrs.alvo}]]`
  },

  addNodeView() {
    return ReactNodeViewRenderer(VisaoLinkNota, { as: "span" })
  },

  // Digitar [[Nota]] (ou [[Nota|apelido]]) à mão também vira pílula.
  addInputRules() {
    return [
      new InputRule({
        find: /\[\[([^\[\]|]+)(?:\|([^\[\]]+))?\]\]$/,
        handler: ({ state, range, match }) => {
          state.tr.replaceWith(range.from, range.to, this.type.create({ alvo: match[1].trim(), rotulo: match[2]?.trim() || null }))
        },
      }),
    ]
  },
})
