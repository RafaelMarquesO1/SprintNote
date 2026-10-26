// Rafael Marques - 23/10/2026
// Fábrica dos menus de sugestão do editor ("/", "[[" e "#"): liga o plugin do TipTap à
// lista flutuante e devolve a extensão pronta.

import { Extension, type Editor } from "@tiptap/core"
import { ReactRenderer } from "@tiptap/react"
import { PluginKey } from "@tiptap/pm/state"
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion"

import { ListaSugestoes, type ItemSugestao, type ListaSugestoesRef } from "@/components/notas/editor/lista-sugestoes"

type Opcoes = {
  nome: string
  char: string
  titulo?: string
  allowSpaces?: boolean
  allowedPrefixes?: string[] | null
  startOfLine?: boolean
  // Itens para o que foi digitado depois do gatilho.
  itens: (consulta: string, editor: Editor) => ItemSugestao[]
}

export function criarSugestao({ nome, char, titulo, allowSpaces = false, allowedPrefixes = [" "], startOfLine = false, itens }: Opcoes) {
  const chave = new PluginKey(`sugestao-${nome}`)

  const render: SuggestionOptions<ItemSugestao, ItemSugestao>["render"] = () => {
    let componente: ReactRenderer<ListaSugestoesRef> | null = null
    let desmontar: (() => void) | undefined
    return {
      onStart(props) {
        componente = new ReactRenderer(ListaSugestoes, {
          props: { items: props.items, command: props.command, titulo },
          editor: props.editor,
        })
        componente.element.style.zIndex = "60"
        desmontar = props.mount(componente.element)
      },
      onUpdate(props) {
        componente?.updateProps({ items: props.items, command: props.command, titulo })
      },
      onKeyDown({ event }) {
        return componente?.ref?.aoTeclar(event) ?? false
      },
      onExit() {
        desmontar?.()
        desmontar = undefined
        componente?.destroy()
        componente = null
      },
    }
  }

  return Extension.create({
    name: `sugestao-${nome}`,
    addProseMirrorPlugins() {
      return [
        Suggestion<ItemSugestao, ItemSugestao>({
          editor: this.editor,
          pluginKey: chave,
          char,
          allowSpaces,
          allowedPrefixes,
          startOfLine,
          items: ({ query, editor }) => itens(query, editor),
          command: ({ editor, range, props }) => props.executar(editor, range),
          render,
        }),
      ]
    },
  })
}
