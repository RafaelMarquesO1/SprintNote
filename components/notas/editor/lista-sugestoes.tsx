"use client"

// Rafael Marques - 23/10/2026
// Lista flutuante dos menus do editor de notas: "/" (blocos), "[[" (links entre notas)
// e "#" (tags). O TipTap posiciona a lista perto do cursor; aqui só desenhamos e tratamos
// as setas, Enter e Tab.

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import type { Editor, Range } from "@tiptap/core"

import { cn } from "@/lib/utils"

export type ItemSugestao = {
  chave: string
  rotulo: string
  descricao?: string
  // Título da seção (itens seguidos com o mesmo grupo ficam juntos).
  grupo?: string
  atalho?: string
  icone?: React.ReactNode
  // O que acontece ao escolher (o texto digitado depois do "/" ou "[[" já está em "range").
  executar: (editor: Editor, range: Range) => void
}

export type ListaSugestoesRef = { aoTeclar: (evento: KeyboardEvent) => boolean }

type Propriedades = {
  items: ItemSugestao[]
  command: (item: ItemSugestao) => void
  titulo?: string
}

export const ListaSugestoes = forwardRef<ListaSugestoesRef, Propriedades>(function ListaSugestoes({ items, command, titulo }, ref) {
  const [indiceAtivo, setIndiceAtivo] = useState(0)
  const [chaves, setChaves] = useState("")
  const caixaRef = useRef<HTMLDivElement>(null)

  // A lista mudou (a pessoa digitou mais uma letra): volta para o primeiro item.
  const chavesAtuais = items.map((item) => item.chave).join("|")
  if (chavesAtuais !== chaves) {
    setChaves(chavesAtuais)
    setIndiceAtivo(0)
  }

  useEffect(() => {
    caixaRef.current?.querySelector("[data-ativo=true]")?.scrollIntoView({ block: "nearest" })
  }, [indiceAtivo, chavesAtuais])

  useImperativeHandle(
    ref,
    () => ({
      aoTeclar(evento) {
        if (items.length === 0) return false
        if (evento.key === "ArrowDown") {
          setIndiceAtivo((indice) => (indice + 1) % items.length)
          return true
        }
        if (evento.key === "ArrowUp") {
          setIndiceAtivo((indice) => (indice - 1 + items.length) % items.length)
          return true
        }
        if (evento.key === "Enter" || evento.key === "Tab") {
          command(items[Math.min(indiceAtivo, items.length - 1)])
          return true
        }
        return false
      },
    }),
    [items, indiceAtivo, command]
  )

  if (items.length === 0) return null

  return (
    <div
      ref={caixaRef}
      role="listbox"
      aria-label={titulo ?? "Sugestões"}
      className="rolagem-fina max-h-80 w-80 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-lg bg-popover p-1 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10"
    >
      {items.map((item, indice) => {
        const mostrarGrupo = item.grupo && item.grupo !== items[indice - 1]?.grupo
        return (
          <div key={item.chave}>
            {mostrarGrupo && <p className="px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground">{item.grupo}</p>}
            {!item.grupo && indice === 0 && titulo && <p className="px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground">{titulo}</p>}
            <button
              type="button"
              role="option"
              aria-selected={indice === indiceAtivo}
              data-ativo={indice === indiceAtivo}
              onMouseDown={(evento) => evento.preventDefault()}
              onMouseEnter={() => setIndiceAtivo(indice)}
              onClick={() => command(item)}
              className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left", indice === indiceAtivo && "bg-muted")}
            >
              {item.icone && (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">{item.icone}</span>
              )}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">{item.rotulo}</span>
                {item.descricao && <span className="truncate text-xs text-muted-foreground">{item.descricao}</span>}
              </span>
              {item.atalho && <kbd className="shrink-0 font-mono text-xs text-muted-foreground">{item.atalho}</kbd>}
            </button>
          </div>
        )
      })}
    </div>
  )
})
