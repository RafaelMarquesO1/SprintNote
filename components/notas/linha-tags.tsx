"use client"

import { useState } from "react"
import Link from "next/link"
import { HashIcon, PlusIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import { useNotas } from "@/lib/estado/notas"
import { contarTags, extrairTags } from "@/lib/tags"
import type { Nota } from "@/lib/tipos"

// Rafael Marques - 21/10/2026
// Tags da nota logo abaixo do título. O "+" abre um campo com sugestões das
// tags já usadas; as #tags escritas no texto também aparecem aqui.
export function LinhaTags({ nota }: { nota: Nota }) {
  const notas = useNotas((estado) => estado.notas)
  const adicionarTag = useNotas((estado) => estado.adicionarTag)
  const removerTag = useNotas((estado) => estado.removerTag)
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState("")
  const [indiceAtivo, setIndiceAtivo] = useState(0)

  const daPropriedade = nota.tags ?? []
  const doTexto = extrairTags(nota.conteudo).filter((tag) => !daPropriedade.includes(tag))
  const atuais = new Set([...daPropriedade, ...doTexto])
  const procurada = texto.trim().replace(/^#+/, "").toLowerCase()
  const sugestoes = contarTags(notas)
    .filter(({ tag }) => !atuais.has(tag) && tag.includes(procurada))
    .slice(0, 6)

  function confirmar(tag: string) {
    // Vírgula ou espaço separam várias tags de uma vez.
    for (const parte of tag.split(/[,\s]+/)) adicionarTag(nota.id, parte)
    setTexto("")
    setIndiceAtivo(0)
  }

  const classeEtiqueta =
    "group/tag flex h-6 items-center gap-0.5 rounded-md bg-muted px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"

  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Tags da nota">
      {daPropriedade.map((tag) => (
        <span key={tag} className={classeEtiqueta}>
          <Link href={`/tags?tag=${encodeURIComponent(tag)}`} className="flex items-center gap-0.5">
            <HashIcon className="size-3" />
            {tag}
          </Link>
          <button
            type="button"
            aria-label={`Remover a tag ${tag}`}
            onClick={() => removerTag(nota.id, tag)}
            className="-mr-1 ml-0.5 rounded p-0.5 opacity-60 hover:bg-foreground/10 hover:opacity-100"
          >
            <XIcon className="size-3" />
          </button>
        </span>
      ))}
      {doTexto.map((tag) => (
        <Link
          key={tag}
          href={`/tags?tag=${encodeURIComponent(tag)}`}
          title="Tag escrita no texto da nota"
          className={cn(classeEtiqueta, "bg-transparent ring-1 ring-border ring-inset")}
        >
          <HashIcon className="size-3" />
          {tag}
        </Link>
      ))}

      {editando ? (
        <div className="relative">
          <input
            autoFocus
            value={texto}
            onChange={(evento) => {
              setTexto(evento.target.value)
              setIndiceAtivo(0)
            }}
            onKeyDown={(evento) => {
              if (evento.key === "ArrowDown" && sugestoes.length) {
                evento.preventDefault()
                setIndiceAtivo((indice) => (indice + 1) % sugestoes.length)
              } else if (evento.key === "ArrowUp" && sugestoes.length) {
                evento.preventDefault()
                setIndiceAtivo((indice) => (indice - 1 + sugestoes.length) % sugestoes.length)
              } else if (evento.key === "Tab" && sugestoes[indiceAtivo]) {
                // Tab completa com a sugestão marcada.
                evento.preventDefault()
                confirmar(sugestoes[indiceAtivo].tag)
              } else if (evento.key === "Enter" || evento.key === ",") {
                // Enter/vírgula criam o que foi digitado (ou usam a sugestão, se nada foi digitado).
                evento.preventDefault()
                const valor = procurada || sugestoes[indiceAtivo]?.tag
                if (valor) confirmar(valor)
                else setEditando(false)
              } else if (evento.key === "Escape") {
                setTexto("")
                setEditando(false)
              } else if (evento.key === "Backspace" && !texto && daPropriedade.length) {
                removerTag(nota.id, daPropriedade[daPropriedade.length - 1])
              }
            }}
            onBlur={() => {
              if (procurada) confirmar(procurada)
              setEditando(false)
            }}
            placeholder="nova tag"
            aria-label="Nova tag"
            className="h-6 w-32 rounded-md bg-muted px-2 text-xs outline-none ring-1 ring-ring/40"
          />
          {sugestoes.length > 0 && (
            <div role="listbox" className="absolute top-7 left-0 z-30 w-48 rounded-lg bg-popover p-1 shadow-lg ring-1 ring-foreground/10">
              {sugestoes.map(({ tag, total }, indice) => (
                <button
                  key={tag}
                  type="button"
                  role="option"
                  aria-selected={indice === indiceAtivo}
                  onMouseDown={(evento) => evento.preventDefault()}
                  onMouseEnter={() => setIndiceAtivo(indice)}
                  onClick={() => confirmar(tag)}
                  className={cn("flex w-full items-center gap-1 rounded-md px-2 py-1 text-left text-xs", indice === indiceAtivo && "bg-muted")}
                >
                  <HashIcon className="size-3 text-muted-foreground" />
                  {tag}
                  <span className="ml-auto text-muted-foreground">{total}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditando(true)}
          aria-label="Adicionar tag"
          title="Adicionar tag"
          className="flex h-6 items-center gap-1 rounded-md px-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <PlusIcon className="size-3.5" />
          {atuais.size === 0 && "Adicionar tag"}
        </button>
      )}
    </div>
  )
}
