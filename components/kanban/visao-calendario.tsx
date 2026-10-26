"use client"

// Rafael Marques - 26/10/2026
// Kanban em calendário: os cartões nos dias do prazo. Arraste um cartão para outro dia para
// mudar o prazo; os cartões sem prazo ficam numa lista ao lado e podem ser soltos num dia.

import { useMemo, useState } from "react"
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { CalendarOffIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useHoje } from "@/hooks/use-hoje"
import { chaveData, nomesDias } from "@/lib/datas"
import { useKanban } from "@/lib/estado/kanban"
import type { CartaoKanban, ColunaKanban } from "@/lib/tipos"
import { cn } from "@/lib/utils"

const MAXIMO_POR_DIA = 3

function Chip({ cartao, concluido, atrasado, aoAbrir, sobreposto = false }: { cartao: CartaoKanban; concluido: boolean; atrasado: boolean; aoAbrir?: () => void; sobreposto?: boolean }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: sobreposto ? `sombra:${cartao.id}` : cartao.id, disabled: sobreposto })
  return (
    <button
      ref={sobreposto ? undefined : setNodeRef}
      type="button"
      onClick={aoAbrir}
      {...(sobreposto ? {} : { ...listeners, ...attributes })}
      className={cn(
        "flex w-full min-w-0 touch-none items-center gap-1.5 rounded-md border bg-card px-1.5 py-1 text-left text-xs shadow-xs hover:bg-muted",
        atrasado && "border-l-[3px] border-l-destructive",
        concluido && "text-muted-foreground line-through",
        isDragging && "opacity-40",
        sobreposto && "rotate-1 shadow-lg ring-2 ring-primary/30"
      )}
    >
      {cartao.prioridade === "alta" && <span className="size-1.5 shrink-0 rounded-full bg-foreground" aria-label="Prioridade alta" />}
      <span className="truncate">{cartao.titulo}</span>
    </button>
  )
}

function Dia({
  chave,
  numero,
  doMes,
  ehHoje,
  cartoes,
  colunas,
  hoje,
  aberto,
  aoAlternarAberto,
  aoAbrirCartao,
}: {
  chave: string
  numero: number
  doMes: boolean
  ehHoje: boolean
  cartoes: CartaoKanban[]
  colunas: ColunaKanban[]
  hoje: string
  aberto: boolean
  aoAlternarAberto: () => void
  aoAbrirCartao: (cartao: CartaoKanban) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `dia:${chave}` })
  const visiveis = aberto ? cartoes : cartoes.slice(0, MAXIMO_POR_DIA)
  return (
    <div ref={setNodeRef} className={cn("flex min-h-24 flex-col gap-1 border-t border-l p-1 first:border-l-0 sm:min-h-28", !doMes && "bg-muted/30", isOver && "bg-primary/10 ring-2 ring-primary/40 ring-inset")}>
      <span className={cn("flex size-6 items-center justify-center self-end rounded-full text-xs tabular-nums sm:self-start", doMes ? "text-foreground" : "text-muted-foreground/60", ehHoje && "bg-foreground font-semibold text-background")}>{numero}</span>
      {visiveis.map((cartao) => {
        const concluido = Boolean(colunas.find((coluna) => coluna.id === cartao.colunaId)?.concluida)
        return <Chip key={cartao.id} cartao={cartao} concluido={concluido} atrasado={!concluido && chave < hoje} aoAbrir={() => aoAbrirCartao(cartao)} />
      })}
      {cartoes.length > MAXIMO_POR_DIA && (
        <button type="button" onClick={aoAlternarAberto} className="rounded px-1 text-left text-[11px] text-muted-foreground hover:text-foreground">
          {aberto ? "Mostrar menos" : `+${cartoes.length - MAXIMO_POR_DIA} mais`}
        </button>
      )}
    </div>
  )
}

export function VisaoCalendario({
  cartoes,
  colunas,
  vidro,
  aoAbrir,
  somenteLeitura,
}: {
  cartoes: CartaoKanban[]
  colunas: ColunaKanban[]
  vidro: boolean
  aoAbrir: (cartao: CartaoKanban) => void
  somenteLeitura?: boolean
}) {
  const hoje = useHoje()
  const atualizarCartao = useKanban((estado) => estado.atualizarCartao)
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }))
  const base = hoje ? new Date(Number(hoje.slice(0, 4)), Number(hoje.slice(5, 7)) - 1, 1) : new Date()
  const [deslocamento, setDeslocamento] = useState(0)
  const [arrastadoId, setArrastadoId] = useState<string | null>(null)
  const [diaAberto, setDiaAberto] = useState<string | null>(null)

  const mes = new Date(base.getFullYear(), base.getMonth() + deslocamento, 1)
  // Semanas completas: do domingo antes do dia 1 até o sábado depois do último dia (conta leve, sem memória).
  const dias = (() => {
    const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1 - mes.getDay())
    const ultimo = new Date(mes.getFullYear(), mes.getMonth() + 1, 0)
    const total = Math.ceil((mes.getDay() + ultimo.getDate()) / 7) * 7
    return Array.from({ length: total }, (_, indice) => {
      const data = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + indice)
      return { chave: chaveData(data), numero: data.getDate(), doMes: data.getMonth() === mes.getMonth() }
    })
  })()

  const porDia = useMemo(() => {
    const mapa = new Map<string, CartaoKanban[]>()
    for (const cartao of cartoes) if (cartao.prazo) mapa.set(cartao.prazo, [...(mapa.get(cartao.prazo) ?? []), cartao])
    return mapa
  }, [cartoes])
  const semPrazo = cartoes.filter((cartao) => !cartao.prazo)
  const arrastado = cartoes.find((cartao) => cartao.id === arrastadoId) ?? null

  function aoSoltar({ active, over }: DragEndEvent) {
    setArrastadoId(null)
    if (!over || somenteLeitura) return
    const chave = String(over.id).replace("dia:", "")
    const cartao = cartoes.find((item) => item.id === active.id)
    if (cartao && cartao.prazo !== chave) atualizarCartao(cartao.id, { prazo: chave })
  }

  const textoMes = mes.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  const tituloMes = textoMes.charAt(0).toUpperCase() + textoMes.slice(1)

  return (
    <DndContext sensors={sensores} onDragStart={({ active }) => setArrastadoId(String(active.id))} onDragEnd={aoSoltar} onDragCancel={() => setArrastadoId(null)}>
      <div className="grid gap-4 px-4 pt-2 pb-6 md:px-6 md:pt-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <section aria-label="Calendário de prazos" className={cn("overflow-hidden rounded-xl border", vidro ? "bg-card/90 backdrop-blur-xl" : "bg-card")}>
          <header className="flex items-center gap-1 border-b px-3 py-2">
            <h2 className="mr-auto text-sm font-semibold">{tituloMes}</h2>
            <Button variant="ghost" size="icon-sm" aria-label="Mês anterior" onClick={() => setDeslocamento((valor) => valor - 1)}>
              <ChevronLeftIcon />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeslocamento(0)} disabled={deslocamento === 0}>
              Hoje
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Próximo mês" onClick={() => setDeslocamento((valor) => valor + 1)}>
              <ChevronRightIcon />
            </Button>
          </header>
          <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
            {nomesDias.map((nome) => (
              <span key={nome} className="py-1.5 font-medium">
                {nome}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {dias.map((dia) => (
              <Dia
                key={dia.chave}
                chave={dia.chave}
                numero={dia.numero}
                doMes={dia.doMes}
                ehHoje={dia.chave === hoje}
                cartoes={porDia.get(dia.chave) ?? []}
                colunas={colunas}
                hoje={hoje}
                aberto={diaAberto === dia.chave}
                aoAlternarAberto={() => setDiaAberto(diaAberto === dia.chave ? null : dia.chave)}
                aoAbrirCartao={aoAbrir}
              />
            ))}
          </div>
        </section>

        <aside aria-label="Cartões sem prazo" className={cn("h-fit space-y-2 rounded-xl border p-3", vidro ? "bg-card/90 backdrop-blur-xl" : "bg-card")}>
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            <CalendarOffIcon className="size-4" /> Sem prazo <span className="text-xs font-normal text-muted-foreground">({semPrazo.length})</span>
          </h2>
          {!somenteLeitura && semPrazo.length > 0 && <p className="text-xs text-muted-foreground">Arraste um cartão para um dia.</p>}
          {semPrazo.length === 0 ? (
            <p className="text-xs text-muted-foreground">Todos os cartões têm prazo.</p>
          ) : (
            <div className="space-y-1">
              {semPrazo.map((cartao) => (
                <Chip key={cartao.id} cartao={cartao} concluido={Boolean(colunas.find((coluna) => coluna.id === cartao.colunaId)?.concluida)} atrasado={false} aoAbrir={() => aoAbrir(cartao)} />
              ))}
            </div>
          )}
        </aside>
      </div>
      <DragOverlay>{arrastado && <Chip cartao={arrastado} concluido={false} atrasado={false} sobreposto />}</DragOverlay>
    </DndContext>
  )
}
