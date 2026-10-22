"use client"

import { useState } from "react"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCheckIcon,
  CheckIcon,
  ChevronsLeftRightIcon,
  GaugeIcon,
  GripVerticalIcon,
  MoreHorizontalIcon,
  PaletteIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { Cartao } from "@/components/kanban/cartao-kanban"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { estiloFaixa, paletaCores } from "@/lib/cores"
import { useKanban } from "@/lib/estado/kanban"
import type { CartaoKanban, ColunaKanban, EtiquetaKanban, ExibicaoCartao } from "@/lib/tipos"

export const PREFIXO_COLUNA = "coluna:"
export const PREFIXO_ARRASTAR_COLUNA = "arrastar-coluna:"

const limites = [3, 5, 8, 10, 15]

function NovoCartao({ colunaId }: { colunaId: string }) {
  const adicionarCartao = useKanban((estado) => estado.adicionarCartao)
  const [aberto, setAberto] = useState(false)
  const [titulo, setTitulo] = useState("")

  if (!aberto) {
    return (
      <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => setAberto(true)}>
        <PlusIcon /> Adicionar cartão
      </Button>
    )
  }

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault()
        adicionarCartao(colunaId, titulo)
        setTitulo("")
      }}
      className="space-y-2"
    >
      <Input
        autoFocus
        value={titulo}
        onChange={(evento) => setTitulo(evento.target.value)}
        onKeyDown={(evento) => {
          if (evento.key === "Escape") setAberto(false)
        }}
        onBlur={() => !titulo.trim() && setAberto(false)}
        placeholder="Título do cartão…"
        aria-label="Título do novo cartão"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm">Adicionar</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button>
      </div>
    </form>
  )
}

// Título da coluna: clique para renomear (salva a cada letra).
function TituloColuna({ coluna, editando, aoEditar }: { coluna: ColunaKanban; editando: boolean; aoEditar: (valor: boolean) => void }) {
  const atualizarColuna = useKanban((estado) => estado.atualizarColuna)
  const [rascunho, setRascunho] = useState(coluna.titulo)

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => {
          setRascunho(coluna.titulo)
          aoEditar(true)
        }}
        title="Clique para renomear"
        className="min-w-0 truncate rounded px-1 text-left text-sm font-semibold hover:bg-foreground/5"
      >
        {coluna.titulo}
      </button>
    )
  }

  return (
    <input
      autoFocus
      value={rascunho}
      onChange={(evento) => {
        setRascunho(evento.target.value)
        if (evento.target.value.trim()) atualizarColuna(coluna.id, { titulo: evento.target.value.trim() })
      }}
      onFocus={(evento) => evento.currentTarget.select()}
      onBlur={() => aoEditar(false)}
      onKeyDown={(evento) => {
        if (evento.key === "Enter" || evento.key === "Escape") evento.currentTarget.blur()
      }}
      aria-label="Nome da coluna"
      className="h-7 min-w-0 flex-1 rounded-md bg-background px-1.5 text-sm font-semibold outline-none ring-1 ring-ring/40"
    />
  )
}

// Rafael Marques - 21/10/2026
// Coluna do quadro: arrastável pela alça, alvo para cartões e com menu de opções.
export function Coluna({
  coluna,
  cartoes,
  etiquetas,
  exibicao,
  posicao,
  total,
  aoAbrirCartao,
  aoMover,
  aoExcluir,
}: {
  coluna: ColunaKanban
  cartoes: CartaoKanban[]
  etiquetas: EtiquetaKanban[]
  exibicao: ExibicaoCartao
  posicao: number
  total: number
  aoAbrirCartao: (cartao: CartaoKanban) => void
  aoMover: (delta: -1 | 1) => void
  aoExcluir: () => void
}) {
  const atualizarColuna = useKanban((estado) => estado.atualizarColuna)
  const [editando, setEditando] = useState(false)
  const { setNodeRef: definirAlvo, isOver } = useDroppable({ id: PREFIXO_COLUNA + coluna.id, data: { colunaId: coluna.id } })
  const {
    setNodeRef: definirArrastavel,
    listeners,
    attributes,
    isDragging,
  } = useDraggable({ id: PREFIXO_ARRASTAR_COLUNA + coluna.id, data: { colunaArrastadaId: coluna.id } })

  const passouDoLimite = coluna.limite !== null && cartoes.length > coluna.limite

  // Coluna recolhida: só uma faixa fina com o nome e a contagem.
  if (coluna.recolhida) {
    return (
      <section ref={definirAlvo} aria-label={coluna.titulo} className={cn("shrink-0", isOver && "ring-2 ring-primary/30 rounded-xl")}>
        <button
          type="button"
          onClick={() => atualizarColuna(coluna.id, { recolhida: false })}
          title="Expandir coluna"
          className="flex h-64 w-10 flex-col items-center gap-2 rounded-xl bg-muted/60 py-3 text-sm font-semibold hover:bg-muted"
        >
          {coluna.cor && <span className="size-2.5 rounded-full" style={{ background: coluna.cor }} />}
          <span className="text-xs text-muted-foreground tabular-nums">{cartoes.length}</span>
          <span className="[writing-mode:vertical-rl]">{coluna.titulo}</span>
        </button>
      </section>
    )
  }

  return (
    <section
      ref={(no) => {
        definirAlvo(no)
        definirArrastavel(no)
      }}
      aria-label={coluna.titulo}
      className={cn(
        "flex w-72 shrink-0 flex-col gap-2 rounded-xl bg-muted/60 p-2 backdrop-blur-sm transition-colors",
        isOver && "bg-muted ring-2 ring-primary/20",
        isDragging && "opacity-40"
      )}
      style={coluna.cor ? estiloFaixa(coluna.cor) : undefined}
    >
      <header className="flex items-center gap-1 px-1 pt-1">
        <button
          type="button"
          aria-label={`Arrastar a coluna ${coluna.titulo}`}
          title="Arraste para reordenar"
          className="flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground hover:bg-foreground/5 active:cursor-grabbing"
          {...listeners}
          {...attributes}
        >
          <GripVerticalIcon className="size-4" />
        </button>
        {coluna.cor && <span className="size-2.5 shrink-0 rounded-full" style={{ background: coluna.cor }} />}
        <TituloColuna coluna={coluna} editando={editando} aoEditar={setEditando} />
        {coluna.concluida && <CheckCheckIcon className="size-3.5 shrink-0 text-muted-foreground" aria-label="Coluna de concluídos" />}
        <span
          className={cn("ml-auto shrink-0 rounded-full bg-background px-2 text-xs text-muted-foreground tabular-nums", passouDoLimite && "bg-destructive/15 font-medium text-destructive")}
          title={coluna.limite !== null ? `Limite: ${coluna.limite} cartões` : undefined}
        >
          {cartoes.length}{coluna.limite !== null && `/${coluna.limite}`}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label={`Opções da coluna ${coluna.titulo}`} className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-foreground/5 hover:text-foreground">
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setEditando(true)}><PencilIcon /> Renomear</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><PaletteIcon /> Cor</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-44">
                <DropdownMenuItem onClick={() => atualizarColuna(coluna.id, { cor: null })}>
                  <span className="size-3.5 rounded-full border" /> Sem cor
                  {!coluna.cor && <CheckIcon className="ml-auto" />}
                </DropdownMenuItem>
                {paletaCores.map((cor) => (
                  <DropdownMenuItem key={cor.id} onClick={() => atualizarColuna(coluna.id, { cor: cor.valor })}>
                    <span className="size-3.5 rounded-full" style={{ background: cor.valor }} /> {cor.nome}
                    {coluna.cor === cor.valor && <CheckIcon className="ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><GaugeIcon /> Limite de cartões</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-40">
                <DropdownMenuRadioGroup
                  value={coluna.limite === null ? "nenhum" : String(coluna.limite)}
                  onValueChange={(valor) => atualizarColuna(coluna.id, { limite: valor === "nenhum" ? null : Number(valor) })}
                >
                  <DropdownMenuRadioItem value="nenhum">Sem limite</DropdownMenuRadioItem>
                  {limites.map((limite) => (
                    <DropdownMenuRadioItem key={limite} value={String(limite)}>{limite} cartões</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuCheckboxItem checked={coluna.concluida} onCheckedChange={(marcado) => atualizarColuna(coluna.id, { concluida: marcado })}>
              Coluna de concluídos
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={posicao === 0} onClick={() => aoMover(-1)}><ArrowLeftIcon /> Mover para a esquerda</DropdownMenuItem>
            <DropdownMenuItem disabled={posicao === total - 1} onClick={() => aoMover(1)}><ArrowRightIcon /> Mover para a direita</DropdownMenuItem>
            <DropdownMenuItem onClick={() => atualizarColuna(coluna.id, { recolhida: true })}><ChevronsLeftRightIcon /> Recolher</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={aoExcluir}><Trash2Icon /> Excluir coluna</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex min-h-16 flex-col gap-2">
        {cartoes.map((cartao) => (
          <Cartao key={cartao.id} cartao={cartao} etiquetas={etiquetas} concluido={coluna.concluida} exibicao={exibicao} aoAbrir={() => aoAbrirCartao(cartao)} />
        ))}
      </div>
      <NovoCartao colunaId={coluna.id} />
    </section>
  )
}
