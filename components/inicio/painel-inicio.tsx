"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DndContext, PointerSensor, pointerWithin, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowRightIcon,
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
const FRASE_INICIO = "Sua organização em um só lugar: notas conectadas, tarefas, hábitos, rotina e Kanban."
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

type Tamanho = { largura: number; alturaPx: number | undefined }

function CartaoWidget({ widget, colunas, aoConfigurar }: { widget: Widget; colunas: number; aoConfigurar: () => void }) {
  const atualizarWidget = useInicio((estado) => estado.atualizarWidget)
  const arrasto = useDraggable({ id: widget.id })
  const alvo = useDroppable({ id: widget.id })
  const cabecalho = useCabecalhoWidget(widget)
  const caixa = useRef<HTMLDivElement | null>(null)
  // Tamanho provisório enquanto o mouse arrasta a borda (salvo ao soltar).
  const [provisorio, setProvisorio] = useState<Tamanho | null>(null)
  const info = catalogoWidgets[widget.tipo]
  const cor = widget.cor ?? "var(--primary)"
  const largura = Math.min(provisorio?.largura ?? widget.largura, colunas)
  const alturaPx = info.alturaAutomatica ? undefined : provisorio ? provisorio.alturaPx : widget.alturaPx
  const sobre = alvo.isOver && !arrasto.isDragging
  const titulo = cabecalho.titulo || info.nome

  // Borda direita muda a largura (em colunas); a de baixo, a altura; o canto, as duas.
  function redimensionar(evento: React.PointerEvent, eixos: { x: boolean; y: boolean }) {
    const elemento = caixa.current
    const grade = elemento?.parentElement
    if (!elemento || !grade || evento.button !== 0) return
    evento.preventDefault()
    evento.stopPropagation()
    const estiloGrade = getComputedStyle(grade)
    const colunasVisiveis = estiloGrade.gridTemplateColumns.split(" ").filter(Boolean).length
    const espaco = parseFloat(estiloGrade.columnGap) || 0
    const larguraColuna = (grade.clientWidth - espaco * (colunasVisiveis - 1)) / colunasVisiveis
    // Em telas menores a grade tem menos colunas que o painel: lá só a altura muda.
    const mudaLargura = eixos.x && colunasVisiveis === colunas
    const inicio = { x: evento.clientX, y: evento.clientY, largura: elemento.offsetWidth, altura: elemento.offsetHeight }
    const original: Tamanho = { largura: Math.min(widget.largura, colunas), alturaPx: widget.alturaPx }
    let atual = original
    const liberarCursor = travarCursorArrastando(eixos.x && eixos.y ? "nwse-resize" : eixos.x ? "ew-resize" : "ns-resize")

    function mover(movimento: PointerEvent) {
      const proximo = { ...atual }
      if (mudaLargura) {
        const novaLargura = inicio.largura + movimento.clientX - inicio.x
        proximo.largura = Math.max(1, Math.min(colunas, Math.round((novaLargura + espaco) / (larguraColuna + espaco))))
      }
      if (eixos.y) {
        const novaAltura = inicio.altura + movimento.clientY - inicio.y
        proximo.alturaPx = Math.round(Math.max(ALTURA_MIN, Math.min(ALTURA_MAX, novaAltura)) / 8) * 8
      }
      if (proximo.largura !== atual.largura || proximo.alturaPx !== atual.alturaPx) {
        atual = proximo
        setProvisorio(proximo)
      }
    }

    function soltar() {
      window.removeEventListener("pointermove", mover)
      window.removeEventListener("pointerup", soltar)
      window.removeEventListener("pointercancel", soltar)
      liberarCursor()
      if (atual !== original) atualizarWidget(widget.id, { largura: atual.largura, alturaPx: atual.alturaPx })
      setProvisorio(null)
    }

    window.addEventListener("pointermove", mover)
    window.addEventListener("pointerup", soltar)
    window.addEventListener("pointercancel", soltar)
  }

  return (
    <div
      ref={(elemento) => {
        caixa.current = elemento
        arrasto.setNodeRef(elemento)
        alvo.setNodeRef(elemento)
      }}
      className={cn("group/widget relative min-w-0", larguraMd[Math.min(largura, 2)], larguraLg[largura], arrasto.isDragging && "z-30 opacity-80")}
      style={{ transform: CSS.Translate.toString(arrasto.transform), height: alturaPx }}
    >
      <Card
        className={cn(
          "h-full gap-3 overflow-hidden transition-shadow",
          sobre && "ring-2 ring-primary",
          provisorio && "ring-2 ring-primary/40",
          arrasto.isDragging && "shadow-2xl"
        )}
        style={estiloCartao(widget, cor)}
      >
        {widget.cor && <div className="-mt-4 h-1 shrink-0" style={{ background: widget.cor }} />}
        <div className="flex items-center gap-2 px-4">
          {/* O ícone vira a alça de arrastar quando o mouse passa pelo cartão. */}
          <button
            type="button"
            aria-label={`Arrastar ${titulo}`}
            title="Arraste para mudar de lugar"
            className="relative -m-1 flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
            {...arrasto.listeners}
            {...arrasto.attributes}
          >
            <span className="flex transition-opacity group-hover/widget:opacity-0" style={{ color: cor }}>
              {cabecalho.icone ? <Icone nome={cabecalho.icone} /> : <info.icone className="size-4" />}
            </span>
            <GripVerticalIcon className="absolute size-4 opacity-0 transition-opacity group-hover/widget:opacity-100" />
          </button>
          <h2 className={cn("min-w-0 flex-1 truncate font-semibold", cabecalho.icone ? "text-base" : "text-sm")}>{titulo}</h2>
          {info.href && (
            <Link href={info.href} className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              Ver tudo <ArrowRightIcon className="size-3" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Configurar ${titulo}`}
            title="Configurar"
            onClick={aoConfigurar}
            className="opacity-0 group-hover/widget:opacity-100 focus-visible:opacity-100"
          >
            <Settings2Icon />
          </Button>
        </div>
        <CardContent
          className={cn(
            "min-h-0 flex-1",
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

      {/* Bordas para redimensionar com o mouse */}
      <div
        aria-hidden
        title="Arraste para mudar a largura"
        onPointerDown={(evento) => redimensionar(evento, { x: true, y: false })}
        className="absolute inset-y-4 -right-1.5 z-10 w-3 cursor-ew-resize touch-none max-lg:hidden"
      />
      {!info.alturaAutomatica && (
        <div
          aria-hidden
          title="Arraste para mudar a altura (duplo clique volta ao automático)"
          onPointerDown={(evento) => redimensionar(evento, { x: false, y: true })}
          onDoubleClick={() => atualizarWidget(widget.id, { alturaPx: undefined })}
          className="absolute inset-x-4 -bottom-1.5 z-10 h-3 cursor-ns-resize touch-none"
        />
      )}
      <div
        aria-hidden
        title={info.alturaAutomatica ? "Arraste para mudar a largura" : "Arraste para redimensionar (duplo clique volta a altura ao automático)"}
        onPointerDown={(evento) => redimensionar(evento, { x: true, y: !info.alturaAutomatica })}
        onDoubleClick={() => atualizarWidget(widget.id, { alturaPx: undefined })}
        className={cn(
          "absolute right-0 bottom-0 z-20 flex size-6 touch-none items-end justify-end p-1.5 text-muted-foreground transition-opacity",
          info.alturaAutomatica ? "cursor-ew-resize max-lg:hidden" : "cursor-nwse-resize",
          provisorio ? "opacity-100" : "opacity-0 group-hover/widget:opacity-100"
        )}
      >
        <svg viewBox="0 0 10 10" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M9 1 1 9M9 5 5 9" />
        </svg>
      </div>
      {provisorio && colunas > 1 && (
        <span className="pointer-events-none absolute top-2 right-2 z-20 rounded-md bg-foreground px-1.5 py-0.5 text-xs font-medium text-background tabular-nums max-lg:hidden">
          {largura === colunas ? "Inteira" : `${largura}/${colunas}`}
        </span>
      )}
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
        descricao={FRASE_INICIO}
        acoes={
          <>
            <Button onClick={() => router.push(`/notas/${criarNota().id}`)}>
              <FilePlusIcon /> Nova nota
            </Button>
            <Button variant="outline" onClick={abrirBusca}>
              <SearchIcon /> Buscar <Kbd>Ctrl K</Kbd>
            </Button>
            <Button variant="outline" size="icon" aria-label="Adicionar widget" title="Adicionar widget" onClick={() => setGaleria(true)}>
              <PlusIcon />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Restaurar padrão" title="Restaurar padrão" onClick={() => setRestaurando(true)}>
              <RotateCcwIcon />
            </Button>
          </>
        }
      />

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
        <DndContext sensors={sensores} collisionDetection={pointerWithin} onDragEnd={aoSoltar}>
          <div className={cn("grid grid-flow-row-dense grid-cols-1 md:grid-cols-2", "lg:grid-cols-4 gap-4")}>
            {widgets.map((widget) => (
              <CartaoWidget key={widget.id} widget={widget} colunas={colunas} aoConfigurar={() => setIdConfigurando(widget.id)} />
            ))}
          </div>
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
