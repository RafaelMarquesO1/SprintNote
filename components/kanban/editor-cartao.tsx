"use client"

// Rafael Marques - 29/10/2026
// Editor visual da descrição e dos comentários do cartão: o texto aparece formatado enquanto se
// digita (ninguém vê "**" ou "```"). Uma barra pequena aparece ao clicar (negrito, listas, código…)
// e o bloco de código é o mesmo das notas (linguagem, cores, copiar e minimizar).
// Por baixo continua sendo Markdown, então descrições e comentários antigos abrem normalmente.

import { useEffect, useRef } from "react"
import { Highlight } from "@tiptap/extension-highlight"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { Placeholder } from "@tiptap/extension-placeholder"
import StarterKit from "@tiptap/starter-kit"
import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from "@tiptap/react"
import { BoldIcon, CodeIcon, ItalicIcon, ListChecksIcon, ListIcon, ListOrderedIcon, SquareCodeIcon, StrikethroughIcon } from "lucide-react"

import { CodigoNota } from "@/components/notas/editor/extensoes/codigo"
import { ColarMarkdown } from "@/components/notas/editor/extensoes/colar"
import { documentoParaMarkdown, markdownParaDocumento, type NoDoc } from "@/lib/editor/markdown-documento"
import { cn } from "@/lib/utils"

function criarExtensoes(placeholder: string) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      codeBlock: false,
      underline: false,
      link: { openOnClick: true, autolink: true, linkOnPaste: true, HTMLAttributes: { target: "_blank", rel: "noreferrer" } },
    }),
    CodigoNota,
    Highlight.configure({ HTMLAttributes: { class: "marca-texto" } }),
    TaskList,
    TaskItem.configure({ nested: true }),
    ColarMarkdown,
    Placeholder.configure({ placeholder }),
  ]
}

function BotaoBarra({ ativo, titulo, aoClicar, children }: { ativo?: boolean; titulo: string; aoClicar: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      aria-pressed={ativo}
      onMouseDown={(evento) => evento.preventDefault()}
      onClick={aoClicar}
      className={cn("flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground [&_svg]:size-3.5", ativo && "bg-muted text-foreground")}
    >
      {children}
    </button>
  )
}

function BarraFormatacao({ editor }: { editor: Editor }) {
  const estado = useEditorState({
    editor,
    selector: ({ editor: atual }) => ({
      negrito: atual.isActive("bold"),
      italico: atual.isActive("italic"),
      riscado: atual.isActive("strike"),
      lista: atual.isActive("bulletList"),
      numerada: atual.isActive("orderedList"),
      tarefas: atual.isActive("taskList"),
      codigo: atual.isActive("code"),
      bloco: atual.isActive("codeBlock"),
    }),
  })
  const cadeia = () => editor.chain().focus()

  // Rafael Marques - 29/10/2026: com texto selecionado, só o trecho escolhido (mesmo em várias
  // linhas) vira um único bloco de código; sem seleção, a linha atual vira código. Dentro de um
  // bloco, o botão desfaz o bloco.
  function blocoDeCodigo() {
    const { from, to, empty } = editor.state.selection
    if (empty || editor.isActive("codeBlock")) {
      cadeia().toggleCodeBlock().run()
      return
    }
    const texto = editor.state.doc.textBetween(from, to, "\n", "\n")
    cadeia()
      .insertContentAt({ from, to }, { type: "codeBlock", content: texto ? [{ type: "text", text: texto }] : [] })
      .run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5">
      <BotaoBarra titulo="Negrito (Ctrl+B)" ativo={estado.negrito} aoClicar={() => cadeia().toggleBold().run()}><BoldIcon /></BotaoBarra>
      <BotaoBarra titulo="Itálico (Ctrl+I)" ativo={estado.italico} aoClicar={() => cadeia().toggleItalic().run()}><ItalicIcon /></BotaoBarra>
      <BotaoBarra titulo="Riscado" ativo={estado.riscado} aoClicar={() => cadeia().toggleStrike().run()}><StrikethroughIcon /></BotaoBarra>
      <span className="mx-1 h-4 w-px bg-border" aria-hidden />
      <BotaoBarra titulo="Lista" ativo={estado.lista} aoClicar={() => cadeia().toggleBulletList().run()}><ListIcon /></BotaoBarra>
      <BotaoBarra titulo="Lista numerada" ativo={estado.numerada} aoClicar={() => cadeia().toggleOrderedList().run()}><ListOrderedIcon /></BotaoBarra>
      <BotaoBarra titulo="Lista de tarefas" ativo={estado.tarefas} aoClicar={() => cadeia().toggleTaskList().run()}><ListChecksIcon /></BotaoBarra>
      <span className="mx-1 h-4 w-px bg-border" aria-hidden />
      <BotaoBarra titulo="Código no meio do texto" ativo={estado.codigo} aoClicar={() => cadeia().toggleCode().run()}><CodeIcon /></BotaoBarra>
      <BotaoBarra titulo="Bloco de código" ativo={estado.bloco} aoClicar={blocoDeCodigo}><SquareCodeIcon /></BotaoBarra>
    </div>
  )
}

export function EditorCartao({
  valor,
  aoMudar,
  placeholder,
  rotulo,
  aoEnviar,
  autoFocus = false,
  sempreComBarra = false,
  rodape,
  className,
}: {
  valor: string
  aoMudar: (markdown: string) => void
  placeholder: string
  rotulo: string
  // Ctrl + Enter (comentários).
  aoEnviar?: () => void
  autoFocus?: boolean
  sempreComBarra?: boolean
  // Conteúdo extra na barra (ex.: botão "Comentar").
  rodape?: React.ReactNode
  className?: string
}) {
  const ultimo = useRef(valor)
  const aoEnviarRef = useRef(aoEnviar)
  useEffect(() => {
    aoEnviarRef.current = aoEnviar
  }, [aoEnviar])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: criarExtensoes(placeholder),
    content: markdownParaDocumento(valor) as JSONContent,
    autofocus: autoFocus ? "end" : false,
    editorProps: {
      attributes: { class: "editor-notas editor-cartao", "aria-label": rotulo, spellcheck: "true" },
      handleKeyDown: (_vista, evento) => {
        if (evento.key === "Enter" && (evento.ctrlKey || evento.metaKey) && aoEnviarRef.current) {
          evento.preventDefault()
          aoEnviarRef.current()
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor: atual }) => {
      const markdown = atual.isEmpty ? "" : documentoParaMarkdown(atual.getJSON() as NoDoc)
      ultimo.current = markdown
      aoMudar(markdown)
    },
  })

  // Valor trocado por fora (outra pessoa da equipe, ou campo limpo depois de enviar).
  useEffect(() => {
    if (!editor || valor === ultimo.current) return
    ultimo.current = valor
    editor.commands.setContent(markdownParaDocumento(valor) as JSONContent, { emitUpdate: false })
  }, [editor, valor])

  const focado = useEditorState({ editor, selector: ({ editor: atual }) => atual?.isFocused ?? false })
  const mostrarBarra = sempreComBarra || focado || Boolean(rodape && valor.trim())

  return (
    <div
      className={cn("group/editor overflow-hidden rounded-lg border bg-card transition-colors", focado ? "border-foreground/30" : "hover:border-foreground/20", className)}
      onClick={(evento) => {
        // Clicar no espaço vazio do quadro também coloca o cursor no texto.
        if (evento.target === evento.currentTarget) editor?.commands.focus("end")
      }}
    >
      <EditorContent editor={editor} className="px-3 py-2" />
      {editor && mostrarBarra && (
        <div className="flex items-center gap-2 border-t px-1.5 py-1">
          <BarraFormatacao editor={editor} />
          {rodape && <div className="ml-auto flex items-center gap-2">{rodape}</div>}
        </div>
      )}
    </div>
  )
}
