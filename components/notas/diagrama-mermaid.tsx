"use client"

// Rafael Marques - 29/10/2026 (sugestão do Kaíke)
// Diagrama Mermaid dentro da nota: o bloco ```mermaid vira desenho (no editor e na leitura) e
// pode ser aberto em tela cheia, com zoom e arrastar. A biblioteca só é baixada quando há diagrama.
// Os quadros interativos (formas e setas) continuam sendo o jeito principal de desenhar no SprintNote.

import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { MaximizeIcon, MinusIcon, PlusIcon, RotateCcwIcon, XIcon } from "lucide-react"

let contador = 0

// Desenha o código e devolve o SVG (ou o erro em português simples).
async function desenhar(codigo: string, escuro: boolean) {
  const { default: mermaid } = await import("mermaid")
  mermaid.initialize({
    startOnLoad: false,
    // Preto e branco, como o resto do app; "strict" impede scripts e cliques no diagrama.
    theme: escuro ? "dark" : "neutral",
    securityLevel: "strict",
    fontFamily: "inherit",
  })
  contador += 1
  const { svg } = await mermaid.render(`mermaid-sprintnote-${contador}`, codigo)
  return svg
}

// Acompanha o tema (classe "dark" no <html>) para redesenhar quando ele muda.
function useTemaEscuro() {
  const [escuro, setEscuro] = useState(false)
  useEffect(() => {
    const raiz = document.documentElement
    const ler = () => setEscuro(raiz.classList.contains("dark"))
    ler()
    const observador = new MutationObserver(ler)
    observador.observe(raiz, { attributes: true, attributeFilter: ["class"] })
    return () => observador.disconnect()
  }, [])
  return escuro
}

export function DiagramaMermaid({ codigo, compacto = false }: { codigo: string; compacto?: boolean }) {
  const escuro = useTemaEscuro()
  const [svg, setSvg] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [telaCheia, setTelaCheia] = useState(false)

  useEffect(() => {
    let cancelado = false
    if (!codigo.trim()) return
    // Espera a pessoa parar de digitar antes de redesenhar.
    const espera = setTimeout(() => {
      desenhar(codigo, escuro)
        .then((novo) => {
          if (cancelado) return
          setSvg(novo)
          setErro(null)
        })
        .catch((falha: unknown) => {
          if (cancelado) return
          setErro(falha instanceof Error ? falha.message.split("\n").slice(0, 3).join("\n") : "Não deu para desenhar o diagrama.")
        })
    }, 300)
    return () => {
      cancelado = true
      clearTimeout(espera)
    }
  }, [codigo, escuro])

  if (!codigo.trim()) {
    return <p className="py-4 text-center text-sm text-muted-foreground">Escreva o diagrama no código abaixo.</p>
  }

  return (
    <div className="group/mermaid relative" contentEditable={false}>
      {erro ? (
        <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">O diagrama tem um erro</p>
          <pre className="mt-1 font-mono break-words whitespace-pre-wrap">{erro}</pre>
        </div>
      ) : svg ? (
        <div
          className={compacto ? "diagrama-mermaid max-h-96 overflow-auto" : "diagrama-mermaid overflow-auto"}
          // SVG gerado pelo Mermaid em modo "strict" (já passa pelo DOMPurify da própria biblioteca).
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">Desenhando o diagrama…</p>
      )}
      {svg && !erro && (
        <button
          type="button"
          onMouseDown={(evento) => evento.preventDefault()}
          onClick={(evento) => {
            evento.stopPropagation()
            setTelaCheia(true)
          }}
          title="Abrir em tela cheia"
          aria-label="Abrir diagrama em tela cheia"
          className="absolute top-1 right-1 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-xs text-muted-foreground opacity-0 shadow-sm ring-1 ring-border transition-opacity group-hover/mermaid:opacity-100 hover:text-foreground focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <MaximizeIcon className="size-3.5" /> Tela cheia
        </button>
      )}
      {telaCheia && svg && <TelaCheiaMermaid svg={svg} aoFechar={() => setTelaCheia(false)} />}
    </div>
  )
}

// Tela cheia: roda do mouse dá zoom, arrastar move, Esc fecha.
function TelaCheiaMermaid({ svg, aoFechar }: { svg: string; aoFechar: () => void }) {
  const titulo = useId()
  const [zoom, setZoom] = useState(1)
  const [posicao, setPosicao] = useState({ x: 0, y: 0 })
  const arrasto = useRef<{ x: number; y: number; inicio: { x: number; y: number } } | null>(null)

  useEffect(() => {
    const teclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") aoFechar()
      else if (evento.key === "+" || evento.key === "=") setZoom((atual) => Math.min(8, atual * 1.2))
      else if (evento.key === "-") setZoom((atual) => Math.max(0.2, atual / 1.2))
      else if (evento.key === "0") {
        setZoom(1)
        setPosicao({ x: 0, y: 0 })
      }
    }
    window.addEventListener("keydown", teclar)
    const overflowAntes = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", teclar)
      document.body.style.overflow = overflowAntes
    }
  }, [aoFechar])

  const botao = "flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby={titulo} className="fixed inset-0 z-[80] flex flex-col bg-background">
      <div className="flex items-center gap-1 border-b px-3 py-2">
        <h2 id={titulo} className="mr-auto text-sm font-medium">Diagrama</h2>
        <button type="button" className={botao} aria-label="Diminuir" title="Diminuir (−)" onClick={() => setZoom((atual) => Math.max(0.2, atual / 1.2))}>
          <MinusIcon className="size-4" />
        </button>
        <span className="w-12 text-center text-xs text-muted-foreground tabular-nums">{Math.round(zoom * 100)}%</span>
        <button type="button" className={botao} aria-label="Aumentar" title="Aumentar (+)" onClick={() => setZoom((atual) => Math.min(8, atual * 1.2))}>
          <PlusIcon className="size-4" />
        </button>
        <button
          type="button"
          className={botao}
          aria-label="Voltar ao tamanho original"
          title="Tamanho original (0)"
          onClick={() => {
            setZoom(1)
            setPosicao({ x: 0, y: 0 })
          }}
        >
          <RotateCcwIcon className="size-4" />
        </button>
        <button type="button" className={botao} aria-label="Fechar tela cheia" title="Fechar (Esc)" onClick={aoFechar}>
          <XIcon className="size-4" />
        </button>
      </div>
      <div
        className="relative flex-1 cursor-grab touch-none overflow-hidden active:cursor-grabbing"
        onWheel={(evento) => setZoom((atual) => Math.min(8, Math.max(0.2, atual * (evento.deltaY < 0 ? 1.1 : 1 / 1.1))))}
        onPointerDown={(evento) => {
          evento.currentTarget.setPointerCapture(evento.pointerId)
          arrasto.current = { x: evento.clientX, y: evento.clientY, inicio: posicao }
        }}
        onPointerMove={(evento) => {
          const atual = arrasto.current
          if (atual) setPosicao({ x: atual.inicio.x + evento.clientX - atual.x, y: atual.inicio.y + evento.clientY - atual.y })
        }}
        onPointerUp={() => (arrasto.current = null)}
        onPointerCancel={() => (arrasto.current = null)}
      >
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div
            className="diagrama-mermaid diagrama-mermaid-cheio"
            style={{ transform: `translate(${posicao.x}px, ${posicao.y}px) scale(${zoom})` }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      </div>
    </div>,
    document.body
  )
}
