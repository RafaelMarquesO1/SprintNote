"use client"

// Rafael Marques - 23/10/2026
// Bloco de código do editor: cabeçalho com linguagem (detectada sozinha se ficar em branco)
// e botão de copiar; as cores aparecem enquanto se digita (mesmo realce da leitura).

import { useState } from "react"
import CodeBlock from "@tiptap/extension-code-block"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react"
import { CheckIcon, ChevronDownIcon, ChevronRightIcon, CopyIcon } from "lucide-react"

import { DiagramaMermaid } from "@/components/notas/diagrama-mermaid"
import { linguagensSugeridas, nomeLinguagem, realcarCodigo } from "@/lib/realce-codigo"

const entidades: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'", "&#39;": "'" }

// Converte o HTML do highlight.js (<span class="hljs-x">…</span>) em faixas [início, fim, classes]
// sobre o texto puro: o editor pinta essas faixas sem mexer no conteúdo.
export function faixasDoRealce(html: string) {
  const faixas: { de: number; ate: number; classe: string }[] = []
  const pilha: string[] = []
  let posicao = 0
  for (const parte of html.split(/(<span class="[^"]*">|<\/span>)/)) {
    if (!parte) continue
    if (parte.startsWith("</span")) pilha.pop()
    else if (parte.startsWith("<span")) pilha.push(/class="([^"]*)"/.exec(parte)?.[1] ?? "")
    else {
      const texto = parte.replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, (e) => entidades[e] ?? e)
      if (pilha.length > 0 && texto.length > 0) faixas.push({ de: posicao, ate: posicao + texto.length, classe: pilha.join(" ") })
      posicao += texto.length
    }
  }
  return faixas
}

const chaveRealce = new PluginKey("realce-codigo")

function VisaoCodigo({ node, updateAttributes, editor }: NodeViewProps) {
  const [copiado, setCopiado] = useState(false)
  const linguagem = String(node.attrs.language ?? "")
  const codigo = node.textContent
  const realce = realcarCodigo(codigo, linguagem)
  // Rafael Marques - 29/10/2026: bloco "mermaid" mostra o diagrama; o código fica escondido até pedir para editar.
  const ehMermaid = linguagem.toLowerCase() === "mermaid"
  const [verCodigo, setVerCodigo] = useState(() => !codigo.trim())
  const codigoOculto = ehMermaid && !verCodigo
  return (
    <NodeViewWrapper className="relative my-1 rounded-lg bg-muted/60 px-4 pt-8 pb-3" data-codigo>
      {ehMermaid && (
        <div contentEditable={false} className="mb-2 rounded-md bg-background p-2">
          <DiagramaMermaid codigo={codigo} compacto />
        </div>
      )}
      {ehMermaid && (
        <button
          type="button"
          contentEditable={false}
          onMouseDown={(evento) => evento.preventDefault()}
          onClick={() => setVerCodigo((atual) => !atual)}
          className="mb-1 flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs text-muted-foreground select-none hover:bg-foreground/10 hover:text-foreground"
        >
          {verCodigo ? <ChevronDownIcon className="size-3.5" /> : <ChevronRightIcon className="size-3.5" />}
          {verCodigo ? "Esconder código" : "Editar código do diagrama"}
        </button>
      )}
      <div contentEditable={false} className="absolute top-1.5 right-2 left-4 flex items-center justify-between gap-2 font-mono text-xs text-muted-foreground select-none">
        <input
          value={linguagem}
          list="linguagens-codigo"
          disabled={!editor.isEditable}
          onChange={(evento) => updateAttributes({ language: evento.target.value.replace(/\s/g, "") || null })}
          placeholder={realce.detectada && realce.linguagem ? `${nomeLinguagem(realce.linguagem)} (detectada)` : "linguagem"}
          aria-label="Linguagem do código"
          className="w-48 bg-transparent outline-none placeholder:text-muted-foreground/70"
        />
        <datalist id="linguagens-codigo">
          {linguagensSugeridas.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <button
          type="button"
          title="Copiar código"
          aria-label="Copiar código"
          onMouseDown={(evento) => evento.preventDefault()}
          onClick={() => {
            void navigator.clipboard?.writeText(codigo)
            setCopiado(true)
            setTimeout(() => setCopiado(false), 1500)
          }}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-foreground/10 hover:text-foreground"
        >
          {copiado ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />} {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className={`codigo-realce m-0 ${codigoOculto ? "hidden " : ""}font-mono text-[0.85em] leading-6 break-words whitespace-pre-wrap`}>
        <NodeViewContent as={"code" as "div"} spellCheck={false} />
      </pre>
    </NodeViewWrapper>
  )
}

export const CodigoNota = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(VisaoCodigo)
  },

  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      // Tab dentro do código recua duas casas (em vez de sair do editor).
      Tab: ({ editor }) => (editor.isActive("codeBlock") ? editor.commands.insertContent("  ") : false),
    }
  },

  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() ?? []),
      new Plugin({
        key: chaveRealce,
        props: {
          decorations(estado) {
            const decoracoes: Decoration[] = []
            estado.doc.descendants((no, posicao) => {
              if (no.type.name !== "codeBlock") return
              const { html } = realcarCodigo(no.textContent, String(no.attrs.language ?? ""))
              for (const faixa of faixasDoRealce(html)) {
                decoracoes.push(Decoration.inline(posicao + 1 + faixa.de, posicao + 1 + faixa.ate, { class: faixa.classe }))
              }
              return false
            })
            return DecorationSet.create(estado.doc, decoracoes)
          },
        },
      }),
    ]
  },
})
