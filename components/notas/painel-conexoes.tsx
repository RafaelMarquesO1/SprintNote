"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useShallow } from "zustand/react/shallow"
import {
  ArrowRightIcon,
  BookIcon,
  FilePlusIcon,
  HashIcon,
  KanbanIcon,
  LightbulbIcon,
  LinkIcon,
  NetworkIcon,
} from "lucide-react"

import { GrafoConexoes } from "@/components/grafo/grafo-conexoes"
import { Icone } from "@/components/icone"
import { Button } from "@/components/ui/button"
import { localDoCartao, useKanban } from "@/lib/estado/kanban"
import { useNotas } from "@/lib/estado/notas"
import { idNota, montarGrafo, type NoGrafo } from "@/lib/grafo"
import {
  alvoDaNota,
  encontrarMencoesSemLink,
  extrairLinksWiki,
  linkarMencao,
  obterReferencias,
  resolverLink,
} from "@/lib/links-wiki"
import { tagsDaNota } from "@/lib/tags"
import type { Nota } from "@/lib/tipos"

function Secao({ titulo, icone: IconeSecao, children, acao }: { titulo: string; icone: React.ElementType; children: React.ReactNode; acao?: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <IconeSecao className="size-4 text-muted-foreground" /> {titulo}
        </h3>
        {acao}
      </div>
      {children}
    </section>
  )
}

function ItemNota({ nota, aoAbrir }: { nota: Nota; aoAbrir: () => void }) {
  return (
    <Link href={`/notas/${nota.id}`} onClick={aoAbrir} className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted">
      <Icone nome={nota.icone} className="text-muted-foreground" />
      <span className="truncate">{nota.titulo}</span>
    </Link>
  )
}

// Quantas conexões a nota tem (para o número no botão "Conexões").
export function useTotalConexoes(nota: Nota) {
  const biblioteca = useNotas(useShallow((estado) => ({ notas: estado.notas, livros: estado.livros })))
  return useMemo(
    () => obterReferencias(biblioteca, { tipo: "nota", nota }).length + extrairLinksWiki(nota.conteudo).length,
    [biblioteca, nota]
  )
}

// Rafael Marques - 21/10/2026
// Painel lateral com tudo que liga a nota ao resto da biblioteca:
// referências, links, sugestões, tags, mapa, subnotas e Kanban.
export function PainelConexoes({ nota, aoFechar }: { nota: Nota; aoFechar: () => void }) {
  const router = useRouter()
  const biblioteca = useNotas(useShallow((estado) => ({ notas: estado.notas, livros: estado.livros })))
  const atualizarNota = useNotas((estado) => estado.atualizarNota)
  const criarNota = useNotas((estado) => estado.criarNota)
  const cartoes = useKanban((estado) => estado.cartoes)
  const colunasKanban = useKanban((estado) => estado.colunas)
  const quadros = useKanban((estado) => estado.quadros)

  const grafo = useMemo(
    () => montarGrafo(biblioteca, { estrutura: true, fantasmas: true, focoId: idNota(nota.id), profundidade: 2 }),
    [biblioteca, nota.id]
  )
  const sugestoes = useMemo(() => {
    const daNota = encontrarMencoesSemLink(biblioteca, nota.id)
    const paraNota = encontrarMencoesSemLink(biblioteca).filter((mencao) => mencao.destino.id === nota.id)
    return [...daNota, ...paraNota]
  }, [biblioteca, nota.id])

  const referencias = obterReferencias(biblioteca, { tipo: "nota", nota })
  const links = extrairLinksWiki(nota.conteudo).map((alvo) => ({ alvo, destino: resolverLink(alvo, biblioteca, nota.livroId) }))
  const subnotas = biblioteca.notas.filter((item) => item.paiId === nota.id)
  const tags = tagsDaNota(nota)
  const cartoesVinculados = cartoes.filter((cartao) => cartao.notaId === nota.id)

  function abrirNo(no: NoGrafo) {
    aoFechar()
    if (no.tipo === "nota") router.push(`/notas/${no.id.replace("nota:", "")}`)
    else if (no.tipo === "livro") router.push(`/livros/${no.id.replace("livro:", "")}`)
    else if (no.tipo === "tag") router.push(`/tags?tag=${encodeURIComponent(no.titulo.replace(/^#/, ""))}`)
  }

  return (
    <div className="space-y-6">
      <Secao titulo="Mapa da nota" icone={NetworkIcon} acao={<Link href="/grafo" onClick={aoFechar} className="text-xs text-muted-foreground hover:text-foreground">Grafo completo</Link>}>
        <GrafoConexoes
          nos={grafo.nos}
          arestas={grafo.arestas}
          ordemLivros={biblioteca.livros.map((item) => item.id)}
          altura={260}
          focoId={idNota(nota.id)}
          aoClicarNo={abrirNo}
        />
      </Secao>

      <Secao titulo={`Referências (${referencias.length})`} icone={LinkIcon}>
        {referencias.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nenhuma nota aponta para esta. Em outra nota, escreva <code>[[{alvoDaNota(nota, biblioteca, null)}]]</code>.
          </p>
        ) : (
          <div>{referencias.map((item) => <ItemNota key={item.id} nota={item} aoAbrir={aoFechar} />)}</div>
        )}
      </Secao>

      <Secao titulo={`Links desta nota (${links.length})`} icone={ArrowRightIcon}>
        {links.length === 0 ? (
          <p className="text-xs text-muted-foreground">Digite <code>[[</code> no texto para ligar esta nota a outra nota ou a um livro.</p>
        ) : (
          <ul>
            {links.map(({ alvo, destino }) => (
              <li key={alvo}>
                {destino?.tipo === "nota" ? (
                  <ItemNota nota={destino.nota} aoAbrir={aoFechar} />
                ) : destino?.tipo === "livro" ? (
                  <Link href={`/livros/${destino.livro.id}`} onClick={aoFechar} className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted">
                    <BookIcon className="size-4 text-muted-foreground" /> {destino.livro.titulo}
                    <span className="ml-auto text-xs text-muted-foreground">livro</span>
                  </Link>
                ) : (
                  <span className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
                    <FilePlusIcon className="size-4" /> <span className="truncate border-b border-dashed">{alvo}</span>
                    <span className="ml-auto text-xs">não criada</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Secao>

      {sugestoes.length > 0 && (
        <Secao titulo="Sugestões de conexão" icone={LightbulbIcon}>
          <ul className="space-y-1.5">
            {sugestoes.map(({ origem, destino }) => (
              <li key={`${origem.id}-${destino.id}`} className="flex items-center gap-2 rounded-lg border p-2 text-xs">
                <span className="min-w-0 flex-1">
                  <strong>{origem.id === nota.id ? "Esta nota" : origem.titulo}</strong> menciona{" "}
                  <strong>{destino.id === nota.id ? "esta nota" : destino.titulo}</strong> sem link
                </span>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    atualizarNota(origem.id, {
                      conteudo: linkarMencao(origem.conteudo, destino.titulo, alvoDaNota(destino, biblioteca, origem.livroId)),
                    })
                  }
                >
                  Linkar
                </Button>
              </li>
            ))}
          </ul>
        </Secao>
      )}

      <Secao titulo={`Tags (${tags.length})`} icone={HashIcon}>
        {tags.length === 0 ? (
          <p className="text-xs text-muted-foreground">Escreva <code>#assunto</code> no texto para marcar a nota.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Link key={tag} href={`/tags?tag=${encodeURIComponent(tag)}`} onClick={aoFechar} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground">
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </Secao>

      <Secao
        titulo={`Subnotas (${subnotas.length})`}
        icone={FilePlusIcon}
        acao={
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              aoFechar()
              router.push(`/notas/${criarNota({ paiId: nota.id }).id}`)
            }}
          >
            + Subnota
          </Button>
        }
      >
        {subnotas.length === 0 ? (
          <p className="text-xs text-muted-foreground">Divida assuntos grandes em subnotas dentro desta.</p>
        ) : (
          <div>{subnotas.map((item) => <ItemNota key={item.id} nota={item} aoAbrir={aoFechar} />)}</div>
        )}
      </Secao>

      {cartoesVinculados.length > 0 && (
        <Secao titulo="No Kanban" icone={KanbanIcon}>
          <ul className="space-y-1">
            {cartoesVinculados.map((cartao) => (
              <li key={cartao.id} className="px-2 text-sm">
                <Link href="/kanban" onClick={aoFechar} className="hover:underline">{cartao.titulo}</Link>
                <span className="text-muted-foreground"> · {localDoCartao(cartao, colunasKanban, quadros)}</span>
              </li>
            ))}
          </ul>
        </Secao>
      )}
    </div>
  )
}
