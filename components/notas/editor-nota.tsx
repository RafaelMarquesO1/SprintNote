"use client"

import { useState } from "react"
import Link from "next/link"
import { useShallow } from "zustand/react/shallow"
import {
  BookIcon,
  CheckIcon,
  ChevronRightIcon,
  DownloadIcon,
  ImageIcon,
  MoreHorizontalIcon,
  NetworkIcon,
  Trash2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { Icone, iconesNota } from "@/components/icone"
import { CapaNota, DialogoCapa } from "@/components/notas/capa-nota"
import { DialogoExcluirNota } from "@/components/notas/dialogo-excluir-nota"
import { EditorNotas } from "@/components/notas/editor/editor-notas"
import { QuadroEditor } from "@/components/quadro/quadro-editor"
import { LinhaTags } from "@/components/notas/linha-tags"
import { PainelConexoes, useTotalConexoes } from "@/components/notas/painel-conexoes"
import { Interruptor, MiniaturasOpcoes, OpcoesLadoALado, PainelPersonalizar, SecaoPersonalizar, SeletorCores } from "@/components/painel-personalizar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useHidratado } from "@/hooks/use-hidratado"
import { useNotas } from "@/lib/estado/notas"
import { exportarNotaMarkdown } from "@/lib/exportar"
import type {
  AlturaCapa,
  AparenciaNota,
  Espacamento,
  FonteNota,
  FundoNota,
  LarguraNota,
  Nota,
  TamanhoTexto,
} from "@/lib/tipos"

// Notas pai até a nota atual (breadcrumb).
function obterCaminho(notas: Nota[], nota: Nota) {
  const caminho: Nota[] = []
  let atual = notas.find((item) => item.id === nota.paiId)
  while (atual && !caminho.includes(atual)) {
    caminho.unshift(atual)
    atual = notas.find((item) => item.id === atual?.paiId)
  }
  return caminho
}

export const classeFonte: Record<FonteNota, string> = {
  padrao: "font-sans",
  serifada: "font-serifada",
  mono: "font-mono",
  manuscrita: "font-manuscrita",
}

const tamanhoPx: Record<TamanhoTexto, number> = { pequeno: 14, normal: 16, grande: 18 }
const classeLargura: Record<LarguraNota, string> = {
  normal: "mx-auto max-w-3xl",
  larga: "mx-auto max-w-5xl",
  total: "max-w-none md:px-12",
}

// Cores de destaque (funcionam no claro e no escuro).
export const coresDestaque = [
  { id: "azul", nome: "Azul", valor: "oklch(0.6 0.15 255)" },
  { id: "verde", nome: "Verde", valor: "oklch(0.62 0.14 155)" },
  { id: "laranja", nome: "Laranja", valor: "oklch(0.68 0.16 55)" },
  { id: "roxo", nome: "Roxo", valor: "oklch(0.6 0.17 300)" },
  { id: "rosa", nome: "Rosa", valor: "oklch(0.65 0.17 350)" },
  { id: "vermelho", nome: "Vermelho", valor: "oklch(0.6 0.19 25)" },
  { id: "amarelo", nome: "Amarelo", valor: "oklch(0.75 0.14 90)" },
]

const opcoesFonte: { id: FonteNota; nome: string }[] = [
  { id: "padrao", nome: "Padrão" },
  { id: "serifada", nome: "Serifada" },
  { id: "mono", nome: "Mono" },
  { id: "manuscrita", nome: "Manuscrita" },
]
const opcoesFundo: { id: FundoNota; nome: string }[] = [
  { id: "nenhum", nome: "Nenhum" },
  { id: "papel", nome: "Papel" },
  { id: "pontilhado", nome: "Pontilhado" },
  { id: "quadriculado", nome: "Quadriculado" },
  { id: "pautado", nome: "Pautado (caderno)" },
]

// Lê a aparência já com os valores padrão (e com os campos antigos convertidos).
export function aparenciaCompleta(aparencia: AparenciaNota = {}) {
  return {
    capa: aparencia.capa ?? null,
    alturaCapa: aparencia.alturaCapa ?? ("media" as AlturaCapa),
    fonte: aparencia.fonte ?? ("padrao" as FonteNota),
    tamanho: aparencia.tamanho ?? (aparencia.textoPequeno ? "pequeno" : ("normal" as TamanhoTexto)),
    espacamento: aparencia.espacamento ?? ("normal" as Espacamento),
    largura: aparencia.largura ?? (aparencia.larguraTotal ? "total" : ("normal" as LarguraNota)),
    corDestaque: aparencia.corDestaque ?? null,
    fundo: aparencia.fundo ?? ("nenhum" as FundoNota),
    tituloCentralizado: Boolean(aparencia.tituloCentralizado),
    ocultarIcone: Boolean(aparencia.ocultarIcone),
  }
}

// Título editável: cada letra já atualiza a sidebar, o caminho e os
// [[links]] das outras notas.
function CampoTitulo({ nota, centralizado, aoConfirmar }: { nota: Nota; centralizado: boolean; aoConfirmar: () => void }) {
  const renomearNota = useNotas((estado) => estado.renomearNota)
  const [rascunho, setRascunho] = useState(nota.titulo === "Sem título" ? "" : nota.titulo)

  return (
    <textarea
      value={rascunho}
      rows={1}
      onChange={(evento) => {
        const valor = evento.target.value.replace(/\n/g, "")
        setRascunho(valor)
        // Campo vazio: espera a pessoa digitar algo (não renomeia para "").
        if (valor.trim()) renomearNota(nota.id, valor)
      }}
      onBlur={() => {
        if (!rascunho.trim()) renomearNota(nota.id, "Sem título")
      }}
      onKeyDown={(evento) => {
        // Enter no título desce para o texto, como no Notion.
        if (evento.key === "Enter" || evento.key === "ArrowDown") {
          evento.preventDefault()
          evento.currentTarget.blur()
          aoConfirmar()
        }
      }}
      autoFocus={nota.titulo === "Sem título" && !nota.conteudo}
      placeholder="Sem título"
      aria-label="Título da nota"
      className={cn(
        // Rafael Marques - 29/10/2026: título comprido (ou palavra enorme) quebra de linha em vez de cortar.
        "field-sizing-content block w-full max-w-full min-w-0 resize-none overflow-hidden bg-transparent [overflow-wrap:anywhere] break-words whitespace-pre-wrap text-[2.5em] leading-tight font-bold tracking-tight outline-none placeholder:text-muted-foreground/40",
        centralizado && "text-center"
      )}
    />
  )
}

// Rafael Marques - 21/10/2026
// Tela da nota: só capa, ícone, título, tags e texto. As conexões ficam num
// painel lateral (botão "Conexões") e a aparência no botão "Personalizar".
export function EditorNota({ id }: { id: string }) {
  const hidratado = useHidratado()
  const biblioteca = useNotas(useShallow((estado) => ({ notas: estado.notas, livros: estado.livros })))
  const nota = biblioteca.notas.find((item) => item.id === id)

  if (!hidratado) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 pt-16">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!nota) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 py-12 text-center">
        <h1 className="text-xl font-semibold">Nota não encontrada</h1>
        <p className="text-sm text-muted-foreground">Ela pode ter sido excluída.</p>
        <Button variant="outline" nativeButton={false} render={<Link href="/notas" />}>Ver a biblioteca</Button>
      </div>
    )
  }

  // Rafael Marques - 23/10/2026: quadros interativos têm tela própria.
  if (nota.tipo === "quadro") return <TelaQuadro key={nota.id} nota={nota} />
  return <TelaNota nota={nota} notas={biblioteca.notas} />
}

function MenuPersonalizar({ nota, aoEscolherCapa }: { nota: Nota; aoEscolherCapa: () => void }) {
  const atualizarAparencia = useNotas((estado) => estado.atualizarAparencia)
  const visual = aparenciaCompleta(nota.aparencia)
  const mudar = (mudancas: Partial<AparenciaNota>) => atualizarAparencia(nota.id, mudancas)

  return (
    <PainelPersonalizar
      titulo="Aparência da nota"
      descricao="As mudanças aparecem na hora."
      tamanhoBotao="sm"
      aoRestaurar={() =>
        atualizarAparencia(nota.id, {
          fonte: undefined, tamanho: undefined, espacamento: undefined, largura: undefined, corDestaque: undefined,
          fundo: undefined, tituloCentralizado: undefined, ocultarIcone: undefined, alturaCapa: undefined,
          textoPequeno: undefined, larguraTotal: undefined,
        })
      }
    >
      <SecaoPersonalizar titulo="Fonte">
        <MiniaturasOpcoes
          rotulo="Fonte"
          colunas={4}
          valor={visual.fonte}
          aoMudar={(fonte) => mudar({ fonte })}
          opcoes={opcoesFonte.map((opcao) => ({
            valor: opcao.id,
            rotulo: opcao.nome,
            previa: <span className={cn("text-xl", classeFonte[opcao.id], opcao.id === "manuscrita" && "text-2xl")}>Aa</span>,
          }))}
        />
      </SecaoPersonalizar>

      <SecaoPersonalizar titulo="Tamanho do texto">
        <OpcoesLadoALado
          rotulo="Tamanho do texto"
          valor={visual.tamanho}
          aoMudar={(tamanho) => mudar({ tamanho, textoPequeno: undefined })}
          opcoes={[
            { valor: "pequeno", rotulo: "Pequeno" },
            { valor: "normal", rotulo: "Normal" },
            { valor: "grande", rotulo: "Grande" },
          ]}
        />
      </SecaoPersonalizar>

      <SecaoPersonalizar titulo="Espaço entre linhas">
        <OpcoesLadoALado
          rotulo="Espaço entre linhas"
          valor={visual.espacamento}
          aoMudar={(espacamento) => mudar({ espacamento })}
          opcoes={[
            { valor: "compacto", rotulo: "Compacto" },
            { valor: "normal", rotulo: "Normal" },
            { valor: "amplo", rotulo: "Amplo" },
          ]}
        />
      </SecaoPersonalizar>

      <SecaoPersonalizar titulo="Largura">
        <OpcoesLadoALado
          rotulo="Largura"
          valor={visual.largura}
          aoMudar={(largura) => mudar({ largura, larguraTotal: undefined })}
          opcoes={[
            { valor: "normal", rotulo: "Normal" },
            { valor: "larga", rotulo: "Larga" },
            { valor: "total", rotulo: "Tela toda" },
          ]}
        />
      </SecaoPersonalizar>

      <SecaoPersonalizar titulo="Cor de destaque">
        <SeletorCores
          valor={visual.corDestaque}
          cores={coresDestaque.map((cor) => ({ valor: cor.valor, nome: cor.nome }))}
          aoMudar={(cor) => mudar({ corDestaque: cor ?? undefined })}
        />
        <p className="text-xs text-muted-foreground">Usada nas caixas de tarefa, marcadores, citações e links.</p>
      </SecaoPersonalizar>

      <SecaoPersonalizar titulo="Fundo da página">
        <MiniaturasOpcoes
          rotulo="Fundo da página"
          valor={visual.fundo}
          aoMudar={(fundo) => mudar({ fundo })}
          opcoes={opcoesFundo.map((opcao) => ({
            valor: opcao.id,
            rotulo: opcao.nome.replace(" (caderno)", ""),
            previa: <span className={cn("size-full text-[0.6rem]", opcao.id !== "nenhum" && `fundo-${opcao.id}`)} />,
          }))}
        />
      </SecaoPersonalizar>

      <SecaoPersonalizar titulo="Capa">
        <Button variant="outline" size="sm" className="w-full" onClick={aoEscolherCapa}>
          <ImageIcon /> {visual.capa ? "Trocar capa" : "Adicionar capa"}
        </Button>
        {visual.capa && (
          <OpcoesLadoALado
            rotulo="Altura da capa"
            valor={visual.alturaCapa}
            aoMudar={(alturaCapa) => mudar({ alturaCapa })}
            opcoes={[
              { valor: "baixa", rotulo: "Baixa" },
              { valor: "media", rotulo: "Média" },
              { valor: "alta", rotulo: "Alta" },
            ]}
          />
        )}
      </SecaoPersonalizar>

      <SecaoPersonalizar titulo="Cabeçalho">
        <Interruptor rotulo="Título centralizado" marcado={visual.tituloCentralizado} aoMudar={(marcado) => mudar({ tituloCentralizado: marcado })} />
        <Interruptor rotulo="Mostrar ícone" marcado={!visual.ocultarIcone} aoMudar={(marcado) => mudar({ ocultarIcone: !marcado })} />
      </SecaoPersonalizar>
    </PainelPersonalizar>
  )
}

function TelaNota({ nota, notas }: { nota: Nota; notas: Nota[] }) {
  const livros = useNotas((estado) => estado.livros)
  const atualizarNota = useNotas((estado) => estado.atualizarNota)
  const moverNota = useNotas((estado) => estado.moverNota)
  const totalConexoes = useTotalConexoes(nota)
  const [excluindo, setExcluindo] = useState(false)
  const [conexoesAbertas, setConexoesAbertas] = useState(false)
  const [escolhendoCapa, setEscolhendoCapa] = useState(false)
  const [pedidoFocoTexto, setPedidoFocoTexto] = useState(0)

  const livro = livros.find((item) => item.id === nota.livroId)
  const caminho = obterCaminho(notas, nota)
  const visual = aparenciaCompleta(nota.aparencia)
  const temCapa = Boolean(visual.capa)
  // A fonte manuscrita é mais miúda: ganha um pouco de tamanho.
  const tamanho = tamanhoPx[visual.tamanho] * (visual.fonte === "manuscrita" ? 1.4 : 1)

  return (
    <div className={cn("-mx-4 -mt-4 min-h-[calc(100svh-3rem)] md:-mx-6 md:-mt-6", visual.fundo !== "nenhum" && `fundo-${visual.fundo}`)}>
      {/* Barra fina: caminho à esquerda, ações à direita */}
      <div className="flex h-11 items-center gap-2 px-4 text-sm md:px-6">
        <nav aria-label="Caminho" className="flex min-w-0 flex-1 items-center gap-1 text-muted-foreground">
          {livro ? (
            // Rafael Marques - 22/10/2026: nome do livro encurta com "…" (antes passava por cima dos botões no celular)
            <Link href={`/livros/${livro.id}`} className="flex max-w-[60%] min-w-0 items-center gap-1 rounded px-1 hover:bg-muted hover:text-foreground">
              <Icone nome={livro.icone} className="size-3.5 shrink-0" /> <span className="truncate">{livro.titulo}</span>
            </Link>
          ) : (
            <Link href="/notas" className="shrink-0 rounded px-1 hover:bg-muted hover:text-foreground">Notas soltas</Link>
          )}
          {caminho.map((item) => (
            <span key={item.id} className="flex min-w-0 items-center gap-1">
              <ChevronRightIcon className="size-3.5 shrink-0" />
              <Link href={`/notas/${item.id}`} className="truncate rounded px-1 hover:bg-muted hover:text-foreground">{item.titulo}</Link>
            </span>
          ))}
          <ChevronRightIcon className="size-3.5 shrink-0" />
          <span className="truncate text-foreground">{nota.titulo}</span>
        </nav>

        <Button variant="ghost" size="sm" onClick={() => setConexoesAbertas(true)} className="text-muted-foreground">
          <NetworkIcon /> <span className="max-sm:hidden">Conexões</span>
          {totalConexoes > 0 && <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">{totalConexoes}</span>}
        </Button>

        <MenuPersonalizar nota={nota} aoEscolherCapa={() => setEscolhendoCapa(true)} />

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Mais opções" className="text-muted-foreground" />}>
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><BookIcon /> Mover para o livro</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-52">
                {livros.map((item) => (
                  <DropdownMenuItem key={item.id} onClick={() => moverNota(nota.id, item.id, null)}>
                    <Icone nome={item.icone} /> {item.titulo}
                    {item.id === nota.livroId && <CheckIcon className="ml-auto" />}
                  </DropdownMenuItem>
                ))}
                {livros.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={() => moverNota(nota.id, null, null)}>
                  Notas soltas {nota.livroId === null && <CheckIcon className="ml-auto" />}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onClick={() => exportarNotaMarkdown(nota)}>
              <DownloadIcon /> Exportar como Markdown
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setExcluindo(true)}>
              <Trash2Icon /> Excluir nota
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <p className="px-2 py-1 text-xs text-muted-foreground" suppressHydrationWarning>
              Editada em {new Date(nota.atualizadoEm).toLocaleString("pt-BR")}
            </p>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CapaNota key={JSON.stringify(visual.capa)} nota={nota} altura={visual.alturaCapa} aoTrocar={() => setEscolhendoCapa(true)} />

      {/* Documento */}
      <div
        className={cn("documento min-w-0 px-4 pb-24 md:px-6", classeLargura[visual.largura], classeFonte[visual.fonte])}
        data-destaque={visual.corDestaque ? "" : undefined}
        data-espacamento={visual.espacamento}
        style={{ fontSize: `${tamanho}px`, ...(visual.corDestaque ? ({ "--destaque": visual.corDestaque } as React.CSSProperties) : {}) }}
      >
        <div className={cn("group/cabecalho", temCapa && !visual.ocultarIcone ? "-mt-10" : "pt-10", visual.tituloCentralizado && "text-center")}>
          {!visual.ocultarIcone && (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Trocar ícone"
                className={cn(
                  "relative flex size-[4.5rem] items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-foreground",
                  temCapa ? "border bg-background shadow-sm" : "hover:bg-muted",
                  visual.tituloCentralizado && "mx-auto"
                )}
              >
                <Icone nome={nota.icone} className="size-10" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-auto">
                <div className="grid grid-cols-8 gap-0.5">
                  {iconesNota.map((icone) => (
                    <DropdownMenuItem key={icone} onClick={() => atualizarNota(nota.id, { icone })} className="justify-center" aria-label={icone}>
                      <Icone nome={icone} />
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Atalhos que aparecem ao passar o mouse, como no Notion */}
          <div className={cn("mt-2 flex h-7 gap-1 opacity-0 transition-opacity group-hover/cabecalho:opacity-100 focus-within:opacity-100", visual.tituloCentralizado && "justify-center")}>
            {!temCapa && (
              <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => setEscolhendoCapa(true)}>
                <ImageIcon /> Adicionar capa
              </Button>
            )}
          </div>

          <CampoTitulo key={nota.id} nota={nota} centralizado={visual.tituloCentralizado} aoConfirmar={() => setPedidoFocoTexto((valor) => valor + 1)} />
          <div className={cn("mt-3 font-sans text-sm", visual.tituloCentralizado && "flex justify-center")}>
            <LinhaTags nota={nota} />
          </div>
        </div>

        <div className="mt-5 md:-ml-14">
          {/* Rafael Marques - 23/10/2026: editor novo (texto formatado ao digitar, estilo Notion) */}
          <EditorNotas key={nota.id} nota={nota} pedidoFocoInicio={pedidoFocoTexto} />
        </div>
      </div>

      <Sheet open={conexoesAbertas} onOpenChange={setConexoesAbertas}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Conexões</SheetTitle>
            <SheetDescription>Tudo que liga “{nota.titulo}” ao resto da biblioteca.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <PainelConexoes nota={nota} aoFechar={() => setConexoesAbertas(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <DialogoCapa nota={nota} aberto={escolhendoCapa} aoMudarAberto={setEscolhendoCapa} />
      <DialogoExcluirNota nota={excluindo ? nota : null} aoMudarAberto={setExcluindo} />
    </div>
  )
}

// Rafael Marques - 23/10/2026
// Tela de um quadro (como o Canvas do Obsidian): título no topo e o quadro ocupando o resto.
function TelaQuadro({ nota }: { nota: Nota }) {
  const livros = useNotas((estado) => estado.livros)
  const renomearNota = useNotas((estado) => estado.renomearNota)
  const atualizarNota = useNotas((estado) => estado.atualizarNota)
  const moverNota = useNotas((estado) => estado.moverNota)
  const [excluindo, setExcluindo] = useState(false)
  const [titulo, setTitulo] = useState(nota.titulo === "Sem título" ? "" : nota.titulo)
  const livro = livros.find((item) => item.id === nota.livroId)

  return (
    <div className="-mx-4 -mt-4 flex h-[calc(100svh-3rem)] min-h-[28rem] flex-col md:-mx-6 md:-mt-6">
      <div className="flex h-12 shrink-0 items-center gap-2 px-4 text-sm md:px-6">
        <nav aria-label="Caminho" className="flex min-w-0 items-center gap-1 text-muted-foreground max-sm:hidden">
          {livro ? (
            <Link href={`/livros/${livro.id}`} className="flex max-w-40 min-w-0 items-center gap-1 rounded px-1 hover:bg-muted hover:text-foreground">
              <Icone nome={livro.icone} className="size-3.5 shrink-0" /> <span className="truncate">{livro.titulo}</span>
            </Link>
          ) : (
            <Link href="/notas" className="shrink-0 rounded px-1 hover:bg-muted hover:text-foreground">Notas soltas</Link>
          )}
          <ChevronRightIcon className="size-3.5 shrink-0" />
        </nav>
        <Icone nome={nota.icone} className="size-5 text-muted-foreground" />
        <input
          value={titulo}
          placeholder="Quadro sem título"
          aria-label="Título do quadro"
          onChange={(evento) => {
            setTitulo(evento.target.value)
            if (evento.target.value.trim()) renomearNota(nota.id, evento.target.value)
          }}
          onBlur={() => !titulo.trim() && renomearNota(nota.id, "Sem título")}
          className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground/50"
        />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Mais opções" className="text-muted-foreground" />}>
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><BookIcon /> Mover para o livro</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-52">
                {livros.map((item) => (
                  <DropdownMenuItem key={item.id} onClick={() => moverNota(nota.id, item.id, null)}>
                    <Icone nome={item.icone} /> {item.titulo}
                    {item.id === nota.livroId && <CheckIcon className="ml-auto" />}
                  </DropdownMenuItem>
                ))}
                {livros.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={() => moverNota(nota.id, null, null)}>
                  Notas soltas {nota.livroId === null && <CheckIcon className="ml-auto" />}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setExcluindo(true)}>
              <Trash2Icon /> Excluir quadro
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <p className="px-2 py-1 text-xs text-muted-foreground" suppressHydrationWarning>
              Editado em {new Date(nota.atualizadoEm).toLocaleString("pt-BR")}
            </p>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="min-h-0 flex-1 px-2 pb-2 md:px-4 md:pb-4">
        <QuadroEditor conteudo={nota.conteudo} notaId={nota.id} aoMudar={(conteudo) => atualizarNota(nota.id, { conteudo })} />
      </div>
      <DialogoExcluirNota nota={excluindo ? nota : null} aoMudarAberto={setExcluindo} />
    </div>
  )
}
