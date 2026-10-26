// Rafael Marques - 23/10/2026
// Colar e soltar no editor:
//  - texto copiado de outro lugar que já está em Markdown (de uma IA, de um site, de outro app)
//    vira blocos formatados na hora, sem a pessoa ver os símbolos;
//  - imagens (print da tela, arquivo arrastado) entram como imagem da nota.

import { Extension } from "@tiptap/core"
import type { JSONContent } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"

import { prepararImagem } from "@/components/notas/editor/dialogo-imagem"
import { markdownParaDocumento } from "@/lib/editor/markdown-documento"

const SINAIS_DE_MARKDOWN = /^(#{1,6} |[-*+] |\d{1,9}[.)] |> |```|~~~|\|.*\||- \[[ xX]\] |---$)|\*\*[^*\n]+\*\*|\[\[[^\]]+\]\]|\[[^\]\n]+\]\(https?:|==[^=\n]+==|~~[^~\n]+~~|^!\[[^\]]*\]\(/m

// Texto puro que parece Markdown (várias linhas ou com símbolos de formatação).
export function pareceMarkdown(texto: string) {
  if (!texto.trim()) return false
  return SINAIS_DE_MARKDOWN.test(texto)
}

const imagensDe = (arquivos: FileList | null | undefined) => Array.from(arquivos ?? []).filter((arquivo) => arquivo.type.startsWith("image/"))

export const ColarMarkdown = Extension.create({
  name: "colarMarkdown",

  addProseMirrorPlugins() {
    const editor = this.editor

    function inserirImagens(arquivos: File[], posicao?: number) {
      arquivos.forEach((arquivo, indice) => {
        void prepararImagem(arquivo)
          .then((src) => {
            const imagem = { type: "image", attrs: { src, alt: arquivo.name.replace(/\.[^.]+$/, "") || null } }
            if (posicao !== undefined) editor.chain().focus().insertContentAt(posicao + indice, imagem).run()
            else editor.chain().focus().insertContent(imagem).run()
          })
          .catch(() => undefined)
      })
    }

    return [
      new Plugin({
        key: new PluginKey("colar-markdown"),
        props: {
          handlePaste(_visao, evento) {
            const dados = evento.clipboardData
            if (!dados) return false
            const imagens = imagensDe(dados.files)
            if (imagens.length > 0 && !dados.getData("text/html")?.includes("<table")) {
              evento.preventDefault()
              inserirImagens(imagens)
              return true
            }
            if (editor.isActive("codeBlock")) return false
            const texto = dados.getData("text/plain")
            // Se veio HTML formatado (de um site, do Word...), o TipTap já converte sozinho.
            if (dados.getData("text/html") || !pareceMarkdown(texto)) return false
            const documento = markdownParaDocumento(texto)
            evento.preventDefault()
            editor.chain().focus().insertContent((documento.content ?? []) as JSONContent[]).run()
            return true
          },
          handleDrop(visao, evento, _fatia, movido) {
            if (movido) return false
            const imagens = imagensDe(evento.dataTransfer?.files)
            if (imagens.length === 0) return false
            evento.preventDefault()
            const alvo = visao.posAtCoords({ left: evento.clientX, top: evento.clientY })
            inserirImagens(imagens, alvo?.pos)
            return true
          },
        },
      }),
    ]
  },
})
