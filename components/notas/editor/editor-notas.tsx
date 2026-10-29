"use client"

// Rafael Marques - 23/10/2026
// Editor de notas no estilo do Notion: o texto aparece formatado enquanto se digita (ninguém
// vê "**", "#" ou "- "). Atalhos de Markdown viram formatação na hora ("# " título, "- " lista,
// "[] " tarefa, "**texto**" negrito...), "/" abre os blocos, "[[" liga notas, "#" sugere tags,
// selecionar texto mostra a barra de formatação e a alça à esquerda arrasta/transforma blocos.
// Por baixo a nota continua sendo Markdown (veja lib/editor/markdown-documento.ts).

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Highlight } from "@tiptap/extension-highlight"
import Image from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { Placeholder } from "@tiptap/extension-placeholder"
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table"
import StarterKit from "@tiptap/starter-kit"
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react"

import { AlcaBloco } from "@/components/notas/editor/alca-bloco"
import { BarraMobile } from "@/components/notas/editor/barra-mobile"
import { BarraFlutuante } from "@/components/notas/editor/barra-flutuante"
import { ControlesTabela } from "@/components/notas/editor/controles-tabela"
import { DialogoPrazo } from "@/components/notas/editor/dialogo-prazo"
import { DialogoImagem } from "@/components/notas/editor/dialogo-imagem"
import { Atalhos } from "@/components/notas/editor/extensoes/atalhos"
import { CitacaoCartao } from "@/components/notas/editor/extensoes/citacao-cartao"
import { CodigoNota } from "@/components/notas/editor/extensoes/codigo"
import { ColarMarkdown } from "@/components/notas/editor/extensoes/colar"
import { Destaque } from "@/components/notas/editor/extensoes/destaque"
import { Etiquetas } from "@/components/notas/editor/extensoes/etiquetas"
import { LinkNota } from "@/components/notas/editor/extensoes/link-nota"
import { SugestaoBarra, SugestaoLinks, SugestaoPrazos, SugestaoTags } from "@/components/notas/editor/extensoes/sugestoes-notas"
import { ExtensaoGanchos, ganchosDo } from "@/components/notas/editor/ganchos"
import { documentoParaMarkdown, markdownParaDocumento, type NoDoc } from "@/lib/editor/markdown-documento"
import { useNotas } from "@/lib/estado/notas"
import type { Nota } from "@/lib/tipos"

function criarExtensoes() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      codeBlock: false,
      underline: false,
      link: { openOnClick: false, autolink: true, linkOnPaste: true, HTMLAttributes: { target: "_blank", rel: "noreferrer" } },
      dropcursor: { color: "var(--foreground)", width: 2 },
    }),
    CodigoNota,
    Highlight.configure({ HTMLAttributes: { class: "marca-texto" } }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    Image.configure({ allowBase64: true }),
    LinkNota,
    Destaque,
    Etiquetas,
    Atalhos,
    ColarMarkdown,
    CitacaoCartao,
    ExtensaoGanchos,
    SugestaoBarra,
    SugestaoLinks,
    SugestaoTags,
    SugestaoPrazos,
    Placeholder.configure({
      showOnlyCurrent: false,
      includeChildren: true,
      placeholder: ({ editor, node, pos, hasAnchor }) => {
        if (node.type.name === "heading") return `Título ${Math.min(3, node.attrs.level as number)}`
        // Nos outros blocos o convite só aparece onde o cursor está — e não dentro de tabelas.
        if (!hasAnchor) return ""
        const $pos = editor.state.doc.resolve(pos)
        for (let profundidade = $pos.depth; profundidade >= 0; profundidade--) {
          if (["tableCell", "tableHeader"].includes($pos.node(profundidade).type.name)) return ""
        }
        return "Digite “/” para blocos, “[[” para ligar notas ou “#” para tags…"
      },
    }),
  ]
}

export function EditorNotas({ nota, pedidoFocoInicio = 0 }: { nota: Nota; pedidoFocoInicio?: number }) {
  const router = useRouter()
  const extensoes = useMemo(() => criarExtensoes(), [])
  const [imagemAberta, setImagemAberta] = useState(false)
  const [prazoAberto, setPrazoAberto] = useState(false)
  // Último Markdown que o próprio editor gravou: se a nota mudar por outro caminho
  // (renomear links, marcar tarefa na lista de tarefas...), o editor recarrega.
  const ultimoMarkdown = useRef(nota.conteudo)
  const pedidoAnterior = useRef(pedidoFocoInicio)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: extensoes,
    content: markdownParaDocumento(nota.conteudo) as JSONContent,
    editorProps: {
      attributes: { class: "editor-notas", "aria-label": "Texto da nota", spellcheck: "true" },
    },
    onUpdate: ({ editor: atual }) => {
      const markdown = documentoParaMarkdown(atual.getJSON() as NoDoc)
      ultimoMarkdown.current = markdown
      const { notas, atualizarNota } = useNotas.getState()
      if (notas.find((item) => item.id === nota.id)?.conteudo !== markdown) atualizarNota(nota.id, { conteudo: markdown })
    },
  })

  // Liga o editor à tela: de qual nota/livro ele é e o que fazer em "Imagem" e ao clicar numa tag.
  useEffect(() => {
    if (!editor) return
    const ganchos = ganchosDo(editor)
    ganchos.notaId = nota.id
    ganchos.livroId = nota.livroId
    ganchos.abrirImagem = () => setImagemAberta(true)
    ganchos.abrirPrazo = () => setPrazoAberto(true)
    ganchos.navegar = (endereco) => router.push(endereco)
  }, [editor, nota.id, nota.livroId, router])

  // A nota mudou por fora: mostra o texto novo sem perder o lugar do cursor.
  useEffect(() => {
    if (!editor) return
    // Compara com o que está guardado AGORA (e não com o texto que a tela mostrava quando
    // este efeito foi agendado): digitando rápido, a tela atrasa e traria o texto velho de volta.
    const guardado = useNotas.getState().notas.find((item) => item.id === nota.id)?.conteudo
    if (guardado === undefined || guardado === ultimoMarkdown.current) return
    const { from } = editor.state.selection
    ultimoMarkdown.current = guardado
    editor.commands.setContent(markdownParaDocumento(guardado) as JSONContent, { emitUpdate: false })
    if (editor.isFocused) editor.commands.setTextSelection(Math.min(from, Math.max(1, editor.state.doc.content.size - 1)))
  }, [editor, nota.id, nota.conteudo])

  // Enter no título (ou seta para baixo) leva o cursor para o começo do texto.
  useEffect(() => {
    if (!editor || pedidoFocoInicio === pedidoAnterior.current) return
    pedidoAnterior.current = pedidoFocoInicio
    editor.commands.focus("start")
  }, [editor, pedidoFocoInicio])

  // Clicar no espaço em branco abaixo do texto continua a nota no fim.
  function continuarNoFim() {
    if (!editor) return
    const ultimo = editor.state.doc.lastChild
    if (ultimo && !(ultimo.type.name === "paragraph" && ultimo.content.size === 0)) {
      editor.chain().insertContentAt(editor.state.doc.content.size, { type: "paragraph" }).run()
    }
    editor.commands.focus("end")
  }

  if (!editor) {
    return (
      <div className="pb-4 md:pl-14" aria-busy="true">
        <div className="h-7 w-2/3 animate-pulse rounded bg-muted/60" />
      </div>
    )
  }

  return (
    <div className="pb-4 md:pl-14">
      <EditorContent editor={editor} />
      <AlcaBloco editor={editor} />
      <BarraFlutuante editor={editor} />
      <ControlesTabela editor={editor} />
      <BarraMobile editor={editor} />
      <button type="button" aria-label="Continuar escrevendo no fim da nota" onClick={continuarNoFim} className="block h-32 w-full cursor-text" />
      <DialogoPrazo aberto={prazoAberto} aoMudarAberto={setPrazoAberto} aoInserir={(token) => editor.chain().focus().insertContent(`${token} `).run()} />
      <DialogoImagem
        aberto={imagemAberta}
        aoMudarAberto={setImagemAberta}
        aoInserir={(src, alt) => editor.chain().focus().setImage({ src, alt: alt || undefined }).run()}
      />
    </div>
  )
}
