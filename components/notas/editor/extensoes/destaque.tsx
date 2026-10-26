"use client"

// Rafael Marques - 23/10/2026
// Destaque (callout): caixa colorida com ícone que guarda outros blocos (como no Notion).
// No Markdown: "> [!dica] texto". Clicar no ícone troca o tipo.

import { InputRule, mergeAttributes, Node } from "@tiptap/core"
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react"
import { CheckIcon, InfoIcon, LightbulbIcon, OctagonAlertIcon, StickyNoteIcon, TriangleAlertIcon } from "lucide-react"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { variantePorApelido, variantesDestaque, type VarianteDestaque } from "@/lib/editor/markdown-documento"

const icones: Record<VarianteDestaque, React.ElementType> = {
  info: InfoIcon,
  dica: LightbulbIcon,
  aviso: TriangleAlertIcon,
  perigo: OctagonAlertIcon,
  nota: StickyNoteIcon,
}

const nomes: Record<VarianteDestaque, string> = { info: "Informação", dica: "Dica", aviso: "Aviso", perigo: "Perigo", nota: "Nota" }

function VisaoDestaque({ node, updateAttributes, editor }: NodeViewProps) {
  const variante = (variantesDestaque.includes(node.attrs.variante) ? node.attrs.variante : "info") as VarianteDestaque
  const Icone = icones[variante]
  return (
    <NodeViewWrapper className={`destaque destaque-${variante} relative my-1.5 rounded-lg py-3 pr-4 pl-12`} data-destaque={variante}>
      <div contentEditable={false} className="absolute top-3 left-3 select-none">
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={!editor.isEditable}
            title={`${nomes[variante]} — clique para trocar o tipo`}
            aria-label={`Destaque do tipo ${nomes[variante]}. Clique para trocar.`}
            className="destaque-icone flex size-6 items-center justify-center rounded-md hover:bg-foreground/10"
          >
            <Icone className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {variantesDestaque.map((opcao) => {
              const IconeOpcao = icones[opcao]
              return (
                <DropdownMenuItem key={opcao} onClick={() => updateAttributes({ variante: opcao })}>
                  <IconeOpcao /> {nomes[opcao]}
                  {opcao === variante && <CheckIcon className="ml-auto" />}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <NodeViewContent className="destaque-conteudo" />
    </NodeViewWrapper>
  )
}

export const Destaque = Node.create({
  name: "destaque",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return { variante: { default: "info" } }
  },

  parseHTML() {
    return [{ tag: "div[data-destaque]", getAttrs: (elemento) => ({ variante: (elemento as HTMLElement).getAttribute("data-destaque") ?? "info" }) }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-destaque": node.attrs.variante, class: `destaque destaque-${node.attrs.variante}` }, HTMLAttributes), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VisaoDestaque)
  },

  // Digitar "> " cria uma citação; escrever "[!dica] " logo no começo dela a transforma em
  // destaque (igual ao Obsidian: "> [!dica] ...").
  addInputRules() {
    return [
      new InputRule({
        find: /^\[!([\p{L}]+)\]\s$/u,
        handler: ({ state, range, match }) => {
          const $inicio = state.doc.resolve(range.from)
          for (let profundidade = $inicio.depth; profundidade >= 1; profundidade--) {
            if ($inicio.node(profundidade).type.name !== "blockquote") continue
            state.tr
              .delete(range.from, range.to)
              .setNodeMarkup($inicio.before(profundidade), this.type, { variante: variantePorApelido(match[1]) })
            return
          }
          return null
        },
      }),
    ]
  },
})
