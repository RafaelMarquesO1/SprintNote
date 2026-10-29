"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useShallow } from "zustand/react/shallow"
import { HashIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import { Icone } from "@/components/icone"
import { Skeleton } from "@/components/ui/skeleton"
import { CabecalhoPagina, Pagina } from "@/components/pagina"
import { useHidratado } from "@/hooks/use-hidratado"
import { useNotas } from "@/lib/estado/notas"
import { contarTags, normalizarTag, notasComTag } from "@/lib/tags"

// Trecho da nota em volta da primeira menção à tag.
// Rafael Marques - 29/10/2026: acha a tag inteira (#aula não pega #aulas) e, se ela só estiver no botão "+",
// mostra o começo da nota em vez de deixar o trecho em branco.
function trechoComTag(conteudo: string, tag: string) {
  const escapada = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const achada = new RegExp(`(^|\\s)#${escapada}(?=$|[^\\p{L}\\p{N}_\\-])`, "iu").exec(conteudo)
  const indice = achada ? achada.index + achada[1].length : -1
  const inicio = indice === -1 ? 0 : Math.max(0, indice - 60)
  const texto = conteudo
    .slice(inicio, indice === -1 ? 140 : indice + tag.length + 80)
    .replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, "$1")
    .replace(/^\s*[-*+] (\[[ xX]\] )?/gm, "")
    .replace(/^#{1,6} /gm, "")
    .replace(/[*`>]/g, "")
    .replace(/\s+/g, " ")
  return `${inicio > 0 ? "…" : ""}${texto.trim()}…`
}

// Rafael Marques - 21/10/2026
// Todas as #tags da biblioteca; ao escolher uma, mostra as notas marcadas.
export function PaginaTags() {
  const hidratado = useHidratado()
  const router = useRouter()
  const caminho = usePathname()
  const parametros = useSearchParams()
  const { notas, livros } = useNotas(useShallow((estado) => ({ notas: estado.notas, livros: estado.livros })))
  const tagAtiva = parametros.get("tag") ? normalizarTag(parametros.get("tag")!.replace(/^#+/, "")) : null

  if (!hidratado) return <Skeleton className="mx-auto h-64 max-w-5xl" />

  const tags = contarTags(notas)
  const marcadas = tagAtiva ? notasComTag(notas, tagAtiva).sort((a, b) => b.atualizadoEm - a.atualizadoEm) : []

  function escolher(tag: string | null) {
    router.replace(tag ? `${caminho}?tag=${encodeURIComponent(tag)}` : caminho)
  }

  return (
    <Pagina>
      <CabecalhoPagina
        secao="Biblioteca"
        icone={HashIcon}
        titulo="Tags"
        descricao={
          <>
            Use o <strong>+</strong> abaixo do título da nota ou escreva <code>#assunto</code> no texto. Tags com barra, como{" "}
            <code>#projeto/fase-1</code>, aparecem dentro de <code>#projeto</code>.
          </>
        }
      />

      {tags.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Nenhuma tag ainda.
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(({ tag, total }) => (
            <button
              key={tag}
              type="button"
              aria-pressed={tag === tagAtiva}
              onClick={() => escolher(tag === tagAtiva ? null : tag)}
              className={cn(
                "flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors",
                tag === tagAtiva ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <HashIcon className="size-3.5" />
              {tag}
              <span className={cn("text-xs", tag === tagAtiva ? "text-primary-foreground/70" : "text-muted-foreground")}>{total}</span>
            </button>
          ))}
        </div>
      )}

      {tagAtiva && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">
            {marcadas.length} nota(s) com #{tagAtiva}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {marcadas.map((nota) => (
              <Link key={nota.id} href={`/notas/${nota.id}`} className="flex flex-col gap-1.5 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40">
                <div className="flex items-center gap-2">
                  <Icone nome={nota.icone} className="text-muted-foreground" />
                  <span className="truncate font-medium">{nota.titulo}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {livros.find((livro) => livro.id === nota.livroId)?.titulo ?? "Nota solta"}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{trechoComTag(nota.conteudo, tagAtiva)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Pagina>
  )
}
