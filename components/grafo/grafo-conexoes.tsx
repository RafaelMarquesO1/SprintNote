"use client"

import { useEffect, useId, useRef, useState } from "react"
import { LocateFixedIcon, MinusIcon, PlusIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import { coresLivroPadrao } from "@/lib/cores"
import { useNotas } from "@/lib/estado/notas"
import type { ArestaGrafo, NoGrafo } from "@/lib/grafo"

// Rafael Marques - 20/10/2026 (visual mais limpo em 21/10/2026)
// Grafo interativo no estilo Obsidian, desenhado em SVG com uma simulação
// de forças simples: nós se repelem, conexões puxam como molas.
//  - arraste o fundo para mover, use a roda do mouse (ou +/-) para zoom
//  - arraste um nó para reposicionar, clique para abrir
//  - passe o mouse para destacar as conexões de um nó
// Para não poluir: linhas finas e curvas, e só os nomes importantes aparecem
// (os outros surgem ao aproximar o zoom ou passar o mouse).

type Ponto = { x: number; y: number; vx: number; vy: number; fixo: boolean }
type Visao = { x: number; y: number; escala: number }

export const coresLivro = coresLivroPadrao

function raio(no: NoGrafo) {
  if (no.tipo === "livro") return 9 + Math.sqrt(no.grau) * 1.6
  if (no.tipo === "fantasma") return 3.5
  if (no.tipo === "tag") return 2.5 + Math.sqrt(no.grau) * 0.6
  if (no.secao) return 6 + Math.sqrt(no.grau) * 1.3
  return 4 + Math.sqrt(no.grau) * 1.3
}

// Curva suave entre dois pontos (deixa o grafo menos "riscado").
function caminhoCurvo(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const dx = b.x - a.x
  const dy = b.y - a.y
  const curva = 0.12
  return `M${a.x},${a.y} Q${mx - dy * curva},${my + dx * curva} ${b.x},${b.y}`
}

function encurtar(texto: string, limite = 24) {
  return texto.length > limite ? `${texto.slice(0, limite - 1)}…` : texto
}

export function GrafoConexoes({
  nos,
  arestas,
  ordemLivros,
  altura = 520,
  selecionadoId,
  focoId,
  aoClicarNo,
  mostrarLegenda = false,
  destacarFoco = false,
  children,
  className,
}: {
  nos: NoGrafo[]
  arestas: ArestaGrafo[]
  // Ordem dos livros, para cada um ter sempre a mesma cor.
  ordemLivros: string[]
  altura?: number | string
  selecionadoId?: string | null
  focoId?: string | null
  aoClicarNo: (no: NoGrafo) => void
  mostrarLegenda?: boolean
  // true: o nó em foco (ex.: resultado da busca) apaga os que não são vizinhos.
  destacarFoco?: boolean
  // Elementos flutuando sobre o grafo (avisos, por exemplo).
  children?: React.ReactNode
  className?: string
}) {
  const idPadrao = useId()
  const svgRef = useRef<SVGSVGElement>(null)
  const livros = useNotas((estado) => estado.livros)
  const pontos = useRef(new Map<string, Ponto>())
  const calor = useRef(1)
  const visaoRef = useRef<Visao>({ x: 0, y: 0, escala: 1 })
  const arrasto = useRef<{ tipo: "fundo" | "no"; id?: string; x: number; y: number; moveu: boolean } | null>(null)
  const dados = useRef({ nos, arestas })
  const ajustou = useRef(false)

  const [posicoes, setPosicoes] = useState<Record<string, { x: number; y: number }>>({})
  const [visao, setVisao] = useState<Visao>({ x: 0, y: 0, escala: 1 })
  const [tamanho, setTamanho] = useState({ largura: 800, altura: 500 })
  const [sobreId, setSobreId] = useState<string | null>(null)

  function definirVisao(nova: Visao) {
    visaoRef.current = nova
    setVisao(nova)
  }

  // Enquadra todos os nós na área visível.
  function enquadrar() {
    const lista = [...pontos.current.values()]
    if (lista.length === 0) return
    const xs = lista.map((ponto) => ponto.x)
    const ys = lista.map((ponto) => ponto.y)
    const larguraConteudo = Math.max(...xs) - Math.min(...xs) + 160
    const alturaConteudo = Math.max(...ys) - Math.min(...ys) + 160
    const svg = svgRef.current
    const largura = svg?.clientWidth ?? 800
    const alturaTela = svg?.clientHeight ?? 500
    const escala = Math.max(0.2, Math.min(1.6, Math.min(largura / larguraConteudo, alturaTela / alturaConteudo)))
    const centroX = (Math.max(...xs) + Math.min(...xs)) / 2
    const centroY = (Math.max(...ys) + Math.min(...ys)) / 2
    definirVisao({ x: largura / 2 - centroX * escala, y: alturaTela / 2 - centroY * escala, escala })
  }

  // Novos nós nascem perto de um vizinho (ou num círculo); a simulação reaquece.
  useEffect(() => {
    dados.current = { nos, arestas }
    const mapa = pontos.current
    const ids = new Set(nos.map((no) => no.id))
    for (const id of [...mapa.keys()]) if (!ids.has(id)) mapa.delete(id)
    nos.forEach((no, indice) => {
      if (mapa.has(no.id)) return
      const vizinho = arestas
        .flatMap((aresta) => (aresta.origem === no.id ? [aresta.destino] : aresta.destino === no.id ? [aresta.origem] : []))
        .map((id) => mapa.get(id))
        .find(Boolean)
      const angulo = (indice / Math.max(1, nos.length)) * Math.PI * 2
      mapa.set(no.id, {
        x: vizinho ? vizinho.x + (Math.random() - 0.5) * 80 : Math.cos(angulo) * 200 + (Math.random() - 0.5) * 20,
        y: vizinho ? vizinho.y + (Math.random() - 0.5) * 80 : Math.sin(angulo) * 200 + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
        fixo: false,
      })
    })
    calor.current = 1
  }, [nos, arestas])

  // Laço da simulação.
  useEffect(() => {
    let quadro = 0
    function passo() {
      const { nos: listaNos, arestas: listaArestas } = dados.current
      const mapa = pontos.current
      if (calor.current > 0.005) {
        const alfa = calor.current
        const lista = listaNos
          .map((no) => ({ no, ponto: mapa.get(no.id) }))
          .filter((item): item is { no: NoGrafo; ponto: Ponto } => Boolean(item.ponto))
        // Repulsão entre todos os pares + "colisão" para os nós não se sobreporem.
        for (let i = 0; i < lista.length; i++) {
          for (let j = i + 1; j < lista.length; j++) {
            const a = lista[i].ponto
            const b = lista[j].ponto
            let dx = a.x - b.x
            let dy = a.y - b.y
            let distancia2 = dx * dx + dy * dy
            if (distancia2 < 1) {
              dx = Math.random() - 0.5
              dy = Math.random() - 0.5
              distancia2 = 1
            }
            if (distancia2 > 360000) continue
            const distancia = Math.sqrt(distancia2)
            const minimo = raio(lista[i].no) + raio(lista[j].no) + 14
            let forca = (2200 / distancia2) * alfa
            if (distancia < minimo) forca += ((minimo - distancia) / distancia) * 0.5
            a.vx += (dx / distancia) * forca
            a.vy += (dy / distancia) * forca
            b.vx -= (dx / distancia) * forca
            b.vy -= (dy / distancia) * forca
          }
        }
        // Molas nas conexões.
        for (const aresta of listaArestas) {
          const a = mapa.get(aresta.origem)
          const b = mapa.get(aresta.destino)
          if (!a || !b) continue
          const dx = b.x - a.x
          const dy = b.y - a.y
          const distancia = Math.sqrt(dx * dx + dy * dy) || 1
          const ideal = aresta.tipo === "estrutura" ? 75 : aresta.tipo === "tag" ? 85 : 110
          const forca = (distancia - ideal) * 0.035 * alfa
          a.vx += (dx / distancia) * forca
          a.vy += (dy / distancia) * forca
          b.vx -= (dx / distancia) * forca
          b.vy -= (dy / distancia) * forca
        }
        // Gravidade leve para o centro e atrito.
        for (const { ponto } of lista) {
          if (ponto.fixo) {
            ponto.vx = 0
            ponto.vy = 0
            continue
          }
          ponto.vx = (ponto.vx - ponto.x * 0.006 * alfa) * 0.8
          ponto.vy = (ponto.vy - ponto.y * 0.006 * alfa) * 0.8
          ponto.x += Math.max(-30, Math.min(30, ponto.vx))
          ponto.y += Math.max(-30, Math.min(30, ponto.vy))
        }
        calor.current *= 0.985
        const novas: Record<string, { x: number; y: number }> = {}
        for (const [id, ponto] of mapa) novas[id] = { x: ponto.x, y: ponto.y }
        setPosicoes(novas)
        if (!ajustou.current && calor.current < 0.35) {
          ajustou.current = true
          enquadrar()
        }
      }
      quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
    // O laço roda uma vez só e lê tudo por refs; "enquadrar" também só usa refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tamanho da área e zoom pela roda do mouse (precisa de listener não passivo).
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const observador = new ResizeObserver(() => setTamanho({ largura: svg.clientWidth, altura: svg.clientHeight }))
    observador.observe(svg)
    function aoRolar(evento: WheelEvent) {
      evento.preventDefault()
      const caixa = svg!.getBoundingClientRect()
      const atual = visaoRef.current
      const escala = Math.max(0.15, Math.min(4, atual.escala * Math.exp(-evento.deltaY * 0.0015)))
      const px = evento.clientX - caixa.left
      const py = evento.clientY - caixa.top
      definirVisao({
        escala,
        x: px - ((px - atual.x) / atual.escala) * escala,
        y: py - ((py - atual.y) / atual.escala) * escala,
      })
    }
    svg.addEventListener("wheel", aoRolar, { passive: false })
    return () => {
      observador.disconnect()
      svg.removeEventListener("wheel", aoRolar)
    }
  }, [])

  // Primeiro enquadramento: centraliza a origem.
  useEffect(() => {
    if (!ajustou.current) definirVisao({ x: tamanho.largura / 2, y: tamanho.altura / 2, escala: 1 })
  }, [tamanho])

  function paraMundo(evento: React.PointerEvent) {
    const caixa = svgRef.current!.getBoundingClientRect()
    const atual = visaoRef.current
    return { x: (evento.clientX - caixa.left - atual.x) / atual.escala, y: (evento.clientY - caixa.top - atual.y) / atual.escala }
  }

  function aoPressionar(evento: React.PointerEvent, id?: string) {
    evento.stopPropagation()
    svgRef.current?.setPointerCapture(evento.pointerId)
    arrasto.current = { tipo: id ? "no" : "fundo", id, x: evento.clientX, y: evento.clientY, moveu: false }
    if (id) {
      const ponto = pontos.current.get(id)
      if (ponto) ponto.fixo = true
    }
  }

  function aoMover(evento: React.PointerEvent) {
    const atual = arrasto.current
    if (!atual) return
    const dx = evento.clientX - atual.x
    const dy = evento.clientY - atual.y
    if (Math.abs(dx) + Math.abs(dy) > 3) atual.moveu = true
    if (atual.tipo === "fundo") {
      const visaoAtual = visaoRef.current
      definirVisao({ ...visaoAtual, x: visaoAtual.x + dx, y: visaoAtual.y + dy })
      atual.x = evento.clientX
      atual.y = evento.clientY
      return
    }
    const ponto = atual.id ? pontos.current.get(atual.id) : undefined
    if (ponto && atual.moveu) {
      const mundo = paraMundo(evento)
      ponto.x = mundo.x
      ponto.y = mundo.y
      calor.current = Math.max(calor.current, 0.3)
    }
  }

  function aoSoltar() {
    const atual = arrasto.current
    arrasto.current = null
    if (!atual || atual.tipo !== "no" || !atual.id) return
    const ponto = pontos.current.get(atual.id)
    if (ponto) ponto.fixo = false
    if (!atual.moveu) {
      const no = dados.current.nos.find((item) => item.id === atual.id)
      if (no) aoClicarNo(no)
    }
  }

  function zoom(fator: number) {
    const atual = visaoRef.current
    const escala = Math.max(0.15, Math.min(4, atual.escala * fator))
    const cx = tamanho.largura / 2
    const cy = tamanho.altura / 2
    definirVisao({ escala, x: cx - ((cx - atual.x) / atual.escala) * escala, y: cy - ((cy - atual.y) / atual.escala) * escala })
  }

  // Destaque: nó sob o mouse (ou em foco) e seus vizinhos.
  const destaque = sobreId ?? (destacarFoco ? focoId : null) ?? null
  const vizinhos = new Set<string>()
  if (destaque) {
    vizinhos.add(destaque)
    for (const aresta of arestas) {
      if (aresta.origem === destaque) vizinhos.add(aresta.destino)
      if (aresta.destino === destaque) vizinhos.add(aresta.origem)
    }
  }
  const esmaecer = (id: string) => destaque !== null && !vizinhos.has(id)

  function cor(no: NoGrafo | undefined) {
    if (!no || no.tipo === "fantasma" || no.tipo === "tag") return "var(--muted-foreground)"
    const indice = no.livroId ? ordemLivros.indexOf(no.livroId) : -1
    if (indice < 0) return "var(--muted-foreground)"
    // Cor escolhida pelo usuário na biblioteca; senão, a automática.
    return livros.find((livro) => livro.id === no.livroId)?.cor || coresLivro[indice % coresLivro.length]
  }

  // Só os nomes importantes ficam sempre visíveis: livros e as notas mais
  // conectadas. Os outros aparecem ao aproximar o zoom ou passar o mouse.
  const grausNotas = nos.filter((no) => no.tipo === "nota").map((no) => no.grau).sort((a, b) => b - a)
  const grauImportante = Math.max(2, grausNotas[Math.floor(grausNotas.length * 0.15)] ?? 2)
  function rotuloVisivel(no: NoGrafo) {
    if (vizinhos.has(no.id) || no.id === selecionadoId) return true
    if (destaque !== null) return false
    if (no.tipo === "livro") return visao.escala > 0.35
    if (no.secao) return visao.escala > 0.5 // Rafael Marques - 29/10/2026
    if (visao.escala >= 1.25) return no.tipo !== "tag" || visao.escala >= 1.6
    return no.tipo === "nota" && no.grau >= grauImportante && visao.escala >= 0.7
  }

  const noDestaque = destaque ? nos.find((no) => no.id === destaque) : undefined
  const corDestaque = cor(noDestaque)
  const espessura = 1 / Math.max(0.7, visao.escala)
  const tamanhoFonte = 10.5 / Math.max(0.75, visao.escala)

  return (
    <div className={cn("relative overflow-hidden rounded-xl border bg-card", className)} style={{ height: altura }}>
      <svg
        ref={svgRef}
        role="img"
        aria-label="Grafo de conexões entre livros e notas"
        className="size-full cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={(evento) => aoPressionar(evento)}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
      >
        {/* Fundo pontilhado que acompanha o zoom */}
        <defs>
          <pattern
            id={`pontos-${idPadrao}`}
            width={24 * visao.escala}
            height={24 * visao.escala}
            patternUnits="userSpaceOnUse"
            x={visao.x}
            y={visao.y}
          >
            <circle cx={1} cy={1} r={0.9} fill="var(--muted-foreground)" fillOpacity={0.22} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#pontos-${idPadrao})`} />

        <g transform={`translate(${visao.x} ${visao.y}) scale(${visao.escala})`}>
          {/* Conexões */}
          <g fill="none" strokeLinecap="round">
            {arestas.map((aresta) => {
              const a = posicoes[aresta.origem]
              const b = posicoes[aresta.destino]
              if (!a || !b) return null
              const ligada = destaque !== null && (aresta.origem === destaque || aresta.destino === destaque)
              const base = aresta.tipo === "link" ? 0.3 : aresta.tipo === "estrutura" ? 0.14 : 0.1
              return (
                <path
                  key={`${aresta.origem}-${aresta.destino}-${aresta.tipo}`}
                  d={caminhoCurvo(a, b)}
                  stroke={ligada ? corDestaque : "var(--muted-foreground)"}
                  strokeOpacity={ligada ? 0.85 : destaque !== null ? 0.05 : base}
                  strokeWidth={(ligada ? 1.6 : aresta.tipo === "link" ? 1 : 0.8) * espessura}
                  strokeDasharray={aresta.tipo === "tag" ? `${1 * espessura} ${3 * espessura}` : undefined}
                  className="transition-[stroke-opacity] duration-200"
                />
              )
            })}
          </g>

          {/* Nós */}
          {nos.map((no) => {
            const posicao = posicoes[no.id]
            if (!posicao) return null
            const r = raio(no)
            const corNo = cor(no)
            const ativo = no.id === destaque || no.id === selecionadoId || no.id === focoId
            const mostrarNome = rotuloVisivel(no)
            return (
              <g
                key={no.id}
                transform={`translate(${posicao.x} ${posicao.y})`}
                opacity={esmaecer(no.id) ? 0.12 : 1}
                className="cursor-pointer transition-opacity duration-200"
                onPointerDown={(evento) => aoPressionar(evento, no.id)}
                onPointerEnter={() => setSobreId(no.id)}
                onPointerLeave={() => setSobreId(null)}
              >
                {/* Brilho do nó em destaque */}
                {ativo && <circle r={r + 7} fill={corNo} fillOpacity={0.18} />}
                {no.tipo === "livro" ? (
                  <>
                    <circle r={r} fill={corNo} fillOpacity={0.22} stroke={corNo} strokeWidth={2.2} />
                    <circle r={r * 0.38} fill={corNo} />
                  </>
                ) : no.tipo === "fantasma" ? (
                  <circle r={r} fill="var(--card)" stroke="var(--muted-foreground)" strokeOpacity={0.6} strokeWidth={1} strokeDasharray="1.5 1.5" />
                ) : no.secao ? (
                  // Rafael Marques - 29/10/2026: seção = quadrado arredondado com contorno.
                  <>
                    <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={r * 0.35} fill={corNo} fillOpacity={0.25} stroke={corNo} strokeWidth={1.8} />
                    <rect x={-r * 0.45} y={-r * 0.45} width={r * 0.9} height={r * 0.9} rx={r * 0.15} fill={corNo} />
                  </>
                ) : (
                  <circle r={r} fill={corNo} fillOpacity={no.tipo === "tag" ? 0.55 : 1} />
                )}
                {/* Área de toque maior que o desenho */}
                <circle r={Math.max(r, 9)} fill="transparent" />
                {mostrarNome && (
                  <text
                    y={r + tamanhoFonte * 1.25}
                    textAnchor="middle"
                    fontSize={no.tipo === "livro" ? tamanhoFonte * 1.15 : tamanhoFonte}
                    fontWeight={no.tipo === "livro" || no.secao || ativo ? 600 : 400}
                    fill={ativo || no.tipo === "livro" || no.secao ? "var(--foreground)" : "var(--muted-foreground)"}
                    stroke="var(--card)"
                    strokeWidth={3 / Math.max(0.75, visao.escala)}
                    strokeLinejoin="round"
                    paintOrder="stroke"
                    className="pointer-events-none"
                  >
                    {no.tipo === "tag" ? no.titulo : encurtar(no.titulo)}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {children}

      {mostrarLegenda && (
        <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border bg-background/80 px-2.5 py-1.5 text-[11px] text-muted-foreground backdrop-blur">
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" aria-hidden><circle cx="6" cy="6" r="4.5" fill="var(--grafo-1)" fillOpacity={0.25} stroke="var(--grafo-1)" strokeWidth={1.5} /><circle cx="6" cy="6" r="1.8" fill="var(--grafo-1)" /></svg>
            Livro
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" aria-hidden><rect x="1.5" y="1.5" width="9" height="9" rx="2.5" fill="var(--grafo-1)" fillOpacity={0.25} stroke="var(--grafo-1)" strokeWidth={1.5} /><rect x="4" y="4" width="4" height="4" rx="1" fill="var(--grafo-1)" /></svg>
            Seção
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="10" height="10" aria-hidden><circle cx="5" cy="5" r="3.5" fill="var(--grafo-1)" /></svg>
            Nota
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="10" height="10" aria-hidden><circle cx="5" cy="5" r="3.5" fill="none" stroke="currentColor" strokeDasharray="1.5 1.5" /></svg>
            Não criada
          </span>
        </div>
      )}

      {/* Zoom */}
      <div className="absolute right-3 bottom-3 flex flex-col overflow-hidden rounded-lg border bg-background/80 shadow-xs backdrop-blur">
        <button type="button" title="Aproximar" aria-label="Aproximar" onClick={() => zoom(1.25)} className="flex size-8 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground">
          <PlusIcon className="size-4" />
        </button>
        <button type="button" title="Afastar" aria-label="Afastar" onClick={() => zoom(0.8)} className="flex size-8 items-center justify-center border-y text-muted-foreground hover:bg-muted hover:text-foreground">
          <MinusIcon className="size-4" />
        </button>
        <button type="button" title="Enquadrar tudo" aria-label="Enquadrar tudo" onClick={() => enquadrar()} className="flex size-8 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground">
          <LocateFixedIcon className="size-4" />
        </button>
      </div>
    </div>
  )
}
