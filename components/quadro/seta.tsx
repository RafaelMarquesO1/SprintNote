"use client"

// Rafael Marques - 23/10/2026
// Seta do quadro: liga duas peças, aceita texto no meio (duplo clique), linha tracejada,
// pontas e cor. A barra aparece quando a seta está selecionada.

import { memo, useEffect, useRef } from "react"
import { BaseEdge, EdgeLabelRenderer, EdgeToolbar, getBezierPath, MarkerType, type Edge, type EdgeProps } from "@xyflow/react"
import { ArrowLeftRightIcon, ArrowRightIcon, MinusIcon, MoreHorizontalIcon, Trash2Icon, XIcon } from "lucide-react"

import { corDaLinha } from "@/components/quadro/cores"
import { useAcoesQuadro } from "@/components/quadro/contexto"
import { coresQuadro, type PontaSeta } from "@/lib/quadro/modelo"
import { cn } from "@/lib/utils"

export type DadosSeta = { rotulo: string; tracejada: boolean; ponta: PontaSeta; cor?: string }
export type SetaFlux = Edge<DadosSeta>

const proximaPonta: Record<PontaSeta, PontaSeta> = { fim: "ambos", ambos: "nenhuma", nenhuma: "fim" }
const nomePonta: Record<PontaSeta, string> = { fim: "Seta no fim", ambos: "Seta nas duas pontas", nenhuma: "Sem seta" }

function SetaBase({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected }: EdgeProps<SetaFlux>) {
  const acoes = useAcoesQuadro()
  const [caminho, x, y] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
  const rotulo = data?.rotulo ?? ""
  const ponta = data?.ponta ?? "fim"
  const cor = corDaLinha(data?.cor)
  const editando = acoes.editandoId === id
  const campo = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (editando) campo.current?.focus()
  }, [editando])

  const marcador = { type: MarkerType.ArrowClosed, color: cor, width: 18, height: 18 }
  return (
    <>
      {/* Faixa larga e invisível: facilita clicar na linha fina. */}
      <path d={caminho} fill="none" stroke="transparent" strokeWidth={22} className="react-flow__edge-interaction" />
      <BaseEdge
        id={id}
        path={caminho}
        markerEnd={ponta !== "nenhuma" ? `url(#${marcadorId(cor)})` : undefined}
        markerStart={ponta === "ambos" ? `url(#${marcadorId(cor)})` : undefined}
        style={{ stroke: cor, strokeWidth: selected ? 3 : 2, strokeDasharray: data?.tracejada ? "7 5" : undefined }}
      />
      <MarcadorSvg cor={cor} marcador={marcador} />
      <EdgeLabelRenderer>
        {(rotulo || editando) && (
          <div
            className="nodrag nopan absolute rounded-md border bg-background px-2 py-0.5 text-sm shadow-sm"
            style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`, pointerEvents: "all" }}
            onDoubleClick={() => acoes.editavel && acoes.comecarEdicao(id)}
          >
            {editando ? (
              <input
                ref={campo}
                defaultValue={rotulo}
                aria-label="Texto da seta"
                onBlur={(evento) => {
                  acoes.mudarSeta(id, { rotulo: evento.target.value })
                  acoes.comecarEdicao(null)
                }}
                onKeyDown={(evento) => {
                  if (evento.key === "Enter" || evento.key === "Escape") evento.currentTarget.blur()
                  evento.stopPropagation()
                }}
                className="w-28 bg-transparent text-center outline-none"
              />
            ) : (
              rotulo
            )}
          </div>
        )}
      </EdgeLabelRenderer>
      {acoes.editavel && (
        <EdgeToolbar edgeId={id} x={x} y={y} isVisible={selected && !editando} alignX="center" alignY="bottom">
          <div className="nodrag nopan mb-2 flex items-center gap-1.5 rounded-lg bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-foreground/10" style={{ pointerEvents: "all" }}>
            <button type="button" title="Escrever sobre a seta" aria-label="Escrever sobre a seta" onClick={() => acoes.comecarEdicao(id)} className="flex h-6 items-center gap-1 rounded px-1.5 text-xs hover:bg-muted">
              <MoreHorizontalIcon className="size-3.5" /> Texto
            </button>
            <button
              type="button"
              title={data?.tracejada ? "Linha contínua" : "Linha tracejada"}
              aria-label="Alternar tracejado"
              aria-pressed={data?.tracejada}
              onClick={() => acoes.mudarSeta(id, { tracejada: !data?.tracejada })}
              className={cn("flex size-6 items-center justify-center rounded hover:bg-muted", data?.tracejada && "bg-muted")}
            >
              <MinusIcon className="size-3.5" strokeDasharray="3 2" />
            </button>
            <button type="button" title={nomePonta[ponta]} aria-label={nomePonta[ponta]} onClick={() => acoes.mudarSeta(id, { ponta: proximaPonta[ponta] })} className="flex size-6 items-center justify-center rounded hover:bg-muted">
              {ponta === "ambos" ? <ArrowLeftRightIcon className="size-3.5" /> : ponta === "fim" ? <ArrowRightIcon className="size-3.5" /> : <MinusIcon className="size-3.5" />}
            </button>
            <div className="flex items-center gap-1">
              <button type="button" title="Sem cor" aria-label="Sem cor" onClick={() => acoes.mudarSeta(id, { cor: undefined })} className={cn("flex size-5 items-center justify-center rounded-full border bg-muted", !data?.cor && "ring-2 ring-foreground")}>
                <XIcon className="size-3 text-muted-foreground" />
              </button>
              {coresQuadro.map((item) => (
                <button key={item.id} type="button" title={item.nome} aria-label={item.nome} onClick={() => acoes.mudarSeta(id, { cor: item.id })} className={cn("size-5 rounded-full border", data?.cor === item.id && "ring-2 ring-foreground ring-offset-1 ring-offset-background")} style={{ background: item.valor }} />
              ))}
            </div>
            <button type="button" title="Excluir seta (Delete)" aria-label="Excluir seta" onClick={() => acoes.excluir([id])} className="flex size-6 items-center justify-center rounded text-destructive hover:bg-destructive/10">
              <Trash2Icon className="size-3.5" />
            </button>
          </div>
        </EdgeToolbar>
      )}
    </>
  )
}

// Cada cor tem o seu marcador (a ponta da seta herda a cor da linha).
function marcadorId(cor: string) {
  return `ponta-${cor.replace(/[^a-z0-9]/gi, "")}`
}

function MarcadorSvg({ cor, marcador }: { cor: string; marcador: { width: number; height: number } }) {
  return (
    <svg className="pointer-events-none absolute size-0" aria-hidden>
      <defs>
        <marker id={marcadorId(cor)} viewBox="-10 -10 20 20" markerWidth={marcador.width} markerHeight={marcador.height} markerUnits="userSpaceOnUse" orient="auto-start-reverse" refX="0" refY="0">
          <polyline points="-5,-4 0,0 -5,4 -5,-4" fill={cor} stroke={cor} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>
    </svg>
  )
}

export const SetaQuadroPeca = memo(SetaBase)
