"use client"

// Rafael Marques - 23/10/2026
// Barra que aparece ao selecionar texto (ou ao parar num link), como no Notion:
// "Transformar em", negrito, itálico, riscado, código, marca-texto, link e link para nota.

import { useEffect, useRef, useState } from "react"
import type { Editor } from "@tiptap/core"
import { BubbleMenu } from "@tiptap/react/menus"
import { useEditorState } from "@tiptap/react"
import {
  BoldIcon,
  CheckIcon,
  ChevronDownIcon,
  CodeIcon,
  ExternalLinkIcon,
  HighlighterIcon,
  ItalicIcon,
  Link2Icon,
  LinkIcon,
  StrikethroughIcon,
  Trash2Icon,
} from "lucide-react"

import { comandoPorId, comandosBarra } from "@/components/notas/editor/comandos-barra"
import { ganchosDo } from "@/components/notas/editor/ganchos"
import { useNotas } from "@/lib/estado/notas"
import { dadosNovaNota, resolverLink } from "@/lib/links-wiki"
import { cn } from "@/lib/utils"

// Blocos para onde o texto selecionado pode ser transformado.
const OPCOES_TRANSFORMAR = ["texto", "h1", "h2", "h3", "lista", "numerada", "tarefas", "citacao", "codigo"] as const

function rotuloDoBloco(editor: Editor) {
  if (editor.isActive("heading", { level: 1 })) return "Título 1"
  if (editor.isActive("heading", { level: 2 })) return "Título 2"
  if (editor.isActive("heading")) return "Título 3"
  if (editor.isActive("taskList")) return "Tarefa"
  if (editor.isActive("bulletList")) return "Lista"
  if (editor.isActive("orderedList")) return "Numerada"
  if (editor.isActive("blockquote")) return "Citação"
  if (editor.isActive("destaque")) return "Destaque"
  if (editor.isActive("codeBlock")) return "Código"
  return "Texto"
}

const comEsquema = (valor: string) => (/^[a-z][a-z0-9+.-]*:/i.test(valor) ? valor : `https://${valor}`)

export function BarraFlutuante({ editor }: { editor: Editor }) {
  const [modo, setModo] = useState<"botoes" | "link" | "bloco">("botoes")
  const [endereco, setEndereco] = useState("")
  const campoRef = useRef<HTMLInputElement>(null)

  const estado = useEditorState({
    editor,
    selector: ({ editor: atual }) => ({
      negrito: atual.isActive("bold"),
      italico: atual.isActive("italic"),
      riscado: atual.isActive("strike"),
      codigo: atual.isActive("code"),
      marca: atual.isActive("highlight"),
      link: atual.isActive("link"),
      href: (atual.getAttributes("link").href as string | undefined) ?? "",
      bloco: rotuloDoBloco(atual),
    }),
  })

  // Ctrl+K (e o botão de link) abrem o campo do endereço já com o link atual.
  useEffect(() => {
    const ganchos = ganchosDo(editor)
    ganchos.abrirLink = () => {
      setEndereco((editor.getAttributes("link").href as string | undefined) ?? "")
      setModo("link")
      setTimeout(() => campoRef.current?.focus(), 30)
    }
    return () => {
      ganchos.abrirLink = null
    }
  }, [editor])

  // Sem seleção (e fora de um link): a barra vai sumir, então volta para os botões.
  useEffect(() => {
    const reiniciar = () => {
      if (editor.state.selection.empty && !editor.isActive("link")) setModo("botoes")
    }
    editor.on("selectionUpdate", reiniciar)
    return () => {
      editor.off("selectionUpdate", reiniciar)
    }
  }, [editor])

  function aplicarLink() {
    const limpo = endereco.trim()
    const cadeia = editor.chain().focus().extendMarkRange("link")
    if (limpo) cadeia.setLink({ href: comEsquema(limpo) }).run()
    else cadeia.unsetLink().run()
    setModo("botoes")
  }

  // Transforma o trecho selecionado em link para nota (cria a nota se ela ainda não existe).
  function virarLinkDeNota() {
    const { from, to } = editor.state.selection
    const texto = editor.state.doc.textBetween(from, to, " ").trim()
    if (!texto) return
    const { notas, livros, criarNota } = useNotas.getState()
    const livroId = ganchosDo(editor).livroId
    if (!resolverLink(texto, { notas, livros }, livroId)) criarNota(dadosNovaNota(texto, { notas, livros }, livroId))
    editor.chain().focus().insertContentAt({ from, to }, { type: "wikiLink", attrs: { alvo: texto, rotulo: null } }).run()
  }

  function transformar(id: string) {
    const comando = comandoPorId(id)
    if (!comando) return
    const cadeia = editor.chain().focus()
    // Títulos e códigos não entram direto em listas/citações: passa por texto comum antes.
    if (!["texto", "h1", "h2", "h3", "codigo"].includes(id)) cadeia.setParagraph()
    ;(comando.aplicar(cadeia, editor) ?? cadeia).run()
    setModo("botoes")
  }

  const botoes = [
    { chave: "negrito", rotulo: "Negrito (Ctrl+B)", icone: BoldIcon, ativo: estado.negrito, acao: () => editor.chain().focus().toggleBold().run() },
    { chave: "italico", rotulo: "Itálico (Ctrl+I)", icone: ItalicIcon, ativo: estado.italico, acao: () => editor.chain().focus().toggleItalic().run() },
    { chave: "riscado", rotulo: "Riscado (Ctrl+Shift+X)", icone: StrikethroughIcon, ativo: estado.riscado, acao: () => editor.chain().focus().toggleStrike().run() },
    { chave: "codigo", rotulo: "Código (Ctrl+E)", icone: CodeIcon, ativo: estado.codigo, acao: () => editor.chain().focus().toggleCode().run() },
    { chave: "marca", rotulo: "Marca-texto (Ctrl+Shift+H)", icone: HighlighterIcon, ativo: estado.marca, acao: () => editor.chain().focus().toggleHighlight().run() },
  ]

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="barra-texto"
      options={{ placement: "top", offset: 8, shift: { padding: 8 } }}
      shouldShow={({ editor: atual, state }) => {
        if (!atual.isEditable || atual.isActive("codeBlock")) return false
        const selecao = state.selection
        // Várias células selecionadas ou imagem selecionada: sem barra de texto.
        if ("$anchorCell" in selecao || ("node" in selecao && !(selecao as { node?: { isText?: boolean } }).node?.isText)) return false
        return !selecao.empty || atual.isActive("link")
      }}
    >
      <div role="toolbar" aria-label="Formatação do texto" className="relative flex items-center gap-0.5 rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10">
        {modo === "link" ? (
          <form
            className="flex items-center gap-1"
            onSubmit={(evento) => {
              evento.preventDefault()
              aplicarLink()
            }}
          >
            <LinkIcon className="ml-1 size-4 shrink-0 text-muted-foreground" />
            <input
              ref={campoRef}
              value={endereco}
              onChange={(evento) => setEndereco(evento.target.value)}
              onKeyDown={(evento) => {
                if (evento.key === "Escape") {
                  evento.preventDefault()
                  setModo("botoes")
                  editor.commands.focus()
                }
              }}
              placeholder="Cole ou digite o endereço do link"
              aria-label="Endereço do link"
              className="h-7 w-56 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <button type="submit" title="Aplicar" aria-label="Aplicar link" className="flex size-7 items-center justify-center rounded-md hover:bg-muted">
              <CheckIcon className="size-4" />
            </button>
            {estado.link && (
              <button
                type="button"
                title="Remover link"
                aria-label="Remover link"
                onMouseDown={(evento) => evento.preventDefault()}
                onClick={() => {
                  editor.chain().focus().extendMarkRange("link").unsetLink().run()
                  setModo("botoes")
                }}
                className="flex size-7 items-center justify-center rounded-md text-destructive hover:bg-muted"
              >
                <Trash2Icon className="size-4" />
              </button>
            )}
          </form>
        ) : (
          <>
            <div className="relative">
              <button
                type="button"
                title="Transformar em"
                aria-label="Transformar em"
                aria-expanded={modo === "bloco"}
                onMouseDown={(evento) => evento.preventDefault()}
                onClick={() => setModo(modo === "bloco" ? "botoes" : "bloco")}
                className="flex h-7 items-center gap-1 rounded-md px-2 text-sm hover:bg-muted"
              >
                {estado.bloco} <ChevronDownIcon className="size-3.5 text-muted-foreground" />
              </button>
              {modo === "bloco" && (
                <div className="absolute top-full left-0 z-10 mt-1 w-48 rounded-lg bg-popover p-1 shadow-lg ring-1 ring-foreground/10">
                  {OPCOES_TRANSFORMAR.map((id) => {
                    const comando = comandosBarra.find((item) => item.id === id)!
                    return (
                      <button
                        key={id}
                        type="button"
                        onMouseDown={(evento) => evento.preventDefault()}
                        onClick={() => transformar(id)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                      >
                        <comando.icone className="size-4 text-muted-foreground" /> {comando.rotulo}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <span className="mx-0.5 h-5 w-px bg-border" />
            {botoes.map((botao) => (
              <button
                key={botao.chave}
                type="button"
                title={botao.rotulo}
                aria-label={botao.rotulo}
                aria-pressed={botao.ativo}
                onMouseDown={(evento) => evento.preventDefault()}
                onClick={botao.acao}
                className={cn("flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground", botao.ativo && "bg-muted text-foreground")}
              >
                <botao.icone className="size-4" />
              </button>
            ))}
            <span className="mx-0.5 h-5 w-px bg-border" />
            <button
              type="button"
              title="Link para site (Ctrl+K)"
              aria-label="Link para site"
              aria-pressed={estado.link}
              onMouseDown={(evento) => evento.preventDefault()}
              onClick={() => ganchosDo(editor).abrirLink?.()}
              className={cn("flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground", estado.link && "bg-muted text-foreground")}
            >
              <LinkIcon className="size-4" />
            </button>
            {!estado.link && (
              <button
                type="button"
                title="Transformar em link para uma nota [[ ]]"
                aria-label="Link para nota"
                onMouseDown={(evento) => evento.preventDefault()}
                onClick={virarLinkDeNota}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Link2Icon className="size-4" />
              </button>
            )}
            {estado.link && estado.href && (
              <a
                href={estado.href}
                target="_blank"
                rel="noreferrer"
                title={`Abrir ${estado.href}`}
                aria-label="Abrir o link em outra aba"
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ExternalLinkIcon className="size-4" />
              </a>
            )}
          </>
        )}
      </div>
    </BubbleMenu>
  )
}
