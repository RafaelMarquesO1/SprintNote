import Link from "next/link"

import { cn } from "@/lib/utils"


// Rafael Marques - 21/10/2026
// Estrutura comum das telas: mesma largura, mesmo cabeçalho e mesma faixa
// de números — para todas as páginas seguirem o mesmo padrão visual.

type Largura = "leitura" | "padrao" | "ampla" | "total"

const larguras: Record<Largura, string> = {
  // Textos longos (créditos).
  leitura: "max-w-3xl",
  // Telas de conteúdo (início, biblioteca, tarefas, hábitos, rotina, tags, dados).
  padrao: "max-w-5xl",
  // Painéis com muitas colunas (início).
  ampla: "max-w-7xl",
  // Telas que precisam de espaço (kanban, grafo).
  total: "max-w-none",
}

export function Pagina({ largura = "padrao", className, children }: { largura?: Largura; className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full space-y-6 pb-10", larguras[largura], className)}>{children}</div>
}

export function CabecalhoPagina({
  secao,
  icone: IconeSecao,
  titulo,
  descricao,
  resumo,
  acoes,
  compactoNoCelular = false,
}: {
  // Rótulo pequeno acima do título (ex.: "Organização", "Biblioteca").
  secao: string
  icone: React.ElementType
  // Texto ou um campo editável (ex.: nome do quadro no Kanban).
  titulo: React.ReactNode
  descricao?: React.ReactNode
  // Linha curta de números (ex.: "2 para hoje · 1 atrasada").
  resumo?: React.ReactNode
  acoes?: React.ReactNode
  // Rafael Marques - 23/10/2026: no celular esconde o rótulo e a descrição para sobrar espaço (Kanban).
  compactoNoCelular?: boolean
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      {/* Rafael Marques - 22/10/2026: base de 18rem para os botões irem para a
          linha de baixo no celular, em vez de espremer o título. */}
      <div className="min-w-0 flex-[1_1_18rem] space-y-1">
        <p className={cn("flex items-center gap-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase", compactoNoCelular && "max-sm:hidden")}>
          <IconeSecao className="size-3.5" /> {secao}
        </p>
        {typeof titulo === "string" ? <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{titulo}</h1> : titulo}
        {descricao && <p className={cn("text-sm text-muted-foreground", compactoNoCelular && "max-sm:hidden")}>{descricao}</p>}
        {resumo}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </header>
  )
}

// Classe do título quando ele é um campo editável (mesmo visual do <h1>).
export const classeTituloEditavel =
  "w-full min-w-0 bg-transparent text-2xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/50 sm:text-3xl"

// Resumo em uma linha (sem cartões): cada item é uma etiqueta leve com o
// número em destaque. "alerta" pinta de vermelho (ex.: tarefas atrasadas).
// Rafael Marques - 30/10/2026: "href" (opcional) faz o item levar à tela correspondente (resumo do Início).
type ItemResumo = { valor: React.ReactNode; texto: string; alerta?: boolean; href?: string }

export function ResumoLinha({ itens }: { itens: (false | null | undefined | ItemResumo)[] }) {
  const visiveis = itens.filter((item): item is ItemResumo => Boolean(item))
  if (visiveis.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
      {visiveis.map((item) => {
        const classe = cn(
          "inline-flex items-baseline gap-1 rounded-md px-2 py-0.5 text-xs ring-1 ring-inset",
          item.alerta ? "bg-destructive/10 text-destructive ring-destructive/20" : "bg-muted/60 text-muted-foreground ring-border",
          item.href && (item.alerta ? "hover:bg-destructive/15" : "hover:bg-muted hover:text-foreground")
        )
        const conteudo = (
          <>
            <strong className={cn("text-sm font-semibold tabular-nums", !item.alerta && "text-foreground")}>{item.valor}</strong>
            {item.texto}
          </>
        )
        return item.href ? (
          <Link key={item.texto} href={item.href} className={classe}>
            {conteudo}
          </Link>
        ) : (
          <span key={item.texto} className={classe}>
            {conteudo}
          </span>
        )
      })}
    </div>
  )
}
