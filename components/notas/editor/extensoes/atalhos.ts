// Rafael Marques - 23/10/2026
// Atalhos de teclado do editor que o TipTap não traz prontos, no jeito do Notion:
//  - Alt+Shift+↑/↓ move o bloco (ou o item da lista) para cima/baixo;
//  - Backspace no começo de um título (ou de um código vazio) vira texto comum;
//  - Ctrl+K edita o link; Ctrl+Shift+X risca.

import { Extension, type Editor } from "@tiptap/core"
import { TextSelection } from "@tiptap/pm/state"

import { ganchosDo } from "@/components/notas/editor/ganchos"

const TIPOS_DE_ITEM = ["listItem", "taskItem"]

// Move o nó que começa em "inicio" uma posição entre os irmãos. Devolve a nova posição (ou null).
export function moverNo(editor: Editor, inicio: number, delta: -1 | 1) {
  const { state, view } = editor
  const $inicio = state.doc.resolve(inicio)
  const pai = $inicio.parent
  const indice = $inicio.index()
  const alvo = indice + delta
  if (alvo < 0 || alvo >= pai.childCount) return null
  const no = pai.child(indice)
  const vizinho = pai.child(alvo)
  const tr = state.tr
  let novoInicio: number
  if (delta < 0) {
    novoInicio = inicio - vizinho.nodeSize
    tr.delete(inicio, inicio + no.nodeSize).insert(novoInicio, no)
  } else {
    novoInicio = inicio + vizinho.nodeSize
    tr.insert(inicio + no.nodeSize + vizinho.nodeSize, no).delete(inicio, inicio + no.nodeSize)
  }
  tr.setSelection(TextSelection.near(tr.doc.resolve(novoInicio + 1), 1))
  view.dispatch(tr.scrollIntoView())
  return novoInicio
}

// O bloco "movível" onde está o cursor: o item de lista mais interno ou o bloco de cima.
export function inicioDoBlocoDoCursor(editor: Editor) {
  const { $from } = editor.state.selection
  for (let profundidade = $from.depth; profundidade >= 1; profundidade--) {
    if (TIPOS_DE_ITEM.includes($from.node(profundidade).type.name)) return $from.before(profundidade)
  }
  return $from.depth >= 1 ? $from.before(1) : null
}

export const Atalhos = Extension.create({
  name: "atalhosNotas",

  addKeyboardShortcuts() {
    const mover = (delta: -1 | 1) => () => {
      const inicio = inicioDoBlocoDoCursor(this.editor)
      return inicio === null ? false : moverNo(this.editor, inicio, delta) !== null
    }
    return {
      "Alt-Shift-ArrowUp": mover(-1),
      "Alt-Shift-ArrowDown": mover(1),
      "Mod-Shift-x": () => this.editor.commands.toggleStrike(),
      "Mod-k": () => {
        const { selection } = this.editor.state
        if (selection.empty && !this.editor.isActive("link")) return false
        ganchosDo(this.editor).abrirLink?.()
        return true
      },
      Backspace: () => {
        const { selection } = this.editor.state
        if (!selection.empty || selection.$from.parentOffset !== 0) return false
        const pai = selection.$from.parent
        if (pai.type.name === "heading" || (pai.type.name === "codeBlock" && pai.content.size === 0)) return this.editor.commands.setParagraph()
        return false
      },
    }
  },
})
