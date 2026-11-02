import { CalendarClockIcon, CheckSquareIcon, HashIcon, HouseIcon, KanbanIcon, LibraryIcon, NetworkIcon, RepeatIcon, type LucideIcon } from "lucide-react"

// Arquitetura de informação (7.1). As URLs antigas ficam; só os nomes mudam ("Kanban" → "Quadros").
export type ItemNav = { rotulo: string; href: string; icone: LucideIcon; tecla?: string }

export const ITEM_HOJE: ItemNav = { rotulo: "Hoje", href: "/", icone: HouseIcon, tecla: "H" }

export const ITENS_FAZER: ItemNav[] = [
  { rotulo: "Tarefas", href: "/tarefas", icone: CheckSquareIcon, tecla: "T" },
  { rotulo: "Hábitos", href: "/habitos", icone: RepeatIcon, tecla: "B" },
  { rotulo: "Rotina", href: "/rotina", icone: CalendarClockIcon, tecla: "R" },
  { rotulo: "Quadros", href: "/kanban", icone: KanbanIcon, tecla: "Q" },
]

export const ITENS_BIBLIOTECA: ItemNav[] = [
  { rotulo: "Grafo", href: "/grafo", icone: NetworkIcon },
  { rotulo: "Tags", href: "/tags", icone: HashIcon },
]

export const ITEM_BIBLIOTECA: ItemNav = { rotulo: "Biblioteca", href: "/notas", icone: LibraryIcon }

// Título de cada rota para a trilha do topo (quando a página não define outra).
const TITULOS: Record<string, string> = {
  "/": "Hoje",
  "/tarefas": "Tarefas",
  "/habitos": "Hábitos",
  "/rotina": "Rotina",
  "/kanban": "Quadros",
  "/notas": "Biblioteca",
  "/grafo": "Grafo de conexões",
  "/tags": "Tags",
  "/conta": "Minha conta",
  "/creditos": "Créditos",
}

export function tituloDaRota(caminho: string) {
  if (TITULOS[caminho]) return TITULOS[caminho]
  if (caminho.startsWith("/notas/")) return "Nota"
  if (caminho.startsWith("/convite/")) return "Convite"
  return "SprintNote"
}

export function itemAtivo(caminho: string, href: string) {
  if (href === "/") return caminho === "/"
  if (href === "/notas") return caminho === "/notas"
  return caminho === href || caminho.startsWith(`${href}/`)
}
