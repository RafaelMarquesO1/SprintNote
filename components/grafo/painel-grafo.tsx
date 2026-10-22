"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useShallow } from "zustand/react/shallow"
import {
  BookPlusIcon,
  CableIcon,
  FilePlusIcon,
  LightbulbIcon,
  NetworkIcon,
  Link2OffIcon,
  RotateCcwIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  UnlinkIcon,
  XIcon,
} from "lucide-react"

import { GrafoConexoes, coresLivro } from "@/components/grafo/grafo-conexoes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { CabecalhoPagina, Pagina } from "@/components/pagina"
import { useHidratado } from "@/hooks/use-hidratado"
import { useNotas } from "@/lib/estado/notas"
import { encontrarLinksQuebrados, encontrarOrfas, montarGrafo, type NoGrafo } from "@/lib/grafo"
import {
  adicionarConexao,
  alvoDaNota,
  dadosNovaNota,
  encontrarMencoesSemLink,
  linkarMencao,
  semAcento,
  type Biblioteca,
} from "@/lib/links-wiki"

// Liga a nota de origem ao destino escrevendo [[destino]] na seção "Conexões".
export function useConectar() {
  const biblioteca = useNotas(useShallow((estado) => ({ notas: estado.notas, livros: estado.livros })))
  const atualizarNota = useNotas((estado) => estado.atualizarNota)

  return function conectar(origemNotaId: string, destino: NoGrafo): string {
    const origem = biblioteca.notas.find((nota) => nota.id === origemNotaId)
    if (!origem) return "Nota de origem não encontrada."
    let alvo = destino.titulo
    if (destino.tipo === "nota") {
      const nota = biblioteca.notas.find((item) => `nota:${item.id}` === destino.id)
      if (!nota) return "Nota de destino não encontrada."
      if (nota.id === origem.id) return "Escolha uma nota diferente."
      alvo = alvoDaNota(nota, biblioteca, origem.livroId)
    }
    atualizarNota(origem.id, { conteudo: adicionarConexao(origem.conteudo, alvo) })
    return `“${origem.titulo}” agora aponta para “${destino.titulo}”.`
  }
}

function Secao({ titulo, icone: IconeSecao, quantidade, children }: { titulo: string; icone: React.ElementType; quantidade: number; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
        <IconeSecao className="size-4 text-muted-foreground" /> {titulo}
        <span className="ml-auto rounded-full bg-muted px-2 text-xs font-normal text-muted-foreground">{quantidade}</span>
      </h2>
      {children}
    </section>
  )
}

function AjudaConexoes({ biblioteca }: { biblioteca: Biblioteca }) {
  const router = useRouter()
  const atualizarNota = useNotas((estado) => estado.atualizarNota)
  const criarNota = useNotas((estado) => estado.criarNota)

  const mencoes = useMemo(() => encontrarMencoesSemLink(biblioteca), [biblioteca])
  const quebrados = useMemo(() => encontrarLinksQuebrados(biblioteca), [biblioteca])
  const orfas = useMemo(() => encontrarOrfas(biblioteca), [biblioteca])

  return (
    <div className="space-y-6">
      <Secao titulo="Sugestões de conexão" icone={LightbulbIcon} quantidade={mencoes.length}>
        {mencoes.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Quando uma nota citar o título de outra sem usar <code>[[ ]]</code>, a sugestão aparece aqui.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {mencoes.slice(0, 12).map(({ origem, destino }) => (
              <li key={`${origem.id}-${destino.id}`} className="flex items-center gap-2 rounded-lg border p-2 text-xs">
                <span className="min-w-0 flex-1">
                  <Link href={`/notas/${origem.id}`} className="font-medium hover:underline">{origem.titulo}</Link>
                  <span className="text-muted-foreground"> menciona </span>
                  <span className="font-medium">{destino.titulo}</span>
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
        )}
      </Secao>

      <Secao titulo="Notas ainda não criadas" icone={Link2OffIcon} quantidade={quebrados.length}>
        {quebrados.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum link quebrado.</p>
        ) : (
          <ul className="space-y-1.5">
            {quebrados.slice(0, 12).map((item) => (
              <li key={item.alvo} className="flex items-center gap-2 rounded-lg border border-dashed p-2 text-xs">
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{item.alvo}</span>
                  <span className="block truncate text-muted-foreground">citada em {item.origens.map((origem) => origem.titulo).join(", ")}</span>
                </span>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => router.push(`/notas/${criarNota(dadosNovaNota(item.alvo, biblioteca, item.origens[0]?.livroId ?? null)).id}`)}
                >
                  <FilePlusIcon /> Criar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      <Secao titulo="Notas sem conexão" icone={UnlinkIcon} quantidade={orfas.length}>
        {orfas.length === 0 ? (
          <p className="text-xs text-muted-foreground">Todas as notas estão conectadas.</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">Use o modo conectar ou escreva <code>[[ ]]</code> nelas.</p>
            <ul className="flex flex-wrap gap-1.5">
              {orfas.slice(0, 20).map((nota) => (
                <li key={nota.id}>
                  <Link href={`/notas/${nota.id}`} className="block rounded-full border px-2.5 py-0.5 text-xs hover:bg-muted">
                    {nota.titulo}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Secao>
    </div>
  )
}

// Rafael Marques - 20/10/2026
// Página do grafo: visão geral das conexões + ferramentas para criar novas.
export function PainelGrafo() {
  const hidratado = useHidratado()
  const router = useRouter()
  const biblioteca = useNotas(useShallow((estado) => ({ notas: estado.notas, livros: estado.livros })))
  const criarLivro = useNotas((estado) => estado.criarLivro)
  const criarNota = useNotas((estado) => estado.criarNota)
  const conectar = useConectar()

  const [estrutura, setEstrutura] = useState(true)
  const [fantasmas, setFantasmas] = useState(true)
  const [mostrarTags, setMostrarTags] = useState(false)
  const [ocultos, setOcultos] = useState<Set<string>>(new Set())
  const [busca, setBusca] = useState("")
  const [modoConectar, setModoConectar] = useState(false)
  const [origemConexao, setOrigemConexao] = useState<NoGrafo | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [assistenteAberto, setAssistenteAberto] = useState(false)

  const filtroLivros = useMemo(() => {
    if (ocultos.size === 0) return undefined
    return new Set([...biblioteca.livros.map((livro) => livro.id), "soltas"].filter((id) => !ocultos.has(id)))
  }, [ocultos, biblioteca.livros])

  const grafo = useMemo(
    () => montarGrafo(biblioteca, { estrutura, fantasmas, tags: mostrarTags, livros: filtroLivros }),
    [biblioteca, estrutura, fantasmas, mostrarTags, filtroLivros]
  )

  // Quantas sugestões o assistente tem (número no botão).
  const totalSugestoes = useMemo(
    () => encontrarMencoesSemLink(biblioteca).length + encontrarLinksQuebrados(biblioteca).length + encontrarOrfas(biblioteca).length,
    [biblioteca]
  )

  if (!hidratado) return <Skeleton className="h-[70vh] w-full" />

  const encontrado = busca.trim()
    ? grafo.nos.find((no) => semAcento(no.titulo).includes(semAcento(busca.trim())))
    : undefined

  function alternarConectar() {
    setModoConectar(!modoConectar)
    setOrigemConexao(null)
    setAviso(modoConectar ? null : "Clique na nota de origem e depois no destino.")
  }

  function aoClicarNo(no: NoGrafo) {
    if (modoConectar) {
      if (!origemConexao) {
        setOrigemConexao(no)
        const invalida = no.tipo === "fantasma" || no.tipo === "tag"
        setAviso(invalida ? "Escolha uma nota (ou um livro) como origem." : `Origem: “${no.titulo}”. Agora clique no destino.`)
        if (invalida) setOrigemConexao(null)
        return
      }
      // Livros não têm texto: quem recebe o [[link]] é sempre uma nota.
      let origem = origemConexao
      let destino = no
      if (origem.tipo === "livro" && destino.tipo === "nota") [origem, destino] = [destino, origem]
      if (destino.tipo === "tag") {
        setAviso("Para marcar com uma tag, escreva #tag no texto da nota.")
      } else if (origem.tipo !== "nota") {
        setAviso("Para ligar dois livros, conecte uma nota de um à outra.")
      } else {
        setAviso(conectar(origem.id.replace("nota:", ""), destino))
      }
      setOrigemConexao(null)
      return
    }
    if (no.tipo === "nota") router.push(`/notas/${no.id.replace("nota:", "")}`)
    else if (no.tipo === "livro") router.push(`/livros/${no.id.replace("livro:", "")}`)
    else if (no.tipo === "tag") router.push(`/tags?tag=${encodeURIComponent(no.titulo.slice(1))}`)
    else router.push(`/notas/${criarNota(dadosNovaNota(no.titulo, biblioteca, no.livroId)).id}`)
  }

  function alternarFiltro(id: string) {
    setOcultos((anterior) => {
      const proximo = new Set(anterior)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
  }

  const vazio = biblioteca.livros.length === 0 && biblioteca.notas.length === 0
  const ordemLivros = biblioteca.livros.map((livro) => livro.id)
  const filtros = [
    ...biblioteca.livros.map((livro, indice) => ({ id: livro.id, titulo: livro.titulo, cor: livro.cor || coresLivro[indice % coresLivro.length] })),
    { id: "soltas", titulo: "Notas soltas", cor: "var(--muted-foreground)" },
  ]
  // Quantos filtros estão diferentes do padrão (número no botão "Filtros").
  const filtrosAtivos = ocultos.size + (estrutura ? 0 : 1) + (fantasmas ? 0 : 1) + (mostrarTags ? 1 : 0)

  return (
    <Pagina largura="total">
      <CabecalhoPagina
        secao="Biblioteca"
        icone={NetworkIcon}
        titulo="Grafo de conexões"
        descricao={`${biblioteca.livros.length} livro(s) · ${biblioteca.notas.length} nota(s) · ${grafo.arestas.filter((aresta) => aresta.tipo === "link").length} conexão(ões)`}
        acoes={
          <>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Encontrar nota…" className="w-48 pl-8" aria-label="Encontrar nota no grafo" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" />}>
                <SlidersHorizontalIcon /> Filtros
                {filtrosAtivos > 0 && <Badge className="h-4 min-w-4 px-1">{filtrosAtivos}</Badge>}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Mostrar livros</DropdownMenuLabel>
                  {filtros.map((filtro) => (
                    <DropdownMenuCheckboxItem key={filtro.id} checked={!ocultos.has(filtro.id)} onCheckedChange={() => alternarFiltro(filtro.id)}>
                      <span className="size-2.5 rounded-full" style={{ background: filtro.cor }} />
                      <span className="truncate">{filtro.titulo}</span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Mostrar no grafo</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem checked={estrutura} onCheckedChange={setEstrutura}>
                    Ligação do livro com as notas
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={fantasmas} onCheckedChange={setFantasmas}>
                    Notas citadas não criadas
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={mostrarTags} onCheckedChange={setMostrarTags}>
                    Tags
                  </DropdownMenuCheckboxItem>
                </DropdownMenuGroup>
                {filtrosAtivos > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setOcultos(new Set())
                        setEstrutura(true)
                        setFantasmas(true)
                        setMostrarTags(false)
                      }}
                    >
                      <RotateCcwIcon /> Limpar filtros
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant={modoConectar ? "default" : "outline"} onClick={alternarConectar}>
              <CableIcon /> {modoConectar ? "Conectando…" : "Conectar"}
            </Button>

            <Button variant="outline" onClick={() => setAssistenteAberto(true)}>
              <LightbulbIcon /> Assistente
              {totalSugestoes > 0 && <Badge variant="secondary" className="h-4 min-w-4 px-1">{totalSugestoes}</Badge>}
            </Button>
          </>
        }
      />

      {vazio ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <p className="font-medium">Sua biblioteca está vazia.</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Crie um livro e escreva notas dentro dele. Cada <code>[[link]]</code> entre notas vira uma linha neste grafo.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => router.push(`/livros/${criarLivro().id}`)}><BookPlusIcon /> Criar livro</Button>
            <Button variant="outline" onClick={() => router.push(`/notas/${criarNota().id}`)}><FilePlusIcon /> Nota solta</Button>
          </div>
        </div>
      ) : (
        <GrafoConexoes
          nos={grafo.nos}
          arestas={grafo.arestas}
          ordemLivros={ordemLivros}
          altura="calc(100svh - 13rem)"
          className="min-h-[420px]"
          selecionadoId={origemConexao?.id ?? encontrado?.id ?? null}
          focoId={encontrado?.id ?? null}
          destacarFoco
          mostrarLegenda
          aoClicarNo={aoClicarNo}
        >
          {/* Avisos flutuam sobre o grafo, sem empurrar o layout */}
          {aviso && (
            <div className="absolute top-3 left-1/2 flex max-w-[90%] -translate-x-1/2 items-center gap-2 rounded-full border bg-background/90 py-1.5 pr-1.5 pl-3 text-sm shadow-sm backdrop-blur">
              <CableIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{aviso}</span>
              <button type="button" aria-label="Fechar aviso" onClick={() => setAviso(null)} className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <XIcon className="size-3.5" />
              </button>
            </div>
          )}
          {busca.trim() && !encontrado && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full border bg-background/90 px-3 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur">
              Nenhuma nota encontrada
            </div>
          )}
        </GrafoConexoes>
      )}

      <Sheet open={assistenteAberto} onOpenChange={setAssistenteAberto}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Assistente de conexões</SheetTitle>
            <SheetDescription>Sugestões para deixar sua biblioteca mais conectada.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <AjudaConexoes biblioteca={biblioteca} />
          </div>
        </SheetContent>
      </Sheet>
    </Pagina>
  )
}
