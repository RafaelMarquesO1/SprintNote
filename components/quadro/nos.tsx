"use client"

// Rafael Marques - 23/10/2026
// Peças do quadro: formas (retângulo, círculo, decisão, nota adesiva, texto), cartões de nota e
// grupos. Duplo clique edita o texto; o círculo nas bordas liga uma peça à outra.

import { memo, useEffect, useRef, type CSSProperties, type ReactNode } from "react"
import { Handle, NodeResizer, NodeToolbar, Position, type Node, type NodeProps } from "@xyflow/react"
import { CopyIcon, ExternalLinkIcon, FileTextIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react"

import { Icone } from "@/components/icone"
import { estiloDaCor, valorDaCor } from "@/components/quadro/cores"
import { useAcoesQuadro } from "@/components/quadro/contexto"
import { useNotas } from "@/lib/estado/notas"
import { coresQuadro, nomesForma, type FormaQuadro, type TipoNoQuadro } from "@/lib/quadro/modelo"
import { cn } from "@/lib/utils"

export type DadosNo = { tipo: TipoNoQuadro; forma: FormaQuadro; texto: string; cor?: string; notaId?: string }
export type NoFlux = Node<DadosNo>

const lados = [
  { id: "cima", posicao: Position.Top },
  { id: "direita", posicao: Position.Right },
  { id: "baixo", posicao: Position.Bottom },
  { id: "esquerda", posicao: Position.Left },
] as const

function Alcas() {
  return (
    <>
      {lados.map((lado) => (
        <Handle
          key={lado.id}
          id={lado.id}
          type="source"
          position={lado.posicao}
          className="!size-3 !border-2 !border-background !bg-foreground/70 opacity-0 transition-opacity group-hover/peca:opacity-100 hover:!bg-foreground [.selected_&]:opacity-100"
        />
      ))}
    </>
  )
}

function SeletorCor({ valor, aoEscolher }: { valor?: string; aoEscolher: (cor: string | undefined) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        title="Sem cor (cinza)"
        aria-label="Sem cor"
        onClick={() => aoEscolher(undefined)}
        className={cn("flex size-5 items-center justify-center rounded-full border bg-muted", !valor && "ring-2 ring-foreground")}
      >
        <XIcon className="size-3 text-muted-foreground" />
      </button>
      {coresQuadro.map((cor) => (
        <button
          key={cor.id}
          type="button"
          title={cor.nome}
          aria-label={cor.nome}
          onClick={() => aoEscolher(cor.id)}
          className={cn("size-5 rounded-full border", valor === cor.id && "ring-2 ring-foreground ring-offset-1 ring-offset-background")}
          style={{ background: cor.valor }}
        />
      ))}
    </div>
  )
}

// Barra que aparece acima da peça selecionada.
function BarraDaPeca({ id, selecionado, cor, forma, comCor = true }: { id: string; selecionado: boolean; cor?: string; forma?: FormaQuadro; comCor?: boolean }) {
  const acoes = useAcoesQuadro()
  if (!acoes.editavel) return null
  return (
    <NodeToolbar isVisible={selecionado} position={Position.Top} offset={10} className="nodrag">
      <div className="flex items-center gap-2 rounded-lg bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-foreground/10">
        {comCor && <SeletorCor valor={cor} aoEscolher={(nova) => acoes.mudarNo(id, { cor: nova })} />}
        {forma && (
          <select
            aria-label="Forma"
            value={forma}
            onChange={(evento) => acoes.mudarNo(id, { forma: evento.target.value as FormaQuadro })}
            className="h-6 rounded-md border bg-background px-1 text-xs"
          >
            {(Object.keys(nomesForma) as FormaQuadro[]).map((item) => (
              <option key={item} value={item}>
                {nomesForma[item]}
              </option>
            ))}
          </select>
        )}
        <button type="button" title="Duplicar (Ctrl+D)" aria-label="Duplicar" onClick={() => acoes.duplicar(id)} className="flex size-6 items-center justify-center rounded hover:bg-muted">
          <CopyIcon className="size-3.5" />
        </button>
        <button type="button" title="Excluir (Delete)" aria-label="Excluir" onClick={() => acoes.excluir([id])} className="flex size-6 items-center justify-center rounded text-destructive hover:bg-destructive/10">
          <Trash2Icon className="size-3.5" />
        </button>
      </div>
    </NodeToolbar>
  )
}

// Texto editável: mostra o texto; duplo clique abre o campo.
function TextoDaPeca({ id, texto, className, style }: { id: string; texto: string; className?: string; style?: CSSProperties }) {
  const acoes = useAcoesQuadro()
  const editando = acoes.editandoId === id
  const campo = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (editando) {
      campo.current?.focus()
      campo.current?.select()
    }
  }, [editando])

  if (editando) {
    return (
      <textarea
        ref={campo}
        defaultValue={texto}
        aria-label="Texto da peça"
        onBlur={(evento) => {
          acoes.mudarNo(id, { texto: evento.target.value })
          acoes.comecarEdicao(null)
        }}
        onKeyDown={(evento) => {
          if (evento.key === "Escape" || (evento.key === "Enter" && !evento.shiftKey)) {
            evento.preventDefault()
            evento.currentTarget.blur()
          }
          evento.stopPropagation()
        }}
        className={cn("nodrag nowheel nopan size-full resize-none bg-transparent text-center outline-none", className)}
        style={style}
      />
    )
  }
  return (
    <div className={cn("w-full text-center break-words whitespace-pre-wrap", !texto && "text-muted-foreground/60", className)} style={style}>
      {texto || (acoes.editavel ? "Duplo clique para escrever" : "")}
    </div>
  )
}

// Rafael Marques - 26/10/2026: botões "+" ao redor da peça selecionada: um clique cria a próxima já ligada.
const posicoesMais = {
  cima: "-top-9 left-1/2 -translate-x-1/2",
  baixo: "-bottom-9 left-1/2 -translate-x-1/2",
  esquerda: "top-1/2 -left-9 -translate-y-1/2",
  direita: "top-1/2 -right-9 -translate-y-1/2",
} as const
const nomesLado = { cima: "acima", baixo: "abaixo", esquerda: "à esquerda", direita: "à direita" } as const

function BotoesMais({ id }: { id: string }) {
  const acoes = useAcoesQuadro()
  if (!acoes.editavel || acoes.editandoId) return null
  return (
    <>
      {(Object.keys(posicoesMais) as (keyof typeof posicoesMais)[]).map((lado) => (
        <button
          key={lado}
          type="button"
          title={`Criar peça ${nomesLado[lado]}`}
          aria-label={`Criar peça ${nomesLado[lado]}`}
          onClick={(evento) => {
            evento.stopPropagation()
            acoes.adicionarLigada(id, lado)
          }}
          className={cn("nodrag nopan absolute z-10 flex size-6 items-center justify-center rounded-full border bg-popover text-foreground shadow-md hover:bg-foreground hover:text-background", posicoesMais[lado])}
        >
          <PlusIcon className="size-3.5" />
        </button>
      ))}
    </>
  )
}

function Quadrado({ id, children, selecionado = false, comMais = true }: { id: string; children: ReactNode; selecionado?: boolean; comMais?: boolean }) {
  const acoes = useAcoesQuadro()
  return (
    <div className="group/peca relative size-full" onDoubleClick={() => acoes.editavel && acoes.comecarEdicao(id)} onKeyDown={(evento) => evento.key === "Enter" && acoes.editavel && !acoes.editandoId && acoes.comecarEdicao(id)}>
      {children}
      {selecionado && comMais && <BotoesMais id={id} />}
    </div>
  )
}

function FormaBase({ id, data, selected }: NodeProps<NoFlux>) {
  const acoes = useAcoesQuadro()
  const { forma, cor, texto } = data
  const estilo = estiloDaCor(cor)
  const borda = valorDaCor(cor) ?? "color-mix(in oklch, var(--foreground) 45%, transparent)"

  let corpo: ReactNode
  if (forma === "losango") {
    corpo = (
      <>
        <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <polygon points="50,1 99,50 50,99 1,50" fill={estilo.background as string} stroke={borda} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="absolute inset-[22%] flex items-center justify-center">
          <TextoDaPeca id={id} texto={texto} />
        </div>
      </>
    )
  } else if (forma === "texto") {
    corpo = (
      <div className={cn("flex size-full items-center justify-center rounded-md px-1 text-lg", selected && "outline-1 outline-dashed outline-foreground/40")}>
        <TextoDaPeca id={id} texto={texto} />
      </div>
    )
  } else {
    const arredondar = forma === "circulo" ? "rounded-full" : forma === "arredondado" ? "rounded-[28px]" : forma === "adesiva" ? "rounded-sm shadow-md" : "rounded-md"
    corpo = (
      <div className={cn("flex size-full items-center justify-center border-2 px-3 py-2", arredondar)} style={forma === "adesiva" ? { ...estilo, background: valorDaCor(cor) ? estilo.background : "color-mix(in oklch, oklch(0.85 0.1 95) 35%, var(--background))" } : estilo}>
        <TextoDaPeca id={id} texto={texto} />
      </div>
    )
  }

  return (
    <Quadrado id={id} selecionado={selected}>
      {acoes.editavel && <NodeResizer isVisible={selected} minWidth={forma === "texto" ? 40 : 60} minHeight={32} lineClassName="!border-foreground/40" handleClassName="!size-2.5 !rounded-sm !border-foreground/60 !bg-background" />}
      <BarraDaPeca id={id} selecionado={selected} cor={cor} forma={forma} comCor={forma !== "texto"} />
      {corpo}
      <Alcas />
    </Quadrado>
  )
}
export const NoForma = memo(FormaBase)

// Texto simples de uma nota para a prévia do cartão.
function previa(conteudo: string) {
  return conteudo
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, alvo, texto) => texto ?? alvo)
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160)
}

function CartaoBase({ id, data, selected }: NodeProps<NoFlux>) {
  const acoes = useAcoesQuadro()
  const nota = useNotas((estado) => (data.notaId ? estado.notas.find((item) => item.id === data.notaId) : undefined))
  const estilo = estiloDaCor(data.cor)
  return (
    <Quadrado id={id} selecionado={selected}>
      {acoes.editavel && <NodeResizer isVisible={selected} minWidth={160} minHeight={90} lineClassName="!border-foreground/40" handleClassName="!size-2.5 !rounded-sm !border-foreground/60 !bg-background" />}
      <BarraDaPeca id={id} selecionado={selected} cor={data.cor} />
      <div className="flex size-full flex-col overflow-hidden rounded-lg border-2 shadow-sm" style={estilo}>
        <div className="flex items-center gap-2 border-b border-foreground/10 px-3 py-2">
          {nota ? <Icone nome={nota.icone} className="size-4 text-muted-foreground" /> : <FileTextIcon className="size-4 text-muted-foreground" />}
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{nota ? nota.titulo : "Nota removida"}</span>
          {nota && (
            <button type="button" title="Abrir a nota" aria-label="Abrir a nota" onClick={() => acoes.abrirNota(nota.id)} className="nodrag flex size-6 items-center justify-center rounded hover:bg-foreground/10">
              <ExternalLinkIcon className="size-3.5" />
            </button>
          )}
        </div>
        <p className="min-h-0 flex-1 overflow-hidden px-3 py-2 text-xs leading-relaxed text-muted-foreground">{nota ? previa(nota.conteudo) || "Nota vazia" : "A nota ligada a este cartão foi excluída."}</p>
      </div>
      <Alcas />
    </Quadrado>
  )
}
export const NoCartao = memo(CartaoBase)

function GrupoBase({ id, data, selected }: NodeProps<NoFlux>) {
  const acoes = useAcoesQuadro()
  const valor = valorDaCor(data.cor)
  return (
    <Quadrado id={id} selecionado={selected} comMais={false}>
      {acoes.editavel && <NodeResizer isVisible={selected} minWidth={120} minHeight={80} lineClassName="!border-foreground/40" handleClassName="!size-2.5 !rounded-sm !border-foreground/60 !bg-background" />}
      <BarraDaPeca id={id} selecionado={selected} cor={data.cor} />
      <div
        className="size-full rounded-xl border-2 border-dashed"
        style={{ borderColor: valor ?? "color-mix(in oklch, var(--foreground) 35%, transparent)", background: valor ? `color-mix(in oklch, ${valor} 8%, transparent)` : "color-mix(in oklch, var(--foreground) 4%, transparent)" }}
      >
        <div className="px-3 py-1.5 text-left text-sm font-semibold" style={{ color: valor ?? undefined }}>
          <TextoDaPeca id={id} texto={data.texto} className="text-left" />
        </div>
      </div>
      <Alcas />
    </Quadrado>
  )
}
export const NoGrupo = memo(GrupoBase)

