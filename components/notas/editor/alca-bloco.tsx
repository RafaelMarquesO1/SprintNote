"use client"

// Rafael Marques - 23/10/2026
// Alça à esquerda de cada bloco (aparece ao passar o mouse), como no Notion:
//  "+" adiciona um bloco abaixo; "⋮⋮" abre o menu (transformar, duplicar, mover, excluir)
//  e também serve para arrastar o bloco para outro lugar.

import { useRef, useState } from "react"
import type { Editor } from "@tiptap/core"
import { TextSelection } from "@tiptap/pm/state"
import type { Node as NoProseMirror } from "@tiptap/pm/model"
import DragHandle from "@tiptap/extension-drag-handle-react"
import { ArrowDownIcon, ArrowUpIcon, CopyIcon, GripVerticalIcon, PlusIcon, RepeatIcon, Trash2Icon } from "lucide-react"

import { comandoPorId, comandosBarra } from "@/components/notas/editor/comandos-barra"
import { moverNo } from "@/components/notas/editor/extensoes/atalhos"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const TRANSFORMAVEIS = ["texto", "h1", "h2", "h3", "lista", "numerada", "tarefas", "citacao", "codigo"]
const TIPOS_DE_TEXTO = ["paragraph", "heading", "bulletList", "orderedList", "taskList", "listItem", "taskItem", "blockquote", "codeBlock"]

type BlocoAtual = { node: NoProseMirror | null; pos: number }

// Põe o cursor dentro do bloco indicado (para os comandos de formatação agirem nele).
function entrarNoBloco(editor: Editor, pos: number) {
  const { state, view } = editor
  view.dispatch(state.tr.setSelection(TextSelection.near(state.doc.resolve(Math.min(pos + 1, state.doc.content.size)), 1)))
}

export function AlcaBloco({ editor }: { editor: Editor }) {
  const atual = useRef<BlocoAtual>({ node: null, pos: -1 })
  const [tipo, setTipo] = useState<string | null>(null)

  const bloco = () => atual.current

  function adicionarAbaixo() {
    const { node, pos } = bloco()
    if (!node) return
    const fim = pos + node.nodeSize
    editor
      .chain()
      .insertContentAt(fim, { type: "paragraph", content: [{ type: "text", text: "/" }] })
      .focus(fim + 2)
      .run()
  }

  function transformar(id: string) {
    const { node, pos } = bloco()
    const comando = comandoPorId(id)
    if (!node || !comando) return
    entrarNoBloco(editor, pos)
    const cadeia = editor.chain().focus()
    if (!["texto", "h1", "h2", "h3", "codigo"].includes(id)) cadeia.setParagraph()
    ;(comando.aplicar(cadeia, editor) ?? cadeia).run()
  }

  function duplicar() {
    const { node, pos } = bloco()
    if (!node) return
    editor.chain().insertContentAt(pos + node.nodeSize, node.toJSON()).run()
  }

  function excluir() {
    const { node, pos } = bloco()
    if (!node) return
    editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run()
  }

  return (
    <DragHandle
      editor={editor}
      nested
      onNodeChange={({ node, pos }) => {
        atual.current = { node, pos }
        setTipo(node?.type.name ?? null)
      }}
    >
      <div className="alca-bloco flex items-center gap-0.5 pr-1 max-md:hidden">
        <button
          type="button"
          title="Adicionar bloco abaixo"
          aria-label="Adicionar bloco abaixo"
          onClick={adicionarAbaixo}
          className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted"
        >
          <PlusIcon className="size-4" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Ações do bloco (arraste para mover)"
            title="Arraste para mover · clique para abrir o menu"
            className="flex size-6 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-muted"
          >
            <GripVerticalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {tipo && TIPOS_DE_TEXTO.includes(tipo) && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <RepeatIcon /> Transformar em
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  {TRANSFORMAVEIS.map((id) => {
                    const comando = comandosBarra.find((item) => item.id === id)!
                    return (
                      <DropdownMenuItem key={id} onClick={() => transformar(id)}>
                        <comando.icone /> {comando.rotulo}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            <DropdownMenuItem onClick={() => moverNo(editor, bloco().pos, -1)}>
              <ArrowUpIcon /> Mover para cima
              <span className="ml-auto text-xs text-muted-foreground">Alt+Shift+↑</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => moverNo(editor, bloco().pos, 1)}>
              <ArrowDownIcon /> Mover para baixo
              <span className="ml-auto text-xs text-muted-foreground">Alt+Shift+↓</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={duplicar}>
              <CopyIcon /> Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={excluir}>
              <Trash2Icon /> Excluir bloco
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </DragHandle>
  )
}
