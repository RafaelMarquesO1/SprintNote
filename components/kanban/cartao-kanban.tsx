"use client"

import { useDraggable, useDroppable } from "@dnd-kit/core"
import {
  ArchiveIcon,
  CalendarIcon,
  CheckIcon,
  CopyIcon,
  FileTextIcon,
  FlagIcon,
  ListChecksIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  Trash2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AvatarPessoa } from "@/components/equipes/avatar-pessoa"
import { useHoje } from "@/hooks/use-hoje"
import { useConta } from "@/components/conta/portao-conta"
import { membroPorId, useEquipes } from "@/lib/estado/equipes"
import { alternarFiltroPorResponsavel, useFiltroAtribuidos } from "@/lib/estado/filtro-atribuidos"
import { exibicaoPadrao, useKanban } from "@/lib/estado/kanban"
import { useNotas } from "@/lib/estado/notas"
import { rotuloPrazo } from "@/lib/tarefas-notas"
import type { CartaoKanban, EtiquetaKanban, ExibicaoCartao, Prioridade } from "@/lib/tipos"

// Sem cor: a urgência aparece no peso do texto e no preenchimento da bandeira.
export const estilosPrioridade: Record<Prioridade, { titulo: string; classe: string; preenchida: boolean }> = {
  alta: { titulo: "Alta", classe: "font-semibold text-foreground", preenchida: true },
  media: { titulo: "Média", classe: "font-medium text-foreground/80", preenchida: false },
  baixa: { titulo: "Baixa", classe: "text-muted-foreground", preenchida: false },
}

// Rafael Marques - 23/10/2026: prioridade, contagem de comentários e "Arquivar" no cartão.
export const PREFIXO_CARTAO = "cartao:"

// Cliques nas caixinhas do cartão não abrem o cartão nem começam um arraste.
const naoPropagar = {
  onPointerDown: (evento: React.PointerEvent) => evento.stopPropagation(),
  onKeyDown: (evento: React.KeyboardEvent) => evento.stopPropagation(),
}

function Caixa({ marcada, rotulo, aoAlternar, redonda = false }: { marcada: boolean; rotulo: string; aoAlternar: () => void; redonda?: boolean }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={marcada}
      aria-label={rotulo}
      {...naoPropagar}
      onClick={(evento) => {
        evento.stopPropagation()
        aoAlternar()
      }}
      className={cn(
        "flex size-4 shrink-0 items-center justify-center border-[1.5px] transition-colors",
        redonda ? "rounded-full" : "rounded",
        marcada ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50 hover:border-primary"
      )}
    >
      {marcada && <CheckIcon className="size-3" strokeWidth={3} />}
    </button>
  )
}

// Visual do cartão (no quadro e na "sombra" enquanto arrasta).
// "interativo" liga as caixinhas de concluir e da checklist.
export function ConteudoCartao({
  cartao,
  etiquetas,
  concluido,
  exibicao = exibicaoPadrao,
  arrastando = false,
  interativo = false,
}: {
  cartao: CartaoKanban
  etiquetas: EtiquetaKanban[]
  concluido: boolean
  exibicao?: ExibicaoCartao
  arrastando?: boolean
  interativo?: boolean
}) {
  const hoje = useHoje()
  const atualizarCartao = useKanban((estado) => estado.atualizarCartao)
  const concluirCartao = useKanban((estado) => estado.concluirCartao)
  const nota = useNotas((estado) => estado.notas.find((item) => item.id === cartao.notaId))
  // Rafael Marques - 23/10/2026: pessoa responsável (quadros de equipe)
  const responsavel = useEquipes((estado) => membroPorId(estado.equipes, cartao.responsavelId))
  const meuId = useConta()?.usuario.id
  const filtrandoPorEle = useFiltroAtribuidos((estado) => cartao.responsavelId !== null && estado.responsavelId === cartao.responsavelId)
  const doCartao = exibicao.etiquetas ? etiquetas.filter((etiqueta) => cartao.etiquetas.includes(etiqueta.id)) : []
  const feitos = cartao.checklist.filter((item) => item.feito).length
  const atrasado = Boolean(hoje && cartao.prazo && cartao.prazo < hoje && !concluido)

  const mostrarPrazo = exibicao.prazo && cartao.prazo && hoje
  const mostrarProgresso = exibicao.checklist === "progresso" && cartao.checklist.length > 0
  const mostrarNota = exibicao.nota && nota
  const mostrarPrioridade = exibicao.prioridade && cartao.prioridade
  const mostrarComentarios = exibicao.comentarios && cartao.comentarios.length > 0
  const temRodape = mostrarPrazo || mostrarProgresso || mostrarNota || mostrarPrioridade || mostrarComentarios || Boolean(responsavel)

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-card text-left text-sm shadow-xs",
        arrastando && "rotate-2 shadow-lg ring-2 ring-primary/30"
      )}
    >
      {exibicao.faixaCor && cartao.cor && <div className="h-1.5" style={{ background: cartao.cor }} />}
      <div className="space-y-1.5 p-2.5 sm:space-y-2 sm:p-3">
        {doCartao.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {doCartao.map((etiqueta) => (
              <span
                key={etiqueta.id}
                className="rounded px-1.5 py-0.5 text-[11px] leading-none font-medium"
                style={{ background: `color-mix(in oklch, ${etiqueta.cor} 22%, transparent)`, color: etiqueta.cor }}
              >
                {etiqueta.nome}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-start gap-2 pr-5">
          {exibicao.concluir && (
            <span className="pt-0.5">
              <Caixa
                redonda
                marcada={concluido}
                rotulo={concluido ? `Reabrir “${cartao.titulo}”` : `Concluir “${cartao.titulo}”`}
                aoAlternar={() => interativo && concluirCartao(cartao.id, !concluido)}
              />
            </span>
          )}
          <p className={cn("min-w-0 font-medium break-words", concluido && "text-muted-foreground line-through")}>{cartao.titulo}</p>
        </div>

        {exibicao.descricao && cartao.descricao && (
          <p className="line-clamp-3 text-xs whitespace-pre-line text-muted-foreground">{cartao.descricao}</p>
        )}

        {exibicao.checklist === "itens" && cartao.checklist.length > 0 && (
          <ul className="space-y-1">
            {cartao.checklist.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-xs">
                <span className="pt-px">
                  <Caixa
                    marcada={item.feito}
                    rotulo={`Marcar “${item.texto}”`}
                    aoAlternar={() =>
                      interativo &&
                      atualizarCartao(cartao.id, {
                        checklist: cartao.checklist.map((atual) => (atual.id === item.id ? { ...atual, feito: !atual.feito } : atual)),
                      })
                    }
                  />
                </span>
                <span className={cn("min-w-0 break-words", item.feito && "text-muted-foreground line-through")}>{item.texto}</span>
              </li>
            ))}
          </ul>
        )}

        {temRodape && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
            {mostrarPrioridade && (
              <span className={cn("flex items-center gap-1", estilosPrioridade[cartao.prioridade!].classe)}>
                <FlagIcon className={cn("size-3", estilosPrioridade[cartao.prioridade!].preenchida && "fill-current")} />
                {estilosPrioridade[cartao.prioridade!].titulo}
              </span>
            )}
            {mostrarPrazo && (
              <span className={cn("flex items-center gap-1", atrasado && "font-medium text-destructive")}>
                <CalendarIcon className="size-3" /> {rotuloPrazo(cartao.prazo!, hoje)}
              </span>
            )}
            {mostrarProgresso && (
              <span className={cn("flex items-center gap-1", feitos === cartao.checklist.length && "text-[color:var(--destaque-dica)]")}>
                <ListChecksIcon className="size-3" /> {feitos}/{cartao.checklist.length}
              </span>
            )}
            {mostrarComentarios && (
              <span className="flex items-center gap-1" title={`${cartao.comentarios.length} comentário(s)`}>
                <MessageSquareIcon className="size-3" /> {cartao.comentarios.length}
              </span>
            )}
            {responsavel && (
              // Rafael Marques - 23/10/2026: clicar na inicial (ou foto) filtra o quadro por essa pessoa e avisa.
              <button
                type="button"
                {...naoPropagar}
                aria-pressed={filtrandoPorEle}
                aria-label={filtrandoPorEle ? `Remover filtro de ${responsavel.nome}` : `Filtrar cartões de ${responsavel.nome}`}
                title={filtrandoPorEle ? "Remover o filtro" : `Responsável: ${responsavel.nome}. Clique para filtrar os cartões dessa pessoa.`}
                onClick={(evento) => {
                  evento.stopPropagation()
                  if (interativo) alternarFiltroPorResponsavel(responsavel.id, responsavel.id === meuId ? "você" : responsavel.nome)
                }}
                className={cn(
                  "ml-auto rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 hover:opacity-80",
                  filtrandoPorEle && "ring-2 ring-foreground"
                )}
              >
                <AvatarPessoa nome={responsavel.nome} foto={responsavel.foto} tamanho="sm" />
              </button>
            )}
            {mostrarNota && (
              <span className="flex min-w-0 items-center gap-1">
                <FileTextIcon className="size-3 shrink-0" /> <span className="truncate">{nota.titulo}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Cartão arrastável: também é um alvo (soltar em cima dele = entrar no lugar).
export function Cartao({
  cartao,
  etiquetas,
  concluido,
  exibicao,
  aoAbrir,
}: {
  cartao: CartaoKanban
  etiquetas: EtiquetaKanban[]
  concluido: boolean
  exibicao: ExibicaoCartao
  aoAbrir: () => void
}) {
  const duplicarCartao = useKanban((estado) => estado.duplicarCartao)
  const excluirCartao = useKanban((estado) => estado.excluirCartao)
  const arquivarCartao = useKanban((estado) => estado.arquivarCartao)
  const {
    setNodeRef: definirArrastavel,
    listeners,
    attributes,
    isDragging,
  } = useDraggable({ id: PREFIXO_CARTAO + cartao.id, data: { cartaoId: cartao.id } })
  const { setNodeRef: definirAlvo, isOver } = useDroppable({
    id: PREFIXO_CARTAO + cartao.id,
    data: { cartaoId: cartao.id },
  })

  return (
    <div ref={definirAlvo} className="group/cartao relative">
      {/* Linha indicando onde o cartão será solto */}
      {isOver && !isDragging && <div className="absolute -top-1.5 right-0 left-0 h-0.5 rounded-full bg-primary" />}
      <div
        ref={definirArrastavel}
        onClick={aoAbrir}
        {...listeners}
        {...attributes}
        // Enter abre o cartão; Espaço continua sendo "pegar para arrastar".
        onKeyDown={(evento) => {
          if (evento.key === "Enter") {
            evento.preventDefault()
            aoAbrir()
            return
          }
          listeners?.onKeyDown?.(evento)
        }}
        aria-label={`Cartão ${cartao.titulo}. Enter abre, Espaço arrasta.`}
        className={cn(
          "block w-full cursor-grab touch-none rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing",
          isDragging && "opacity-40"
        )}
      >
        <ConteudoCartao cartao={cartao} etiquetas={etiquetas} concluido={concluido} exibicao={exibicao} interativo />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Ações do cartão ${cartao.titulo}`}
          className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-md bg-card/80 text-muted-foreground opacity-0 group-hover/cartao:opacity-100 hover:bg-muted hover:text-foreground focus-visible:opacity-100 aria-expanded:opacity-100"
        >
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={aoAbrir}>Abrir</DropdownMenuItem>
          <DropdownMenuItem onClick={() => duplicarCartao(cartao.id)}><CopyIcon /> Duplicar</DropdownMenuItem>
          <DropdownMenuItem onClick={() => arquivarCartao(cartao.id, true)}><ArchiveIcon /> Arquivar</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => excluirCartao(cartao.id)}><Trash2Icon /> Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
