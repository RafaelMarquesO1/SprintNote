"use client"

import { useEffect, useRef, useState } from "react"
import { ZoomInIcon, ZoomOutIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import type { CorteAvatar } from "@/lib/imagem"

// Rafael Marques - 23/10/2026
// Enquadramento da foto de perfil: arraste para posicionar e use o zoom para
// aproximar. O que fica dentro do círculo é o que vira a foto.

const LADO = 256
const ZOOM_MAXIMO = 4

type Props = {
  arquivo: File
  salvando?: boolean
  onCancelar: () => void
  onConfirmar: (arquivo: File, corte: CorteAvatar) => void
}

export function EnquadrarFoto({ arquivo, salvando, onCancelar, onConfirmar }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [tamanho, setTamanho] = useState<{ largura: number; altura: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  // Deslocamento do centro da imagem em relação ao centro do quadro, em px da tela.
  const [deslocamento, setDeslocamento] = useState({ x: 0, y: 0 })
  const arrasto = useRef<{ x: number; y: number; inicio: { x: number; y: number } } | null>(null)

  // A prévia vem de um data URL lido do arquivo (o componente é montado de novo a cada foto).
  useEffect(() => {
    const leitor = new FileReader()
    leitor.onload = () => setUrl(String(leitor.result))
    leitor.readAsDataURL(arquivo)
    return () => {
      leitor.onload = null
    }
  }, [arquivo])

  // Escala em que a imagem cobre o quadro inteiro (zoom 1).
  const base = tamanho ? LADO / Math.min(tamanho.largura, tamanho.altura) : 1
  const escala = base * zoom

  // Mantém a imagem cobrindo o quadro: sem bordas vazias dentro do círculo.
  function limitar(ponto: { x: number; y: number }, escalaAtual = escala) {
    if (!tamanho) return ponto
    const folgaX = Math.max(0, (tamanho.largura * escalaAtual - LADO) / 2)
    const folgaY = Math.max(0, (tamanho.altura * escalaAtual - LADO) / 2)
    return { x: Math.min(folgaX, Math.max(-folgaX, ponto.x)), y: Math.min(folgaY, Math.max(-folgaY, ponto.y)) }
  }

  function mudarZoom(novo: number) {
    const limitado = Math.min(ZOOM_MAXIMO, Math.max(1, novo))
    setZoom(limitado)
    setDeslocamento((atual) => limitar(atual, base * limitado))
  }

  function confirmar() {
    if (!tamanho) return
    const lado = LADO / escala
    const x = (tamanho.largura * escala - LADO) / 2 - deslocamento.x
    const y = (tamanho.altura * escala - LADO) / 2 - deslocamento.y
    onConfirmar(arquivo, { x: Math.max(0, x / escala), y: Math.max(0, y / escala), lado })
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && !salvando && onCancelar()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Enquadrar foto</DialogTitle>
          <DialogDescription>Arraste para posicionar e use o zoom. A parte dentro do círculo será a sua foto.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div
            className="relative touch-none cursor-grab overflow-hidden rounded-md bg-muted select-none active:cursor-grabbing"
            style={{ width: LADO, height: LADO }}
            onPointerDown={(evento) => {
              evento.currentTarget.setPointerCapture(evento.pointerId)
              arrasto.current = { x: evento.clientX, y: evento.clientY, inicio: deslocamento }
            }}
            onPointerMove={(evento) => {
              if (!arrasto.current) return
              setDeslocamento(
                limitar({
                  x: arrasto.current.inicio.x + evento.clientX - arrasto.current.x,
                  y: arrasto.current.inicio.y + evento.clientY - arrasto.current.y,
                })
              )
            }}
            onPointerUp={() => (arrasto.current = null)}
            onPointerCancel={() => (arrasto.current = null)}
            onWheel={(evento) => mudarZoom(zoom - evento.deltaY / 400)}
          >
            {url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt="Prévia da foto"
                draggable={false}
                onLoad={(evento) => setTamanho({ largura: evento.currentTarget.naturalWidth, altura: evento.currentTarget.naturalHeight })}
                className="pointer-events-none absolute top-1/2 left-1/2 max-w-none"
                style={
                  tamanho
                    ? {
                        width: tamanho.largura,
                        height: tamanho.altura,
                        transform: `translate(-50%, -50%) translate(${deslocamento.x}px, ${deslocamento.y}px) scale(${escala})`,
                      }
                    : { visibility: "hidden" }
                }
              />
            )}
            {/* Escurece o que fica fora do círculo. */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/70"
              style={{ boxShadow: "0 0 0 999px rgb(0 0 0 / 0.55)" }}
            />
          </div>

          <div className="flex w-full max-w-64 items-center gap-2 text-muted-foreground">
            <ZoomOutIcon className="size-4 shrink-0" />
            <input
              type="range"
              min={1}
              max={ZOOM_MAXIMO}
              step={0.01}
              value={zoom}
              onChange={(evento) => mudarZoom(Number(evento.target.value))}
              aria-label="Zoom da foto"
              className="h-1.5 w-full cursor-pointer accent-foreground"
            />
            <ZoomInIcon className="size-4 shrink-0" />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancelar} disabled={salvando}>Cancelar</Button>
          <Button type="button" onClick={confirmar} disabled={!tamanho || salvando}>
            {salvando && <Spinner />} Usar foto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
