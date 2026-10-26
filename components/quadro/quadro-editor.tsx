"use client"

// Rafael Marques - 23/10/2026
// Quadro interativo (como o Canvas do Obsidian): tela infinita onde se criam formas, cartões
// de nota e grupos, e se ligam com setas, tudo com o mouse ou o dedo. Duplo clique no vazio cria
// uma forma; arrastar a bolinha de uma peça até o vazio cria outra já ligada.

import "@xyflow/react/dist/style.css"

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type OnConnectEnd,
} from "@xyflow/react"
import { CircleHelpIcon, LayoutTemplateIcon, XIcon, CircleIcon, DiamondIcon, FileTextIcon, FrameIcon, MapIcon, Maximize2Icon, Redo2Icon, SquareIcon, SquareRoundCornerIcon, StickyNoteIcon, TypeIcon, Undo2Icon, ZoomInIcon, ZoomOutIcon, ScanIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ContextoQuadro, type AcoesQuadro } from "@/components/quadro/contexto"
import { EscolherNota } from "@/components/quadro/escolher-nota"
import { NoCartao, NoForma, NoGrupo, type NoFlux } from "@/components/quadro/nos"
import { SetaQuadroPeca, type DadosSeta, type SetaFlux } from "@/components/quadro/seta"
import { modelosQuadro, type ModeloQuadro } from "@/lib/quadro/modelos"
import {
  duplicarNos,
  escreverQuadro,
  lerQuadro,
  nomesForma,
  novaForma,
  novoCartaoNota,
  novoGrupo,
  novoIdQuadro,
  removerNos,
  type FormaQuadro,
  type LadoQuadro,
  type NoQuadro,
  type Quadro,
  type SetaQuadro,
} from "@/lib/quadro/modelo"
import { cn } from "@/lib/utils"

const tiposDePeca = { forma: NoForma, nota: NoCartao, grupo: NoGrupo }
const tiposDeSeta = { seta: SetaQuadroPeca }

const oposto: Record<LadoQuadro, LadoQuadro> = { cima: "baixo", baixo: "cima", esquerda: "direita", direita: "esquerda" }

// ---------- Modelo <-> peças do React Flow ----------

function paraFluxoNo(no: NoQuadro): NoFlux {
  return {
    id: no.id,
    type: no.tipo === "forma" ? "forma" : no.tipo,
    position: { x: no.x, y: no.y },
    width: no.largura,
    height: no.altura,
    zIndex: no.tipo === "grupo" ? -1 : 0,
    data: { tipo: no.tipo, forma: no.forma, texto: no.texto, cor: no.cor, notaId: no.notaId },
  }
}

function paraFluxoSeta(seta: SetaQuadro): SetaFlux {
  return {
    id: seta.id,
    type: "seta",
    source: seta.de,
    target: seta.para,
    sourceHandle: seta.deLado,
    targetHandle: seta.paraLado,
    data: { rotulo: seta.rotulo, tracejada: seta.tracejada, ponta: seta.ponta, cor: seta.cor },
  }
}

function doFluxo(nos: NoFlux[], setas: SetaFlux[]): Quadro {
  return {
    versao: 1,
    nos: nos.map((no) => ({
      id: no.id,
      tipo: no.data.tipo,
      x: Math.round(no.position.x),
      y: Math.round(no.position.y),
      largura: Math.round(no.width ?? no.measured?.width ?? 160),
      altura: Math.round(no.height ?? no.measured?.height ?? 80),
      texto: no.data.texto,
      forma: no.data.forma,
      ...(no.data.cor ? { cor: no.data.cor } : {}),
      ...(no.data.notaId ? { notaId: no.data.notaId } : {}),
    })),
    setas: setas.map((seta) => ({
      id: seta.id,
      de: seta.source,
      para: seta.target,
      ...(seta.sourceHandle ? { deLado: seta.sourceHandle as LadoQuadro } : {}),
      ...(seta.targetHandle ? { paraLado: seta.targetHandle as LadoQuadro } : {}),
      rotulo: seta.data?.rotulo ?? "",
      tracejada: seta.data?.tracejada ?? false,
      ponta: seta.data?.ponta ?? "fim",
      ...(seta.data?.cor ? { cor: seta.data.cor } : {}),
    })),
  }
}

// Segue o modo claro/escuro do app (a classe "dark" no <html>).
function assinarTema(avisar: () => void) {
  const observador = new MutationObserver(avisar)
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
  return () => observador.disconnect()
}

type Props = {
  conteudo: string
  aoMudar: (conteudo: string) => void
  // Nota do próprio quadro (não aparece na escolha de cartões).
  notaId?: string
  editavel?: boolean
  className?: string
}

export function QuadroEditor(props: Props) {
  return (
    <ReactFlowProvider>
      <Interno {...props} />
    </ReactFlowProvider>
  )
}

function Interno({ conteudo, aoMudar, notaId, editavel = true, className }: Props) {
  const router = useRouter()
  const fluxo = useReactFlow<NoFlux, SetaFlux>()
  const tema = useSyncExternalStore(assinarTema, () => (document.documentElement.classList.contains("dark") ? "dark" : "light"), () => "light" as const)
  const [nos, setNos] = useState<NoFlux[]>(() => lerQuadro(conteudo).nos.map(paraFluxoNo))
  const [setas, setSetas] = useState<SetaFlux[]>(() => lerQuadro(conteudo).setas.map(paraFluxoSeta))
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [escolhendoNota, setEscolhendoNota] = useState(false)
  const [minimapa, setMinimapa] = useState(false)
  const [formasAbertas, setFormasAbertas] = useState(false)
  const [modelosAbertos, setModelosAbertos] = useState(false)
  const [ajudaAberta, setAjudaAberta] = useState(false)
  const [menu, setMenu] = useState<{ x: number; y: number; ponto: { x: number; y: number } } | null>(null)
  const [pilhas, setPilhas] = useState({ desfazer: 0, refazer: 0 })

  // Último texto que este editor gravou: se `conteudo` mudar por outro motivo, recarrega.
  const ultimo = useRef(conteudo)
  const passado = useRef<string[]>([])
  const futuro = useRef<string[]>([])
  const aoMudarRef = useRef(aoMudar)
  useEffect(() => {
    aoMudarRef.current = aoMudar
  }, [aoMudar])
  const arrasto = useRef<{ grupo: string; inicio: Map<string, { x: number; y: number }>; origem: { x: number; y: number } } | null>(null)
  const ultimoFim = useRef<Quadro | null>(null)

  useEffect(() => {
    if (conteudo === ultimo.current) return
    ultimo.current = conteudo
    const novo = lerQuadro(conteudo)
    setNos(novo.nos.map(paraFluxoNo))
    setSetas(novo.setas.map(paraFluxoSeta))
  }, [conteudo])

  // Guarda depois de uma pausa; cada gravação vira um passo do desfazer.
  useEffect(() => {
    const quadro = doFluxo(nos, setas)
    ultimoFim.current = quadro
    const texto = escreverQuadro(quadro)
    if (texto === ultimo.current) return
    const espera = setTimeout(() => {
      passado.current.push(ultimo.current)
      if (passado.current.length > 100) passado.current.shift()
      futuro.current = []
      ultimo.current = texto
      aoMudarRef.current(texto)
      setPilhas({ desfazer: passado.current.length, refazer: 0 })
    }, 400)
    return () => clearTimeout(espera)
  }, [nos, setas])

  const carregar = useCallback((texto: string) => {
    const quadro = lerQuadro(texto)
    ultimo.current = texto
    setNos(quadro.nos.map(paraFluxoNo))
    setSetas(quadro.setas.map(paraFluxoSeta))
    aoMudarRef.current(texto)
    setPilhas({ desfazer: passado.current.length, refazer: futuro.current.length })
  }, [])
  const desfazer = useCallback(() => {
    // Se há mudança ainda não gravada, ela entra no histórico antes de voltar.
    const pendente = ultimoFim.current ? escreverQuadro(ultimoFim.current) : ultimo.current
    if (pendente !== ultimo.current) {
      passado.current.push(ultimo.current)
      ultimo.current = pendente
    }
    const anterior = passado.current.pop()
    if (anterior === undefined) return
    futuro.current.push(ultimo.current)
    carregar(anterior)
  }, [carregar])
  const refazer = useCallback(() => {
    const proximo = futuro.current.pop()
    if (proximo === undefined) return
    passado.current.push(ultimo.current)
    carregar(proximo)
  }, [carregar])

  const centroDaTela = useCallback(() => {
    const caixa = document.querySelector(".quadro-raiz .react-flow__pane")?.getBoundingClientRect()
    const ponto = caixa ? { x: caixa.left + caixa.width / 2, y: caixa.top + caixa.height / 2 } : { x: 400, y: 300 }
    const origem = fluxo.screenToFlowPosition(ponto)
    // Pequeno desvio para peças seguidas não ficarem uma em cima da outra.
    const desvio = (passado.current.length % 5) * 18
    return { x: origem.x + desvio, y: origem.y + desvio }
  }, [fluxo])

  const adicionar = useCallback(
    (no: NoQuadro, editar = false) => {
      setNos((atuais) => [...atuais.map((item) => ({ ...item, selected: false })), { ...paraFluxoNo(no), selected: true }])
      setSetas((atuais) => atuais.map((item) => ({ ...item, selected: false })))
      if (editar) setEditandoId(no.id)
    },
    []
  )

  const acoes: AcoesQuadro = useMemo(
    () => ({
      editavel,
      editandoId,
      comecarEdicao: setEditandoId,
      mudarNo: (id, mudancas) => setNos((atuais) => atuais.map((no) => (no.id === id ? { ...no, data: { ...no.data, ...mudancas } } : no))),
      mudarSeta: (id, mudancas) => setSetas((atuais) => atuais.map((seta) => (seta.id === id ? { ...seta, data: { ...(seta.data as DadosSeta), ...mudancas } } : seta))),
      excluir: (ids) => {
        const atual = doFluxo(nos, setas)
        const idsNos = ids.filter((id) => nos.some((no) => no.id === id))
        const resto = removerNos(atual, idsNos)
        const idsSetas = new Set(ids)
        setNos(resto.nos.map(paraFluxoNo).map((novo) => ({ ...novo, selected: false })))
        setSetas(resto.setas.filter((seta) => !idsSetas.has(seta.id)).map(paraFluxoSeta))
      },
      duplicar: (id) => {
        const { quadro, novosIds } = duplicarNos(doFluxo(nos, setas), [id])
        setNos(quadro.nos.map((no) => ({ ...paraFluxoNo(no), selected: novosIds.includes(no.id) })))
        setSetas(quadro.setas.map(paraFluxoSeta))
      },
      adicionarLigada: (id, lado) => {
        const origem = nos.find((no) => no.id === id)
        if (!origem) return
        const nova = novaForma("retangulo", { x: 0, y: 0 })
        const largura = origem.width ?? 180
        const altura = origem.height ?? 80
        const folga = 70
        const posicao = {
          cima: { x: origem.position.x + (largura - nova.largura) / 2, y: origem.position.y - nova.altura - folga },
          baixo: { x: origem.position.x + (largura - nova.largura) / 2, y: origem.position.y + altura + folga },
          esquerda: { x: origem.position.x - nova.largura - folga, y: origem.position.y + (altura - nova.altura) / 2 },
          direita: { x: origem.position.x + largura + folga, y: origem.position.y + (altura - nova.altura) / 2 },
        }[lado]
        nova.x = Math.round(posicao.x)
        nova.y = Math.round(posicao.y)
        setNos((atuais) => [...atuais.map((item) => ({ ...item, selected: false })), { ...paraFluxoNo(nova), selected: true }])
        setSetas((atuais) => [...atuais, { id: novoIdQuadro("s"), type: "seta", source: id, target: nova.id, sourceHandle: lado, targetHandle: oposto[lado], data: { rotulo: "", tracejada: false, ponta: "fim" } }])
        setEditandoId(nova.id)
      },
      abrirNota: (id) => router.push(`/notas/${id}`),
    }),
    [editavel, editandoId, nos, setas, router]
  )

  function aoMudarNos(mudancas: NodeChange<NoFlux>[]) {
    // Somente leitura: só aceita seleção e dimensões.
    const permitidas = editavel ? mudancas : mudancas.filter((m) => m.type === "select" || m.type === "dimensions")
    setNos((atuais) => applyNodeChanges(permitidas, atuais))
  }
  function aoMudarSetas(mudancas: EdgeChange<SetaFlux>[]) {
    const permitidas = editavel ? mudancas : mudancas.filter((m) => m.type === "select")
    setSetas((atuais) => applyEdgeChanges(permitidas, atuais))
  }

  const aoConectar = useCallback((conexao: Connection) => {
    if (!conexao.source || !conexao.target || conexao.source === conexao.target) return
    const nova: SetaFlux = {
      id: novoIdQuadro("s"),
      type: "seta",
      source: conexao.source,
      target: conexao.target,
      sourceHandle: conexao.sourceHandle,
      targetHandle: conexao.targetHandle,
      data: { rotulo: "", tracejada: false, ponta: "fim" },
    }
    setSetas((atuais) => [...atuais.map((item) => ({ ...item, selected: false })), { ...nova, selected: true }])
  }, [])

  // Soltar a seta no vazio cria uma peça nova já ligada.
  const aoFinalizarConexao: OnConnectEnd = useCallback(
    (evento, estado) => {
      if (estado.isValid || !estado.fromNode || !estado.fromHandle?.id) return
      const ponto = "changedTouches" in evento ? evento.changedTouches[0] : evento
      const posicao = fluxo.screenToFlowPosition({ x: ponto.clientX, y: ponto.clientY })
      const lado = estado.fromHandle.id as LadoQuadro
      const nova = novaForma("retangulo", posicao)
      // A peça nova fica do lado em que a seta foi solta.
      const deslocamento = { cima: [0, -nova.altura / 2], baixo: [0, nova.altura / 2], esquerda: [-nova.largura / 2, 0], direita: [nova.largura / 2, 0] }[lado]
      nova.x += deslocamento[0]
      nova.y += deslocamento[1]
      adicionar(nova, true)
      setSetas((atuais) => [
        ...atuais,
        { id: novoIdQuadro("s"), type: "seta", source: estado.fromNode!.id, target: nova.id, sourceHandle: lado, targetHandle: oposto[lado], data: { rotulo: "", tracejada: false, ponta: "fim" } },
      ])
    },
    [fluxo, adicionar]
  )

  // Arrastar um grupo leva junto o que está dentro dele.
  function aoComecarArrastar(_: unknown, no: NoFlux) {
    if (no.data.tipo !== "grupo") return
    const caixa = { x: no.position.x, y: no.position.y, l: no.width ?? 0, a: no.height ?? 0 }
    const inicio = new Map<string, { x: number; y: number }>()
    for (const outro of nos) {
      if (outro.id === no.id || outro.selected) continue
      const centroX = outro.position.x + (outro.width ?? 0) / 2
      const centroY = outro.position.y + (outro.height ?? 0) / 2
      if (centroX >= caixa.x && centroX <= caixa.x + caixa.l && centroY >= caixa.y && centroY <= caixa.y + caixa.a) inicio.set(outro.id, { ...outro.position })
    }
    arrasto.current = { grupo: no.id, inicio, origem: { ...no.position } }
  }
  function aoArrastar(_: unknown, no: NoFlux) {
    const a = arrasto.current
    if (!a || a.grupo !== no.id || a.inicio.size === 0) return
    const dx = no.position.x - a.origem.x
    const dy = no.position.y - a.origem.y
    setNos((atuais) => atuais.map((item) => (a.inicio.has(item.id) ? { ...item, position: { x: a.inicio.get(item.id)!.x + dx, y: a.inicio.get(item.id)!.y + dy } } : item)))
  }

  // Duplo clique no vazio cria uma forma ali e já abre para escrever.
  function aoDuplicarClique(evento: React.MouseEvent) {
    if (!editavel) return
    const alvo = evento.target as HTMLElement
    if (!alvo.classList.contains("react-flow__pane")) return
    adicionar(novaForma("retangulo", fluxo.screenToFlowPosition({ x: evento.clientX, y: evento.clientY })), true)
  }

  // Atalhos: Ctrl+D duplica, Ctrl+Z / Ctrl+Y desfaz e refaz.
  useEffect(() => {
    if (!editavel) return
    const aoTeclar = (evento: KeyboardEvent) => {
      const alvo = evento.target as HTMLElement | null
      if (alvo && (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.tagName === "SELECT" || alvo.isContentEditable)) return
      if (!document.querySelector(".quadro-raiz")?.contains(alvo) && alvo !== document.body) return
      const selecionadoTeclado = nos.find((no) => no.selected && no.data.tipo !== "grupo")
      if (!evento.ctrlKey && !evento.metaKey) {
        // Tab cria a próxima peça ligada; Enter começa a escrever na peça selecionada.
        if (evento.key === "Tab" && selecionadoTeclado && !evento.shiftKey) {
          evento.preventDefault()
          acoes.adicionarLigada(selecionadoTeclado.id, "direita")
        } else if (evento.key === "Enter" && selecionadoTeclado && selecionadoTeclado.data.tipo === "forma") {
          evento.preventDefault()
          setEditandoId(selecionadoTeclado.id)
        }
        return
      }
      const tecla = evento.key.toLowerCase()
      if (tecla === "z") {
        evento.preventDefault()
        if (evento.shiftKey) refazer()
        else desfazer()
      } else if (tecla === "y") {
        evento.preventDefault()
        refazer()
      } else if (tecla === "d") {
        evento.preventDefault()
        const selecionado = nos.find((no) => no.selected)
        if (selecionado) acoes.duplicar(selecionado.id)
      }
    }
    window.addEventListener("keydown", aoTeclar)
    return () => window.removeEventListener("keydown", aoTeclar)
  }, [editavel, desfazer, refazer, nos, acoes])

  // Rafael Marques - 26/10/2026: modelos prontos entram no centro da tela, sem apagar o que já existe.
  function usarModelo(modelo: ModeloQuadro) {
    const pronto = modelo.criar()
    const centro = centroDaTela()
    const minX = Math.min(...pronto.nos.map((no) => no.x))
    const minY = Math.min(...pronto.nos.map((no) => no.y))
    const maxX = Math.max(...pronto.nos.map((no) => no.x + no.largura))
    const maxY = Math.max(...pronto.nos.map((no) => no.y + no.altura))
    const dx = Math.round(centro.x - (minX + maxX) / 2)
    const dy = Math.round(centro.y - (minY + maxY) / 2)
    setNos((atuais) => [...atuais.map((item) => ({ ...item, selected: false })), ...pronto.nos.map((no) => paraFluxoNo({ ...no, x: no.x + dx, y: no.y + dy }))])
    setSetas((atuais) => [...atuais, ...pronto.setas.map(paraFluxoSeta)])
    setModelosAbertos(false)
    setTimeout(() => void fluxo.fitView({ padding: 0.25, maxZoom: 1, duration: 300 }), 60)
  }

  // Clique direito (ou segurar o dedo) no vazio: menu para criar ali.
  function aoMenuDoQuadro(evento: React.MouseEvent) {
    if (!editavel) return
    evento.preventDefault()
    const caixa = document.querySelector(".quadro-raiz")?.getBoundingClientRect()
    if (!caixa) return
    setMenu({ x: Math.max(8, Math.min(evento.clientX - caixa.left, caixa.width - 220)), y: Math.max(8, Math.min(evento.clientY - caixa.top, caixa.height - 330)), ponto: fluxo.screenToFlowPosition({ x: evento.clientX, y: evento.clientY }) })
  }

  const botao = "flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
  const botaoRotulado = "flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm text-foreground transition-colors hover:bg-muted max-md:h-12 max-md:w-14 max-md:flex-col max-md:justify-center max-md:gap-0.5 max-md:px-0 max-md:text-[10px]"
  const formasDoMenu: { forma: FormaQuadro; Icone: typeof SquareIcon }[] = [
    { forma: "retangulo", Icone: SquareIcon },
    { forma: "arredondado", Icone: SquareRoundCornerIcon },
    { forma: "circulo", Icone: CircleIcon },
    { forma: "losango", Icone: DiamondIcon },
    { forma: "adesiva", Icone: StickyNoteIcon },
  ]
  const itemMenu = "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted"

  return (
    <ContextoQuadro.Provider value={acoes}>
      <div
        className={cn("quadro-raiz relative h-full min-h-96 w-full overflow-hidden rounded-xl border bg-background", className)}
        onDoubleClick={aoDuplicarClique}
        onContextMenu={(evento) => {
          if ((evento.target as HTMLElement).classList.contains("react-flow__pane")) aoMenuDoQuadro(evento)
        }}
        onClick={() => setMenu(null)}
      >
        <ReactFlow<NoFlux, SetaFlux>
          nodes={nos}
          edges={setas}
          nodeTypes={tiposDePeca}
          edgeTypes={tiposDeSeta}
          onNodesChange={aoMudarNos}
          onEdgesChange={aoMudarSetas}
          onConnect={aoConectar}
          onConnectEnd={aoFinalizarConexao}
          onNodeDragStart={aoComecarArrastar}
          onNodeDrag={aoArrastar}
          connectionMode={ConnectionMode.Loose}
          connectionRadius={36}
          nodesDraggable={editavel}
          nodesConnectable={editavel}
          elementsSelectable
          zoomOnDoubleClick={false}
          colorMode={tema}
          fitView
          fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
          minZoom={0.1}
          maxZoom={3}
          deleteKeyCode={editavel ? ["Delete", "Backspace"] : null}
          selectionOnDrag={editavel}
          panOnDrag={editavel ? [1, 2] : true}
          panOnScroll
          multiSelectionKeyCode={["Shift", "Meta", "Control"]}
          snapToGrid
          snapGrid={[10, 10]}
          aria-label="Quadro: use Tab para percorrer as peças, Enter para escrever, Delete para excluir"
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} />
          {minimapa && <MiniMap pannable zoomable className="!bg-card" maskColor="color-mix(in oklch, var(--background) 70%, transparent)" />}
        </ReactFlow>

        {editavel && (
          <div
            className="absolute z-10 flex gap-0.5 rounded-xl bg-popover/95 p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 backdrop-blur max-md:right-2 max-md:bottom-2 max-md:left-2 max-md:justify-around md:top-3 md:left-3 md:flex-col"
            role="toolbar"
            aria-label="Ferramentas do quadro"
          >
            <p className="px-2.5 pt-1 pb-0.5 text-[11px] font-medium text-muted-foreground uppercase max-md:hidden">Adicionar</p>
            <div className="relative max-md:contents">
              <button type="button" className={cn(botaoRotulado, "w-full")} aria-expanded={formasAbertas} onClick={() => setFormasAbertas((valor) => !valor)}>
                <SquareIcon className="size-5" /> Forma
              </button>
              {formasAbertas && (
                <div className="absolute z-20 grid w-48 gap-0.5 rounded-xl bg-popover p-1 shadow-lg ring-1 ring-foreground/10 max-md:right-0 max-md:bottom-14 md:top-0 md:left-full md:ml-2">
                  {formasDoMenu.map(({ forma, Icone }) => (
                    <button
                      key={forma}
                      type="button"
                      onClick={() => {
                        adicionar(novaForma(forma, centroDaTela()), true)
                        setFormasAbertas(false)
                      }}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted"
                    >
                      <Icone className="size-4" /> {nomesForma[forma]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" className={botaoRotulado} onClick={() => adicionar(novaForma("texto", centroDaTela()), true)}>
              <TypeIcon className="size-5" /> Texto
            </button>
            <button type="button" className={botaoRotulado} onClick={() => setEscolhendoNota(true)}>
              <FileTextIcon className="size-5" /> Nota
            </button>
            <button type="button" className={botaoRotulado} onClick={() => adicionar(novoGrupo(centroDaTela()), true)}>
              <FrameIcon className="size-5" /> Grupo
            </button>
            <div className="relative max-md:contents">
              <button type="button" className={cn(botaoRotulado, "w-full")} aria-expanded={modelosAbertos} onClick={() => setModelosAbertos((valor) => !valor)}>
                <LayoutTemplateIcon className="size-5" /> Modelos
              </button>
              {modelosAbertos && (
                <div className="absolute z-20 grid w-60 gap-0.5 rounded-xl bg-popover p-1 shadow-lg ring-1 ring-foreground/10 max-md:right-0 max-md:bottom-14 md:top-0 md:left-full md:ml-2">
                  {modelosQuadro.map((modelo) => (
                    <button key={modelo.id} type="button" onClick={() => usarModelo(modelo)} className="rounded-lg px-2 py-2 text-left hover:bg-muted">
                      <span className="block text-sm font-medium">{modelo.nome}</span>
                      <span className="block text-xs text-muted-foreground">{modelo.descricao}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="my-0.5 h-px bg-border max-md:mx-0.5 max-md:h-auto max-md:w-px" />
            <div className="flex md:justify-center">
              <button type="button" className={botao} title="Desfazer (Ctrl+Z)" aria-label="Desfazer" disabled={pilhas.desfazer === 0} onClick={desfazer}>
                <Undo2Icon className="size-5" />
              </button>
              <button type="button" className={botao} title="Refazer (Ctrl+Y)" aria-label="Refazer" disabled={pilhas.refazer === 0} onClick={refazer}>
                <Redo2Icon className="size-5" />
              </button>
            </div>
          </div>
        )}

        <div className="absolute top-3 right-3 z-10 flex items-center gap-0.5 rounded-xl bg-popover/95 p-1 shadow-lg ring-1 ring-foreground/10 backdrop-blur">
          <button type="button" className={botao} title="Como usar" aria-label="Como usar o quadro" aria-expanded={ajudaAberta} onClick={() => setAjudaAberta((valor) => !valor)}>
            <CircleHelpIcon className="size-5" />
          </button>
        </div>

        <div className="absolute right-3 bottom-3 z-10 flex items-center gap-0.5 rounded-xl bg-popover/95 p-1 shadow-lg ring-1 ring-foreground/10 backdrop-blur max-md:bottom-[4.5rem]">
          <button type="button" className={botao} title="Diminuir" aria-label="Diminuir" onClick={() => void fluxo.zoomOut({ duration: 150 })}>
            <ZoomOutIcon className="size-5" />
          </button>
          <button type="button" className={botao} title="Aumentar" aria-label="Aumentar" onClick={() => void fluxo.zoomIn({ duration: 150 })}>
            <ZoomInIcon className="size-5" />
          </button>
          <button type="button" className={botao} title="Ajustar à tela" aria-label="Ajustar à tela" onClick={() => void fluxo.fitView({ padding: 0.25, maxZoom: 1, duration: 250 })}>
            <ScanIcon className="size-5" />
          </button>
          <button type="button" className={cn(botao, minimapa && "bg-muted text-foreground")} title="Minimapa" aria-label="Minimapa" aria-pressed={minimapa} onClick={() => setMinimapa((valor) => !valor)}>
            <MapIcon className="size-5" />
          </button>
          <button
            type="button"
            className={botao}
            title="Tela cheia"
            aria-label="Tela cheia"
            onClick={() => {
              const raiz = document.querySelector(".quadro-raiz")
              if (document.fullscreenElement) void document.exitFullscreen()
              else void raiz?.requestFullscreen?.()
            }}
          >
            <Maximize2Icon className="size-5" />
          </button>
        </div>

        {ajudaAberta && (
          <div role="dialog" aria-label="Como usar o quadro" className="absolute top-16 right-3 z-20 w-72 max-w-[calc(100%-1.5rem)] space-y-2 rounded-xl bg-popover p-4 text-sm shadow-lg ring-1 ring-foreground/10">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Como usar o quadro</p>
              <button type="button" aria-label="Fechar ajuda" onClick={() => setAjudaAberta(false)} className="flex size-6 items-center justify-center rounded hover:bg-muted">
                <XIcon className="size-4" />
              </button>
            </div>
            <ul className="space-y-1.5 text-muted-foreground">
              <li><b className="text-foreground">Criar:</b> duplo clique no vazio, clique direito, ou a barra “Adicionar”.</li>
              <li><b className="text-foreground">Escrever:</b> duplo clique na peça (ou Enter com ela selecionada).</li>
              <li><b className="text-foreground">Próxima peça:</b> selecione uma peça e clique num dos botões + ao redor dela, ou aperte Tab.</li>
              <li><b className="text-foreground">Ligar:</b> arraste a bolinha da borda até outra peça. Soltando no vazio, cria uma nova.</li>
              <li><b className="text-foreground">Cor, forma, duplicar, excluir:</b> aparecem acima da peça selecionada.</li>
              <li><b className="text-foreground">Mover a tela:</b> role com o mouse ou arraste com o botão do meio. Zoom com Ctrl + roda.</li>
              <li><b className="text-foreground">Atalhos:</b> Ctrl+Z desfaz, Ctrl+Y refaz, Ctrl+D duplica, Delete exclui.</li>
            </ul>
          </div>
        )}

        {menu && (
          <div role="menu" aria-label="Criar aqui" className="absolute z-30 w-52 space-y-0.5 rounded-xl bg-popover p-1 text-sm shadow-lg ring-1 ring-foreground/10" style={{ left: menu.x, top: menu.y }} onClick={(evento) => evento.stopPropagation()}>
            <p className="px-2 pt-1 text-[11px] font-medium text-muted-foreground uppercase">Criar aqui</p>
            {formasDoMenu.map(({ forma, Icone }) => (
              <button
                key={forma}
                type="button"
                role="menuitem"
                onClick={() => {
                  adicionar(novaForma(forma, menu.ponto), true)
                  setMenu(null)
                }}
                className={itemMenu}
              >
                <Icone className="size-4" /> {nomesForma[forma]}
              </button>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                adicionar(novaForma("texto", menu.ponto), true)
                setMenu(null)
              }}
              className={itemMenu}
            >
              <TypeIcon className="size-4" /> Texto solto
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                adicionar(novoGrupo(menu.ponto), true)
                setMenu(null)
              }}
              className={itemMenu}
            >
              <FrameIcon className="size-4" /> Grupo
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenu(null)
                setEscolhendoNota(true)
              }}
              className={itemMenu}
            >
              <FileTextIcon className="size-4" /> Cartão de nota…
            </button>
          </div>
        )}

        {nos.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center p-4 md:pl-44">
            <div className="pointer-events-auto w-full max-w-md space-y-4 rounded-2xl bg-popover/95 p-5 text-center shadow-lg ring-1 ring-foreground/10 backdrop-blur">
              <div>
                <p className="text-base font-semibold">{editavel ? "Comece o seu quadro" : "Este quadro está vazio"}</p>
                {editavel && <p className="text-sm text-muted-foreground">Dê um duplo clique em qualquer lugar para criar uma forma, ou comece por um modelo pronto.</p>}
              </div>
              {editavel && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {modelosQuadro.map((modelo) => (
                      <button key={modelo.id} type="button" onClick={() => usarModelo(modelo)} className="rounded-xl border px-3 py-2.5 text-left hover:bg-muted">
                        <span className="block text-sm font-medium">{modelo.nome}</span>
                        <span className="block text-xs text-muted-foreground">{modelo.descricao}</span>
                      </button>
                    ))}
                  </div>
                  <Button className="w-full" onClick={() => adicionar(novaForma("retangulo", centroDaTela()), true)}>
                    <SquareIcon /> Começar com uma forma em branco
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <EscolherNota aberto={escolhendoNota} aoMudarAberto={setEscolhendoNota} ignorarId={notaId} aoEscolher={(id) => adicionar(novoCartaoNota(id, centroDaTela()))} />
    </ContextoQuadro.Provider>
  )
}
