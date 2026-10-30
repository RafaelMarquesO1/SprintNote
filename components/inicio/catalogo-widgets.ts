import {
  BookOpenIcon,
  CalendarClockIcon,
  CalendarRangeIcon,
  ChartPieIcon,
  ClockIcon,
  FileTextIcon,
  FlameIcon,
  GaugeIcon,
  HashIcon,
  KanbanIcon,
  ListChecksIcon,
  ListTodoIcon,
  NetworkIcon,
  PinIcon,
  RepeatIcon,
  SquareUserIcon,
  StickyNoteIcon,
  TimerIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react"

import type { ConfigWidget, TipoWidget } from "@/lib/estado/inicio"

// Rafael Marques - 21/10/2026
// Catálogo dos widgets da tela de início: nome, descrição, ícone, categoria,
// tamanho inicial e para onde leva o "Ver tudo".

export type Categoria = "Visão geral" | "Tarefas" | "Hábitos e rotina" | "Kanban" | "Notas e livros" | "Ferramentas"

export type InfoWidget = {
  nome: string
  descricao: string
  icone: LucideIcon
  categoria: Categoria
  largura: number
  // Altura acompanha o conteúdo (cresce quando os cartões quebram de linha) e não é arrastável.
  alturaAutomatica?: boolean
  href?: string
  config?: ConfigWidget
}

export const catalogoWidgets: Record<TipoWidget, InfoWidget> = {
  numeros: {
    nome: "Números do dia",
    descricao: "Cartões com os números que você escolher: tarefas, hábitos, rotina, Kanban, notas…",
    icone: GaugeIcon,
    categoria: "Visão geral",
    largura: 4,
    alturaAutomatica: true,
    config: { metricas: ["tarefas-hoje", "habitos-feitos", "rotina-feitas", "cartoes-abertos"] },
  },
  "progresso-dia": {
    nome: "Progresso do dia",
    descricao: "Um anel com o quanto do dia já foi feito, somando tarefas, hábitos e rotina.",
    icone: ChartPieIcon,
    categoria: "Visão geral",
    largura: 1,
  },
  relogio: {
    nome: "Relógio",
    descricao: "Hora grande, data e o próximo item da rotina.",
    icone: ClockIcon,
    categoria: "Visão geral",
    largura: 1,
  },
  atalhos: {
    nome: "Atalhos",
    descricao: "Botões para as ações e telas que você mais usa.",
    icone: ZapIcon,
    categoria: "Ferramentas",
    largura: 2,
    config: { atalhos: ["nova-nota", "novo-livro", "buscar", "kanban", "grafo", "rotina"] },
  },
  "tarefas-hoje": {
    nome: "Tarefas de hoje",
    descricao: "Pendências de hoje e atrasadas, para marcar como feitas aqui mesmo.",
    icone: ListTodoIcon,
    categoria: "Tarefas",
    largura: 2,
    href: "/tarefas",
    config: { limite: 6, incluirNotas: true },
  },
  "tarefas-proximas": {
    nome: "Próximos dias",
    descricao: "Tarefas com prazo nos próximos dias, agrupadas por data.",
    icone: CalendarRangeIcon,
    categoria: "Tarefas",
    largura: 2,
    href: "/tarefas",
    config: { dias: 7, limite: 8, incluirNotas: true },
  },
  "habitos-hoje": {
    nome: "Hábitos de hoje",
    descricao: "Marque os hábitos do dia com um clique e veja a sequência.",
    icone: RepeatIcon,
    categoria: "Hábitos e rotina",
    largura: 2,
    href: "/habitos",
  },
  "habitos-semana": {
    nome: "Hábitos na semana",
    descricao: "Grade dos últimos 7 dias de cada hábito.",
    icone: FlameIcon,
    categoria: "Hábitos e rotina",
    largura: 2,
    href: "/habitos",
  },
  "rotina-proximas": {
    nome: "Próximo na rotina",
    descricao: "O que vem a seguir na rotina de hoje.",
    icone: CalendarClockIcon,
    categoria: "Hábitos e rotina",
    largura: 2,
    href: "/rotina",
    config: { limite: 4 },
  },
  "rotina-dia": {
    nome: "Rotina completa de hoje",
    descricao: "Todas as atividades do dia, para marcar o que já fez.",
    icone: TimerIcon,
    categoria: "Hábitos e rotina",
    largura: 2,
    href: "/rotina",
  },
  "kanban-andamento": {
    nome: "Andamento do quadro",
    descricao: "Progresso de um quadro do Kanban e quantos cartões há em cada coluna.",
    icone: KanbanIcon,
    categoria: "Kanban",
    largura: 2,
    href: "/kanban",
    config: { quadroId: null },
  },
  "kanban-prazos": {
    nome: "Prazos do Kanban",
    descricao: "Cartões abertos com prazo, do mais urgente para o menos.",
    icone: ListChecksIcon,
    categoria: "Kanban",
    largura: 2,
    href: "/kanban",
    config: { limite: 6, quadroId: null },
  },
  // Rafael Marques - 30/10/2026
  "meus-cartoes": {
    nome: "Meus cartões",
    descricao: "Seus cartões em aberto de todos os quadros, incluindo os atribuídos a você nas equipes.",
    icone: SquareUserIcon,
    categoria: "Kanban",
    largura: 2,
    href: "/kanban",
    config: { limite: 6 },
  },
  "notas-recentes": {
    nome: "Notas recentes",
    descricao: "As últimas notas editadas (de todos os livros ou de um só).",
    icone: FileTextIcon,
    categoria: "Notas e livros",
    largura: 2,
    href: "/notas",
    config: { limite: 6, livroId: null },
  },
  "nota-fixada": {
    nome: "Nota fixada",
    descricao: "Deixe uma nota sempre à vista no início (metas, lembretes, listas).",
    icone: PinIcon,
    categoria: "Notas e livros",
    largura: 2,
    config: { notaId: null },
  },
  livros: {
    nome: "Livros",
    descricao: "Seus livros com a cor e o número de notas de cada um.",
    icone: BookOpenIcon,
    categoria: "Notas e livros",
    largura: 2,
    href: "/notas",
    config: { limite: 6 },
  },
  tags: {
    nome: "Nuvem de tags",
    descricao: "As #tags mais usadas, maiores conforme aparecem mais.",
    icone: HashIcon,
    categoria: "Notas e livros",
    largura: 2,
    href: "/tags",
    config: { limite: 20 },
  },
  grafo: {
    nome: "Mini grafo",
    descricao: "O grafo de conexões das suas notas (de tudo ou de um livro).",
    icone: NetworkIcon,
    categoria: "Notas e livros",
    largura: 2,
    href: "/grafo",
    config: { livroId: null },
  },
  "bloco-notas": {
    nome: "Bloco de notas",
    descricao: "Um post-it para anotações rápidas, salvo automaticamente.",
    icone: StickyNoteIcon,
    categoria: "Ferramentas",
    largura: 1,
    config: { texto: "" },
  },
}

export const categorias: Categoria[] = ["Visão geral", "Tarefas", "Hábitos e rotina", "Kanban", "Notas e livros", "Ferramentas"]
