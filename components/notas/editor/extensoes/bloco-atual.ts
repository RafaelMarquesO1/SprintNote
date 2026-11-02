// Rafael Marques - 02/11/2026
// Marca com a classe "bloco-atual" o bloco do primeiro nível onde está o cursor.
// O fundo "Foco" da nota usa isso para mostrar a pauta só ali (veja globals.css).

import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"

const chave = new PluginKey("bloco-atual")

export const BlocoAtual = Extension.create({
  name: "blocoAtual",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: chave,
        props: {
          decorations(estado) {
            const { $from } = estado.selection
            if ($from.depth < 1) return null
            const inicio = $from.before(1)
            const bloco = estado.doc.child($from.index(0))
            return DecorationSet.create(estado.doc, [Decoration.node(inicio, inicio + bloco.nodeSize, { class: "bloco-atual" })])
          },
        },
      }),
    ]
  },
})
