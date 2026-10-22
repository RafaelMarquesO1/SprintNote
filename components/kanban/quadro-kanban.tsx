"use client"

import { useState } from "react"
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  CheckIcon,
  KanbanIcon,
  ChevronDownIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  TagIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { Icone, iconesNota } from "@/components/icone"
import { ConteudoCartao, PREFIXO_CARTAO } from "@/components/kanban/cartao-kanban"
import { Coluna, PREFIXO_ARRASTAR_COLUNA, PREFIXO_COLUNA } from "@/components/kanban/coluna-kanban"
import { DialogoCartao } from "@/components/kanban/dialogo-cartao"
import { DialogoEtiquetas, DialogoExcluirColuna } from "@/components/kanban/dialogos-quadro"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { CabecalhoPagina, ResumoLinha, classeTituloEditavel } from "@/components/pagina"
import { Interruptor, MiniaturasOpcoes, OpcoesLadoALado, PainelPersonalizar, SecaoPersonalizar } from "@/components/painel-personalizar"
import { useHidratado } from "@/hooks/use-hidratado"
import { useHoje } from "@/hooks/use-hoje"
import { AvisosPrazo } from "@/components/avisos-prazo"
import { fundosQuadro } from "@/lib/cores"
import { colunasDoQuadro, exibicaoDoQuadro, exibicaoPadrao, useKanban } from "@/lib/estado/kanban"
import type { ColunaKanban } from "@/lib/tipos"

// Arrastando um cartão: o cartão sob o cursor ganha da coluna.
// Arrastando uma coluna: só outras colunas contam como alvo.
const detectarColisao: CollisionDetection = (argumentos) => {
  const ehColuna = String(argumentos.active.id).startsWith(PREFIXO_ARRASTAR_COLUNA)
  if (ehColuna) {
    // A coluna sob o ponteiro ganha; fora de todas, a mais próxima.
    const soColunas = {
      ...argumentos,
      droppableContainers: argumentos.droppableContainers.filter((alvo) => String(alvo.id).startsWith(PREFIXO_COLUNA)),
    }
    const sobPonteiro = pointerWithin(soColunas)
    return sobPonteiro.length > 0 ? sobPonteiro : closestCenter(soColunas)
  }
  const colisoes = pointerWithin(argumentos)
  const sobreCartao = colisoes.find((colisao) => String(colisao.id).startsWith(PREFIXO_CARTAO))
  if (sobreCartao) return [sobreCartao]
  return colisoes.length > 0 ? colisoes : rectIntersection(argumentos)
}

// Título do quadro: editável no próprio cabeçalho (salva a cada letra).
function TituloQuadro({ quadroId, titulo }: { quadroId: string; titulo: string }) {
  const atualizarQuadro = useKanban((estado) => estado.atualizarQuadro)
  const [rascunho, setRascunho] = useState(titulo)
  return (
    <input
      value={rascunho}
      onChange={(evento) => {
        setRascunho(evento.target.value)
        if (evento.target.value.trim()) atualizarQuadro(quadroId, { titulo: evento.target.value.trim() })
      }}
      onBlur={() => setRascunho(titulo)}
      onKeyDown={(evento) => evento.key === "Enter" && evento.currentTarget.blur()}
      aria-label="Nome do quadro"
      className={classeTituloEditavel}
    />
  )
}

// Rafael Marques - 20/10/2026 (personalização em 21/10/2026)
// Kanban: vários quadros, colunas e etiquetas personalizáveis.
// Cartões e colunas se arrastam com mouse, toque ou teclado.
export function QuadroKanban() {
  const hidratado = useHidratado()
  const hoje = useHoje()
  const quadros = useKanban((estado) => estado.quadros)
  const todasColunas = useKanban((estado) => estado.colunas)
  const cartoes = useKanban((estado) => estado.cartoes)
  const quadroAtivoId = useKanban((estado) => estado.quadroAtivoId)
  const definirQuadroAtivo = useKanban((estado) => estado.definirQuadroAtivo)
  const criarQuadro = useKanban((estado) => estado.criarQuadro)
  const atualizarQuadro = useKanban((estado) => estado.atualizarQuadro)
  const excluirQuadro = useKanban((estado) => estado.excluirQuadro)
  const adicionarColuna = useKanban((estado) => estado.adicionarColuna)
  const reordenarColuna = useKanban((estado) => estado.reordenarColuna)
  const moverCartao = useKanban((estado) => estado.moverCartao)
  const definirExibicao = useKanban((estado) => estado.definirExibicao)

  const [idArrastado, setIdArrastado] = useState<string | null>(null)
  const [colunaArrastadaId, setColunaArrastadaId] = useState<string | null>(null)
  const [idAberto, setIdAberto] = useState<string | null>(null)
  const [colunaParaExcluir, setColunaParaExcluir] = useState<ColunaKanban | null>(null)
  const [editandoEtiquetas, setEditandoEtiquetas] = useState(false)
  const [excluindoQuadro, setExcluindoQuadro] = useState(false)
  const [novaColuna, setNovaColuna] = useState<string | null>(null)
  const [busca, setBusca] = useState("")
  const [filtroEtiquetas, setFiltroEtiquetas] = useState<string[]>([])

  const sensores = useSensors(
    // Precisa arrastar 5px para começar: assim um clique simples abre o cartão.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  if (!hidratado) {
    return (
      <div className="flex gap-4">
        {[1, 2, 3].map((item) => <Skeleton key={item} className="h-64 w-72 shrink-0" />)}
      </div>
    )
  }

  const quadro = quadros.find((item) => item.id === quadroAtivoId) ?? quadros[0]

  if (!quadro) {
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-xl border border-dashed p-10 text-center">
        <p className="font-medium">Nenhum quadro ainda</p>
        <Button onClick={() => criarQuadro("Meu quadro")}><PlusIcon /> Criar quadro</Button>
      </div>
    )
  }

  const colunas = colunasDoQuadro(todasColunas, quadro.id)
  const exibicao = exibicaoDoQuadro(quadro)
  const idsColunas = new Set(colunas.map((coluna) => coluna.id))
  const termo = busca.trim().toLowerCase()
  const filtrando = Boolean(termo) || filtroEtiquetas.length > 0
  const visivel = (cartao: (typeof cartoes)[number]) =>
    (!termo || `${cartao.titulo} ${cartao.descricao}`.toLowerCase().includes(termo)) &&
    filtroEtiquetas.every((id) => cartao.etiquetas.includes(id))
  const cartoesDoQuadro = cartoes.filter((cartao) => idsColunas.has(cartao.colunaId))

  function aoSoltar({ active, over }: DragEndEvent) {
    setIdArrastado(null)
    setColunaArrastadaId(null)
    if (!over) return

    // Reordenar coluna: entra no lugar da coluna sob o cursor.
    const colunaMovida = active.data.current?.colunaArrastadaId as string | undefined
    if (colunaMovida) {
      const alvo = over.data.current?.colunaId as string | undefined
      if (!alvo || alvo === colunaMovida) return
      const ordem = colunas.map((coluna) => coluna.id)
      const daqui = ordem.indexOf(colunaMovida)
      const dali = ordem.indexOf(alvo)
      // Indo para a direita, fica depois do alvo.
      reordenarColuna(colunaMovida, daqui < dali ? (ordem[dali + 1] ?? null) : alvo)
      return
    }

    const id = active.data.current?.cartaoId as string
    if (!cartoes.some((cartao) => cartao.id === id)) return

    // Soltou na coluna (área vazia): vai para o fim dela.
    const colunaAlvo = over.data.current?.colunaId as string | undefined
    if (colunaAlvo) {
      moverCartao(id, colunaAlvo, null)
      return
    }

    // Soltou sobre outro cartão: entra no lugar dele.
    const idAlvo = over.data.current?.cartaoId as string
    const cartaoAlvo = cartoes.find((cartao) => cartao.id === idAlvo)
    if (!cartaoAlvo || idAlvo === id) return
    const daColuna = cartoes.filter((cartao) => cartao.colunaId === cartaoAlvo.colunaId)
    const indiceMovido = daColuna.findIndex((cartao) => cartao.id === id)
    const indiceAlvo = daColuna.findIndex((cartao) => cartao.id === idAlvo)
    // Descendo na mesma coluna, o cartão fica depois do alvo.
    const antesDeId =
      indiceMovido !== -1 && indiceMovido < indiceAlvo ? (daColuna[indiceAlvo + 1]?.id ?? null) : idAlvo
    moverCartao(id, cartaoAlvo.colunaId, antesDeId)
  }

  function moverColunaPorMenu(coluna: ColunaKanban, delta: -1 | 1) {
    const ordem = colunas.map((item) => item.id)
    const indice = ordem.indexOf(coluna.id)
    const destino = indice + delta
    if (destino < 0 || destino >= ordem.length) return
    reordenarColuna(coluna.id, delta < 0 ? ordem[destino] : (ordem[destino + 1] ?? null))
  }

  const cartaoArrastado = cartoes.find((cartao) => cartao.id === idArrastado) ?? null
  const colunaArrastada = colunas.find((coluna) => coluna.id === colunaArrastadaId) ?? null
  const cartaoAberto = cartoes.find((cartao) => cartao.id === idAberto) ?? null
  const concluidos = cartoesDoQuadro.filter((cartao) => colunas.find((coluna) => coluna.id === cartao.colunaId)?.concluida).length
  const emAndamento = cartoesDoQuadro.length - concluidos
  const atrasados = cartoesDoQuadro.filter(
    (cartao) => hoje && cartao.prazo && cartao.prazo < hoje && !colunas.find((coluna) => coluna.id === cartao.colunaId)?.concluida
  ).length

  return (
    <div className="-mx-4 -mt-4 flex min-h-[calc(100svh-3rem)] flex-col md:-mx-6 md:-mt-6" style={quadro.fundo ? { background: quadro.fundo } : undefined}>
      {/* Cabeçalho no padrão das outras telas + números do quadro */}
      <div className="space-y-5 px-4 pt-4 md:px-6 md:pt-6">
        <CabecalhoPagina
          secao="Organização · Kanban"
          icone={KanbanIcon}
          titulo={
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Trocar ícone do quadro"
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background/70 hover:bg-background"
                >
                  <Icone nome={quadro.icone} className="size-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-auto">
                  <div className="grid grid-cols-8 gap-0.5">
                    {iconesNota.map((icone) => (
                      <DropdownMenuItem key={icone} aria-label={icone} className="justify-center" onClick={() => atualizarQuadro(quadro.id, { icone })}>
                        <Icone nome={icone} />
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <TituloQuadro key={quadro.id} quadroId={quadro.id} titulo={quadro.titulo} />
            </div>
          }
          descricao="Arraste cartões e colunas. Clique em um cartão para editar — tudo é salvo na hora."
          acoes={
            <>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="bg-background/70" />}>
                  Quadros ({quadros.length}) <ChevronDownIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Trocar de quadro</DropdownMenuLabel>
                    {quadros.map((item) => (
                      <DropdownMenuItem key={item.id} onClick={() => definirQuadroAtivo(item.id)}>
                        <Icone nome={item.icone} /> {item.titulo}
                        {item.id === quadro.id && <CheckIcon className="ml-auto" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => criarQuadro("Novo quadro")}><PlusIcon /> Novo quadro</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <PainelPersonalizar
                titulo="Aparência do quadro"
                descricao="As mudanças aparecem na hora."
                tamanhoBotao="sm"
                aoRestaurar={() => {
                  definirExibicao(quadro.id, exibicaoPadrao)
                  atualizarQuadro(quadro.id, { fundo: null })
                }}
              >
                <SecaoPersonalizar titulo="Fundo do quadro">
                  <MiniaturasOpcoes
                    rotulo="Fundo do quadro"
                    colunas={4}
                    valor={quadro.fundo ?? "nenhum"}
                    aoMudar={(valor) => atualizarQuadro(quadro.id, { fundo: valor === "nenhum" ? null : valor })}
                    opcoes={[
                      { valor: "nenhum", rotulo: "Nenhum", previa: <span className="size-full bg-background" /> },
                      ...fundosQuadro.map((fundo) => ({
                        valor: fundo.valor,
                        rotulo: fundo.nome,
                        previa: <span className="size-full" style={{ background: fundo.valor }} />,
                      })),
                    ]}
                  />
                </SecaoPersonalizar>
                <SecaoPersonalizar titulo="Mostrar nos cartões">
                  <Interruptor
                    rotulo="Caixa para concluir"
                    descricao="Marca o cartão como feito sem abrir."
                    marcado={exibicao.concluir}
                    aoMudar={(marcado) => definirExibicao(quadro.id, { concluir: marcado })}
                  />
                  <Interruptor rotulo="Etiquetas" marcado={exibicao.etiquetas} aoMudar={(marcado) => definirExibicao(quadro.id, { etiquetas: marcado })} />
                  <Interruptor rotulo="Prazo" marcado={exibicao.prazo} aoMudar={(marcado) => definirExibicao(quadro.id, { prazo: marcado })} />
                  <Interruptor rotulo="Trecho da descrição" marcado={exibicao.descricao} aoMudar={(marcado) => definirExibicao(quadro.id, { descricao: marcado })} />
                  <Interruptor rotulo="Nota vinculada" marcado={exibicao.nota} aoMudar={(marcado) => definirExibicao(quadro.id, { nota: marcado })} />
                  <Interruptor rotulo="Faixa de cor" marcado={exibicao.faixaCor} aoMudar={(marcado) => definirExibicao(quadro.id, { faixaCor: marcado })} />
                </SecaoPersonalizar>
                <SecaoPersonalizar titulo="Checklist no cartão">
                  <OpcoesLadoALado
                    rotulo="Checklist no cartão"
                    valor={exibicao.checklist}
                    aoMudar={(checklist) => definirExibicao(quadro.id, { checklist })}
                    opcoes={[
                      { valor: "oculto", rotulo: "Oculta" },
                      { valor: "progresso", rotulo: "Progresso" },
                      { valor: "itens", rotulo: "Itens" },
                    ]}
                  />
                  <p className="text-xs text-muted-foreground">“Itens” mostra a lista no cartão para marcar sem abrir.</p>
                </SecaoPersonalizar>
              </PainelPersonalizar>

              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" aria-label="Opções do quadro" className="bg-background/70" />}>
                  <MoreHorizontalIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setEditandoEtiquetas(true)}><TagIcon /> Etiquetas…</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setNovaColuna("")}><PlusIcon /> Nova coluna</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setExcluindoQuadro(true)}><Trash2Icon /> Excluir quadro</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
          resumo={
            <ResumoLinha
              itens={[
                { valor: cartoesDoQuadro.length, texto: cartoesDoQuadro.length === 1 ? "cartão" : "cartões" },
                { valor: `${cartoesDoQuadro.length ? Math.round((concluidos / cartoesDoQuadro.length) * 100) : 0}%`, texto: "concluído" },
                emAndamento > 0 && { valor: emAndamento, texto: "em aberto" },
                atrasados > 0 && { valor: atrasados, texto: atrasados === 1 ? "atrasado" : "atrasados", alerta: true },
              ]}
            />
          }
        />

        <AvisosPrazo areas={["kanban"]} quadroId={quadro.id} comLinks={false} />

        {/* Filtros e progresso */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Filtrar cartões…" aria-label="Filtrar cartões" className="h-8 w-52 bg-background/70 pl-8" />
          </div>
          {quadro.etiquetas.map((etiqueta) => {
            const ativa = filtroEtiquetas.includes(etiqueta.id)
            return (
              <button
                key={etiqueta.id}
                type="button"
                aria-pressed={ativa}
                onClick={() => setFiltroEtiquetas(ativa ? filtroEtiquetas.filter((id) => id !== etiqueta.id) : [...filtroEtiquetas, etiqueta.id])}
                className={cn("rounded-md px-2 py-0.5 text-xs font-medium transition-opacity", !ativa && "opacity-60 hover:opacity-100")}
                style={{ background: `color-mix(in oklch, ${etiqueta.cor} ${ativa ? 28 : 14}%, transparent)`, color: etiqueta.cor }}
              >
                {etiqueta.nome}
              </button>
            )
          })}
          {filtrando && (
            <Button variant="ghost" size="xs" onClick={() => { setBusca(""); setFiltroEtiquetas([]) }}>
              <XIcon /> Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Colunas */}
      <DndContext
        id="quadro-kanban"
        sensors={sensores}
        collisionDetection={detectarColisao}
        onDragStart={({ active }) => {
          setIdArrastado((active.data.current?.cartaoId as string) ?? null)
          setColunaArrastadaId((active.data.current?.colunaArrastadaId as string) ?? null)
        }}
        onDragEnd={aoSoltar}
        onDragCancel={() => {
          setIdArrastado(null)
          setColunaArrastadaId(null)
        }}
        accessibility={{
          screenReaderInstructions: {
            draggable: "Pressione espaço para pegar, use as setas para mover e espaço para soltar.",
          },
        }}
      >
        <div className="flex flex-1 items-start gap-3 overflow-x-auto px-4 pt-4 pb-6 md:px-6">
          {colunas.map((coluna, indice) => (
            <Coluna
              key={coluna.id}
              coluna={coluna}
              cartoes={cartoes.filter((cartao) => cartao.colunaId === coluna.id && visivel(cartao))}
              etiquetas={quadro.etiquetas}
              exibicao={exibicao}
              posicao={indice}
              total={colunas.length}
              aoAbrirCartao={(cartao) => setIdAberto(cartao.id)}
              aoMover={(delta) => moverColunaPorMenu(coluna, delta)}
              aoExcluir={() => setColunaParaExcluir(coluna)}
            />
          ))}

          {/* Nova coluna */}
          {novaColuna === null ? (
            <button
              type="button"
              onClick={() => setNovaColuna("")}
              className="flex h-12 w-72 shrink-0 items-center gap-2 rounded-xl border border-dashed bg-background/40 px-3 text-sm text-muted-foreground hover:bg-background/70 hover:text-foreground"
            >
              <PlusIcon className="size-4" /> Adicionar coluna
            </button>
          ) : (
            <form
              className="w-72 shrink-0 space-y-2 rounded-xl bg-muted/60 p-2"
              onSubmit={(evento) => {
                evento.preventDefault()
                if (!novaColuna.trim()) return
                adicionarColuna(quadro.id, novaColuna)
                setNovaColuna("")
              }}
            >
              <Input
                autoFocus
                value={novaColuna}
                onChange={(evento) => setNovaColuna(evento.target.value)}
                onKeyDown={(evento) => evento.key === "Escape" && setNovaColuna(null)}
                placeholder="Nome da coluna…"
                aria-label="Nome da nova coluna"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm">Adicionar</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setNovaColuna(null)}>Cancelar</Button>
              </div>
            </form>
          )}
        </div>

        <DragOverlay>
          {cartaoArrastado && (
            <ConteudoCartao
              cartao={cartaoArrastado}
              etiquetas={quadro.etiquetas}
              exibicao={exibicao}
              concluido={Boolean(colunas.find((coluna) => coluna.id === cartaoArrastado.colunaId)?.concluida)}
              arrastando
            />
          )}
          {colunaArrastada && (
            <div className="w-72 rotate-1 rounded-xl bg-muted p-3 text-sm font-semibold shadow-lg ring-2 ring-primary/30">
              {colunaArrastada.titulo}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <DialogoCartao cartao={cartaoAberto} aoFechar={() => setIdAberto(null)} />
      <DialogoEtiquetas quadro={quadro} aberto={editandoEtiquetas} aoMudarAberto={setEditandoEtiquetas} />
      <DialogoExcluirColuna
        coluna={colunaParaExcluir}
        outras={colunas.filter((coluna) => coluna.id !== colunaParaExcluir?.id)}
        totalCartoes={cartoes.filter((cartao) => cartao.colunaId === colunaParaExcluir?.id).length}
        aoFechar={() => setColunaParaExcluir(null)}
      />
      <AlertDialog open={excluindoQuadro} onOpenChange={setExcluindoQuadro}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir o quadro “{quadro.titulo}”?</AlertDialogTitle>
            <AlertDialogDescription>
              As {colunas.length} coluna(s) e os {cartoesDoQuadro.length} cartão(ões) dele também serão excluídos. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                excluirQuadro(quadro.id)
                setExcluindoQuadro(false)
              }}
            >
              Excluir quadro
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
