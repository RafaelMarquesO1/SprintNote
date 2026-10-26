"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useShallow } from "zustand/react/shallow"
import {
  ArrowUpDownIcon,
  BookOpenIcon,
  BookPlusIcon,
  CheckIcon,
  ExternalLinkIcon,
  EyeIcon,
  FileTextIcon,
  ImageIcon,
  LayoutGridIcon,
  LibraryIcon,
  Link2Icon,
  ListIcon,
  MoreHorizontalIcon,
  NetworkIcon,
  PaletteIcon,
  PinIcon,
  PinOffIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  ShapesIcon,
  Trash2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { Icone, iconesNota } from "@/components/icone"
import { SeletorCor } from "@/components/kanban/dialogos-quadro"
import { DialogoExcluirLivro } from "@/components/livros/dialogo-excluir-livro"
import { BibliotecaVazia } from "@/components/notas/biblioteca-vazia"
import { CabecalhoPagina, Pagina, ResumoLinha } from "@/components/pagina"
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useHidratado } from "@/hooks/use-hidratado"
import { tempoRelativo, useAgora } from "@/hooks/use-hoje"
import { capasLivro, corDoLivro as corEscolhidaDoLivro, estiloCapaLivro, estiloFaixa } from "@/lib/cores"
import { useNotas } from "@/lib/estado/notas"
import { preferenciasBibliotecaPadrao, usePreferencias, type PreferenciasBiblioteca } from "@/lib/estado/preferencias"
import { travarCursorArrastando } from "@/lib/arrastar"
import { extrairLinksWiki, semAcento } from "@/lib/links-wiki"
import { tagsDaNota } from "@/lib/tags"
import type { Livro, Nota } from "@/lib/tipos"

type Aba = "livros" | "notas" | "soltas"
type Ordem = PreferenciasBiblioteca["ordem"]

const nomesOrdem: Record<Ordem, string> = {
  recentes: "Editados recentemente",
  nome: "Nome (A–Z)",
  tamanho: "Mais notas",
  criacao: "Ordem de criação",
}

// Largura dos cartões de livro: o usuário arrasta a borda de um cartão e a
// grade encaixa quantos cabem por linha.
const LARGURA_MINIMA = 200
const MAXIMO_POR_LINHA = 6
const larguraAntiga = { compacto: 220, normal: 300, grande: 420 }

const opcoesMostrar: { chave: keyof PreferenciasBiblioteca; rotulo: string }[] = [
  { chave: "mostrarNumeros", rotulo: "Números da coleção" },
  { chave: "mostrarCapa", rotulo: "Capa dos livros" },
  { chave: "mostrarDescricao", rotulo: "Descrição" },
  { chave: "mostrarTags", rotulo: "Contadores e tags" },
  { chave: "mostrarTarefas", rotulo: "Progresso das tarefas" },
  { chave: "mostrarRecentes", rotulo: "Notas recentes" },
]

// Resumo do conteúdo sem a sintaxe Markdown.
function resumir(conteudo: string) {
  return conteudo
    .replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (_, alvo: string, __, rotulo?: string) => rotulo ?? alvo.split("/").pop() ?? alvo)
    .replace(/^\s*[-*+] (\[[ xX]\] )?/gm, "")
    .replace(/^>\s?(\[![^\]]+\]\s?)?/gm, "")
    .replace(/[#*`|=]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// Tarefas ([ ] / [x]) escritas nas notas do livro.
function contarTarefas(notas: Nota[]) {
  let total = 0
  let feitas = 0
  for (const nota of notas) {
    for (const linha of nota.conteudo.split("\n")) {
      const encontrado = /^\s*[-*+] \[( |x|X)\] \S/.exec(linha)
      if (!encontrado) continue
      total++
      if (encontrado[1] !== " ") feitas++
    }
  }
  return { total, feitas }
}

type ResumoLivro = {
  livro: Livro
  cor: string
  notas: Nota[]
  links: number
  tags: string[]
  tarefas: { total: number; feitas: number }
  atualizadoEm: number
}

// Menu de cada livro: abrir, nova nota, fixar, cor, capa, ícone e excluir.
function MenuLivro({ resumo, aoNovaNota, aoExcluir, className }: { resumo: ResumoLivro; aoNovaNota: () => void; aoExcluir: () => void; className?: string }) {
  const atualizarLivro = useNotas((estado) => estado.atualizarLivro)
  const { livro, cor } = resumo
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="secondary" size="icon-sm" aria-label={`Opções do livro ${livro.titulo}`} className={className} />}>
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem render={<Link href={`/livros/${livro.id}`} />}><ExternalLinkIcon /> Abrir livro</DropdownMenuItem>
        <DropdownMenuItem onClick={aoNovaNota}><PlusIcon /> Nova nota</DropdownMenuItem>
        <DropdownMenuItem onClick={() => atualizarLivro(livro.id, { fixado: !livro.fixado })}>
          {livro.fixado ? <><PinOffIcon /> Desafixar</> : <><PinIcon /> Fixar no topo</>}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger><PaletteIcon /> Cor</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-auto p-2">
            <SeletorCor valor={livro.cor ?? null} aoMudar={(nova) => atualizarLivro(livro.id, { cor: nova })} permitirNenhuma />
            <p className="mt-2 max-w-44 text-xs text-muted-foreground">Também muda a cor do livro no grafo.</p>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger><ImageIcon /> Capa</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            {capasLivro.map((capa) => (
              <DropdownMenuItem key={capa.id} onClick={() => atualizarLivro(livro.id, { capa: capa.id })}>
                <span className="size-4 shrink-0 rounded border" style={estiloCapaLivro(capa.id, cor)} /> {capa.nome}
                {(livro.capa ?? "pontos") === capa.id && <CheckIcon className="ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger><ShapesIcon /> Ícone</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-auto">
            <div className="grid grid-cols-8 gap-0.5">
              {iconesNota.map((icone) => (
                <DropdownMenuItem key={icone} aria-label={icone} className="justify-center" onClick={() => atualizarLivro(livro.id, { icone })}>
                  <Icone nome={icone} />
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={aoExcluir}><Trash2Icon /> Excluir livro</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Rafael Marques - 22/10/2026
// "Mostrar": o que aparece nos cartões, direto na barra (sem painel de personalizar).
function MenuMostrar({ preferencias }: { preferencias: PreferenciasBiblioteca }) {
  const definir = usePreferencias((estado) => estado.definirBiblioteca)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" aria-label="O que mostrar" title="O que mostrar" />}>
        <EyeIcon /> <span className="max-sm:hidden">Mostrar</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Mostrar</DropdownMenuLabel>
          {opcoesMostrar.map((opcao) => (
            <DropdownMenuCheckboxItem
              key={opcao.chave}
              checked={Boolean(preferencias[opcao.chave])}
              onCheckedChange={(marcado) => definir({ [opcao.chave]: marcado })}
            >
              {opcao.rotulo}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => definir(preferenciasBibliotecaPadrao)}>
          <RotateCcwIcon /> Restaurar padrão
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Prévia que aparece ao passar o mouse no nome do livro.
function PreviaLivro({ resumo, agora }: { resumo: ResumoLivro; agora: number }) {
  const recentes = [...resumo.notas].sort((a, b) => b.atualizadoEm - a.atualizadoEm).slice(0, 5)
  return (
    <HoverCardContent align="start" className="w-72 space-y-2">
      <p className="text-sm font-semibold">{resumo.livro.titulo}</p>
      {recentes.length === 0 ? (
        <p className="text-xs text-muted-foreground">Ainda sem notas.</p>
      ) : (
        <ul className="space-y-1">
          {recentes.map((nota) => (
            <li key={nota.id}>
              <Link href={`/notas/${nota.id}`} className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted">
                <Icone nome={nota.icone} className="text-muted-foreground" />
                <span className="truncate">{nota.titulo}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">{tempoRelativo(nota.atualizadoEm, agora)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </HoverCardContent>
  )
}

type PropsLivro = {
  resumo: ResumoLivro
  agora: number
  preferencias: PreferenciasBiblioteca
  aoNovaNota: () => void
  aoExcluir: () => void
}

function CartaoLivro({
  resumo,
  agora,
  preferencias,
  aoNovaNota,
  aoExcluir,
  aoRedimensionar,
  rotuloLargura,
}: PropsLivro & {
  // Arrastar a borda direita muda o tamanho de todos os cartões.
  aoRedimensionar: (evento: React.PointerEvent, cartao: HTMLElement) => void
  // "3 por linha", mostrado enquanto este cartão é arrastado.
  rotuloLargura?: string
}) {
  const { livro, cor, notas, links, tags, tarefas } = resumo
  const recentes = [...notas].sort((a, b) => b.atualizadoEm - a.atualizadoEm)
  const capa = preferencias.mostrarCapa
  return (
    <Card
      className={cn(
        "group relative gap-0 transition-shadow hover:shadow-md hover:ring-foreground/20",
        capa && "pt-0",
        rotuloLargura && "ring-2 ring-primary/40"
      )}
    >
      {capa && <Link href={`/livros/${livro.id}`} aria-label={`Abrir o livro ${livro.titulo}`} className="block aspect-[10/3] max-h-40 min-h-16" style={estiloCapaLivro(livro.capa, cor)} />}
      {/* Borda direita: arraste para mudar o tamanho dos cartões */}
      <div
        aria-hidden
        title="Arraste para mudar o tamanho dos cartões"
        onPointerDown={(evento) => aoRedimensionar(evento, evento.currentTarget.parentElement!)}
        className="absolute top-12 right-0 bottom-14 z-20 flex w-3 cursor-ew-resize touch-none items-center justify-center max-sm:hidden"
      >
        <span className={cn("h-10 w-1 rounded-full bg-foreground/25 transition-opacity", rotuloLargura ? "opacity-100" : "opacity-0 group-hover:opacity-100")} />
      </div>
      {rotuloLargura && (
        <span className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-md bg-foreground px-2 py-0.5 text-xs font-medium text-background tabular-nums">
          {rotuloLargura}
        </span>
      )}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        {livro.fixado && (
          <span className="flex size-7 items-center justify-center rounded-md bg-background/80 text-foreground shadow-sm" title="Fixado no topo">
            <PinIcon className="size-3.5" />
          </span>
        )}
        <MenuLivro
          resumo={resumo}
          aoNovaNota={aoNovaNota}
          aoExcluir={aoExcluir}
          className="bg-background/80 opacity-0 shadow-sm group-hover:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100"
        />
      </div>
      <CardHeader className={cn("gap-1.5", capa && "-mt-7")}>
        <span
          className={cn("flex size-12 items-center justify-center rounded-xl", capa && "border-4 border-card bg-card shadow-sm")}
          style={capa ? { color: cor } : { color: cor, background: `color-mix(in oklch, ${cor} 15%, transparent)` }}
        >
          <Icone nome={livro.icone} className="size-6" />
        </span>
        <HoverCard>
          <HoverCardTrigger render={<Link href={`/livros/${livro.id}`} />} className="mt-1 block">
            <CardTitle className="truncate text-base hover:underline">{livro.titulo}</CardTitle>
          </HoverCardTrigger>
          <PreviaLivro resumo={resumo} agora={agora} />
        </HoverCard>
        {preferencias.mostrarDescricao && (
          <CardDescription className="line-clamp-2 min-h-10">
            {livro.descricao || <span className="italic opacity-70">Sem descrição — adicione uma na página do livro.</span>}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="mt-3 mb-4 space-y-3">
        {preferencias.mostrarTags && (
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary"><FileTextIcon /> {notas.length} nota{notas.length === 1 ? "" : "s"}</Badge>
          {links > 0 && <Badge variant="secondary"><Link2Icon /> {links} link{links === 1 ? "" : "s"}</Badge>}
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-muted-foreground">#{tag}</Badge>
          ))}
        </div>
        )}
        {preferencias.mostrarTarefas && tarefas.total > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tarefas nas notas</span>
              <span className="tabular-nums">{tarefas.feitas}/{tarefas.total}</span>
            </div>
            <Progress value={(tarefas.feitas / tarefas.total) * 100} aria-label="Tarefas concluídas" />
          </div>
        )}
      </CardContent>

      <CardFooter className="mt-auto justify-between gap-2 border-t py-3">
        {!preferencias.mostrarRecentes ? (
          <span className="text-xs text-muted-foreground">{notas.length} nota{notas.length === 1 ? "" : "s"}</span>
        ) : recentes.length > 0 ? (
          <AvatarGroup>
            {recentes.slice(0, 4).map((nota) => (
              <Avatar key={nota.id} size="sm" title={nota.titulo}>
                <AvatarFallback><Icone nome={nota.icone} className="size-3.5" /></AvatarFallback>
              </Avatar>
            ))}
            {recentes.length > 4 && <AvatarGroupCount>+{recentes.length - 4}</AvatarGroupCount>}
          </AvatarGroup>
        ) : (
          <span className="text-xs text-muted-foreground">Livro vazio</span>
        )}
        <div className="flex items-center gap-1">
          <span className="mr-1 text-xs text-muted-foreground">{tempoRelativo(resumo.atualizadoEm, agora)}</span>
          <Button size="icon-sm" variant="ghost" aria-label={`Nova nota em ${livro.titulo}`} title="Nova nota neste livro" onClick={aoNovaNota}>
            <PlusIcon />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

function LinhaLivro({ resumo, agora, preferencias, aoNovaNota, aoExcluir }: PropsLivro) {
  const { livro, cor, notas, links, tarefas } = resumo
  return (
    <Card size="sm" className="group flex-row items-center gap-4 px-4 transition-colors hover:bg-muted/40" style={estiloFaixa(cor, "esquerda", 4)}>
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-lg"
        style={preferencias.mostrarCapa ? { ...estiloCapaLivro(livro.capa, cor), color: "white" } : { color: cor, background: `color-mix(in oklch, ${cor} 15%, transparent)` }}
      >
        <Icone nome={livro.icone} className="size-5" />
      </span>
      <Link href={`/livros/${livro.id}`} className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate font-semibold">
          {livro.titulo}
          {livro.fixado && <PinIcon className="size-3.5 shrink-0 text-muted-foreground" aria-label="Fixado" />}
        </p>
        {preferencias.mostrarDescricao && (
          <p className="truncate text-xs text-muted-foreground">{livro.descricao || `${notas.length} nota(s)`}</p>
        )}
      </Link>
      {preferencias.mostrarTags && (
        <div className="hidden items-center gap-1.5 sm:flex">
          <Badge variant="secondary"><FileTextIcon /> {notas.length}</Badge>
          {links > 0 && <Badge variant="secondary"><Link2Icon /> {links}</Badge>}
          {preferencias.mostrarTarefas && tarefas.total > 0 && <Badge variant="outline">{tarefas.feitas}/{tarefas.total} tarefas</Badge>}
        </div>
      )}
      <span className="hidden w-20 text-right text-xs text-muted-foreground md:block">{tempoRelativo(resumo.atualizadoEm, agora)}</span>
      <Button size="icon-sm" variant="ghost" aria-label={`Nova nota em ${livro.titulo}`} onClick={aoNovaNota}>
        <PlusIcon />
      </Button>
      <MenuLivro resumo={resumo} aoNovaNota={aoNovaNota} aoExcluir={aoExcluir} className="bg-transparent" />
    </Card>
  )
}

function CartaoNota({ nota, livro, cor, agora }: { nota: Nota; livro?: Livro; cor?: string; agora: number }) {
  const tags = tagsDaNota(nota)
  return (
    <Link href={`/notas/${nota.id}`} className="group">
      <Card size="sm" className="h-full gap-2 transition-shadow group-hover:shadow-md group-hover:ring-foreground/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Icone nome={nota.icone} className="text-muted-foreground" />
            <span className="truncate">{nota.titulo}</span>
          </CardTitle>
          <CardAction>
            <span className="text-xs text-muted-foreground">{tempoRelativo(nota.atualizadoEm, agora)}</span>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="line-clamp-2 min-h-8 text-xs text-muted-foreground">{resumir(nota.conteudo) || "Nota vazia"}</p>
          <div className="flex flex-wrap items-center gap-1">
            {livro ? (
              <Badge variant="outline" style={{ color: cor, borderColor: `color-mix(in oklch, ${cor} 40%, transparent)` }}>
                <BookOpenIcon /> {livro.titulo}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">Solta</Badge>
            )}
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-muted-foreground">#{tag}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// Rafael Marques - 21/10/2026
// Biblioteca: números da coleção, livros em cartões com capa colorida,
// todas as notas e notas soltas — com busca, ordenação e grade/lista.
export function ListaNotas() {
  const hidratado = useHidratado()
  const agora = useAgora()
  const router = useRouter()
  const { livros, notas } = useNotas(useShallow((estado) => ({ livros: estado.livros, notas: estado.notas })))
  const criarNota = useNotas((estado) => estado.criarNota)
  const criarLivro = useNotas((estado) => estado.criarLivro)
  const preferenciasSalvas = usePreferencias((estado) => estado.biblioteca)
  const definirPreferencias = usePreferencias((estado) => estado.definirBiblioteca)
  const preferencias = { ...preferenciasBibliotecaPadrao, ...preferenciasSalvas }
  const { ordem, visao } = preferencias
  const setOrdem = (nova: Ordem) => definirPreferencias({ ordem: nova })
  const [aba, setAba] = useState<Aba>("livros")
  const [busca, setBusca] = useState("")
  const [excluindo, setExcluindo] = useState<Livro | null>(null)
  const grade = useRef<HTMLDivElement>(null)
  // Enquanto a borda é arrastada: largura provisória e qual cartão mostra o rótulo.
  const [redimensionando, setRedimensionando] = useState<{ livroId: string; largura: number; porLinha: number } | null>(null)
  const larguraSalva = preferencias.larguraCartao ?? larguraAntiga[preferencias.tamanho ?? "normal"]
  const larguraCartao = redimensionando?.largura ?? larguraSalva

  // A largura "encaixa" em quantos cartões cabem por linha; ao soltar, fica salva.
  function redimensionarCartoes(evento: React.PointerEvent, cartao: HTMLElement, livroId: string) {
    const elementoGrade = grade.current
    if (!elementoGrade || evento.button !== 0) return
    evento.preventDefault()
    evento.stopPropagation()
    const espaco = parseFloat(getComputedStyle(elementoGrade).columnGap) || 0
    const total = elementoGrade.clientWidth
    const limite = Math.max(1, Math.min(MAXIMO_POR_LINHA, Math.floor((total + espaco) / (LARGURA_MINIMA + espaco))))
    const larguraPara = (porLinha: number) => Math.floor((total - espaco * (porLinha - 1)) / porLinha)
    const inicio = { x: evento.clientX, largura: cartao.offsetWidth }
    let atual: { livroId: string; largura: number; porLinha: number } | null = null
    const liberarCursor = travarCursorArrastando("ew-resize")

    function mover(movimento: PointerEvent) {
      const desejada = inicio.largura + movimento.clientX - inicio.x
      const porLinha = Math.max(1, Math.min(limite, Math.round((total + espaco) / (desejada + espaco))))
      if (atual?.porLinha === porLinha) return
      atual = { livroId, largura: larguraPara(porLinha), porLinha }
      setRedimensionando(atual)
    }

    function soltar() {
      window.removeEventListener("pointermove", mover)
      window.removeEventListener("pointerup", soltar)
      window.removeEventListener("pointercancel", soltar)
      liberarCursor()
      if (atual) definirPreferencias({ larguraCartao: atual.largura })
      setRedimensionando(null)
    }

    window.addEventListener("pointermove", mover)
    window.addEventListener("pointerup", soltar)
    window.addEventListener("pointercancel", soltar)
  }

  const resumos = useMemo<ResumoLivro[]>(
    () =>
      livros.map((livro) => {
        const doLivro = notas.filter((nota) => nota.livroId === livro.id)
        return {
          livro,
          cor: corEscolhidaDoLivro(livros, livro.id)!,
          notas: doLivro,
          links: doLivro.reduce((soma, nota) => soma + extrairLinksWiki(nota.conteudo).length, 0),
          tags: [...new Set(doLivro.flatMap(tagsDaNota))],
          tarefas: contarTarefas(doLivro),
          atualizadoEm: Math.max(livro.atualizadoEm, ...doLivro.map((nota) => nota.atualizadoEm)),
        }
      }),
    [livros, notas]
  )

  if (!hidratado) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-3 sm:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-20" />)}</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-72" />)}</div>
      </div>
    )
  }

  const termo = semAcento(busca.trim())
  const corDoLivro = (id: string | null) => resumos.find((resumo) => resumo.livro.id === id)?.cor
  const totalLinks = resumos.reduce((soma, resumo) => soma + resumo.links, 0) +
    notas.filter((nota) => !nota.livroId).reduce((soma, nota) => soma + extrairLinksWiki(nota.conteudo).length, 0)
  const naSemana = agora ? notas.filter((nota) => agora - nota.atualizadoEm < 7 * 86_400_000).length : 0

  const livrosVisiveis = resumos
    .filter((resumo) => !termo || semAcento(`${resumo.livro.titulo} ${resumo.livro.descricao}`).includes(termo))
    .sort((a, b) =>
      // Livros fixados ficam sempre no topo.
      Number(Boolean(b.livro.fixado)) - Number(Boolean(a.livro.fixado)) ||
      (ordem === "nome"
        ? a.livro.titulo.localeCompare(b.livro.titulo, "pt-BR")
        : ordem === "tamanho"
          ? b.notas.length - a.notas.length
          : ordem === "criacao"
            ? a.livro.criadoEm - b.livro.criadoEm
            : b.atualizadoEm - a.atualizadoEm)
    )
  const notasVisiveis = notas
    .filter((nota) => aba !== "soltas" || nota.livroId === null)
    .filter((nota) => !termo || semAcento(`${nota.titulo} ${nota.conteudo} ${tagsDaNota(nota).join(" ")}`).includes(termo))
    .sort((a, b) =>
      ordem === "nome"
        ? a.titulo.localeCompare(b.titulo, "pt-BR")
        : ordem === "criacao"
          ? a.criadoEm - b.criadoEm
          : b.atualizadoEm - a.atualizadoEm
    )
  const totalSoltas = notas.filter((nota) => nota.livroId === null).length

  const novaNotaNoLivro = (livroId: string) => router.push(`/notas/${criarNota({ livroId }).id}`)

  return (
    <Pagina>
      <CabecalhoPagina
        secao="Biblioteca"
        icone={LibraryIcon}
        titulo="Todos os livros"
        descricao={<>Livros reúnem notas sobre um assunto. Conecte tudo com <code>[[</code>.</>}
        acoes={
          <>
          <Button variant="outline" nativeButton={false} render={<Link href="/grafo" />}>
            <NetworkIcon /> Grafo
          </Button>
          <Button onClick={() => router.push(`/livros/${criarLivro().id}`)}>
            <BookPlusIcon /> Novo livro
          </Button>
          </>
        }
        resumo={
          preferencias.mostrarNumeros &&
          (livros.length > 0 || notas.length > 0) && (
            <ResumoLinha
              itens={[
                { valor: livros.length, texto: livros.length === 1 ? "livro" : "livros" },
                { valor: notas.length, texto: notas.length === 1 ? "nota" : "notas" },
                totalSoltas > 0 && { valor: totalSoltas, texto: totalSoltas === 1 ? "solta" : "soltas" },
                { valor: totalLinks, texto: totalLinks === 1 ? "conexão" : "conexões" },
                { valor: naSemana, texto: "editadas na semana" },
              ]}
            />
          )
        }
      />

      {livros.length === 0 && notas.length === 0 ? (
        <BibliotecaVazia aoCriarLivro={() => router.push(`/livros/${criarLivro().id}`)} />
      ) : (
        <>
          {/* Barra de ferramentas */}
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={aba} onValueChange={(valor) => setAba(valor as Aba)}>
              <TabsList>
                <TabsTrigger value="livros">Livros <Badge variant="secondary" className="ml-1 h-4 px-1.5">{livros.length}</Badge></TabsTrigger>
                <TabsTrigger value="notas">Todas as notas <Badge variant="secondary" className="ml-1 h-4 px-1.5">{notas.length}</Badge></TabsTrigger>
                <TabsTrigger value="soltas">Soltas <Badge variant="secondary" className="ml-1 h-4 px-1.5">{totalSoltas}</Badge></TabsTrigger>
              </TabsList>
            </Tabs>
            {/* No celular a busca ocupa a linha toda (antes sobrava um vão à esquerda) */}
            <div className="relative min-w-0 max-sm:flex-[1_1_12rem] sm:ml-auto">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder={aba === "livros" ? "Buscar livros…" : "Buscar notas…"} aria-label="Buscar" className="w-full pl-8 sm:w-56" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                <ArrowUpDownIcon /> <span className="max-sm:hidden">{nomesOrdem[ordem]}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {(Object.keys(nomesOrdem) as Ordem[])
                  .filter((opcao) => aba === "livros" || opcao !== "tamanho")
                  .map((opcao) => (
                    <DropdownMenuItem key={opcao} onClick={() => setOrdem(opcao)}>
                      {nomesOrdem[opcao]} {ordem === opcao && <CheckIcon className="ml-auto" />}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {aba === "livros" && <MenuMostrar preferencias={preferencias} />}
            {aba === "livros" && (
              <ToggleGroup
                value={[visao]}
                onValueChange={(valor) => valor[0] && definirPreferencias({ visao: valor[0] as PreferenciasBiblioteca["visao"] })}
                variant="outline"
                size="sm"
                aria-label="Modo de exibição"
              >
                <ToggleGroupItem value="grade" aria-label="Grade"><LayoutGridIcon /></ToggleGroupItem>
                <ToggleGroupItem value="lista" aria-label="Lista"><ListIcon /></ToggleGroupItem>
              </ToggleGroup>
            )}
          </div>

          {/* Conteúdo da aba */}
          {aba === "livros" ? (
            livrosVisiveis.length === 0 ? (
              <Card className="items-center py-10 text-center text-sm text-muted-foreground">
                {livros.length === 0 ? "Nenhum livro ainda — crie um no botão “Novo livro”." : "Nenhum livro encontrado."}
              </Card>
            ) : visao === "grade" ? (
              <div
                ref={grade}
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${larguraCartao}px), 1fr))` }}
              >
                {livrosVisiveis.map((resumo) => (
                  <CartaoLivro
                    key={resumo.livro.id}
                    resumo={resumo}
                    agora={agora}
                    preferencias={preferencias}
                    aoNovaNota={() => novaNotaNoLivro(resumo.livro.id)}
                    aoExcluir={() => setExcluindo(resumo.livro)}
                    aoRedimensionar={(evento, cartao) => redimensionarCartoes(evento, cartao, resumo.livro.id)}
                    rotuloLargura={redimensionando?.livroId === resumo.livro.id ? `${redimensionando.porLinha} por linha` : undefined}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => router.push(`/livros/${criarLivro().id}`)}
                  className={cn(
                    "min-h-48",
                    "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-muted-foreground transition-colors",
                    "hover:border-primary/40 hover:bg-muted/30 hover:text-foreground"
                  )}
                >
                  <BookPlusIcon className="size-6" /> Novo livro
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {livrosVisiveis.map((resumo) => (
                  <LinhaLivro
                    key={resumo.livro.id}
                    resumo={resumo}
                    agora={agora}
                    preferencias={preferencias}
                    aoNovaNota={() => novaNotaNoLivro(resumo.livro.id)}
                    aoExcluir={() => setExcluindo(resumo.livro)}
                  />
                ))}
              </div>
            )
          ) : notasVisiveis.length === 0 ? (
            <Card className="items-center py-10 text-center text-sm text-muted-foreground">
              {aba === "soltas" && totalSoltas === 0 ? "Nenhuma nota solta: todas estão em livros." : "Nenhuma nota encontrada."}
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {notasVisiveis.map((nota) => (
                <CartaoNota
                  key={nota.id}
                  nota={nota}
                  livro={livros.find((livro) => livro.id === nota.livroId)}
                  cor={corDoLivro(nota.livroId)}
                  agora={agora}
                />
              ))}
            </div>
          )}
        </>
      )}
      <DialogoExcluirLivro livro={excluindo} aoMudarAberto={(aberto) => !aberto && setExcluindo(null)} />
    </Pagina>
  )
}
