"use client"

// Rafael Marques - 26/10/2026
// Árvore do explorador da Biblioteca: livros e notas em níveis, com arrastar e soltar para
// mover, renomear no lugar, menu de ações e filtro. Clicar num livro mostra o conteúdo dele ao
// lado; clicar numa nota ou quadro abre ela.

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core"
import { useShallow } from "zustand/react/shallow"
import { ChevronRightIcon, FilePlusIcon, FolderIcon, FolderInputIcon, FolderOpenIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon, WorkflowIcon } from "lucide-react"

import { Icone } from "@/components/icone"
import { DialogoExcluirLivro } from "@/components/livros/dialogo-excluir-livro"
import { DialogoExcluirNota } from "@/components/notas/dialogo-excluir-nota"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useNotas } from "@/lib/estado/notas"
import type { Livro, Nota } from "@/lib/tipos"
import { cn } from "@/lib/utils"

export type SelecaoBiblioteca = { tipo: "raiz" } | { tipo: "livro"; id: string } | { tipo: "soltas" }

const CHAVE_ABERTOS = "sprintnote-explorador-abertos"

// Quais ramos estão abertos fica guardado neste aparelho (é só uma preferência de tela).
function lerAbertos(): Set<string> {
  try {
    const bruto = localStorage.getItem(CHAVE_ABERTOS)
    return new Set(bruto ? (JSON.parse(bruto) as string[]) : [])
  } catch {
    return new Set()
  }
}

const botaoLinha = "flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 hover:bg-foreground/10 hover:text-foreground focus-visible:opacity-100 group-hover/linha:opacity-100 aria-expanded:opacity-100 max-md:opacity-100"

type Props = {
  selecao: SelecaoBiblioteca
  aoSelecionar: (selecao: SelecaoBiblioteca) => void
  // "lateral" = dentro da barra lateral do app (sem moldura nem busca); "painel" = no explorador.
  modo?: "painel" | "lateral"
  // Nota aberta agora (fica destacada na árvore).
  notaAtiva?: string | null
  className?: string
}

export function ArvoreBiblioteca({ selecao, aoSelecionar, modo = "painel", notaAtiva = null, className }: Props) {
  const lateral = modo === "lateral"
  const router = useRouter()
  const { livros, notas } = useNotas(useShallow((estado) => ({ livros: estado.livros, notas: estado.notas })))
  const { criarNota, moverNota, renomearNota, renomearLivro } = useNotas(
    useShallow((estado) => ({ criarNota: estado.criarNota, moverNota: estado.moverNota, renomearNota: estado.renomearNota, renomearLivro: estado.renomearLivro }))
  )
  const [abertos, setAbertos] = useState<Set<string>>(() => (typeof window === "undefined" ? new Set() : lerAbertos()))
  const [renomeando, setRenomeando] = useState<string | null>(null)
  const [arrastando, setArrastando] = useState<Nota | null>(null)
  const [notaParaExcluir, setNotaParaExcluir] = useState<Nota | null>(null)
  const [livroParaExcluir, setLivroParaExcluir] = useState<Livro | null>(null)

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  )

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_ABERTOS, JSON.stringify([...abertos]))
    } catch {
      // Sem armazenamento: só não lembra o que estava aberto.
    }
  }, [abertos])


  function alternar(id: string) {
    setAbertos((anterior) => {
      const proximo = new Set(anterior)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
  }
  function abrir(...ids: string[]) {
    setAbertos((anterior) => new Set([...anterior, ...ids]))
  }

  function novaNota(livroId: string | null, paiId: string | null = null, quadro = false) {
    const nota = criarNota({ livroId, paiId, ...(quadro ? { titulo: "Novo quadro", tipo: "quadro" as const } : {}) })
    abrir(...[livroId ? `livro:${livroId}` : "soltas", paiId ?? ""].filter(Boolean))
    router.push(`/notas/${nota.id}`)
  }

  function aoSoltar(evento: DragEndEvent) {
    setArrastando(null)
    const origem = String(evento.active.id).replace("nota:", "")
    const destino = evento.over ? String(evento.over.id) : null
    if (!destino) return
    if (destino.startsWith("livro:")) moverNota(origem, destino.slice(6), null)
    else if (destino === "soltas") moverNota(origem, null, null)
    else if (destino.startsWith("nota:")) {
      const alvo = notas.find((item) => item.id === destino.slice(5))
      if (alvo && alvo.id !== origem) {
        moverNota(origem, alvo.livroId, alvo.id)
        abrir(alvo.id)
      }
    }
  }
  function aoComecar(evento: DragStartEvent) {
    setArrastando(notas.find((item) => `nota:${item.id}` === evento.active.id) ?? null)
  }

  const soltas = notas.filter((nota) => nota.livroId === null && nota.paiId === null)

  function ramo(livroId: string | null, paiId: string | null, nivel: number): React.ReactNode {
    const filhas = notas
      .filter((nota) => nota.livroId === livroId && nota.paiId === paiId)
      .sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"))
    return filhas.map((nota) => (
      <LinhaNota
        key={nota.id}
        nota={nota}
        nivel={nivel}
        ativa={nota.id === notaAtiva}
        aberta={abertos.has(nota.id)}
        temFilhas={notas.some((item) => item.paiId === nota.id)}
        renomeando={renomeando === nota.id}
        livros={livros}
        aoAlternar={() => alternar(nota.id)}
        aoAbrir={() => router.push(`/notas/${nota.id}`)}
        aoRenomear={() => setRenomeando(nota.id)}
        aoConfirmarNome={(titulo) => {
          if (titulo.trim()) renomearNota(nota.id, titulo)
          setRenomeando(null)
        }}
        aoNova={(quadro) => novaNota(livroId, nota.id, quadro)}
        aoMover={(destino) => moverNota(nota.id, destino, null)}
        aoExcluir={() => setNotaParaExcluir(nota)}
      >
        {ramo(livroId, nota.id, nivel + 1)}
      </LinhaNota>
    ))
  }

  const livrosVisiveis = livros
  const mostrarSoltas = soltas.length > 0

  return (
    <DndContext sensors={sensores} onDragStart={aoComecar} onDragEnd={aoSoltar} onDragCancel={() => setArrastando(null)}>
      <nav
        aria-label="Estrutura da biblioteca"
        className={cn("flex min-h-0 flex-col", !lateral && "rounded-xl border bg-card", className)}
        style={{ "--linha-hover": lateral ? "var(--sidebar-accent)" : "var(--muted)", "--linha-ativa": lateral ? "var(--sidebar-accent)" : "var(--muted)" } as React.CSSProperties}
      >
        <div className={cn("min-h-0 flex-1 space-y-0.5", !lateral && "overflow-y-auto p-1.5")} role="tree">
          {livrosVisiveis.map((livro) => (
            <LinhaLivro
              key={livro.id}
              livro={livro}
              selecionado={selecao.tipo === "livro" && selecao.id === livro.id}
              aberto={abertos.has(`livro:${livro.id}`)}
              temNotas={notas.some((nota) => nota.livroId === livro.id)}
              renomeando={renomeando === `livro:${livro.id}`}
              aoAlternar={() => alternar(`livro:${livro.id}`)}
              aoSelecionar={() => {
                aoSelecionar({ tipo: "livro", id: livro.id })
                abrir(`livro:${livro.id}`)
              }}
              aoRenomear={() => setRenomeando(`livro:${livro.id}`)}
              aoConfirmarNome={(titulo) => {
                if (titulo.trim()) renomearLivro(livro.id, titulo)
                setRenomeando(null)
              }}
              aoNova={(quadro) => novaNota(livro.id, null, quadro)}
              aoExcluir={() => setLivroParaExcluir(livro)}
            >
              {ramo(livro.id, null, 1)}
            </LinhaLivro>
          ))}

          {mostrarSoltas && (
            <LinhaSoltas
              selecionado={selecao.tipo === "soltas"}
              aberto={abertos.has("soltas")}
              total={soltas.length}
              aoAlternar={() => alternar("soltas")}
            >
              {ramo(null, null, 1)}
            </LinhaSoltas>
          )}

          {livrosVisiveis.length === 0 && !mostrarSoltas && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nada por aqui ainda.</p>}
        </div>
      </nav>

      <DragOverlay>
        {arrastando && (
          <div className="flex items-center gap-2 rounded-lg border bg-popover px-3 py-1.5 text-sm shadow-lg">
            <Icone nome={arrastando.icone} className="text-muted-foreground" /> {arrastando.titulo}
          </div>
        )}
      </DragOverlay>

      <DialogoExcluirNota nota={notaParaExcluir} aoMudarAberto={(aberto) => !aberto && setNotaParaExcluir(null)} />
      <DialogoExcluirLivro livro={livroParaExcluir} aoMudarAberto={(aberto) => !aberto && setLivroParaExcluir(null)} />
    </DndContext>
  )
}

function Seta({ aberta, visivel, aoClicar }: { aberta: boolean; visivel: boolean; aoClicar: () => void }) {
  return (
    <button type="button" onClick={aoClicar} aria-label={aberta ? "Recolher" : "Expandir"} aria-expanded={aberta} className={cn("flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/10", !visivel && "invisible")}>
      <ChevronRightIcon className={cn("size-3.5 transition-transform", aberta && "rotate-90")} />
    </button>
  )
}

// Campo de nome que aparece no lugar do texto ao renomear.
function CampoNome({ valor, aoConfirmar }: { valor: string; aoConfirmar: (nome: string) => void }) {
  const campo = useRef<HTMLInputElement>(null)
  useEffect(() => {
    campo.current?.focus()
    campo.current?.select()
  }, [])
  return (
    <input
      ref={campo}
      defaultValue={valor}
      aria-label="Novo nome"
      onBlur={(evento) => aoConfirmar(evento.target.value)}
      onKeyDown={(evento) => {
        if (evento.key === "Enter") evento.currentTarget.blur()
        if (evento.key === "Escape") {
          evento.currentTarget.value = valor
          evento.currentTarget.blur()
        }
      }}
      className="h-6 min-w-0 flex-1 rounded border bg-background px-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    />
  )
}

function LinhaLivro({
  livro,
  selecionado,
  aberto,
  temNotas,
  renomeando,
  aoAlternar,
  aoSelecionar,
  aoRenomear,
  aoConfirmarNome,
  aoNova,
  aoExcluir,
  children,
}: {
  livro: Livro
  selecionado: boolean
  aberto: boolean
  temNotas: boolean
  renomeando: boolean
  aoAlternar: () => void
  aoSelecionar: () => void
  aoRenomear: () => void
  aoConfirmarNome: (nome: string) => void
  aoNova: (quadro: boolean) => void
  aoExcluir: () => void
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `livro:${livro.id}` })
  return (
    <div role="treeitem" aria-expanded={temNotas ? aberto : undefined} aria-selected={selecionado}>
      <div ref={setNodeRef} className={cn("group/linha flex h-8 items-center gap-0.5 rounded-md pr-0.5 text-sm font-medium hover:bg-[var(--linha-hover)]", selecionado && "bg-[var(--linha-ativa)]", isOver && "bg-primary/15 ring-2 ring-primary/50")}>
        <Seta aberta={aberto} visivel={temNotas} aoClicar={aoAlternar} />
        {renomeando ? (
          <CampoNome valor={livro.titulo} aoConfirmar={aoConfirmarNome} />
        ) : (
          <button type="button" onClick={aoSelecionar} onDoubleClick={aoRenomear} className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left">
            <Icone nome={livro.icone} />
            <span className="truncate">{livro.titulo}</span>
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Mais ações do livro" className={botaoLinha}>
            <MoreHorizontalIcon className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem onClick={() => aoNova(false)}>
              <FilePlusIcon /> Nova nota
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => aoNova(true)}>
              <WorkflowIcon /> Novo quadro
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={aoRenomear}>
              <PencilIcon /> Renomear
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={aoExcluir}>
              <Trash2Icon /> Excluir livro
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {aberto && temNotas && <div role="group">{children}</div>}
    </div>
  )
}

function LinhaSoltas({ selecionado, aberto, total, aoAlternar, children }: { selecionado: boolean; aberto: boolean; total: number; aoAlternar: () => void; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "soltas" })
  return (
    <div role="treeitem" aria-expanded={aberto} aria-selected={selecionado}>
      <div ref={setNodeRef} className={cn("group/linha flex h-8 items-center gap-0.5 rounded-md pr-0.5 text-sm hover:bg-[var(--linha-hover)]", selecionado && "bg-[var(--linha-ativa)]", isOver && "bg-primary/15 ring-2 ring-primary/50")}>
        <Seta aberta={aberto} visivel aoClicar={aoAlternar} />
        <button type="button" onClick={aoAlternar} className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left text-muted-foreground">
          <FolderInputIcon className="size-4" />
          <span className="truncate">Notas soltas</span>
          <span className="text-xs tabular-nums">{total}</span>
        </button>
      </div>
      {aberto && <div role="group">{children}</div>}
    </div>
  )
}

function LinhaNota({
  nota,
  nivel,
  ativa,
  aberta,
  temFilhas,
  renomeando,
  livros,
  aoAlternar,
  aoAbrir,
  aoRenomear,
  aoConfirmarNome,
  aoNova,
  aoMover,
  aoExcluir,
  children,
}: {
  nota: Nota
  nivel: number
  ativa: boolean
  aberta: boolean
  temFilhas: boolean
  renomeando: boolean
  livros: Livro[]
  aoAlternar: () => void
  aoAbrir: () => void
  aoRenomear: () => void
  aoConfirmarNome: (nome: string) => void
  aoNova: (quadro: boolean) => void
  aoMover: (livroId: string | null) => void
  aoExcluir: () => void
  children: React.ReactNode
}) {
  const arrastavel = useDraggable({ id: `nota:${nota.id}` })
  const alvo = useDroppable({ id: `nota:${nota.id}` })
  return (
    <div role="treeitem" aria-selected={false} aria-expanded={temFilhas ? aberta : undefined}>
      <div
        ref={(elemento) => {
          arrastavel.setNodeRef(elemento)
          alvo.setNodeRef(elemento)
        }}
        className={cn("group/linha flex h-8 items-center gap-0.5 rounded-md pr-0.5 text-sm hover:bg-[var(--linha-hover)]", ativa && "bg-[var(--linha-ativa)] font-medium", arrastavel.isDragging && "opacity-40", alvo.isOver && !arrastavel.isDragging && "bg-primary/15 ring-2 ring-primary/50")}
        style={{ paddingLeft: nivel * 14 }}
        {...arrastavel.attributes}
        {...arrastavel.listeners}
      >
        <Seta aberta={aberta} visivel={temFilhas} aoClicar={aoAlternar} />
        {renomeando ? (
          <CampoNome valor={nota.titulo} aoConfirmar={aoConfirmarNome} />
        ) : (
          // Rafael Marques - 29/10/2026: nota com notas dentro aparece como seção. Mostra o ícone escolhido;
          // a pasta só entra no lugar do ícone padrão ("arquivo").
          <button type="button" onClick={aoAbrir} onDoubleClick={aoRenomear} className={cn("flex min-w-0 flex-1 items-center gap-2 py-1 text-left", temFilhas && "font-medium")}>
            {temFilhas && (!nota.icone || nota.icone === "arquivo") ? (
              aberta ? <FolderOpenIcon className="size-4 shrink-0 text-muted-foreground" /> : <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <Icone nome={nota.icone} className="text-muted-foreground" />
            )}
            <span className="truncate">{nota.titulo}</span>
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Mais ações" className={botaoLinha}>
            <MoreHorizontalIcon className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {nota.tipo !== "quadro" && (
              <DropdownMenuItem onClick={() => aoNova(false)}>
                <FilePlusIcon /> {temFilhas ? "Nova nota na seção" : "Nova nota dentro (vira seção)"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={aoRenomear}>
              <PencilIcon /> Renomear
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderInputIcon /> Mover para…
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                {livros.map((livro) => (
                  <DropdownMenuItem key={livro.id} onClick={() => aoMover(livro.id)}>
                    <Icone nome={livro.icone} /> {livro.titulo}
                  </DropdownMenuItem>
                ))}
                {livros.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={() => aoMover(null)}>Notas soltas</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={aoExcluir}>
              <Trash2Icon /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {aberta && temFilhas && <div role="group">{children}</div>}
    </div>
  )
}
