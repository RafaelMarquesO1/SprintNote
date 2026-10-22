"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useShallow } from "zustand/react/shallow"
import {
  BookPlusIcon,
  ChevronRightIcon,
  FilePlusIcon,
  HashIcon,
  LibraryIcon,
  MoreHorizontalIcon,
  NetworkIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { Icone } from "@/components/icone"
import { DialogoExcluirLivro } from "@/components/livros/dialogo-excluir-livro"
import { DialogoExcluirNota } from "@/components/notas/dialogo-excluir-nota"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar"
import { useHidratado } from "@/hooks/use-hidratado"
import { useNotas } from "@/lib/estado/notas"
import type { Livro, Nota } from "@/lib/tipos"

const classeLinha =
  "group/linha flex h-8 items-center gap-1 rounded-md pr-1 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
const classeBotaoLinha =
  "flex size-5 shrink-0 items-center justify-center rounded-sm opacity-0 group-hover/linha:opacity-100 focus-visible:opacity-100 hover:bg-sidebar-border aria-expanded:opacity-100"

// Rafael Marques - 20/10/2026
// Biblioteca na sidebar: livros (com as notas em árvore) e notas soltas.
export function ArvoreNotas() {
  const hidratado = useHidratado()
  const router = useRouter()
  const caminho = usePathname()
  const { livros, notas } = useNotas(useShallow((estado) => ({ livros: estado.livros, notas: estado.notas })))
  const criarNota = useNotas((estado) => estado.criarNota)
  const criarLivro = useNotas((estado) => estado.criarLivro)
  const [recolhidos, setRecolhidos] = useState<Set<string>>(new Set())
  const [notaParaExcluir, setNotaParaExcluir] = useState<Nota | null>(null)
  const [livroParaExcluir, setLivroParaExcluir] = useState<Livro | null>(null)

  const [, rota, idRota] = caminho.split("/")
  const notaAtiva = rota === "notas" ? idRota : null
  const livroAtivo = rota === "livros" ? idRota : null

  function abrir(id: string) {
    setRecolhidos((anterior) => {
      const proximo = new Set(anterior)
      proximo.delete(id)
      return proximo
    })
  }

  function alternar(id: string) {
    setRecolhidos((anterior) => {
      const proximo = new Set(anterior)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
  }

  function novaNota(livroId: string | null, paiId: string | null = null) {
    const nota = criarNota({ livroId, paiId })
    if (livroId) abrir(livroId)
    if (paiId) abrir(paiId)
    router.push(`/notas/${nota.id}`)
  }

  function seta(id: string, visivel: boolean) {
    const aberto = !recolhidos.has(id)
    return (
      <button
        type="button"
        onClick={() => alternar(id)}
        aria-label={aberto ? "Recolher" : "Expandir"}
        className={cn("flex size-5 shrink-0 items-center justify-center rounded-sm hover:bg-sidebar-border", !visivel && "invisible")}
      >
        <ChevronRightIcon className={cn("size-3.5 transition-transform", aberto && "rotate-90")} />
      </button>
    )
  }

  function ramo(livroId: string | null, paiId: string | null, profundidade: number): React.ReactNode {
    const filhas = notas
      .filter((nota) => nota.livroId === livroId && nota.paiId === paiId)
      .sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"))
    return filhas.map((nota) => {
      const temFilhas = notas.some((item) => item.paiId === nota.id)
      return (
        <SidebarMenuItem key={nota.id}>
          <div
            className={cn(classeLinha, nota.id === notaAtiva && "bg-sidebar-accent font-medium text-sidebar-accent-foreground")}
            style={{ paddingLeft: `${profundidade * 12 + 4}px` }}
          >
            {seta(nota.id, temFilhas)}
            <Link href={`/notas/${nota.id}`} className="flex min-w-0 flex-1 items-center gap-1.5 py-1">
              <Icone nome={nota.icone} className="text-sidebar-foreground/60" />
              <span className="truncate">{nota.titulo}</span>
            </Link>
            <button type="button" onClick={() => novaNota(livroId, nota.id)} aria-label="Nova subnota" title="Nova subnota" className={classeBotaoLinha}>
              <PlusIcon className="size-3.5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Mais ações" className={classeBotaoLinha}>
                <MoreHorizontalIcon className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-44">
                <DropdownMenuItem onClick={() => novaNota(livroId, nota.id)}>
                  <PlusIcon /> Nova subnota
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => setNotaParaExcluir(nota)}>
                  <Trash2Icon /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {temFilhas && !recolhidos.has(nota.id) && <SidebarMenu>{ramo(livroId, nota.id, profundidade + 1)}</SidebarMenu>}
        </SidebarMenuItem>
      )
    })
  }

  const soltas = notas.filter((nota) => nota.livroId === null)

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Biblioteca</SidebarGroupLabel>
      <SidebarGroupAction title="Novo livro" onClick={() => router.push(`/livros/${criarLivro().id}`)}>
        <BookPlusIcon />
        <span className="sr-only">Novo livro</span>
      </SidebarGroupAction>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/notas" />} isActive={caminho === "/notas"}>
              <LibraryIcon />
              <span>Todos os livros</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/grafo" />} isActive={caminho === "/grafo"}>
              <NetworkIcon />
              <span>Grafo de conexões</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/tags" />} isActive={caminho === "/tags"}>
              <HashIcon />
              <span>Tags</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {!hidratado ? (
            <>
              <SidebarMenuSkeleton showIcon />
              <SidebarMenuSkeleton showIcon />
            </>
          ) : (
            <>
              {livros.map((livro) => {
                const temNotas = notas.some((nota) => nota.livroId === livro.id)
                return (
                  <SidebarMenuItem key={livro.id}>
                    <div className={cn(classeLinha, "font-medium", livro.id === livroAtivo && "bg-sidebar-accent text-sidebar-accent-foreground")} style={{ paddingLeft: 4 }}>
                      {seta(livro.id, temNotas)}
                      <Link href={`/livros/${livro.id}`} className="flex min-w-0 flex-1 items-center gap-1.5 py-1">
                        <Icone nome={livro.icone} />
                        <span className="truncate">{livro.titulo}</span>
                      </Link>
                      <button type="button" onClick={() => novaNota(livro.id)} aria-label={`Nova nota em ${livro.titulo}`} title="Nova nota neste livro" className={classeBotaoLinha}>
                        <PlusIcon className="size-3.5" />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger aria-label="Ações do livro" className={classeBotaoLinha}>
                          <MoreHorizontalIcon className="size-3.5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start" className="w-44">
                          <DropdownMenuItem onClick={() => novaNota(livro.id)}>
                            <FilePlusIcon /> Nova nota
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => setLivroParaExcluir(livro)}>
                            <Trash2Icon /> Excluir livro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {temNotas && !recolhidos.has(livro.id) && <SidebarMenu>{ramo(livro.id, null, 1)}</SidebarMenu>}
                  </SidebarMenuItem>
                )
              })}

              {soltas.length > 0 && (
                <SidebarMenuItem>
                  <div className={cn(classeLinha, "text-sidebar-foreground/70")} style={{ paddingLeft: 4 }}>
                    {seta("soltas", true)}
                    <span className="flex-1 py-1 text-xs font-medium">Notas soltas</span>
                    <button type="button" onClick={() => novaNota(null)} aria-label="Nova nota solta" title="Nova nota solta" className={classeBotaoLinha}>
                      <PlusIcon className="size-3.5" />
                    </button>
                  </div>
                  {!recolhidos.has("soltas") && <SidebarMenu>{ramo(null, null, 1)}</SidebarMenu>}
                </SidebarMenuItem>
              )}

              {livros.length === 0 && soltas.length === 0 && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => router.push(`/livros/${criarLivro().id}`)} className="text-muted-foreground">
                    <BookPlusIcon />
                    <span>Criar o primeiro livro</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
      <DialogoExcluirNota nota={notaParaExcluir} aoMudarAberto={(aberto) => !aberto && setNotaParaExcluir(null)} />
      <DialogoExcluirLivro livro={livroParaExcluir} aoMudarAberto={(aberto) => !aberto && setLivroParaExcluir(null)} />
    </SidebarGroup>
  )
}
