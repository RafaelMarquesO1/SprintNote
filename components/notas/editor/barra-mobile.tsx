"use client"

// Rafael Marques - 23/10/2026
// Barra de ferramentas do celular: no toque não há alça de blocos nem Ctrl+B, então uma barra
// fina fica colada acima do teclado enquanto se escreve, com o que mais se usa
// (inserir bloco, título, lista, tarefa, recuar, desfazer).

import { useEffect, useState } from "react"
import type { Editor } from "@tiptap/core"
import { useEditorState } from "@tiptap/react"
import {
  BoldIcon,
  ChevronDownIcon,
  Heading2Icon,
  IndentDecreaseIcon,
  IndentIncreaseIcon,
  ItalicIcon,
  ListChecksIcon,
  ListIcon,
  PlusIcon,
  Redo2Icon,
  Undo2Icon,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

type Botao = { chave: string; rotulo: string; icone: LucideIcon; ativo?: boolean; desabilitado?: boolean; acao: () => void }

export function BarraMobile({ editor }: { editor: Editor }) {
  // Quanto o teclado do celular cobre da tela (a barra sobe junto).
  const [coberto, setCoberto] = useState(0)

  const estado = useEditorState({
    editor,
    selector: ({ editor: atual }) => ({
      focado: atual.isFocused,
      negrito: atual.isActive("bold"),
      italico: atual.isActive("italic"),
      titulo: atual.isActive("heading"),
      lista: atual.isActive("bulletList"),
      tarefa: atual.isActive("taskList"),
      emLista: atual.isActive("listItem") || atual.isActive("taskItem"),
      podeDesfazer: atual.can().undo(),
      podeRefazer: atual.can().redo(),
    }),
  })

  useEffect(() => {
    const visao = window.visualViewport
    if (!visao) return
    const atualizar = () => setCoberto(Math.max(0, window.innerHeight - visao.height - visao.offsetTop))
    atualizar()
    visao.addEventListener("resize", atualizar)
    visao.addEventListener("scroll", atualizar)
    return () => {
      visao.removeEventListener("resize", atualizar)
      visao.removeEventListener("scroll", atualizar)
    }
  }, [])

  if (!estado.focado) return null

  // Novo bloco: abre o menu "/" aqui (se a linha está vazia) ou numa linha nova logo abaixo.
  function inserirBloco() {
    const { $from } = editor.state.selection
    if ($from.parent.type.name === "paragraph" && $from.parent.content.size === 0) {
      editor.chain().focus().insertContent("/").run()
      return
    }
    const fim = $from.after(1)
    editor.chain().insertContentAt(fim, { type: "paragraph", content: [{ type: "text", text: "/" }] }).focus(fim + 2).run()
  }

  const botoes: Botao[] = [
    { chave: "inserir", rotulo: "Inserir bloco", icone: PlusIcon, acao: inserirBloco },
    { chave: "titulo", rotulo: "Título", icone: Heading2Icon, ativo: estado.titulo, acao: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { chave: "negrito", rotulo: "Negrito", icone: BoldIcon, ativo: estado.negrito, acao: () => editor.chain().focus().toggleBold().run() },
    { chave: "italico", rotulo: "Itálico", icone: ItalicIcon, ativo: estado.italico, acao: () => editor.chain().focus().toggleItalic().run() },
    { chave: "lista", rotulo: "Lista", icone: ListIcon, ativo: estado.lista, acao: () => editor.chain().focus().toggleBulletList().run() },
    { chave: "tarefa", rotulo: "Lista de tarefas", icone: ListChecksIcon, ativo: estado.tarefa, acao: () => editor.chain().focus().toggleTaskList().run() },
    {
      chave: "recuar",
      rotulo: "Recuar item",
      icone: IndentIncreaseIcon,
      desabilitado: !estado.emLista,
      acao: () => editor.chain().focus().sinkListItem(editor.isActive("taskItem") ? "taskItem" : "listItem").run(),
    },
    {
      chave: "sair",
      rotulo: "Tirar o recuo",
      icone: IndentDecreaseIcon,
      desabilitado: !estado.emLista,
      acao: () => editor.chain().focus().liftListItem(editor.isActive("taskItem") ? "taskItem" : "listItem").run(),
    },
    { chave: "desfazer", rotulo: "Desfazer", icone: Undo2Icon, desabilitado: !estado.podeDesfazer, acao: () => editor.chain().focus().undo().run() },
    { chave: "refazer", rotulo: "Refazer", icone: Redo2Icon, desabilitado: !estado.podeRefazer, acao: () => editor.chain().focus().redo().run() },
    { chave: "fechar", rotulo: "Fechar o teclado", icone: ChevronDownIcon, acao: () => editor.commands.blur() },
  ]

  return (
    <div
      role="toolbar"
      aria-label="Ferramentas de escrita"
      className="fixed right-0 left-0 z-40 flex items-center gap-0.5 overflow-x-auto border-t bg-background/95 px-2 py-1 backdrop-blur md:hidden"
      style={{ bottom: coberto }}
    >
      {botoes.map((botao) => (
        <button
          key={botao.chave}
          type="button"
          title={botao.rotulo}
          aria-label={botao.rotulo}
          aria-pressed={botao.ativo}
          disabled={botao.desabilitado}
          // Não tira o foco do texto (senão o teclado fecha a cada toque).
          onPointerDown={(evento) => evento.preventDefault()}
          onMouseDown={(evento) => evento.preventDefault()}
          onClick={botao.acao}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground disabled:opacity-35",
            botao.ativo && "bg-muted text-foreground"
          )}
        >
          <botao.icone className="size-5" />
        </button>
      ))}
    </div>
  )
}
