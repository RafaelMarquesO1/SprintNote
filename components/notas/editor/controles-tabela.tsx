"use client"

// Rafael Marques - 23/10/2026
// Barra de controles da tabela (aparece quando o cursor está numa tabela): adicionar e
// remover linhas e colunas, linha de título e excluir a tabela.

import type { Editor } from "@tiptap/core"
import { BubbleMenu } from "@tiptap/react/menus"
import {
  BetweenHorizontalEndIcon,
  BetweenHorizontalStartIcon,
  BetweenVerticalEndIcon,
  BetweenVerticalStartIcon,
  PanelTopIcon,
  Trash2Icon,
  type LucideIcon,
} from "lucide-react"

type Acao = { rotulo: string; icone: LucideIcon; executar: (editor: Editor) => void; destrutiva?: boolean }

const acoes: (Acao | "separador")[] = [
  { rotulo: "Coluna à esquerda", icone: BetweenVerticalStartIcon, executar: (e) => e.chain().focus().addColumnBefore().run() },
  { rotulo: "Coluna à direita", icone: BetweenVerticalEndIcon, executar: (e) => e.chain().focus().addColumnAfter().run() },
  { rotulo: "Linha acima", icone: BetweenHorizontalStartIcon, executar: (e) => e.chain().focus().addRowBefore().run() },
  { rotulo: "Linha abaixo", icone: BetweenHorizontalEndIcon, executar: (e) => e.chain().focus().addRowAfter().run() },
  "separador",
  { rotulo: "Alternar linha de título", icone: PanelTopIcon, executar: (e) => e.chain().focus().toggleHeaderRow().run() },
  "separador",
  { rotulo: "Excluir coluna", icone: Trash2Icon, executar: (e) => e.chain().focus().deleteColumn().run(), destrutiva: true },
  { rotulo: "Excluir linha", icone: Trash2Icon, executar: (e) => e.chain().focus().deleteRow().run(), destrutiva: true },
  { rotulo: "Excluir tabela", icone: Trash2Icon, executar: (e) => e.chain().focus().deleteTable().run(), destrutiva: true },
]

export function ControlesTabela({ editor }: { editor: Editor }) {
  return (
    <BubbleMenu
      editor={editor}
      pluginKey="controles-tabela"
      options={{ placement: "top-start", offset: 8, shift: { padding: 8 } }}
      shouldShow={({ editor: atual, state }) => atual.isEditable && atual.isActive("table") && state.selection.empty}
    >
      <div role="toolbar" aria-label="Controles da tabela" className="flex items-center gap-0.5 rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10">
        {acoes.map((acao, indice) =>
          acao === "separador" ? (
            <span key={`sep-${indice}`} className="mx-0.5 h-5 w-px bg-border" />
          ) : (
            <button
              key={acao.rotulo}
              type="button"
              title={acao.rotulo}
              aria-label={acao.rotulo}
              onMouseDown={(evento) => evento.preventDefault()}
              onClick={() => acao.executar(editor)}
              className={`flex h-7 items-center gap-1 rounded-md px-1.5 text-xs hover:bg-muted ${acao.destrutiva ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}
            >
              <acao.icone className="size-4" />
              {acao.destrutiva && <span className="max-sm:hidden">{acao.rotulo.replace("Excluir ", "")}</span>}
            </button>
          )
        )}
      </div>
    </BubbleMenu>
  )
}
