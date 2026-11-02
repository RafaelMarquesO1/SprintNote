"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment } from "react"

import { LogoMark } from "@/components/brand/logo"
import { tituloDaRota } from "@/components/shell/navegacao"
import { useTopbar } from "@/components/shell/estado"

// Topbar (7.2): só trilha à esquerda e ações da página à direita. Sem busca duplicada.
export function Topbar() {
  const caminho = usePathname()
  const trilha = useTopbar((estado) => estado.trilha)
  const acoes = useTopbar((estado) => estado.acoes)
  const itens = trilha ?? [{ rotulo: tituloDaRota(caminho) }]

  return (
    <header className="sticky top-0 z-10 flex h-topbar shrink-0 items-center gap-3 border-b border-line bg-night px-4 md:px-6">
      <Link href="/" aria-label="Ir para Hoje" className="rounded-sm md:hidden">
        <LogoMark size={24} />
      </Link>
      <nav aria-label="Você está em" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1.5 text-ui">
          {itens.map((item, indice) => {
            const ultimo = indice === itens.length - 1
            return (
              <Fragment key={`${item.rotulo}-${indice}`}>
                {indice > 0 ? (
                  <li aria-hidden="true" className="text-ink-muted">
                    /
                  </li>
                ) : null}
                <li className={ultimo ? "min-w-0 truncate text-paper" : "shrink-0 text-ink-soft max-sm:hidden"}>
                  {item.href && !ultimo ? (
                    <Link href={item.href} className="rounded-xs hover:text-paper">
                      {item.rotulo}
                    </Link>
                  ) : (
                    <span aria-current={ultimo ? "page" : undefined}>{item.rotulo}</span>
                  )}
                </li>
              </Fragment>
            )
          })}
        </ol>
      </nav>
      {acoes ? <div className="flex shrink-0 items-center gap-2">{acoes}</div> : null}
    </header>
  )
}
