"use client"

import { useRef, useState } from "react"
import { ImageIcon, ImageUpIcon, LinkIcon, MoveVerticalIcon, PaletteIcon, Trash2Icon } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNotas } from "@/lib/estado/notas"
import { comprimirImagem } from "@/lib/imagem"
import type { AlturaCapa, Capa, Nota } from "@/lib/tipos"

// Rafael Marques - 21/10/2026
// Capa (banner) da nota: galeria de gradientes e cores, imagem enviada do
// computador ou link de imagem, com ajuste da posição vertical.

export const gradientes = [
  "linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)",
  "linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)",
  "linear-gradient(120deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(120deg, #f6d365 0%, #fda085 100%)",
  "linear-gradient(120deg, #89f7fe 0%, #66a6ff 100%)",
  "linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)",
  "linear-gradient(120deg, #30cfd0 0%, #330867 100%)",
  "linear-gradient(120deg, #434343 0%, #000000 100%)",
  "linear-gradient(120deg, #ff9a9e 0%, #fecfef 100%)",
  "linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)",
  "linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)",
  "linear-gradient(120deg, #c79081 0%, #dfa579 100%)",
]

export const coresSolidas = ["#e9e5e3", "#f4dfcd", "#fbecdd", "#dbeddb", "#d3e5ef", "#e8deee", "#f5e0e9", "#ffe2dd", "#37352f", "#1f3a5f"]

export function estiloCapa(capa: Capa): React.CSSProperties {
  if (capa.tipo === "imagem") {
    return { backgroundImage: `url("${capa.valor}")`, backgroundSize: "cover", backgroundPosition: `center ${capa.posicaoY}%` }
  }
  return { background: capa.valor }
}

export function DialogoCapa({ nota, aberto, aoMudarAberto }: { nota: Nota; aberto: boolean; aoMudarAberto: (aberto: boolean) => void }) {
  const atualizarAparencia = useNotas((estado) => estado.atualizarAparencia)
  const [aba, setAba] = useState<"galeria" | "enviar" | "link">("galeria")
  const [link, setLink] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  function escolher(capa: Capa) {
    atualizarAparencia(nota.id, { capa })
    aoMudarAberto(false)
  }

  async function enviar(arquivo: File | undefined) {
    if (!arquivo) return
    if (!arquivo.type.startsWith("image/")) {
      setErro("Escolha um arquivo de imagem.")
      return
    }
    setErro(null)
    setCarregando(true)
    try {
      escolher({ tipo: "imagem", valor: await comprimirImagem(arquivo), posicaoY: 50 })
    } catch {
      setErro("Não foi possível ler essa imagem.")
    } finally {
      setCarregando(false)
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Capa da nota</DialogTitle>
          <DialogDescription>Escolha um gradiente, uma cor ou uma imagem.</DialogDescription>
        </DialogHeader>
        <Tabs value={aba} onValueChange={(valor) => setAba(valor as typeof aba)}>
          <TabsList>
            <TabsTrigger value="galeria"><PaletteIcon /> Galeria</TabsTrigger>
            <TabsTrigger value="enviar"><ImageUpIcon /> Enviar</TabsTrigger>
            <TabsTrigger value="link"><LinkIcon /> Link</TabsTrigger>
          </TabsList>
        </Tabs>

        {aba === "galeria" && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Gradientes</p>
            <div className="grid grid-cols-4 gap-2">
              {gradientes.map((valor) => (
                <button
                  key={valor}
                  type="button"
                  aria-label="Usar este gradiente"
                  onClick={() => escolher({ tipo: "gradiente", valor, posicaoY: 50 })}
                  className="h-12 rounded-md ring-offset-2 ring-offset-background hover:ring-2 hover:ring-ring"
                  style={{ background: valor }}
                />
              ))}
            </div>
            <p className="text-xs font-medium text-muted-foreground">Cores</p>
            <div className="grid grid-cols-5 gap-2">
              {coresSolidas.map((valor) => (
                <button
                  key={valor}
                  type="button"
                  aria-label={`Usar a cor ${valor}`}
                  onClick={() => escolher({ tipo: "cor", valor, posicaoY: 50 })}
                  className="h-10 rounded-md border ring-offset-2 ring-offset-background hover:ring-2 hover:ring-ring"
                  style={{ background: valor }}
                />
              ))}
            </div>
          </div>
        )}

        {aba === "enviar" && (
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground hover:bg-muted/50",
              carregando && "pointer-events-none opacity-60"
            )}
            onDragOver={(evento) => evento.preventDefault()}
            onDrop={(evento) => {
              evento.preventDefault()
              enviar(evento.dataTransfer.files[0])
            }}
          >
            <ImageIcon className="size-6" />
            {carregando ? "Preparando a imagem…" : "Clique para escolher ou arraste uma imagem aqui"}
            <span className="text-xs">A imagem é reduzida e fica salva só no seu navegador.</span>
            <input type="file" accept="image/*" className="sr-only" onChange={(evento) => enviar(evento.target.files?.[0])} />
          </label>
        )}

        {aba === "link" && (
          <form
            className="flex gap-2"
            onSubmit={(evento) => {
              evento.preventDefault()
              if (!/^https?:\/\//.test(link.trim())) {
                setErro("Cole um link que comece com http:// ou https://")
                return
              }
              escolher({ tipo: "imagem", valor: link.trim(), posicaoY: 50 })
            }}
          >
            <Input value={link} onChange={(evento) => setLink(evento.target.value)} placeholder="https://exemplo.com/imagem.jpg" aria-label="Link da imagem" />
            <Button type="submit">Usar</Button>
          </form>
        )}
        {erro && <p className="text-sm text-destructive">{erro}</p>}
      </DialogContent>
    </Dialog>
  )
}

// Capa exibida no topo da nota, com botões ao passar o mouse.
const alturas: Record<AlturaCapa, string> = {
  baixa: "h-[18vh] max-h-40 min-h-24",
  media: "h-[28vh] max-h-72 min-h-36",
  alta: "h-[42vh] max-h-[28rem] min-h-52",
}

export function CapaNota({ nota, altura = "media", aoTrocar }: { nota: Nota; altura?: AlturaCapa; aoTrocar: () => void }) {
  const atualizarAparencia = useNotas((estado) => estado.atualizarAparencia)
  const capa = nota.aparencia?.capa
  const [reposicionando, setReposicionando] = useState(false)
  const [posicao, setPosicao] = useState(capa?.posicaoY ?? 50)
  const arrasto = useRef<{ y: number; inicial: number } | null>(null)
  const elemento = useRef<HTMLDivElement>(null)

  if (!capa) return null
  const posicaoAtual = reposicionando ? posicao : capa.posicaoY

  return (
    <div
      ref={elemento}
      className={cn("group/capa relative w-full transition-[height]", alturas[altura], reposicionando && "cursor-ns-resize")}
      style={estiloCapa({ ...capa, posicaoY: posicaoAtual })}
      onPointerDown={(evento) => {
        if (!reposicionando) return
        evento.currentTarget.setPointerCapture(evento.pointerId)
        arrasto.current = { y: evento.clientY, inicial: posicao }
      }}
      onPointerMove={(evento) => {
        if (!arrasto.current || !elemento.current) return
        const delta = ((evento.clientY - arrasto.current.y) / elemento.current.clientHeight) * 100
        setPosicao(Math.max(0, Math.min(100, arrasto.current.inicial - delta)))
      }}
      onPointerUp={() => {
        arrasto.current = null
      }}
    >
      {reposicionando && (
        <span className="absolute inset-x-0 top-1/2 mx-auto w-fit -translate-y-1/2 rounded-md bg-black/50 px-3 py-1 text-xs text-white">
          Arraste a imagem para cima ou para baixo
        </span>
      )}
      <div
        className={cn(
          "absolute right-3 bottom-3 flex gap-1 opacity-0 transition-opacity group-hover/capa:opacity-100 focus-within:opacity-100",
          reposicionando && "opacity-100"
        )}
      >
        {reposicionando ? (
          <>
            <Button size="xs" variant="secondary" onClick={() => setReposicionando(false)}>Cancelar</Button>
            <Button
              size="xs"
              onClick={() => {
                atualizarAparencia(nota.id, { capa: { ...capa, posicaoY: posicao } })
                setReposicionando(false)
              }}
            >
              Salvar posição
            </Button>
          </>
        ) : (
          <>
            <Button size="xs" variant="secondary" onClick={aoTrocar}><ImageIcon /> Trocar capa</Button>
            {capa.tipo === "imagem" && (
              <Button
                size="xs"
                variant="secondary"
                onClick={() => {
                  setPosicao(capa.posicaoY)
                  setReposicionando(true)
                }}
              >
                <MoveVerticalIcon /> Reposicionar
              </Button>
            )}
            <Button size="xs" variant="secondary" aria-label="Remover capa" onClick={() => atualizarAparencia(nota.id, { capa: null })}>
              <Trash2Icon />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
