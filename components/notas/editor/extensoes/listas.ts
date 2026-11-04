// Rafael Marques - 04/11/2026 (v1.5a)
// Listas no jeito do Notion:
//  - Tab recua o item (quando dá) e nunca tira o cursor do editor;
//  - Shift+Tab num item do primeiro nível não faz nada (antes o item saía da lista);
//  - funções usadas pelo menu "/" e pela alça para trabalhar dentro de um item de lista.

import { Extension, type Editor } from "@tiptap/core"

const TIPOS_DE_ITEM = ["listItem", "taskItem"]
export const COMANDOS_DE_LISTA: Record<string, string> = { lista: "bulletList", numerada: "orderedList", tarefas: "taskList" }

// Item de lista mais interno onde está o cursor (ou null fora de listas).
export function itemDoCursor(editor: Editor) {
  const { $from } = editor.state.selection
  for (let profundidade = $from.depth; profundidade >= 1; profundidade--) {
    const no = $from.node(profundidade)
    if (TIPOS_DE_ITEM.includes(no.type.name)) {
      return { profundidade, no, lista: $from.node(profundidade - 1), nivel: nivelDaLista($from, profundidade) }
    }
  }
  return null
}

// 1 = lista do primeiro nível; 2 = lista dentro de um item; e assim por diante.
function nivelDaLista($from: Editor["state"]["selection"]["$from"], profundidadeItem: number) {
  let nivel = 0
  for (let profundidade = profundidadeItem; profundidade >= 1; profundidade--) {
    if (TIPOS_DE_ITEM.includes($from.node(profundidade).type.name)) nivel++
  }
  return nivel
}

// Tira o bloco do cursor de todas as listas (vira um parágrafo comum no lugar).
export function sairDaLista(editor: Editor) {
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const item = itemDoCursor(editor)
    if (!item || !editor.commands.liftListItem(item.no.type.name)) break
  }
}

// Shift+Tab precisa rodar antes do atalho das listas (que tiraria o item da lista).
export const ListasAntes = Extension.create({
  name: "listasAntes",
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      "Shift-Tab": () => {
        const item = itemDoCursor(this.editor)
        return Boolean(item && item.nivel === 1)
      },
    }
  },
})

// Tab que ninguém usou (item que não pode recuar, texto comum): fica no editor.
export const ListasDepois = Extension.create({
  name: "listasDepois",
  priority: 1,
  addKeyboardShortcuts() {
    return {
      Tab: () => true,
      "Shift-Tab": () => true,
    }
  },
})
