"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useShallow } from "zustand/react/shallow"
import { FilePlusIcon, LibraryIcon, LinkIcon, NetworkIcon, Trash2Icon } from "lucide-react"

import { GrafoConexoes } from "@/components/grafo/grafo-conexoes"
import { CabecalhoPagina, Pagina, classeTituloEditavel } from "@/components/pagina"
import { Icone, iconesNota } from "@/components/icone"
import { DialogoExcluirLivro } from "@/components/livros/dialogo-excluir-livro"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { useHidratado } from "@/hooks/use-hidratado"
import { useNotas } from "@/lib/estado/notas"
import { idLivro, montarGrafo, type NoGrafo } from "@/lib/grafo"
import { extrairLinksWiki, obterReferencias } from "@/lib/links-wiki"
import type { Livro, Nota } from "@/lib/tipos"

function TituloLivro({ livro }: { livro: Livro }) {
  const renomearLivro = useNotas((estado) => estado.renomearLivro)
  const [rascunho, setRascunho] = useState(livro.titulo)
  return (
    <input
      value={rascunho}
      onChange={(evento) => {
        // Cada letra já atualiza a sidebar e os [[links]] das notas.
        setRascunho(evento.target.value)
        if (evento.target.value.trim()) renomearLivro(livro.id, evento.target.value)
      }}
      onBlur={() => {
        if (!rascunho.trim()) setRascunho(livro.titulo)
      }}
      onKeyDown={(evento) => {
        if (evento.key === "Enter") evento.currentTarget.blur()
      }}
      aria-label="Título do livro"
      className={classeTituloEditavel}
    />
  )
}

function resumir(conteudo: string) {
  return conteudo
    .replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (_, alvo: string, __, rotulo?: string) => rotulo ?? alvo.split("/").pop() ?? alvo)
    .replace(/[#>*`\-\[\]|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// Rafael Marques - 20/10/2026
// Página de um livro: descrição, notas (em árvore), mini-grafo e referências.
export function PaginaLivro({ id }: { id: string }) {
  const hidratado = useHidratado()
  const router = useRouter()
  const biblioteca = useNotas(useShallow((estado) => ({ notas: estado.notas, livros: estado.livros })))
  const atualizarLivro = useNotas((estado) => estado.atualizarLivro)
  const criarNota = useNotas((estado) => estado.criarNota)
  const [excluindo, setExcluindo] = useState(false)

  const livro = biblioteca.livros.find((item) => item.id === id)
  const grafo = useMemo(
    () => montarGrafo(biblioteca, { estrutura: true, fantasmas: true, focoId: idLivro(id), profundidade: 3 }),
    [biblioteca, id]
  )

  if (!hidratado) return <Skeleton className="mx-auto h-64 max-w-4xl" />

  if (!livro) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 py-12 text-center">
        <h1 className="text-xl font-semibold">Livro não encontrado</h1>
        <Button variant="outline" nativeButton={false} render={<Link href="/notas" />}>Ver a biblioteca</Button>
      </div>
    )
  }

  const notasDoLivro = biblioteca.notas.filter((nota) => nota.livroId === livro.id)
  const referencias = [
    ...obterReferencias(biblioteca, { tipo: "livro", livro }),
    // Notas de outros livros que apontam para notas deste livro.
    ...biblioteca.notas.filter(
      (nota) =>
        nota.livroId !== livro.id &&
        notasDoLivro.some((daqui) => obterReferencias(biblioteca, { tipo: "nota", nota: daqui }).some((ref) => ref.id === nota.id))
    ),
  ].filter((nota, indice, lista) => lista.findIndex((item) => item.id === nota.id) === indice)

  function novaNota(paiId: string | null = null) {
    router.push(`/notas/${criarNota({ livroId: livro!.id, paiId }).id}`)
  }

  function abrirNo(no: NoGrafo) {
    if (no.tipo === "nota") router.push(`/notas/${no.id.replace("nota:", "")}`)
    else if (no.tipo === "livro") router.push(`/livros/${no.id.replace("livro:", "")}`)
  }

  function ramo(paiId: string | null, nivel: number): React.ReactNode {
    const filhas = notasDoLivro
      .filter((nota) => nota.paiId === paiId)
      .sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"))
    if (filhas.length === 0) return null
    return (
      <ul className={nivel > 0 ? "ml-5 border-l pl-3" : "space-y-1"}>
        {filhas.map((nota: Nota) => (
          <li key={nota.id}>
            <Link href={`/notas/${nota.id}`} className="group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-muted">
              <Icone nome={nota.icone} className="mt-0.5 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{nota.titulo}</span>
                <span className="block truncate text-xs text-muted-foreground">{resumir(nota.conteudo) || "Nota vazia"}</span>
              </span>
              {extrairLinksWiki(nota.conteudo).length > 0 && (
                <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground" title="Links nesta nota">
                  <LinkIcon className="size-3" /> {extrairLinksWiki(nota.conteudo).length}
                </span>
              )}
            </Link>
            {ramo(nota.id, nivel + 1)}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <Pagina>
      <CabecalhoPagina
        secao="Biblioteca · Livro"
        icone={LibraryIcon}
        titulo={
          <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Trocar ícone do livro" className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground hover:bg-muted/70">
            <Icone nome={livro.icone} className="size-6" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-auto">
            <div className="grid grid-cols-8 gap-0.5">
              {iconesNota.map((icone) => (
                <DropdownMenuItem key={icone} aria-label={icone} className="justify-center" onClick={() => atualizarLivro(livro.id, { icone })}>
                  <Icone nome={icone} />
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <TituloLivro key={livro.id} livro={livro} />
          </div>
        }
        descricao={
          <textarea
            value={livro.descricao}
            onChange={(evento) => atualizarLivro(livro.id, { descricao: evento.target.value })}
            placeholder="Sobre o que é este livro? (opcional)"
            aria-label="Descrição do livro"
            className="field-sizing-content block w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground/60"
          />
        }
        acoes={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href="/notas" />}>
              <LibraryIcon /> Todos os livros
            </Button>
            <Button variant="ghost" size="icon" aria-label="Excluir livro" title="Excluir livro" onClick={() => setExcluindo(true)}>
              <Trash2Icon />
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Notas ({notasDoLivro.length})</h2>
            <Button size="sm" onClick={() => novaNota()}>
              <FilePlusIcon /> Nova nota
            </Button>
          </div>
          {notasDoLivro.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhuma nota ainda. Crie a primeira e use <code>[[ ]]</code> para ligar as notas entre si.
            </div>
          ) : (
            ramo(null, 0)
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold"><NetworkIcon className="size-4" /> Conexões do livro</h2>
            <Link href="/grafo" className="text-xs text-muted-foreground hover:text-foreground">Abrir grafo completo</Link>
          </div>
          <GrafoConexoes
            nos={grafo.nos}
            arestas={grafo.arestas}
            ordemLivros={biblioteca.livros.map((item) => item.id)}
            altura={320}
            focoId={idLivro(livro.id)}
            aoClicarNo={abrirNo}
          />
          <div>
            <h3 className="mb-1 text-xs font-medium text-muted-foreground">Citado por notas de outros livros</h3>
            {referencias.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma ainda. Em qualquer nota, escreva <code>[[{livro.titulo}]]</code> ou <code>[[{livro.titulo}/Nota]]</code>.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {referencias.map((nota) => (
                  <li key={nota.id}>
                    <Link href={`/notas/${nota.id}`} className="flex items-center gap-1.5 text-sm hover:underline">
                      <Icone nome={nota.icone} className="text-muted-foreground" /> {nota.titulo}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <DialogoExcluirLivro livro={excluindo ? livro : null} aoMudarAberto={setExcluindo} />
    </Pagina>
  )
}
