"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

// Rafael Marques - 20/10/2026
// Menu flutuante dos editores: "/" (comandos) e "[[" (links entre notas).

export type ContextoMenu = {
  modo: "comando" | "link" | "tag"
  consulta: string
  // Posição onde começa o "/" ou o "[[" no texto.
  inicio: number
}

export type ItemMenu = {
  chave: string
  rotulo: string
  descricao?: string
  atalho?: string
  icone: React.ReactNode
}

// Descobre se o cursor está logo depois de um "/" ou de um "[[".
export function detectarContexto(valor: string, cursor: number): ContextoMenu | null {
  const linha = valor.slice(valor.lastIndexOf("\n", cursor - 1) + 1, cursor)

  const link = /\[\[([^\[\]\n]*)$/.exec(linha)
  if (link) return { modo: "link", consulta: link[1], inicio: cursor - link[0].length }

  // "#bio" (pelo menos uma letra, para não atrapalhar o atalho "# " de título).
  const tag = /(?:^|\s)#([\p{L}\p{N}_\-/]+)$/u.exec(linha)
  if (tag) return { modo: "tag", consulta: tag[1], inicio: cursor - tag[1].length - 1 }

  const comando = /(?:^|\s)\/([\p{L}\d]*)$/u.exec(linha)
  if (comando) return { modo: "comando", consulta: comando[1], inicio: cursor - comando[1].length - 1 }

  return null
}

export const LARGURA_MENU = 300

export function MenuFlutuante<T extends ItemMenu>({
  titulo,
  itens,
  indiceAtivo,
  posicao,
  aoEscolher,
  aoPassar,
}: {
  titulo: React.ReactNode
  itens: T[]
  indiceAtivo: number
  posicao: { topo: number; esquerda: number }
  aoEscolher: (item: T) => void
  aoPassar: (indice: number) => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    menuRef.current?.querySelector("[data-ativo=true]")?.scrollIntoView({ block: "nearest" })
  }, [indiceAtivo])

  return (
    <div
      ref={menuRef}
      role="listbox"
      className="absolute z-30 max-h-80 overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10"
      style={{ top: posicao.topo, left: posicao.esquerda, width: LARGURA_MENU }}
    >
      <p className="px-2 py-1 text-xs font-medium text-muted-foreground">{titulo}</p>
      {itens.map((item, indice) => (
        <button
          key={item.chave}
          type="button"
          role="option"
          aria-selected={indice === indiceAtivo}
          data-ativo={indice === indiceAtivo}
          onMouseDown={(evento) => evento.preventDefault()}
          onMouseEnter={() => aoPassar(indice)}
          onClick={() => aoEscolher(item)}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
            indice === indiceAtivo && "bg-muted"
          )}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
            {item.icone}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate">{item.rotulo}</span>
            {item.descricao && <span className="truncate text-xs text-muted-foreground">{item.descricao}</span>}
          </span>
          {item.atalho && <kbd className="font-mono text-xs text-muted-foreground">{item.atalho}</kbd>}
        </button>
      ))}
    </div>
  )
}
