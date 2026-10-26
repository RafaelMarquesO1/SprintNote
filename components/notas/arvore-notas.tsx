"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { BookPlusIcon, FilePlusIcon, HashIcon, NetworkIcon, PlusIcon, WorkflowIcon } from "lucide-react"

import { ArvoreBiblioteca } from "@/components/biblioteca/arvore"
import { enderecoDaSelecao, selecaoDaUrl } from "@/components/biblioteca/selecao"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton } from "@/components/ui/sidebar"
import { useHidratado } from "@/hooks/use-hidratado"
import { useNotas } from "@/lib/estado/notas"

// Rafael Marques - 26/10/2026
// Biblioteca na barra lateral: os mesmos livros e notas do explorador (/notas), em árvore, com
// arrastar e soltar, renomear e menu de ações. Clicar num livro abre o conteúdo dele no explorador.
export function ArvoreNotas() {
  const router = useRouter()
  const caminho = usePathname()
  const criarNota = useNotas((estado) => estado.criarNota)
  const criarLivro = useNotas((estado) => estado.criarLivro)

  return (
    <SidebarGroup>
      <SidebarGroupLabel render={<Link href="/notas" title="Ver todos os livros" />}>Biblioteca</SidebarGroupLabel>
      <DropdownMenu>
        <DropdownMenuTrigger render={<SidebarGroupAction title="Criar" />}>
          <PlusIcon />
          <span className="sr-only">Criar na biblioteca</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={() => router.push(enderecoDaSelecao({ tipo: "livro", id: criarLivro().id }))}>
            <BookPlusIcon /> Novo livro
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/notas/${criarNota().id}`)}>
            <FilePlusIcon /> Nova nota solta
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/notas/${criarNota({ titulo: "Novo quadro", tipo: "quadro" }).id}`)}>
            <WorkflowIcon /> Novo quadro
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SidebarGroupContent>
        <SidebarMenu>
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
        </SidebarMenu>
        <div className="mt-1 border-t border-sidebar-border pt-1.5">
          <Suspense fallback={null}>
            <ArvoreLateral />
          </Suspense>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
// Rafael Marques - 26/10/2026
// Função de Árvore lateral, que é a mesma do explorador, mas com o modo lateral. A nota ativa é a nota aberta no explorador, e a seleção é a seleção da URL (ou nenhum livro selecionado se não estivermos no explorador).
function ArvoreLateral() {
  const hidratado = useHidratado()
  const router = useRouter()
  const caminho = usePathname()
  const parametros = useSearchParams()
  const [, rota, idRota] = caminho.split("/")
  const notaAtiva = rota === "notas" ? (idRota ?? null) : null
  // Fora do explorador nenhum livro fica marcado; só a nota aberta.
  const selecao = caminho === "/notas" ? selecaoDaUrl(parametros) : { tipo: "livro" as const, id: "" }

  if (!hidratado) {
    return (
      <SidebarMenu>
        <SidebarMenuSkeleton showIcon />
        <SidebarMenuSkeleton showIcon />
      </SidebarMenu>
    )
  }
  return <ArvoreBiblioteca modo="lateral" notaAtiva={notaAtiva} selecao={selecao} aoSelecionar={(nova) => router.push(enderecoDaSelecao(nova))} />
}
