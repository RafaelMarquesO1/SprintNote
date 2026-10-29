"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useShallow } from "zustand/react/shallow"
import { FilePlusIcon, LibraryIcon, LinkIcon, MoreHorizontalIcon, NetworkIcon, Trash2Icon, WorkflowIcon } from "lucide-react"

import { GrafoConexoes } from "@/components/grafo/grafo-conexoes"
import { classeTituloEditavel } from "@/components/pagina"
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
import { Switch } from "@/components/ui/switch"
import { useHidratado } from "@/hooks/use-hidratado"
import { tempoRelativo, useAgora } from "@/hooks/use-hoje"
import { useNotas } from "@/lib/estado/notas"
import { idLivro, montarGrafo, type NoGrafo } from "@/lib/grafo"
import { extrairLinksWiki, obterReferencias } from "@/lib/links-wiki"
import { lerQuadro, textoDoQuadro } from "@/lib/quadro/modelo"
import { tagsDaNota } from "@/lib/tags"
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

function resumir(nota: Nota) {
  if (nota.tipo === "quadro") {
    const total = lerQuadro(nota.conteudo).nos.length
    const texto = textoDoQuadro(nota.conteudo)
    return total === 0 ? "Quadro vazio" : `${total} ${total === 1 ? "peça" : "peças"}${texto ? ` · ${texto}` : ""}`
  }
  return (
    nota.conteudo
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (_, alvo: string, __, rotulo?: string) => rotulo ?? alvo.split("/").pop() ?? alvo)
      .replace(/^\s*[-*+] (\[[ xX]\] )?/gm, "")
      .replace(/^>\s?(\[![^\]]+\]\s?)?/gm, "")
      .replace(/[#*`|=]/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Nota vazia"
  )
}

// Número com a palavra no singular ou no plural.
const contar = (total: number, singular: string, plural: string) => `${total} ${total === 1 ? singular : plural}`

// Rafael Marques - 20/10/2026
// Página de um livro: descrição, notas e quadros em cartões, mini-grafo e referências.
// Rafael Marques - 26/10/2026: tela refeita (números do livro, notas e quadros em cartões com
// prévia, subnotas e tags; ações enxutas).
export function PaginaLivro({ id }: { id: string }) {
  const hidratado = useHidratado()
  const router = useRouter()
  const agora = useAgora()
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
  const principais = notasDoLivro.filter((nota) => nota.paiId === null).sort((a, b) => b.atualizadoEm - a.atualizadoEm)
  const textos = principais.filter((nota) => nota.tipo !== "quadro")
  const quadros = principais.filter((nota) => nota.tipo === "quadro")
  const totalQuadros = notasDoLivro.filter((nota) => nota.tipo === "quadro").length
  const totalLinks = notasDoLivro.reduce((soma, nota) => soma + extrairLinksWiki(nota.conteudo).length, 0)
  const ultimaEdicao = notasDoLivro.reduce((maior, nota) => Math.max(maior, nota.atualizadoEm), livro.atualizadoEm)
  const referencias = [
    ...obterReferencias(biblioteca, { tipo: "livro", livro }),
    // Notas de outros livros que apontam para notas deste livro.
    ...biblioteca.notas.filter(
      (nota) =>
        nota.livroId !== livro.id &&
        notasDoLivro.some((daqui) => obterReferencias(biblioteca, { tipo: "nota", nota: daqui }).some((ref) => ref.id === nota.id))
    ),
  ].filter((nota, indice, lista) => lista.findIndex((item) => item.id === nota.id) === indice)

  function novaNota() {
    router.push(`/notas/${criarNota({ livroId: livro!.id }).id}`)
  }

  // Rafael Marques - 23/10/2026: quadro interativo dentro do livro.
  function novoQuadro() {
    router.push(`/notas/${criarNota({ livroId: livro!.id, titulo: "Novo quadro", tipo: "quadro" }).id}`)
  }

  function abrirNo(no: NoGrafo) {
    if (no.tipo === "nota") router.push(`/notas/${no.id.replace("nota:", "")}`)
    else if (no.tipo === "livro") router.push(`/notas?livro=${no.id.replace("livro:", "")}`)
  }

  function Cartao({ nota }: { nota: Nota }) {
    const subnotas = notasDoLivro.filter((item) => item.paiId === nota.id)
    const tags = tagsDaNota(nota).slice(0, 3)
    const links = extrairLinksWiki(nota.conteudo).length
    return (
      <li>
        <Link href={`/notas/${nota.id}`} className="group flex h-full flex-col gap-2 rounded-xl border bg-card p-3.5 transition-shadow hover:shadow-md hover:ring-1 hover:ring-foreground/20">
          <div className="flex items-start gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icone nome={nota.icone} className="text-muted-foreground" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{nota.titulo}</p>
              <p className="text-xs text-muted-foreground">{tempoRelativo(nota.atualizadoEm, agora)}</p>
            </div>
            {links > 0 && (
              <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground" title="Links nesta nota">
                <LinkIcon className="size-3" /> {links}
              </span>
            )}
          </div>
          <p className="line-clamp-2 min-h-8 text-xs text-muted-foreground">{resumir(nota)}</p>
          {(subnotas.length > 0 || tags.length > 0) && (
            <div className="mt-auto flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              {subnotas.length > 0 && <span className="rounded-full border px-2 py-0.5">{contar(subnotas.length, "nota na seção", "notas na seção")}</span>}
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-2 py-0.5">#{tag}</span>
              ))}
            </div>
          )}
        </Link>
      </li>
    )
  }

  const estatisticas = [
    { valor: notasDoLivro.length - totalQuadros, texto: notasDoLivro.length - totalQuadros === 1 ? "nota" : "notas" },
    { valor: totalQuadros, texto: totalQuadros === 1 ? "quadro" : "quadros" },
    { valor: totalLinks, texto: totalLinks === 1 ? "link" : "links" },
  ].filter((item, indice) => indice === 0 || item.valor > 0)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      <header className="space-y-3">
        <Link href="/notas" className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase hover:text-foreground">
          <LibraryIcon className="size-3.5" /> Biblioteca
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-[1_1_20rem] items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Trocar ícone do livro" className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground hover:bg-muted/70">
                <Icone nome={livro.icone} className="size-7" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-auto">
                <div className="grid max-h-72 grid-cols-8 gap-0.5 overflow-y-auto">
                  {iconesNota.map((icone) => (
                    <DropdownMenuItem key={icone} aria-label={icone} className="justify-center" onClick={() => atualizarLivro(livro.id, { icone })}>
                      <Icone nome={icone} />
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="min-w-0 flex-1">
              <TituloLivro key={livro.id} livro={livro} />
              <textarea
                value={livro.descricao}
                onChange={(evento) => atualizarLivro(livro.id, { descricao: evento.target.value })}
                rows={1}
                placeholder="Sobre o que é este livro? (opcional)"
                aria-label="Descrição do livro"
                className="field-sizing-content mt-0.5 block w-full resize-none bg-transparent text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={novoQuadro}>
              <WorkflowIcon /> Novo quadro
            </Button>
            <Button onClick={novaNota}>
              <FilePlusIcon /> Nova nota
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Mais opções do livro" className="text-muted-foreground" />}>
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem variant="destructive" onClick={() => setExcluindo(true)}>
                  <Trash2Icon /> Excluir livro
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground" suppressHydrationWarning>
          {estatisticas.map((item, indice) => (
            <span key={item.texto}>
              {indice > 0 && <span className="mr-2">·</span>}
              <strong className="font-semibold text-foreground tabular-nums">{item.valor}</strong> {item.texto}
            </span>
          ))}
          {notasDoLivro.length > 0 && <span>· editado {tempoRelativo(ultimaEdicao, agora)}</span>}
        </p>
        {/* Rafael Marques - 29/10/2026 (sugestão do Kaíke): escolher se as tarefas das notas deste livro entram em Tarefas */}
        <label className="flex w-fit max-w-full cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm">
          <Switch
            size="sm"
            checked={livro.vincularTarefas !== false}
            onCheckedChange={(valor) => atualizarLivro(livro.id, { vincularTarefas: valor })}
            aria-label="Vincular as tarefas deste livro à página de Tarefas"
          />
          <span className="min-w-0">
            <span className="font-medium">Vincular às tarefas</span>
            <span className="block text-xs text-muted-foreground">
              {livro.vincularTarefas !== false
                ? "As caixinhas “- [ ]” das notas deste livro aparecem em Tarefas, no Início e nos avisos de prazo."
                : "As caixinhas das notas deste livro ficam só nas notas, fora de Tarefas."}
            </span>
          </span>
        </label>
      </header>

      {/* minmax(0,1fr): sem isso a coluna cresce até o tamanho do texto mais longo e a página vaza no celular */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {notasDoLivro.length === 0 ? (
            <div className="space-y-4 rounded-2xl border border-dashed p-8 text-center">
              <div>
                <p className="font-medium">Este livro ainda está vazio</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Comece por uma nota ou por um quadro. Use <code>[[ ]]</code> para ligar as notas entre si.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={novaNota}>
                  <FilePlusIcon /> Criar a primeira nota
                </Button>
                <Button variant="outline" onClick={novoQuadro}>
                  <WorkflowIcon /> Criar um quadro
                </Button>
              </div>
            </div>
          ) : (
            <>
              {textos.length > 0 && (
                <section className="space-y-2.5" aria-label="Notas">
                  <h2 className="text-sm font-semibold">Notas</h2>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {textos.map((nota) => (
                      <Cartao key={nota.id} nota={nota} />
                    ))}
                  </ul>
                </section>
              )}
              {quadros.length > 0 && (
                <section className="space-y-2.5" aria-label="Quadros">
                  <h2 className="text-sm font-semibold">Quadros</h2>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {quadros.map((nota) => (
                      <Cartao key={nota.id} nota={nota} />
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        <aside className="space-y-3" aria-label="Conexões do livro">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold"><NetworkIcon className="size-4" /> Conexões do livro</h2>
            <Link href="/grafo" className="text-xs text-muted-foreground hover:text-foreground">Abrir grafo completo</Link>
          </div>
          <GrafoConexoes
            nos={grafo.nos}
            arestas={grafo.arestas}
            ordemLivros={biblioteca.livros.map((item) => item.id)}
            altura={300}
            focoId={idLivro(livro.id)}
            aoClicarNo={abrirNo}
          />
          <div className="rounded-xl border bg-card p-3.5">
            <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">Citado por notas de outros livros</h3>
            {referencias.length === 0 ? (
              <p className="text-xs break-words text-muted-foreground">
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
        </aside>
      </div>

      <DialogoExcluirLivro livro={excluindo ? livro : null} aoMudarAberto={setExcluindo} />
    </div>
  )
}
