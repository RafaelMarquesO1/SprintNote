"use client"

import { createContext, useContext } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useShallow } from "zustand/react/shallow"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { BookIcon, CalendarIcon } from "lucide-react"

import { useHoje } from "@/hooks/use-hoje"
import { useNotas } from "@/lib/estado/notas"
import { PREFIXO_LINK_WIKI, PREFIXO_MARCA, PREFIXO_PRAZO, PREFIXO_TAG, dadosNovaNota, linksWikiParaMarkdown, resolverLink } from "@/lib/links-wiki"
import { interpretarPrazo, rotuloPrazo } from "@/lib/tarefas-notas"

// Nota que está sendo exibida: [[Nota]] prioriza notas do mesmo livro.
const ContextoNota = createContext<{ livroId: string | null }>({ livroId: null })

// Rafael Marques - 20/10/2026
// Link [[alvo]]: abre a nota/livro ou, se não existir, cria a nota ao clicar.
function LinkWiki({ alvo, children }: { alvo: string; children: React.ReactNode }) {
  const router = useRouter()
  const livroAtualId = useContext(ContextoNota).livroId
  const biblioteca = useNotas(useShallow((estado) => ({ notas: estado.notas, livros: estado.livros })))
  const criarNota = useNotas((estado) => estado.criarNota)
  const destino = resolverLink(alvo, biblioteca, livroAtualId)

  // Evita que o clique no link ative a edição do bloco.
  const pararClique = (evento: React.MouseEvent) => evento.stopPropagation()

  if (destino?.tipo === "nota") {
    return (
      <Link href={`/notas/${destino.nota.id}`} className="link-wiki" onClick={pararClique} onMouseDown={pararClique}>
        {children}
      </Link>
    )
  }

  if (destino?.tipo === "livro") {
    return (
      <Link href={`/livros/${destino.livro.id}`} className="link-wiki link-wiki-livro" onClick={pararClique} onMouseDown={pararClique}>
        <BookIcon className="mr-0.5 inline size-3.5 -translate-y-px" />
        {children}
      </Link>
    )
  }

  function criar(evento: React.MouseEvent) {
    evento.stopPropagation()
    // [[Livro/Nota]] cria a nota dentro daquele livro.
    const nota = criarNota(dadosNovaNota(alvo, biblioteca, livroAtualId))
    router.push(`/notas/${nota.id}`)
  }

  return (
    <button
      type="button"
      className="link-wiki link-wiki-inexistente"
      title="Nota ainda não existe — clique para criar"
      onMouseDown={pararClique}
      onClick={criar}
    >
      {children}
    </button>
  )
}

// #tag: abre a página da tag.
function EtiquetaTag({ tag }: { tag: string }) {
  return (
    <Link
      href={`/tags?tag=${encodeURIComponent(tag)}`}
      className="etiqueta-tag"
      onClick={(evento) => evento.stopPropagation()}
      onMouseDown={(evento) => evento.stopPropagation()}
    >
      #{tag}
    </Link>
  )
}

// @amanhã: mostra a data de verdade, em vermelho se já passou.
function EtiquetaPrazo({ token }: { token: string }) {
  const hoje = useHoje()
  const prazo = hoje ? interpretarPrazo(token, hoje) : null
  return (
    <span className={prazo && prazo < hoje ? "etiqueta-prazo etiqueta-prazo-atrasada" : "etiqueta-prazo"} title={prazo ?? undefined}>
      <CalendarIcon className="mr-0.5 inline size-3 -translate-y-px" />
      {prazo ? rotuloPrazo(prazo, hoje) : token}
    </span>
  )
}

const componentes: Components = {
  a({ href, children }) {
    if (href === PREFIXO_MARCA) return <mark className="marca-texto">{children}</mark>
    if (href?.startsWith(PREFIXO_TAG)) return <EtiquetaTag tag={decodeURIComponent(href.slice(PREFIXO_TAG.length))} />
    if (href?.startsWith(PREFIXO_PRAZO)) return <EtiquetaPrazo token={decodeURIComponent(href.slice(PREFIXO_PRAZO.length))} />
    if (href?.startsWith(PREFIXO_LINK_WIKI)) {
      const alvo = decodeURIComponent(href.slice(PREFIXO_LINK_WIKI.length))
      return <LinkWiki alvo={alvo}>{children}</LinkWiki>
    }
    return (
      <a href={href} target="_blank" rel="noreferrer" onClick={(evento) => evento.stopPropagation()}>
        {children}
      </a>
    )
  },
  // Rafael Marques - 22/10/2026: caixa que rola de lado quando a tabela não cabe (celular).
  table: ({ children }) => (
    <div className="tabela-rolavel">
      <table>{children}</table>
    </div>
  ),
}

// Para trechos curtos dentro de um bloco: sem <p> em volta.
const componentesInline: Components = {
  ...componentes,
  p: ({ children }) => <>{children}</>,
}

// Rafael Marques - 20/10/2026
// Markdown formatado (estilos em .markdown no globals.css).
// "inline" renderiza só o texto de um bloco, sem parágrafo.
export function ConteudoMarkdown({
  texto,
  livroId = null,
  inline = false,
}: {
  texto: string
  livroId?: string | null
  inline?: boolean
}) {
  // Quebra de linha simples vira quebra visível (como no Notion).
  const fonte = linksWikiParaMarkdown(inline ? texto.replace(/\n/g, "  \n") : texto)
  return (
    <ContextoNota.Provider value={{ livroId }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={inline ? componentesInline : componentes}>
        {fonte}
      </ReactMarkdown>
    </ContextoNota.Provider>
  )
}
