"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DndContext, DragOverlay, PointerSensor, pointerWithin, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  FilePlusIcon,
  GripVerticalIcon,
  HouseIcon,
  LayoutDashboardIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  Settings2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { abrirBusca } from "@/components/busca"
import { Icone } from "@/components/icone"
import { catalogoWidgets } from "@/components/inicio/catalogo-widgets"
import { DialogoConfigurarWidget, GaleriaWidgets } from "@/components/inicio/dialogos-inicio"
import { CapturaRapida, ResumoDia } from "@/components/inicio/topo-inicio"
import { ConteudoWidget, useCabecalhoWidget } from "@/components/inicio/widgets"
import { useConta } from "@/components/conta/portao-conta"
import { CabecalhoPagina } from "@/components/pagina"
import { AvisosPrazo } from "@/components/avisos-prazo"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Kbd } from "@/components/ui/kbd"
import { Skeleton } from "@/components/ui/skeleton"
import { useHidratado } from "@/hooks/use-hidratado"
import { useHoje, useHorario } from "@/hooks/use-hoje"
import { travarCursorArrastando } from "@/lib/arrastar"
import { lerChave } from "@/lib/datas"
import { useInicio, type Widget } from "@/lib/estado/inicio"
import { useNotas } from "@/lib/estado/notas"

// Classes fixas (o Tailwind precisa enxergar cada uma no código).
const larguraMd: Record<number, string> = { 1: "md:col-span-1", 2: "md:col-span-2" }
const larguraLg: Record<number, string> = { 1: "lg:col-span-1", 2: "lg:col-span-2", 3: "lg:col-span-3", 4: "lg:col-span-4" }

// Rafael Marques - 22/10/2026
// Cabeçalho e grade do início são fixos (o usuário não personaliza mais).
const COLUNAS = 4
const alturas = { baixa: "", normal: "min-h-40", alta: "min-h-80" }

// Altura mínima/máxima ao redimensionar com o mouse (px).
const ALTURA_MIN = 96
const ALTURA_MAX = 960

function saudacao(horario: string) {
  const hora = Number(horario.slice(0, 2))
  if (hora < 12) return "Bom dia"
  if (hora < 18) return "Boa tarde"
  return "Boa noite"
}

// Visual do cartão conforme o estilo escolhido no widget.
function estiloCartao(widget: Widget, cor: string): React.CSSProperties {
  switch (widget.estilo) {
    case "suave":
      return { background: `color-mix(in oklch, ${cor} 7%, var(--card))` }
    case "contorno":
      return { background: "transparent", boxShadow: `inset 0 0 0 1.5px color-mix(in oklch, ${cor} 55%, transparent)` }
    case "destaque":
      return { background: `linear-gradient(135deg, color-mix(in oklch, ${cor} 24%, var(--card)), var(--card) 70%)` }
    default:
      return {}
  }
}

// Rafael Marques - 30/10/2026: cartão do widget refeito para o modo Personalizar.
// Fora dele o cartão fica limpo. Dentro dele, todos os controles ficam DENTRO do cartão (nada invade o
// vizinho): uma barra com a alça de arrastar, a largura em colunas e a engrenagem, e uma única alça de
// altura no canto. Ao arrastar, o cartão fica no lugar (apagado) e o destino mostra "Soltar aqui".
function CartaoWidget({
  widget,
  colunas,
  editando,
  arrastandoOutro,
  aoConfigurar,
}: {
  widget: Widget
  colunas: number
  editando: boolean
  // Há outro cartão sendo arrastado (este pode ser o destino).
  arrastandoOutro: boolean
  aoConfigurar: () => void
}) {
  const atualizarWidget = useInicio((estado) => estado.atualizarWidget)
  const { setNodeRef: refAlca, listeners: ouvintesArrasto, attributes: atributosArrasto, isDragging: sendoArrastado } = useDraggable({ id: widget.id, disabled: !editando })
  const alvo = useDroppable({ id: widget.id, disabled: !editando })
  const cabecalho = useCabecalhoWidget(widget)
  const caixa = useRef<HTMLDivElement | null>(null)
  // Altura provisória enquanto o mouse arrasta a alça (salva ao soltar).
  const [alturaProvisoria, setAlturaProvisoria] = useState<number | null>(null)
  const info = catalogoWidgets[widget.tipo]
  const cor = widget.cor ?? "var(--primary)"
  const largura = Math.min(widget.largura, colunas)
  const alturaPx = info.alturaAutomatica ? undefined : (alturaProvisoria ?? widget.alturaPx)
  const destino = editando && arrastandoOutro && alvo.isOver
  const titulo = cabecalho.titulo || info.nome
  const icone = cabecalho.icone ? <Icone nome={cabecalho.icone} /> : <info.icone className="size-4" />

  function redimensionarAltura(evento: React.PointerEvent) {
    const elemento = caixa.current
    if (!elemento || evento.button !== 0) return
    evento.preventDefault()
    evento.stopPropagation()
    const inicio = { y: evento.clientY, altura: elemento.offsetHeight }
    let atual: number | null = null
    const liberarCursor = travarCursorArrastando("ns-resize")

    function mover(movimento: PointerEvent) {
      const proxima = Math.round(Math.max(ALTURA_MIN, Math.min(ALTURA_MAX, inicio.altura + movimento.clientY - inicio.y)) / 8) * 8
      if (proxima !== atual) {
        atual = proxima
        setAlturaProvisoria(proxima)
      }
    }

    function soltar() {
      window.removeEventListener("pointermove", mover)
      window.removeEventListener("pointerup", soltar)
      window.removeEventListener("pointercancel", soltar)
      liberarCursor()
      if (atual !== null && atual !== widget.alturaPx) atualizarWidget(widget.id, { alturaPx: atual })
      setAlturaProvisoria(null)
    }

    window.addEventListener("pointermove", mover)
    window.addEventListener("pointerup", soltar)
    window.addEventListener("pointercancel", soltar)
  }

  return (
    <div
      ref={(elemento) => {
        caixa.current = elemento
        alvo.setNodeRef(elemento)
      }}
      className={cn("relative min-w-0", larguraMd[Math.min(largura, 2)], larguraLg[largura])}
      style={{ height: alturaPx }}
    >
      <Card
        className={cn(
          "h-full gap-3 overflow-hidden transition-[opacity,box-shadow]",
          editando && "ring-1 ring-border",
          sendoArrastado && "opacity-40",
          destino && "ring-2 ring-foreground",
          alturaProvisoria !== null && "ring-2 ring-foreground/40"
        )}
        style={estiloCartao(widget, cor)}
      >
        {widget.cor && <div className="-mt-4 h-1 shrink-0" style={{ background: widget.cor }} />}

        {editando ? (
          // Barra de edição: arrastar | título | largura | configurar
          <div className="-mt-1 flex items-center gap-1.5 border-b px-2 pb-2">
            <button
              ref={refAlca}
              type="button"
              aria-label={`Mover ${titulo}`}
              title="Arraste para mudar de lugar"
              className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
              {...ouvintesArrasto}
              {...atributosArrasto}
            >
              <GripVerticalIcon className="size-4" />
            </button>
            <h2 className="min-w-0 flex-1 truncate text-sm font-medium">{titulo}</h2>
            {colunas > 1 && (
              <div role="radiogroup" aria-label={`Largura de ${titulo}`} className="hidden shrink-0 items-center rounded-md bg-muted p-0.5 lg:flex">
                {Array.from({ length: colunas }, (_, indice) => indice + 1).map((colunasOcupadas) => (
                  <button
                    key={colunasOcupadas}
                    type="button"
                    role="radio"
                    aria-checked={largura === colunasOcupadas}
                    aria-label={colunasOcupadas === colunas ? "Largura inteira" : `${colunasOcupadas} de ${colunas} colunas`}
                    title={colunasOcupadas === colunas ? "Largura inteira" : `${colunasOcupadas} de ${colunas} colunas`}
                    onClick={() => atualizarWidget(widget.id, { largura: colunasOcupadas })}
                    className={cn(
                      "flex h-6 w-7 items-center justify-center rounded text-xs tabular-nums transition-colors",
                      largura === colunasOcupadas ? "bg-background font-semibold text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {/* Barrinhas mostram quanto da linha o cartão ocupa. */}
                    <span aria-hidden className="flex h-2.5 gap-px">
                      {Array.from({ length: colunas }, (_, barra) => (
                        <span key={barra} className={cn("w-[3px] rounded-[1px]", barra < colunasOcupadas ? "bg-current" : "bg-current opacity-20")} />
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <Button variant="ghost" size="icon-sm" aria-label={`Configurar ${titulo}`} title="Configurar" onClick={aoConfigurar}>
              <Settings2Icon />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4">
            <span className="flex shrink-0" style={{ color: cor }}>
              {icone}
            </span>
            <h2 className={cn("min-w-0 flex-1 truncate font-semibold", cabecalho.icone ? "text-base" : "text-sm")}>{titulo}</h2>
            {info.href && (
              <Link href={info.href} className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                Ver tudo <ArrowRightIcon className="size-3" />
              </Link>
            )}
          </div>
        )}

        <CardContent
          // No modo Personalizar o conteúdo fica esmaecido e sem clique (evita marcar algo sem querer).
          inert={editando}
          className={cn(
            "min-h-0 flex-1",
            editando && "pointer-events-none opacity-50 select-none",
            info.alturaAutomatica
              ? null
              : alturaPx
                ? "overflow-y-auto"
                : [alturas[widget.altura], widget.altura === "alta" && "max-h-[36rem] overflow-y-auto"]
          )}
        >
          <ConteudoWidget widget={widget} cor={cor} />
        </CardContent>
      </Card>

      {destino && (
        <span className="pointer-events-none absolute inset-x-0 top-3 z-10 mx-auto w-fit rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background shadow">
          Soltar aqui
        </span>
      )}

      {/* Altura: uma alça só, dentro do canto do cartão (duplo clique volta ao automático). */}
      {editando && !info.alturaAutomatica && (
        <button
          type="button"
          aria-label={`Altura de ${titulo}`}
          title={widget.alturaPx ? "Arraste para mudar a altura (duplo clique volta ao automático)" : "Arraste para mudar a altura"}
          onPointerDown={redimensionarAltura}
          onDoubleClick={() => atualizarWidget(widget.id, { alturaPx: undefined })}
          className="absolute right-1.5 bottom-1.5 z-20 flex size-6 cursor-ns-resize touch-none items-center justify-center rounded-md border bg-background text-muted-foreground shadow-xs hover:text-foreground"
        >
          <ChevronsUpDownIcon className="size-3.5" />
        </button>
      )}
      {alturaProvisoria !== null && (
        <span className="pointer-events-none absolute right-9 bottom-2 z-20 rounded-md bg-foreground px-1.5 py-0.5 text-xs font-medium text-background tabular-nums">
          {alturaProvisoria}px
        </span>
      )}
    </div>
  )
}

// Etiqueta que segue o mouse enquanto um cartão é arrastado.
function PreviaArrasto({ widget }: { widget: Widget }) {
  const cabecalho = useCabecalhoWidget(widget)
  const info = catalogoWidgets[widget.tipo]
  return (
    <div className="flex w-56 cursor-grabbing items-center gap-2 rounded-lg border bg-popover px-3 py-2 text-sm font-medium shadow-lg">
      <GripVerticalIcon className="size-4 shrink-0 text-muted-foreground" />
      <span className="flex shrink-0 text-muted-foreground">{cabecalho.icone ? <Icone nome={cabecalho.icone} /> : <info.icone className="size-4" />}</span>
      <span className="min-w-0 truncate">{cabecalho.titulo || info.nome}</span>
    </div>
  )
}

// Rafael Marques - 21/10/2026
// Tela de início montada pelo próprio usuário: widgets com dados do sistema.
// Tudo direto na tela: arrastar pelo ícone, redimensionar pelas bordas e ⚙ para configurar.
export function PainelInicio() {
  const hidratado = useHidratado()
  const hoje = useHoje()
  const horario = useHorario()
  const router = useRouter()
  const conta = useConta()
  const criarNota = useNotas((estado) => estado.criarNota)
  const widgets = useInicio((estado) => estado.widgets)
  const moverWidget = useInicio((estado) => estado.moverWidget)
  const restaurarPadrao = useInicio((estado) => estado.restaurarPadrao)
  const [galeria, setGaleria] = useState(false)
  const [restaurando, setRestaurando] = useState(false)
  const [idConfigurando, setIdConfigurando] = useState<string | null>(null)
  const [editando, setEditando] = useState(false)
  const [arrastandoId, setArrastandoId] = useState<string | null>(null)
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  if (!hidratado || !hoje) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-44" />)}
        </div>
      </div>
    )
  }

  const colunas = COLUNAS
  const configurando = widgets.find((widget) => widget.id === idConfigurando) ?? null
  // Saudação com o primeiro nome do cadastro da conta.
  const primeiroNome = conta?.usuario.nome.trim().split(/\s+/)[0] ?? ""
  const titulo = [saudacao(horario), primeiroNome].filter(Boolean).join(", ")

  function aoSoltar(evento: DragEndEvent) {
    setArrastandoId(null)
    const { active, over } = evento
    if (!over || active.id === over.id) return
    moverWidget(String(active.id), widgets.findIndex((widget) => widget.id === over.id))
  }

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        secao={lerChave(hoje).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        icone={HouseIcon}
        titulo={`${titulo}!`}
        resumo={<ResumoDia />}
        acoes={
          editando ? (
            <>
              <Button variant="outline" onClick={() => setGaleria(true)}>
                <PlusIcon /> Adicionar widget
              </Button>
              <Button variant="ghost" onClick={() => setRestaurando(true)}>
                <RotateCcwIcon /> Restaurar padrão
              </Button>
              <Button onClick={() => setEditando(false)}>
                <CheckIcon /> Concluir
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => router.push(`/notas/${criarNota().id}`)}>
                <FilePlusIcon /> Nova nota
              </Button>
              <Button variant="outline" onClick={abrirBusca}>
                <SearchIcon /> Buscar <Kbd>Ctrl K</Kbd>
              </Button>
              <Button variant="outline" onClick={() => setEditando(true)}>
                <LayoutDashboardIcon /> Personalizar
              </Button>
            </>
          )
        }
      />

      {editando ? (
        <p className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
          <GripVerticalIcon className="size-4 shrink-0" />
          Arraste pela alça para mudar de lugar, puxe as bordas para mudar o tamanho e use a engrenagem para configurar.
        </p>
      ) : (
        <CapturaRapida />
      )}

      <AvisosPrazo areas={["tarefas", "kanban"]} />

      {widgets.length === 0 ? (
        <Card className="items-center gap-4 px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LayoutDashboardIcon className="size-7" />
          </span>
          <div className="space-y-1">
            <p className="text-lg font-semibold">Seu início está vazio</p>
            <p className="text-sm text-muted-foreground">Monte do seu jeito: tarefas, hábitos, rotina, Kanban, notas, relógio, atalhos…</p>
          </div>
          <Button onClick={() => setGaleria(true)}><PlusIcon /> Adicionar widget</Button>
        </Card>
      ) : (
        <DndContext
          sensors={sensores}
          collisionDetection={pointerWithin}
          onDragStart={({ active }) => setArrastandoId(String(active.id))}
          onDragEnd={aoSoltar}
          onDragCancel={() => setArrastandoId(null)}
        >
          <div className={cn("grid grid-flow-row-dense grid-cols-1 md:grid-cols-2", "lg:grid-cols-4 gap-4")}>
            {widgets.map((widget) => (
              <CartaoWidget
                key={widget.id}
                widget={widget}
                colunas={colunas}
                editando={editando}
                arrastandoOutro={arrastandoId !== null && arrastandoId !== widget.id}
                aoConfigurar={() => setIdConfigurando(widget.id)}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>
            {arrastandoId && (() => {
              const arrastado = widgets.find((widget) => widget.id === arrastandoId)
              return arrastado ? <PreviaArrasto widget={arrastado} /> : null
            })()}
          </DragOverlay>
        </DndContext>
      )}

      <GaleriaWidgets aberto={galeria} aoFechar={() => setGaleria(false)} colunas={colunas} />
      <DialogoConfigurarWidget widget={configurando} colunas={colunas} aoFechar={() => setIdConfigurando(null)} />

      <AlertDialog open={restaurando} onOpenChange={setRestaurando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar o início padrão?</AlertDialogTitle>
            <AlertDialogDescription>
              Os widgets voltam ao modelo inicial. O texto dos blocos de notas será perdido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { restaurarPadrao(); setRestaurando(false) }}>Restaurar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
