"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  InfoIcon,
  CalendarClockIcon,
  ChevronRightIcon,
  HouseIcon,
  KanbanIcon,
  ListTodoIcon,
  NotebookPenIcon,
  RepeatIcon,
  SearchIcon,
  type LucideIcon,
} from "lucide-react"

// Rafael Marques - 20/10/2026
// Componentes (botões da sidebar, agrupamento, botão de menu e etc...)
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Kbd } from "@/components/ui/kbd"
import { ArvoreNotas } from "@/components/notas/arvore-notas"
import { abrirBusca } from "@/components/busca"
import { MenuConta } from "@/components/conta/menu-conta"
import { ThemeToggle } from "@/components/theme-toggle"
import { useHoje } from "@/hooks/use-hoje"
import { itensDeHoje, useTarefasUnificadas } from "@/hooks/use-tarefas-unificadas"
import { useHabitos, valeNoDia } from "@/lib/estado/habitos"
import { cartaoConcluido, useKanban } from "@/lib/estado/kanban"

type ItemNavegacao = { title: string; href: string; icon: LucideIcon }

// Rafael Marques - 20/10/2026
// Contadores exibidos ao lado dos itens (só no navegador, depois de ler os dados).
function useContadores() {
  const hoje = useHoje()
  const { itens: tarefas } = useTarefasUnificadas(hoje)
  const habitos = useHabitos((estado) => estado.habitos)
  const cartoes = useKanban((estado) => estado.cartoes)
  const colunasKanban = useKanban((estado) => estado.colunas)

  if (!hoje) return {}
  const tarefasHoje = itensDeHoje(tarefas, hoje).length
  const habitosHoje = habitos.filter((habito) => valeNoDia(habito, hoje))
  const habitosFeitos = habitosHoje.filter((habito) => habito.feitos.includes(hoje)).length
  // Cartões ainda não concluídos (fora das colunas marcadas como "concluídos").
  const emAndamento = cartoes.filter((cartao) => !cartaoConcluido(cartao, colunasKanban)).length

  return {
    "/tarefas": tarefasHoje > 0 ? String(tarefasHoje) : null,
    "/habitos": habitosHoje.length > 0 ? `${habitosFeitos}/${habitosHoje.length}` : null,
    "/kanban": emAndamento > 0 ? String(emAndamento) : null,
  } as Record<string, string | null>
}

const itensOrganizacao: ItemNavegacao[] = [
  { title: "Tarefas", href: "/tarefas", icon: ListTodoIcon },
  { title: "Hábitos", href: "/habitos", icon: RepeatIcon },
  { title: "Rotina", href: "/rotina", icon: CalendarClockIcon },
  { title: "Kanban", href: "/kanban", icon: KanbanIcon },
]

// usePathname fica dentro de <Suspense>: em /notas/[id] o caminho só é conhecido
// no navegador (Cache Components), então a sidebar mostra um esqueleto até lá.
function LinksNavegacao({ itens }: { itens: ItemNavegacao[] }) {
  const caminho = usePathname()
  const contadores = useContadores()

  return (
    <SidebarMenu>
      {itens.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            render={<Link href={item.href} />}
            isActive={caminho === item.href}
          >
            <item.icon />
            <span>{item.title}</span>
          </SidebarMenuButton>
          {contadores[item.href] && <SidebarMenuBadge>{contadores[item.href]}</SidebarMenuBadge>}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

function EsqueletoNavegacao({ quantidade }: { quantidade: number }) {
  return (
    <SidebarMenu>
      {Array.from({ length: quantidade }, (_, indice) => (
        <SidebarMenuSkeleton key={indice} showIcon />
      ))}
    </SidebarMenu>
  )
}

// Grupo da sidebar que pode ser recolhido clicando no título.
function GrupoRecolhivel({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <Collapsible defaultOpen className="group/recolhivel">
      <SidebarGroup>
        <SidebarGroupLabel
          render={<CollapsibleTrigger />}
          className="w-full cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {titulo}
          <ChevronRightIcon className="ml-auto transition-transform group-data-[open]/recolhivel:rotate-90" />
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>{children}</SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

export function AppSidebar() {
  return (
    <Sidebar>
      {/* Rafael Marques - 20/10/2026
          Header da Sidebar, com o logo, o nome do projeto e a busca */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <NotebookPenIcon className="size-5" />
          <span className="font-semibold">SprintNote</span>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={abrirBusca} variant="outline" className="text-muted-foreground">
              <SearchIcon />
              <span>Buscar…</span>
              <Kbd className="ml-auto">Ctrl K</Kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Suspense fallback={<EsqueletoNavegacao quantidade={1} />}>
          <LinksNavegacao itens={[{ title: "Início", href: "/", icon: HouseIcon }]} />
        </Suspense>
      </SidebarHeader>

      {/* Rafael Marques - 20/10/2026
          Corpo da Sidebar: organização do dia a dia e a árvore de notas */}
      <SidebarContent>
        <GrupoRecolhivel titulo="Organização">
          <Suspense fallback={<EsqueletoNavegacao quantidade={itensOrganizacao.length} />}>
            <LinksNavegacao itens={itensOrganizacao} />
          </Suspense>
        </GrupoRecolhivel>
        <SidebarSeparator className="mx-0" />
        <Suspense fallback={<EsqueletoNavegacao quantidade={2} />}>
          <ArvoreNotas />
        </Suspense>
      </SidebarContent>

      {/* Rafael Marques - 20/10/2026
          Footer da Sidebar: créditos, tema e a versão do projeto */}
      <SidebarFooter>
        <Suspense fallback={<EsqueletoNavegacao quantidade={1} />}>
          <LinksNavegacao itens={[{ title: "Créditos", href: "/creditos", icon: InfoIcon }]} />
        </Suspense>
        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-muted-foreground">v1.0 - SprintNote</p>
          <ThemeToggle />
        </div>
        <SidebarSeparator className="mx-0" />
        <MenuConta />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
