import Link from "next/link"

import { cn } from "@/lib/utils"

// Rafael Marques - 21/10/2026 · redesign v2 (fase 8)
// Estrutura comum das telas que ainda usam este wrapper. O shell já limita a largura (1120px);
// aqui só fica o espaçamento vertical e uma largura de leitura opcional.

type Largura = "leitura" | "padrao" | "ampla" | "total"

const larguras: Record<Largura, string> = {
  leitura: "max-w-reading",
  padrao: "",
  ampla: "",
  total: "max-w-none",
}

export function Pagina({ largura = "padrao", className, children }: { largura?: Largura; className?: string; children: React.ReactNode }) {
  return <div className={cn("w-full space-y-8 pb-10", larguras[largura], className)}>{children}</div>
}

// Cabeçalho no padrão do PageHeader (seção 6): título grande, descrição em ink-soft, ações à direita.
// "secao" e "icone" continuam aceitos, mas não aparecem mais: o rótulo acima do título repetia o menu (1.3).
export function CabecalhoPagina({
  titulo,
  descricao,
  resumo,
  acoes,
  compactoNoCelular = false,
}: {
  secao?: string
  icone?: React.ElementType
  titulo: React.ReactNode
  descricao?: React.ReactNode
  resumo?: React.ReactNode
  acoes?: React.ReactNode
  compactoNoCelular?: boolean
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div className="min-w-0 flex-[1_1_20rem] space-y-3">
        {typeof titulo === "string" ? (
          <h1 className="font-display text-4xl leading-none font-bold tracking-tight text-paper [view-transition-name:page-title] md:text-display-lg">{titulo}</h1>
        ) : (
          titulo
        )}
        {descricao && <p className={cn("max-w-[60ch] text-body text-ink-soft", compactoNoCelular && "max-sm:hidden")}>{descricao}</p>}
        {resumo}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </header>
  )
}

// Classe do título quando ele é um campo editável (mesmo visual do <h1>).
export const classeTituloEditavel =
  "w-full min-w-0 bg-transparent font-display text-4xl leading-none font-bold tracking-tight text-paper outline-none placeholder:text-ink-muted md:text-display-lg"

// Resumo em uma linha, no padrão do StatList inline: número em paper, rótulo em ink-soft.
// "alerta" ganha um ícone (sem vermelho: cor nunca é o único sinal). "href" leva à tela correspondente.
type ItemResumo = { valor: React.ReactNode; texto: string; alerta?: boolean; href?: string }

export function ResumoLinha({ itens }: { itens: (false | null | undefined | ItemResumo)[] }) {
  const visiveis = itens.filter((item): item is ItemResumo => Boolean(item))
  if (visiveis.length === 0) return null
  return (
    <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ui text-ink-soft">
      {visiveis.map((item) => {
        const conteudo = (
          <>
            <dd className="text-paper tabular-nums">
              {item.alerta ? (
                <svg viewBox="0 0 16 16" aria-hidden="true" className="mr-1 inline size-3.5 align-[-2px]">
                  <circle cx="8" cy="8" r="6.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 4.5v4.25M8 11.1v.15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              ) : null}
              {item.valor}
            </dd>
            <dt>{item.texto}</dt>
          </>
        )
        return item.href ? (
          <Link key={item.texto} href={item.href} className="flex items-baseline gap-1 rounded-xs hover:text-paper">
            {conteudo}
          </Link>
        ) : (
          <div key={item.texto} className="flex items-baseline gap-1">
            {conteudo}
          </div>
        )
      })}
    </dl>
  )
}
