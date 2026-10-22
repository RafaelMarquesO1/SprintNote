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
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="flex items-center gap-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
          <IconeSecao className="size-3.5" /> {secao}
        </p>
        {typeof titulo === "string" ? <h1 className="text-3xl font-bold tracking-tight">{titulo}</h1> : titulo}
        {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
        {resumo}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </header>
  )
}

// Classe do título quando ele é um campo editável (mesmo visual do <h1>).
export const classeTituloEditavel =
  "w-full min-w-0 bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/50"

// Resumo em uma linha (sem cartões): cada item é uma etiqueta leve com o
// número em destaque. "alerta" pinta de vermelho (ex.: tarefas atrasadas).
type ItemResumo = { valor: React.ReactNode; texto: string; alerta?: boolean }

export function ResumoLinha({ itens }: { itens: (false | null | undefined | ItemResumo)[] }) {
  const visiveis = itens.filter((item): item is ItemResumo => Boolean(item))
  if (visiveis.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
      {visiveis.map((item) => (
        <span
          key={item.texto}
          className={cn(
            "inline-flex items-baseline gap-1 rounded-md px-2 py-0.5 text-xs ring-1 ring-inset",
            item.alerta ? "bg-destructive/10 text-destructive ring-destructive/20" : "bg-muted/60 text-muted-foreground ring-border"
          )}
        >
          <strong className={cn("text-sm font-semibold tabular-nums", !item.alerta && "text-foreground")}>{item.valor}</strong>
          {item.texto}
        </span>
      ))}
    </div>
  )
}
