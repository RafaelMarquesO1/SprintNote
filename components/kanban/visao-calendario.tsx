"use client"

// Rafael Marques - 26/10/2026
// Kanban em calendário: os cartões nos dias do prazo. Arraste um cartão para outro dia para
// mudar o prazo.
// Rafael Marques - 29/10/2026: sem a lista "Sem prazo" ao lado. Cada dia tem um "+" que cria um
// cartão já com aquela data ou agenda ali, com um clique, um cartão que ainda não tem prazo.
// Rafael Marques - 04/11/2026 (v1.5a): cartões com data de início viram barras que atravessam os
// dias (início → entrega). Cada semana distribui as barras em faixas; com muitos cartões juntos,
// cada dia mostra só as primeiras e um "+N mais" abre a semana inteira.

import { useMemo, useState } from "react"
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { CalendarPlusIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useHoje } from "@/hooks/use-hoje"
import { useIsMobile } from "@/hooks/use-mobile"
import { chaveData, diasEntre, lerChave, nomesDias, somarDias } from "@/lib/datas"
import { useKanban } from "@/lib/estado/kanban"
import type { CartaoKanban, ColunaKanban } from "@/lib/tipos"
import { cn } from "@/lib/utils"

const MAXIMO_POR_DIA = 3
const ALTURA_FAIXA = 26
const ESPACO_FAIXA = 4
const TOPO_FAIXAS = 32

// Pedaço do cartão dentro de uma semana: começa em "coluna" (0 = domingo) e ocupa "dias" colunas.
// "continuaAntes/Depois" = o cartão vem da semana anterior ou segue na próxima (ponta reta).
type Trecho = { cartao: CartaoKanban; coluna: number; dias: number; faixa: number; continuaAntes: boolean; continuaDepois: boolean }

function formatarCurto(chave: string) {
  return lerChave(chave).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
}

// Período que o cartão ocupa: do início (se houver) até a entrega.
function periodo(cartao: CartaoKanban): [string, string] | null {
  const fim = cartao.prazo ?? cartao.inicio ?? null
  if (!fim) return null
  const comeco = cartao.inicio && cartao.inicio <= fim ? cartao.inicio : fim
  return [comeco, fim]
}

// Distribui os cartões de uma semana em faixas sem sobreposição: os que começam antes (e os mais
// longos) ficam em cima, e cada um entra na primeira faixa livre nos seus dias.
function montarTrechos(semana: string[], cartoes: CartaoKanban[]): Trecho[] {
  const primeiro = semana[0]
  const ultimo = semana[semana.length - 1]
  const candidatos = cartoes
    .map((cartao) => ({ cartao, periodo: periodo(cartao) }))
    .filter((item): item is { cartao: CartaoKanban; periodo: [string, string] } => Boolean(item.periodo && item.periodo[0] <= ultimo && item.periodo[1] >= primeiro))
    .sort((a, b) => a.periodo[0].localeCompare(b.periodo[0]) || b.periodo[1].localeCompare(a.periodo[1]) || a.cartao.criadoEm - b.cartao.criadoEm)
  const ocupado: boolean[][] = []
  return candidatos.map(({ cartao, periodo: [comeco, fim] }) => {
    const coluna = Math.max(0, diasEntre(primeiro, comeco))
    const fimColuna = Math.min(6, diasEntre(primeiro, fim))
    let faixa = 0
    while (ocupado[faixa]?.slice(coluna, fimColuna + 1).some(Boolean)) faixa++
    ocupado[faixa] ??= Array(7).fill(false)
    for (let i = coluna; i <= fimColuna; i++) ocupado[faixa][i] = true
    return { cartao, coluna, dias: fimColuna - coluna + 1, faixa, continuaAntes: comeco < primeiro, continuaDepois: fim > ultimo }
  })
}

function Chip({
  trecho,
  concluido,
  atrasado,
  aoAbrir,
  sobreposto = false,
  compacto = false,
}: {
  trecho: Pick<Trecho, "cartao" | "continuaAntes" | "continuaDepois" | "dias"> & { idArraste?: string }
  concluido: boolean
  atrasado: boolean
  aoAbrir?: () => void
  sobreposto?: boolean
  compacto?: boolean
}) {
  const { cartao } = trecho
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: sobreposto ? `sombra:${cartao.id}` : (trecho.idArraste ?? cartao.id), disabled: sobreposto })
  const varios = trecho.dias > 1 || trecho.continuaAntes || trecho.continuaDepois
  const intervalo = cartao.inicio && cartao.prazo && cartao.inicio < cartao.prazo
  // Celular: só uma barrinha (o título aparece na lista do dia, abaixo do calendário).
  if (compacto) {
    return (
      <span
        ref={setNodeRef}
        aria-hidden="true"
        className={cn(
          "block h-full w-full",
          concluido ? "bg-line-strong" : atrasado ? "bg-destructive" : "bg-ink-soft",
          trecho.continuaAntes ? "rounded-l-none" : "rounded-l-full",
          trecho.continuaDepois ? "rounded-r-none" : "rounded-r-full"
        )}
      />
    )
  }
  return (
    <button
      ref={sobreposto ? undefined : setNodeRef}
      type="button"
      onClick={aoAbrir}
      title={intervalo ? `${cartao.titulo} · ${formatarCurto(cartao.inicio!)} → ${formatarCurto(cartao.prazo!)}` : cartao.titulo}
      {...(sobreposto ? {} : { ...listeners, ...attributes })}
      className={cn(
        "flex h-full w-full min-w-0 touch-none items-center gap-1.5 border px-1.5 text-left text-xs shadow-xs hover:bg-muted",
        varios ? "bg-muted/70" : "bg-card",
        trecho.continuaAntes ? "rounded-l-none border-l-0" : "rounded-l-md",
        trecho.continuaDepois ? "rounded-r-none border-r-0" : "rounded-r-md",
        atrasado && !trecho.continuaAntes && "border-l-[3px] border-l-destructive",
        concluido && "text-muted-foreground line-through",
        isDragging && "opacity-40",
        sobreposto && "h-7 max-w-56 rotate-1 rounded-md border shadow-lg ring-2 ring-primary/30"
      )}
    >
      {trecho.continuaAntes && (
        <span aria-hidden="true" className="text-muted-foreground">
          ‹
        </span>
      )}
      {cartao.prioridade === "alta" && <span className="size-1.5 shrink-0 rounded-full bg-foreground" aria-label="Prioridade alta" />}
      <span className="truncate">{cartao.titulo}</span>
      {trecho.continuaDepois && (
        <span aria-hidden="true" className="ml-auto text-muted-foreground">
          ›
        </span>
      )}
    </button>
  )
}

// Menu do "+" de um dia: criar cartão com a data ou agendar um que está sem prazo.
function MenuDoDia({ chave, semPrazo, colunaInicial }: { chave: string; semPrazo: CartaoKanban[]; colunaInicial: ColunaKanban | undefined }) {
  const adicionarCartao = useKanban((estado) => estado.adicionarCartao)
  const atualizarCartao = useKanban((estado) => estado.atualizarCartao)
  const [aberto, setAberto] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [ano, mes, dia] = chave.split("-").map(Number)
  const rotulo = new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger
        aria-label={`Adicionar cartão em ${rotulo}`}
        title="Adicionar cartão neste dia"
        className="flex size-6 items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover/dia:opacity-100 hover:bg-muted hover:text-foreground focus-visible:opacity-100 data-[popup-open]:opacity-100 max-md:opacity-100"
      >
        <PlusIcon className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <p className="text-sm font-medium first-letter:">{rotulo}</p>
        {colunaInicial && (
          <form
            className="flex gap-1.5"
            onSubmit={(evento) => {
              evento.preventDefault()
              if (adicionarCartao(colunaInicial.id, titulo, chave)) {
                setTitulo("")
                setAberto(false)
              }
            }}
          >
            <Input autoFocus value={titulo} onChange={(evento) => setTitulo(evento.target.value)} placeholder="Novo cartão neste dia…" aria-label="Título do novo cartão" className="h-8" />
            <Button type="submit" size="sm" disabled={!titulo.trim()}>
              Criar
            </Button>
          </form>
        )}
        {semPrazo.length > 0 && (
          <div className="space-y-1 border-t pt-2">
            <p className="text-xs text-muted-foreground">Ou agende um cartão sem prazo:</p>
            <ul className="max-h-48 space-y-0.5 overflow-y-auto">
              {semPrazo.map((cartao) => (
                <li key={cartao.id}>
                  <button
                    type="button"
                    onClick={() => {
                      atualizarCartao(cartao.id, { prazo: chave })
                      setAberto(false)
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    <CalendarPlusIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{cartao.titulo}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Dia da grade: só o número, o "+" e a área para soltar (as barras ficam por cima, na semana).
function Dia({
  chave,
  numero,
  doMes,
  ehHoje,
  semPrazo,
  colunaInicial,
  somenteLeitura,
  compacto,
  escolhido,
  total,
  aoEscolher,
}: {
  chave: string
  numero: number
  doMes: boolean
  ehHoje: boolean
  semPrazo: CartaoKanban[]
  colunaInicial: ColunaKanban | undefined
  somenteLeitura?: boolean
  compacto: boolean
  escolhido: boolean
  total: number
  aoEscolher: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `dia:${chave}` })
  const dataPorExtenso = lerChave(chave).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })
  return (
    <div
      ref={setNodeRef}
      aria-current={ehHoje ? "date" : undefined}
      className={cn(
        "group/dia relative flex flex-col border-t border-l p-1 first:border-l-0",
        !doMes && "bg-muted/30",
        ehHoje && "outline-2 -outline-offset-2 outline-ember",
        compacto && escolhido && "bg-raised",
        isOver && "bg-primary/10 ring-2 ring-primary/40 ring-inset"
      )}
    >
      {compacto ? (
        // O dia inteiro é o botão: tocar mostra os cartões dele embaixo do calendário.
        <button
          type="button"
          aria-pressed={escolhido}
          aria-label={`${dataPorExtenso}: ${total === 1 ? "1 cartão" : `${total} cartões`}`}
          onClick={aoEscolher}
          className="absolute inset-0 flex items-start justify-center pt-1"
        >
          <span className={cn("flex size-6 items-center justify-center rounded-full text-xs tabular-nums", doMes ? "text-foreground" : "text-muted-foreground/60", ehHoje && "font-bold text-ember", escolhido && "bg-paper text-night")}>
            {numero}
          </span>
        </button>
      ) : (
        <div className="flex items-center justify-between">
          <span className={cn("flex size-6 items-center justify-center text-xs tabular-nums", doMes ? "text-foreground" : "text-muted-foreground/60", ehHoje && "font-bold text-ember")}>{numero}</span>
          {!somenteLeitura && <MenuDoDia chave={chave} semPrazo={semPrazo} colunaInicial={colunaInicial} />}
        </div>
      )}
    </div>
  )
}

function Semana({
  dias,
  cartoes,
  colunas,
  hoje,
  aberta,
  semPrazo,
  colunaInicial,
  somenteLeitura,
  aoAlternarAberta,
  aoAbrirCartao,
  compacto,
  diaEscolhido,
  aoEscolherDia,
}: {
  dias: { chave: string; numero: number; doMes: boolean }[]
  cartoes: CartaoKanban[]
  colunas: ColunaKanban[]
  hoje: string
  aberta: boolean
  semPrazo: CartaoKanban[]
  colunaInicial: ColunaKanban | undefined
  somenteLeitura?: boolean
  aoAlternarAberta: () => void
  aoAbrirCartao: (cartao: CartaoKanban) => void
  compacto: boolean
  diaEscolhido: string
  aoEscolherDia: (chave: string) => void
}) {
  const primeiro = dias[0].chave
  const medidas = compacto ? { faixa: 5, espaco: 3, topo: 34, minimo: 60 } : { faixa: ALTURA_FAIXA, espaco: ESPACO_FAIXA, topo: TOPO_FAIXAS, minimo: 96 }
  const trechos = useMemo(() => montarTrechos(Array.from({ length: 7 }, (_, i) => somarDias(primeiro, i)), cartoes), [primeiro, cartoes])
  const totalFaixas = trechos.reduce((maior, trecho) => Math.max(maior, trecho.faixa + 1), 0)
  const faixasVisiveis = aberta ? totalFaixas : Math.min(totalFaixas, MAXIMO_POR_DIA)
  // Quantos cartões ficaram escondidos em cada dia (os que estão nas faixas de baixo).
  const escondidosPorDia = dias.map((_, coluna) => trechos.filter((trecho) => trecho.faixa >= faixasVisiveis && coluna >= trecho.coluna && coluna < trecho.coluna + trecho.dias).length)
  const temMais = !compacto && (escondidosPorDia.some((total) => total > 0) || (aberta && totalFaixas > MAXIMO_POR_DIA))
  const linhas = faixasVisiveis + (temMais ? 1 : 0)
  const altura = Math.max(medidas.minimo, medidas.topo + linhas * (medidas.faixa + medidas.espaco) + 6)
  const totalDoDia = (coluna: number) => trechos.filter((trecho) => coluna >= trecho.coluna && coluna < trecho.coluna + trecho.dias).length

  return (
    <div className="relative grid grid-cols-7" style={{ minHeight: altura }}>
      {dias.map((dia, coluna) => (
        <Dia
          key={dia.chave}
          chave={dia.chave}
          numero={dia.numero}
          doMes={dia.doMes}
          ehHoje={dia.chave === hoje}
          semPrazo={semPrazo}
          colunaInicial={colunaInicial}
          somenteLeitura={somenteLeitura}
          compacto={compacto}
          escolhido={dia.chave === diaEscolhido}
          total={totalDoDia(coluna)}
          aoEscolher={() => aoEscolherDia(dia.chave)}
        />
      ))}
      <div className="pointer-events-none absolute inset-x-0 grid grid-cols-7 px-1" style={{ top: medidas.topo, gridAutoRows: medidas.faixa, rowGap: medidas.espaco }}>
        {trechos
          .filter((trecho) => trecho.faixa < faixasVisiveis)
          .map((trecho) => {
            const concluido = Boolean(colunas.find((coluna) => coluna.id === trecho.cartao.colunaId)?.concluida)
            return (
              <div
                key={trecho.cartao.id}
                className={cn("min-w-0", !compacto && "pointer-events-auto", !trecho.continuaAntes && "pl-0.5", !trecho.continuaDepois && "pr-0.5")}
                style={{ gridColumn: `${trecho.coluna + 1} / span ${trecho.dias}`, gridRow: trecho.faixa + 1 }}
              >
                <Chip
                  trecho={{ ...trecho, idArraste: `${trecho.cartao.id}@${primeiro}` }}
                  concluido={concluido}
                  atrasado={!concluido && Boolean(trecho.cartao.prazo && hoje && trecho.cartao.prazo < hoje)}
                  aoAbrir={() => aoAbrirCartao(trecho.cartao)}
                  compacto={compacto}
                />
              </div>
            )
          })}
        {temMais &&
          dias.map((dia, coluna) =>
            escondidosPorDia[coluna] > 0 || (aberta && coluna === 0) ? (
              <button
                key={dia.chave}
                type="button"
                onClick={aoAlternarAberta}
                className="pointer-events-auto truncate rounded px-1 text-left text-[11px] text-muted-foreground hover:text-foreground"
                style={{ gridColumn: coluna + 1, gridRow: faixasVisiveis + 1 }}
              >
                {aberta ? "Mostrar menos" : `+${escondidosPorDia[coluna]} mais`}
              </button>
            ) : null
          )}
      </div>
    </div>
  )
}

// Lista do dia escolhido (só no celular), com o "+" para criar ou agendar ali.
function DoDia({
  chave,
  cartoes,
  colunas,
  hoje,
  semPrazo,
  colunaInicial,
  somenteLeitura,
  vidro,
  aoAbrir,
}: {
  chave: string
  cartoes: CartaoKanban[]
  colunas: ColunaKanban[]
  hoje: string
  semPrazo: CartaoKanban[]
  colunaInicial: ColunaKanban | undefined
  somenteLeitura?: boolean
  vidro: boolean
  aoAbrir: (cartao: CartaoKanban) => void
}) {
  const rotulo = lerChave(chave).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
  return (
    <section aria-label={`Cartões de ${rotulo}`} className={cn("group/dia mt-3 rounded-xl border p-3", vidro ? "bg-card/90 backdrop-blur-xl" : "bg-card")}>
      <header className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold first-letter:uppercase">{rotulo}</h3>
        {!somenteLeitura && <MenuDoDia chave={chave} semPrazo={semPrazo} colunaInicial={colunaInicial} />}
      </header>
      {cartoes.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum cartão neste dia. Use o + para criar ou agendar um.</p>
      ) : (
        <ul className="space-y-1.5">
          {cartoes.map((cartao) => {
            const concluido = Boolean(colunas.find((coluna) => coluna.id === cartao.colunaId)?.concluida)
            const atrasado = !concluido && Boolean(cartao.prazo && hoje && cartao.prazo < hoje)
            const intervalo = cartao.inicio && cartao.prazo && cartao.inicio < cartao.prazo
            return (
              <li key={cartao.id}>
                <button
                  type="button"
                  onClick={() => aoAbrir(cartao)}
                  className={cn("flex min-h-11 w-full items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-left text-sm hover:bg-muted", concluido && "text-muted-foreground line-through")}
                >
                  <span className="min-w-0 truncate">{cartao.titulo}</span>
                  <span className={cn("shrink-0 text-xs text-muted-foreground", atrasado && "text-destructive")}>
                    {intervalo ? `${formatarCurto(cartao.inicio!)} → ${formatarCurto(cartao.prazo!)}` : cartao.prazo ? formatarCurto(cartao.prazo) : ""}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
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
  const [semanaAberta, setSemanaAberta] = useState<string | null>(null)
  // Celular: os dias ficam estreitos demais para títulos; tocar num dia mostra os cartões dele abaixo.
  const compacto = useIsMobile()
  const [diaEscolhido, setDiaEscolhido] = useState<string | null>(null)
  const escolhido = diaEscolhido ?? hoje

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
  const semanas = Array.from({ length: dias.length / 7 }, (_, indice) => dias.slice(indice * 7, indice * 7 + 7))

  const agendados = useMemo(() => cartoes.filter((cartao) => cartao.prazo || cartao.inicio), [cartoes])
  // Só os em aberto entram na lista para agendar.
  const semPrazo = cartoes.filter((cartao) => !cartao.prazo && !cartao.inicio && !colunas.find((coluna) => coluna.id === cartao.colunaId)?.concluida)
  // Cartão criado pelo calendário vai para a primeira coluna em aberto.
  const colunaInicial = colunas.find((coluna) => !coluna.concluida) ?? colunas[0]
  const arrastado = cartoes.find((cartao) => cartao.id === arrastadoId?.split("@")[0]) ?? null

  // Soltar num dia: cartão de um dia só muda o prazo; cartão com início muda de lugar inteiro
  // (o início vai para o dia escolhido e a entrega anda junto, mantendo a duração).
  function aoSoltar({ active, over }: DragEndEvent) {
    setArrastadoId(null)
    if (!over || somenteLeitura) return
    const chave = String(over.id).replace("dia:", "")
    const cartao = cartoes.find((item) => item.id === String(active.id).split("@")[0])
    const intervalo = cartao ? periodo(cartao) : null
    if (!cartao || !intervalo) return
    if (cartao.inicio) {
      if (intervalo[0] === chave) return
      const deslocar = diasEntre(intervalo[0], chave)
      atualizarCartao(cartao.id, { inicio: chave, ...(cartao.prazo && { prazo: somarDias(cartao.prazo, deslocar) }) })
    } else if (cartao.prazo !== chave) atualizarCartao(cartao.id, { prazo: chave })
  }

  const textoMes = mes.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  const tituloMes = textoMes.charAt(0).toUpperCase() + textoMes.slice(1)

  return (
    <DndContext sensors={sensores} onDragStart={({ active }) => setArrastadoId(String(active.id))} onDragEnd={aoSoltar} onDragCancel={() => setArrastadoId(null)}>
      <div className="px-4 pt-2 pb-6 md:px-6 md:pt-4">
        <section aria-label="Calendário de datas" className={cn("overflow-hidden rounded-xl border", vidro ? "bg-card/90 backdrop-blur-xl" : "bg-card")}>
          <header className="flex items-center gap-1 border-b px-3 py-2">
            <h2 className="text-sm font-semibold">{tituloMes}</h2>
            {!somenteLeitura && (
              <span className="mr-auto ml-3 hidden text-xs text-muted-foreground sm:inline">
                Use o + de um dia para criar ou agendar · arraste para mudar a data
                {semPrazo.length > 0 && ` · ${semPrazo.length} sem prazo`}
              </span>
            )}
            <span className={cn("mr-auto", !somenteLeitura && "sm:hidden")} />
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
          <div>
            {semanas.map((semana) => (
              <Semana
                key={semana[0].chave}
                dias={semana}
                cartoes={agendados}
                colunas={colunas}
                hoje={hoje}
                aberta={semanaAberta === semana[0].chave}
                semPrazo={semPrazo}
                colunaInicial={colunaInicial}
                somenteLeitura={somenteLeitura}
                aoAlternarAberta={() => setSemanaAberta(semanaAberta === semana[0].chave ? null : semana[0].chave)}
                aoAbrirCartao={aoAbrir}
                compacto={compacto}
                diaEscolhido={escolhido}
                aoEscolherDia={setDiaEscolhido}
              />
            ))}
          </div>
        </section>
        {compacto && escolhido ? (
          <DoDia
            chave={escolhido}
            cartoes={agendados.filter((cartao) => {
              const intervalo = periodo(cartao)
              return Boolean(intervalo && intervalo[0] <= escolhido && intervalo[1] >= escolhido)
            })}
            colunas={colunas}
            hoje={hoje}
            semPrazo={semPrazo}
            colunaInicial={colunaInicial}
            somenteLeitura={somenteLeitura}
            vidro={vidro}
            aoAbrir={aoAbrir}
          />
        ) : null}
      </div>
      <DragOverlay>{arrastado && <Chip trecho={{ cartao: arrastado, dias: 1, continuaAntes: false, continuaDepois: false }} concluido={false} atrasado={false} sobreposto />}</DragOverlay>
    </DndContext>
  )
}
