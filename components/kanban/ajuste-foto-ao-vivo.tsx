"use client"

// Rafael Marques - 26/10/2026
// Ajuste da foto de fundo direto no quadro (o que você vê é o que fica): arraste em qualquer
// lugar para enquadrar, role para aproximar e use a barra de baixo para zoom e desfoque.
// Visibilidade e brilho são automáticos. Nada é salvo até "Aplicar"; Esc cancela.

import { useEffect, useRef } from "react"
import { ImagePlusIcon, MoveIcon, RotateCcwIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ajusteFotoPadrao, normalizarAjuste, type AjusteFoto } from "@/lib/kanban/fundo"

function Deslizante({ rotulo, valor, minimo, maximo, texto, aoMudar }: { rotulo: string; valor: number; minimo: number; maximo: number; texto: string; aoMudar: (valor: number) => void }) {
  const id = `ajuste-${rotulo}`
  return (
    <div className="w-36 space-y-0.5 sm:w-44">
      <div className="flex items-center justify-between text-xs">
        <label htmlFor={id} className="font-medium">
          {rotulo}
        </label>
        <span className="text-muted-foreground tabular-nums">{texto}</span>
      </div>
      <input id={id} type="range" min={minimo} max={maximo} step={1} value={valor} onChange={(evento) => aoMudar(Number(evento.target.value))} className="w-full accent-[var(--foreground)]" />
    </div>
  )
}

export function AjusteFotoAoVivo({
  ajuste,
  aoMudar,
  aoTrocarFoto,
  aoRemover,
  aoCancelar,
  aoAplicar,
  preparando,
  aviso,
}: {
  ajuste: AjusteFoto
  aoMudar: (ajuste: AjusteFoto) => void
  aoTrocarFoto: (arquivo: File) => void
  aoRemover: () => void
  aoCancelar: () => void
  aoAplicar: () => void
  preparando: boolean
  aviso: string | null
}) {
  const entrada = useRef<HTMLInputElement>(null)
  const camada = useRef<HTMLDivElement>(null)
  const arrasto = useRef<{ x: number; y: number; inicioX: number; inicioY: number } | null>(null)
  const atual = useRef(ajuste)
  useEffect(() => {
    atual.current = ajuste
  }, [ajuste])
  const mudar = (mudancas: Partial<AjusteFoto>) => aoMudar(normalizarAjuste({ ...atual.current, ...mudancas }))

  // Esc cancela; roda do mouse aproxima ou afasta (sem rolar a página por baixo).
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => evento.key === "Escape" && aoCancelar()
    const elemento = camada.current
    const aoRolar = (evento: WheelEvent) => {
      evento.preventDefault()
      aoMudar(normalizarAjuste({ ...atual.current, zoom: atual.current.zoom - evento.deltaY * 0.15 }))
    }
    window.addEventListener("keydown", aoTeclar)
    elemento?.addEventListener("wheel", aoRolar, { passive: false })
    return () => {
      window.removeEventListener("keydown", aoTeclar)
      elemento?.removeEventListener("wheel", aoRolar)
    }
  }, [aoCancelar, aoMudar])

  return (
    <>
      {/* Camada que pega o arrasto e a roda do mouse em cima do quadro inteiro */}
      <div
        ref={camada}
        className="fixed inset-0 z-40 cursor-move touch-none"
        aria-label="Arraste para enquadrar a foto"
        onPointerDown={(evento) => {
          try {
            evento.currentTarget.setPointerCapture(evento.pointerId)
          } catch {
            // Sem captura o arrasto ainda funciona enquanto o ponteiro estiver na tela.
          }
          arrasto.current = { x: evento.clientX, y: evento.clientY, inicioX: atual.current.x, inicioY: atual.current.y }
        }}
        onPointerMove={(evento) => {
          const inicio = arrasto.current
          if (!inicio) return
          // A foto acompanha o mouse: arrastar para a direita mostra mais da esquerda.
          const fator = 100 / (atual.current.zoom / 100)
          mudar({ x: inicio.inicioX - ((evento.clientX - inicio.x) / window.innerWidth) * fator, y: inicio.inicioY - ((evento.clientY - inicio.y) / window.innerHeight) * fator })
        }}
        onPointerUp={() => (arrasto.current = null)}
        onPointerCancel={() => (arrasto.current = null)}
      >
        <span className="animacao-visao pointer-events-none absolute top-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-popover/95 px-3 py-1.5 text-xs text-popover-foreground shadow-lg ring-1 ring-foreground/10">
          <MoveIcon className="size-3.5" /> Arraste para enquadrar · role para aproximar
        </span>
      </div>

      {/* Barra de ajustes */}
      <div
        role="dialog"
        aria-label="Ajustar a foto de fundo"
        className="animacao-entrar fixed inset-x-3 bottom-4 z-50 mx-auto flex w-fit max-w-[calc(100vw-1.5rem)] flex-wrap items-center justify-center gap-x-4 gap-y-3 rounded-2xl bg-popover p-3 text-popover-foreground shadow-2xl ring-1 ring-foreground/15"
      >
        <Deslizante rotulo="Zoom" valor={ajuste.zoom} minimo={100} maximo={250} texto={`${ajuste.zoom}%`} aoMudar={(zoom) => mudar({ zoom })} />
        <Deslizante rotulo="Desfoque" valor={ajuste.desfoque} minimo={0} maximo={24} texto={ajuste.desfoque === 0 ? "Nítida" : `${ajuste.desfoque} px`} aoMudar={(desfoque) => mudar({ desfoque })} />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" title="Centralizar" aria-label="Centralizar" onClick={() => mudar({ ...ajusteFotoPadrao, desfoque: atual.current.desfoque })}>
            <RotateCcwIcon />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Trocar foto" aria-label="Trocar foto" disabled={preparando} onClick={() => entrada.current?.click()}>
            <ImagePlusIcon />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Remover foto" aria-label="Remover foto" className="text-destructive hover:text-destructive" onClick={aoRemover}>
            <Trash2Icon />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={aoCancelar}>
            Cancelar
          </Button>
          <Button size="sm" disabled={preparando} onClick={aoAplicar}>
            Aplicar
          </Button>
        </div>
        {(aviso || preparando) && (
          <p role="status" className="w-full text-center text-xs text-muted-foreground">
            {preparando ? "Preparando a foto…" : aviso}
          </p>
        )}
        <input
          ref={entrada}
          type="file"
          accept="image/*"
          className="hidden"
          aria-label="Escolher outra foto"
          onChange={(evento) => {
            const arquivo = evento.target.files?.[0]
            if (arquivo) aoTrocarFoto(arquivo)
            evento.target.value = ""
          }}
        />
      </div>
    </>
  )
}
