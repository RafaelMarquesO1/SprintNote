// Rafael Marques - 23/10/2026
// #tags e @prazos no texto ficam com cara de etiqueta enquanto se digita (como na leitura
// da nota). O texto continua sendo texto comum: só há um destaque visual por cima.

import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"

import { ganchosDo } from "@/components/notas/editor/ganchos"
import { REGEX_TAG } from "@/lib/tags"
import { REGEX_PRAZO, interpretarPrazo } from "@/lib/tarefas-notas"
import { chaveHoje } from "@/lib/datas"

const chave = new PluginKey("etiquetas-nota")

export const Etiquetas = Extension.create({
  name: "etiquetas",

  addProseMirrorPlugins() {
    const editor = this.editor
    return [
      new Plugin({
        key: chave,
        props: {
          decorations(estado) {
            const decoracoes: Decoration[] = []
            const hoje = chaveHoje()
            estado.doc.descendants((no, posicao, pai) => {
              if (!no.isText || !no.text) return
              if (pai?.type.name === "codeBlock" || no.marks.some((marca) => marca.type.name === "code")) return
              // Os regex olham o caractere antes (começo ou espaço): usa o texto do bloco inteiro.
              const texto = no.text
              for (const m of texto.matchAll(new RegExp(REGEX_TAG.source, "gu"))) {
                const inicio = posicao + (m.index ?? 0) + m[1].length
                decoracoes.push(Decoration.inline(inicio, inicio + 1 + m[2].length, { class: "etiqueta-tag", "data-tag": m[2].toLowerCase() }))
              }
              for (const m of texto.matchAll(new RegExp(REGEX_PRAZO.source, "gi"))) {
                const inicio = posicao + (m.index ?? 0) + m[1].length
                const prazo = interpretarPrazo(m[2], hoje)
                const atrasado = prazo !== null && prazo < hoje
                decoracoes.push(
                  Decoration.inline(inicio, inicio + 1 + m[2].length, {
                    class: atrasado ? "etiqueta-prazo etiqueta-prazo-atrasada" : "etiqueta-prazo",
                    ...(prazo ? { title: prazo } : {}),
                  })
                )
              }
            })
            return DecorationSet.create(estado.doc, decoracoes)
          },
          handleClick(_visao, _posicao, evento) {
            const alvo = (evento.target as HTMLElement | null)?.closest?.("[data-tag]")
            const tag = alvo?.getAttribute("data-tag")
            if (!tag) return false
            ganchosDo(editor).navegar?.(`/tags?tag=${encodeURIComponent(tag)}`)
            return true
          },
        },
      }),
    ]
  },
})
