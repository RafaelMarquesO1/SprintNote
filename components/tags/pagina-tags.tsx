"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useShallow } from "zustand/react/shallow"
import { HashIcon } from "lucide-react"

import { Icone } from "@/components/icone"
import { Skeleton } from "@/components/ui/skeleton"
import { CabecalhoPagina, Pagina } from "@/components/pagina"
import { useHidratado } from "@/hooks/use-hidratado"
import { useNotas } from "@/lib/estado/notas"
import { contarTags, normalizarTag, notasComTag, tagsDaNota } from "@/lib/tags"
import { EmptyState } from "@/components/ui/empty-state"
import { ToggleChip } from "@/components/ui/chip"
import { StatList } from "@/components/ui/stat-list"

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
  const semTag = notas.filter((nota) => tagsDaNota(nota).length === 0)
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
            Use + abaixo do título da nota ou escreva <code className="font-mono text-code text-ink">#assunto</code> no texto. Tags com barra, como{" "}
            <code className="font-mono text-code text-ink">#projeto/fase-1</code>, aparecem dentro de <code className="font-mono text-code text-ink">#projeto</code>.
          </>
        }
        resumo={<StatList stats={[{ label: tags.length === 1 ? "tag" : "tags", value: tags.length }, { label: "notas sem tag", value: semTag.length }]} />}
      />

      {tags.length === 0 ? (
        <EmptyState title="Nenhuma tag ainda." description="Escreva #assunto em qualquer nota e ela aparece aqui." />
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(({ tag, total }) => (
            <ToggleChip key={tag} pressed={tag === tagAtiva} onPressedChange={(ligar) => escolher(ligar ? tag : null)}>
              #{tag} <span className="text-ink-muted tabular-nums">{total}</span>
            </ToggleChip>
          ))}
        </div>
      )}

      {tagAtiva && (
        <section className="space-y-3">
          <h2 className="font-display text-section text-paper">
            {marcadas.length} {marcadas.length === 1 ? "nota" : "notas"} com #{tagAtiva}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {marcadas.map((nota) => (
              <Link key={nota.id} href={`/notas/${nota.id}`} className="flex flex-col gap-1.5 rounded-lg border border-line bg-panel p-4 transition-colors hover:border-line-strong">
                <div className="flex items-center gap-2">
                  <Icone nome={nota.icone} className="text-muted-foreground" />
                  <span className="truncate text-ui font-semibold text-paper">{nota.titulo}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {livros.find((livro) => livro.id === nota.livroId)?.titulo ?? "Sem caderno"}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{trechoComTag(nota.conteudo, tagAtiva)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!tagAtiva && semTag.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-section text-paper">Notas sem tag</h2>
          <ul className="divide-y divide-line rounded-lg border border-line bg-panel px-4">
            {semTag.slice(0, 8).map((nota) => (
              <li key={nota.id}>
                <Link href={`/notas/${nota.id}`} className="flex min-h-row items-center justify-between gap-3 text-ui text-paper hover:underline hover:underline-offset-4">
                  <span className="truncate">{nota.titulo}</span>
                  <span className="shrink-0 text-small text-ink-soft">{livros.find((livro) => livro.id === nota.livroId)?.titulo ?? "Sem caderno"}</span>
                </Link>
              </li>
            ))}
          </ul>
          {semTag.length > 8 ? <p className="text-small text-ink-soft">E mais {semTag.length - 8}.</p> : null}
        </section>
      )}
    </Pagina>
  )
}
