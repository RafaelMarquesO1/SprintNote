"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoldIcon,
  CheckIcon,
  CodeIcon,
  CopyIcon,
  FilePlusIcon,
  FileTextIcon,
  GripVerticalIcon,
  HashIcon,
  HighlighterIcon,
  InfoIcon,
  LightbulbIcon,
  OctagonAlertIcon,
  ItalicIcon,
  Link2Icon,
  LinkIcon,
  PlusIcon,
  RepeatIcon,
  StickyNoteIcon,
  StrikethroughIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { Icone } from "@/components/icone"
import { comandosEditor, filtrarComandos, textoInicialTabela, type ComandoEditor } from "@/components/notas/comandos-editor"
import {
  LARGURA_MENU,
  MenuFlutuante,
  detectarContexto,
  type ContextoMenu,
  type ItemMenu,
} from "@/components/notas/menu-insercao"
import { ConteudoMarkdown } from "@/components/notas/visualizacao-markdown"
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
import {
  blocosParaMarkdown,
  detectarAtalho,
  markdownParaBlocos,
  novoBloco,
  numerarBlocos,
  tiposLista,
  tiposTextoCru,
  variantesDestaque,
  type Bloco,
  type TipoBloco,
  type VarianteDestaque,
} from "@/lib/blocos"
import { useNotas } from "@/lib/estado/notas"
import { dadosNovaNota, resolverLink, sugerirLinks, type SugestaoLink } from "@/lib/links-wiki"
import { obterPosicaoCursor } from "@/lib/posicao-cursor"
import { linguagensSugeridas, nomeLinguagem, realcarCodigo } from "@/lib/realce-codigo"
import { contarTags } from "@/lib/tags"
import type { Nota } from "@/lib/tipos"

// Rafael Marques - 20/10/2026
// Editor em blocos, no estilo do Notion:
//  - cada parágrafo/título/item é um bloco que aparece formatado na hora;
//  - ao clicar, o bloco vira editável ali mesmo (sem tela separada de preview);
//  - atalhos de Markdown no começo do bloco ("# ", "- ", "[] ", "> ", "```", "---");
//  - "/" abre os blocos, "[[" abre as notas/livros, seleção mostra a barra de formatação;
//  - o ⋮⋮ ao lado do bloco transforma, move, duplica ou exclui.

type Cursor = number | "fim"
type Foco = { id: string; cursor: Cursor; pedido: number }

// Tamanhos em "em": seguem o tamanho de texto escolhido em "Personalizar".
const estiloTipo: Record<TipoBloco, string> = {
  paragrafo: "text-[1em] leading-[var(--linha,1.75)]",
  titulo1: "text-[1.875em] font-bold leading-tight tracking-tight",
  titulo2: "text-[1.5em] font-semibold leading-snug tracking-tight",
  titulo3: "text-[1.25em] font-semibold leading-snug",
  lista: "text-[1em] leading-[var(--linha,1.75)]",
  numerada: "text-[1em] leading-[var(--linha,1.75)]",
  tarefa: "text-[1em] leading-[var(--linha,1.75)]",
  citacao: "text-[1em] leading-[var(--linha,1.75)] italic text-muted-foreground",
  codigo: "font-mono text-[0.85em] leading-6 whitespace-pre",
  divisor: "",
  tabela: "font-mono text-[0.85em] leading-6",
  destaque: "text-[1em] leading-[var(--linha,1.75)]",
}

const espacoAntes: Partial<Record<TipoBloco, string>> = {
  titulo1: "mt-6",
  titulo2: "mt-5",
  titulo3: "mt-3",
  codigo: "my-1",
  tabela: "my-1",
  citacao: "my-1",
  destaque: "my-1.5",
}

const placeholders: Partial<Record<TipoBloco, string>> = {
  paragrafo: "Digite “/” para comandos, “[[” para linkar ou “#” para tags…",
  titulo1: "Título 1",
  titulo2: "Título 2",
  titulo3: "Título 3",
  lista: "Lista",
  numerada: "Lista",
  tarefa: "Tarefa",
  citacao: "Citação",
  codigo: "Código… (a linguagem é detectada sozinha)",
  destaque: "Escreva o destaque…",
}

const opcoesTransformar = comandosEditor.filter((comando) => comando.tipo && comando.tipo !== "divisor")

const iconesDestaque: Record<VarianteDestaque, React.ElementType> = {
  info: InfoIcon,
  dica: LightbulbIcon,
  aviso: TriangleAlertIcon,
  perigo: OctagonAlertIcon,
  nota: StickyNoteIcon,
}

const nomesDestaque: Record<VarianteDestaque, string> = {
  info: "Informação",
  dica: "Dica",
  aviso: "Aviso",
  perigo: "Perigo",
  nota: "Nota",
}

// Converte a posição de um clique no texto formatado para a posição no Markdown
// (pulando **, *, `, ~~ e a parte escondida dos links).
function posicaoNaFonte(texto: string, alvo: number) {
  const marcas = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\[([^\]]*)\]\([^)]*\)|\*\*|__|~~|[*_`]/y
  let visivel = 0
  let i = 0
  while (i < texto.length) {
    marcas.lastIndex = i
    const encontrado = marcas.exec(texto)
    if (encontrado) {
      let rotulo: string | null = null
      let inicioRotulo = 0
      if (encontrado[0].startsWith("[[")) {
        rotulo = encontrado[2] ?? encontrado[1].split("/").pop() ?? ""
        inicioRotulo = encontrado[2] ? i + 3 + encontrado[1].length : i + 2 + encontrado[1].length - rotulo.length
      } else if (encontrado[3] !== undefined) {
        rotulo = encontrado[3]
        inicioRotulo = i + 1
      }
      if (rotulo !== null) {
        if (alvo <= visivel + rotulo.length) return inicioRotulo + (alvo - visivel)
        visivel += rotulo.length
      }
      i += encontrado[0].length
      continue
    }
    if (visivel >= alvo) return i
    visivel++
    i++
  }
  return texto.length
}

function deslocamentoVisivel(container: HTMLElement, x: number, y: number) {
  type ComPosicao = Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
  }
  const doc = document as ComPosicao
  let no: Node | null = null
  let deslocamento = 0
  const posicao = doc.caretPositionFromPoint?.(x, y)
  if (posicao) {
    no = posicao.offsetNode
    deslocamento = posicao.offset
  } else {
    const faixa = document.caretRangeFromPoint?.(x, y)
    if (faixa) {
      no = faixa.startContainer
      deslocamento = faixa.startOffset
    }
  }
  if (!no || !container.contains(no)) return null
  const faixa = document.createRange()
  faixa.setStart(container, 0)
  faixa.setEnd(no, deslocamento)
  return faixa.toString().length
}

type Acoes = {
  mudarTexto: (id: string, texto: string, cursor: number) => void
  atualizar: (id: string, mudancas: Partial<Bloco>) => void
  enter: (id: string, antes: string, depois: string) => void
  backspaceInicio: (id: string) => void
  juntarProximo: (id: string) => void
  navegar: (id: string, direcao: -1 | 1) => void
  recuar: (id: string, delta: number) => void
  mover: (id: string, delta: number) => void
  duplicar: (id: string) => void
  excluir: (id: string) => void
  transformar: (id: string, tipo: TipoBloco) => void
  inserirDepois: (id: string, texto?: string) => void
  aplicarComando: (id: string, comando: ComandoEditor, contexto: ContextoMenu, cursor: number) => void
  ativar: (id: string, cursor: Cursor) => void
  desativar: (id: string) => void
}

type ItemBloco = ItemMenu &
  (
    | { tipo: "comando"; comando: ComandoEditor }
    | { tipo: "link"; sugestao: SugestaoLink }
    | { tipo: "tag"; tag: string }
  )

// Barra de formatação que aparece ao selecionar texto.
function BarraFormatacao({ posicao, aoFormatar }: { posicao: { topo: number; esquerda: number }; aoFormatar: (acao: string) => void }) {
  const botoes = [
    { acao: "negrito", icone: BoldIcon, rotulo: "Negrito (Ctrl+B)" },
    { acao: "italico", icone: ItalicIcon, rotulo: "Itálico (Ctrl+I)" },
    { acao: "riscado", icone: StrikethroughIcon, rotulo: "Riscado (Ctrl+Shift+X)" },
    { acao: "codigo", icone: CodeIcon, rotulo: "Código (Ctrl+E)" },
    { acao: "marca", icone: HighlighterIcon, rotulo: "Marca-texto (Ctrl+Shift+H)" },
    { acao: "nota", icone: Link2Icon, rotulo: "Transformar em link de nota [[ ]]" },
    { acao: "url", icone: LinkIcon, rotulo: "Link para site" },
  ]
  return (
    <div
      role="toolbar"
      aria-label="Formatação"
      className="absolute z-30 flex -translate-y-full gap-0.5 rounded-lg bg-popover p-1 shadow-lg ring-1 ring-foreground/10"
      style={{ top: posicao.topo - 6, left: posicao.esquerda }}
    >
      {botoes.map((botao) => (
        <button
          key={botao.acao}
          type="button"
          title={botao.rotulo}
          aria-label={botao.rotulo}
          onMouseDown={(evento) => evento.preventDefault()}
          onClick={() => aoFormatar(botao.acao)}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <botao.icone className="size-4" />
        </button>
      ))}
    </div>
  )
}

function BlocoEditavel({
  bloco,
  numero,
  foco,
  nota,
  acoes,
}: {
  bloco: Bloco
  numero: number
  foco: Foco | null
  nota: Nota
  acoes: Acoes
}) {
  const campoRef = useRef<HTMLTextAreaElement>(null)
  const textoRef = useRef<HTMLDivElement>(null)
  // Seleção a aplicar depois que o React atualizar o texto (formatação, menus).
  const selecaoPendente = useRef<[number, number] | null>(null)
  const ultimoPedido = useRef<number | null>(null)

  const [contexto, setContexto] = useState<ContextoMenu | null>(null)
  const [dispensadoEm, setDispensadoEm] = useState<number | null>(null)
  const [indiceAtivo, setIndiceAtivo] = useState(0)
  const [posicaoMenu, setPosicaoMenu] = useState({ topo: 0, esquerda: 0 })
  const [selecao, setSelecao] = useState<{ topo: number; esquerda: number } | null>(null)

  const biblioteca = useNotas(useShallow((estado) => ({ notas: estado.notas, livros: estado.livros })))
  const criarNota = useNotas((estado) => estado.criarNota)

  const ativo = foco !== null

  function analisar() {
    const campo = campoRef.current
    if (!campo) return
    const { selectionStart: inicio, selectionEnd: fim, value } = campo
    const novo = inicio === fim && !tiposTextoCru.includes(bloco.tipo) ? detectarContexto(value, inicio) : null
    if (contexto?.modo !== novo?.modo || contexto?.inicio !== novo?.inicio || contexto?.consulta !== novo?.consulta) {
      setIndiceAtivo(0)
    }
    setContexto(novo)
    if (!novo) setDispensadoEm(null)
    else {
      const medida = obterPosicaoCursor(campo, novo.inicio)
      setPosicaoMenu({ topo: medida.topo + medida.alturaLinha + 4, esquerda: Math.max(0, Math.min(medida.esquerda, campo.clientWidth - LARGURA_MENU)) })
    }
    if (inicio !== fim && !tiposTextoCru.includes(bloco.tipo)) {
      const medida = obterPosicaoCursor(campo, inicio)
      setSelecao({ topo: medida.topo, esquerda: Math.max(0, Math.min(medida.esquerda, campo.clientWidth - 220)) })
    } else {
      setSelecao(null)
    }
  }

  // Foco vindo de fora (Enter, setas, clique): posiciona o cursor.
  useLayoutEffect(() => {
    const campo = campoRef.current
    if (!campo) return
    if (foco && foco.pedido !== ultimoPedido.current) {
      ultimoPedido.current = foco.pedido
      const posicao = foco.cursor === "fim" ? campo.value.length : Math.min(foco.cursor, campo.value.length)
      campo.focus()
      campo.setSelectionRange(posicao, posicao)
      analisar()
    }
    if (selecaoPendente.current) {
      const [inicio, fim] = selecaoPendente.current
      selecaoPendente.current = null
      campo.focus()
      campo.setSelectionRange(inicio, fim)
      analisar()
    }
  })

  function trocarTexto(texto: string, inicio: number, fim = inicio) {
    selecaoPendente.current = [inicio, fim]
    acoes.mudarTexto(bloco.id, texto, inicio)
  }

  function formatar(acao: string) {
    const campo = campoRef.current
    if (!campo) return
    const { selectionStart: inicio, selectionEnd: fim, value } = campo
    const selecionado = value.slice(inicio, fim)
    const envolver = (abre: string, fecha = abre) => {
      // Se já está formatado, remove a formatação.
      if (value.slice(inicio - abre.length, inicio) === abre && value.slice(fim, fim + fecha.length) === fecha) {
        trocarTexto(value.slice(0, inicio - abre.length) + selecionado + value.slice(fim + fecha.length), inicio - abre.length, fim - abre.length)
        return
      }
      trocarTexto(value.slice(0, inicio) + abre + selecionado + fecha + value.slice(fim), inicio + abre.length, fim + abre.length)
    }
    if (acao === "negrito") envolver("**")
    else if (acao === "italico") envolver("*")
    else if (acao === "riscado") envolver("~~")
    else if (acao === "codigo") envolver("`")
    else if (acao === "marca") envolver("==")
    else if (acao === "nota") {
      // Cria a nota se ela ainda não existir.
      if (selecionado.trim() && !resolverLink(selecionado, biblioteca, nota.livroId)) {
        criarNota(dadosNovaNota(selecionado.trim(), biblioteca, nota.livroId))
      }
      envolver("[[", "]]")
    } else if (acao === "url") {
      const texto = `[${selecionado || "texto"}](https://)`
      const posicaoUrl = inicio + texto.length - 1
      trocarTexto(value.slice(0, inicio) + texto + value.slice(fim), posicaoUrl - 8, posicaoUrl)
    }
  }

  let itens: ItemBloco[] = []
  if (contexto?.modo === "comando") {
    itens = filtrarComandos(contexto.consulta, true).map((comando) => ({
      tipo: "comando",
      comando,
      chave: comando.id,
      rotulo: comando.rotulo,
      descricao: comando.descricao,
      atalho: comando.atalho,
      icone: <comando.icone className="size-4" />,
    }))
  } else if (contexto?.modo === "link") {
    itens = sugerirLinks(biblioteca, contexto.consulta, { notaId: nota.id, livroId: nota.livroId }).map((sugestao) => ({
      tipo: "link",
      sugestao,
      chave: sugestao.chave,
      rotulo: sugestao.rotulo,
      descricao: sugestao.detalhe,
      icone: sugestao.criar ? <FilePlusIcon className="size-4" /> : <Icone nome={sugestao.icone} />,
    }))
  }
  if (contexto?.modo === "tag") {
    const procurada = contexto.consulta.toLowerCase()
    const existentes = contarTags(biblioteca.notas)
      .filter(({ tag }) => tag.includes(procurada) && tag !== procurada)
      .slice(0, 6)
    itens = existentes.map(({ tag, total }) => ({
      tipo: "tag",
      tag,
      chave: `tag-${tag}`,
      rotulo: `#${tag}`,
      descricao: `${total} nota(s)`,
      icone: <HashIcon className="size-4" />,
    }))
  }
  const menuVisivel = ativo && contexto !== null && contexto.inicio !== dispensadoEm && itens.length > 0

  function escolher(item: ItemBloco | undefined) {
    const campo = campoRef.current
    if (!item || !contexto || !campo) return
    const cursor = campo.selectionStart
    if (item.tipo === "comando") {
      acoes.aplicarComando(bloco.id, item.comando, contexto, cursor)
      setContexto(null)
      return
    }
    if (item.tipo === "tag") {
      const valor = campo.value
      const texto = `#${item.tag} `
      trocarTexto(valor.slice(0, contexto.inicio) + texto + valor.slice(cursor), contexto.inicio + texto.length)
      return
    }
    const { sugestao } = item
    if (sugestao.criar) criarNota(dadosNovaNota(sugestao.alvo, biblioteca, nota.livroId))
    const valor = campo.value
    const fim = valor.slice(cursor).startsWith("]]") ? cursor + 2 : cursor
    const link = `[[${sugestao.alvo}]]`
    trocarTexto(valor.slice(0, contexto.inicio) + link + valor.slice(fim), contexto.inicio + link.length)
  }

  function aoPressionarTecla(evento: React.KeyboardEvent<HTMLTextAreaElement>) {
    const campo = evento.currentTarget
    const { selectionStart: inicio, selectionEnd: fim, value } = campo
    const semSelecao = inicio === fim
    const ctrl = evento.ctrlKey || evento.metaKey

    if (menuVisivel && contexto) {
      if (evento.key === "ArrowDown") {
        evento.preventDefault()
        setIndiceAtivo((indice) => (indice + 1) % itens.length)
        return
      }
      if (evento.key === "ArrowUp") {
        evento.preventDefault()
        setIndiceAtivo((indice) => (indice - 1 + itens.length) % itens.length)
        return
      }
      if (evento.key === "Enter" || evento.key === "Tab") {
        evento.preventDefault()
        escolher(itens[Math.min(indiceAtivo, itens.length - 1)])
        return
      }
      if (evento.key === "Escape") {
        evento.preventDefault()
        setDispensadoEm(contexto.inicio)
        return
      }
    }

    if (ctrl && !evento.shiftKey && ["b", "i", "e"].includes(evento.key.toLowerCase()) && !tiposTextoCru.includes(bloco.tipo)) {
      evento.preventDefault()
      formatar({ b: "negrito", i: "italico", e: "codigo" }[evento.key.toLowerCase()] as string)
      return
    }
    if (ctrl && evento.shiftKey && evento.key.toLowerCase() === "x") {
      evento.preventDefault()
      formatar("riscado")
      return
    }
    if (ctrl && evento.shiftKey && evento.key.toLowerCase() === "h" && !tiposTextoCru.includes(bloco.tipo)) {
      evento.preventDefault()
      formatar("marca")
      return
    }
    if (evento.altKey && evento.shiftKey && (evento.key === "ArrowUp" || evento.key === "ArrowDown")) {
      evento.preventDefault()
      acoes.mover(bloco.id, evento.key === "ArrowUp" ? -1 : 1)
      return
    }

    if (evento.key === "Enter" && !evento.shiftKey) {
      // Em código e tabela, Enter quebra linha; Ctrl+Enter sai do bloco.
      if (tiposTextoCru.includes(bloco.tipo) && !ctrl) return
      evento.preventDefault()
      acoes.enter(bloco.id, value.slice(0, inicio), value.slice(fim))
      return
    }
    if (evento.key === "Backspace" && inicio === 0 && fim === 0) {
      evento.preventDefault()
      acoes.backspaceInicio(bloco.id)
      return
    }
    if (evento.key === "Delete" && semSelecao && inicio === value.length) {
      evento.preventDefault()
      acoes.juntarProximo(bloco.id)
      return
    }
    if (evento.key === "Tab") {
      evento.preventDefault()
      if (tiposLista.includes(bloco.tipo)) acoes.recuar(bloco.id, evento.shiftKey ? -1 : 1)
      else if (bloco.tipo === "codigo") trocarTexto(value.slice(0, inicio) + "  " + value.slice(fim), inicio + 2)
      return
    }
    if (evento.key === "ArrowUp" && semSelecao) {
      const medida = obterPosicaoCursor(campo, inicio)
      if (medida.topo < medida.alturaLinha) {
        evento.preventDefault()
        acoes.navegar(bloco.id, -1)
      }
      return
    }
    if (evento.key === "ArrowDown" && semSelecao) {
      const atual = obterPosicaoCursor(campo, inicio)
      const ultima = obterPosicaoCursor(campo, value.length)
      if (atual.topo >= ultima.topo) {
        evento.preventDefault()
        acoes.navegar(bloco.id, 1)
      }
      return
    }
    if (evento.key === "ArrowLeft" && semSelecao && inicio === 0) {
      evento.preventDefault()
      acoes.navegar(bloco.id, -1)
      return
    }
    if (evento.key === "ArrowRight" && semSelecao && inicio === value.length) {
      evento.preventDefault()
      acoes.navegar(bloco.id, 1)
      return
    }
    if (evento.key === "Escape") campo.blur()
  }

  function ativarPeloClique(evento: React.MouseEvent) {
    if (ativo) return
    const container = textoRef.current
    const visivel = container ? deslocamentoVisivel(container, evento.clientX, evento.clientY) : null
    acoes.ativar(bloco.id, visivel === null ? "fim" : posicaoNaFonte(bloco.texto, visivel))
  }

  // ----- Marcador à esquerda (bolinha, número, caixa de tarefa) -----
  let marcador: React.ReactNode = null
  if (bloco.tipo === "lista") {
    marcador = <span className="flex h-[calc(var(--linha,1.75)*1em)] w-6 shrink-0 items-center justify-center text-[1.1em] leading-none text-(--destaque-suave)">•</span>
  } else if (bloco.tipo === "numerada") {
    marcador = <span className="flex h-[calc(var(--linha,1.75)*1em)] min-w-6 shrink-0 items-center justify-end pr-1.5 text-(--destaque-suave) tabular-nums">{numero}.</span>
  } else if (bloco.tipo === "tarefa") {
    marcador = (
      <span className="flex h-[calc(var(--linha,1.75)*1em)] w-6 shrink-0 items-center">
        <button
          type="button"
          role="checkbox"
          aria-checked={bloco.marcado}
          aria-label="Marcar tarefa"
          onMouseDown={(evento) => evento.preventDefault()}
          onClick={() => acoes.atualizar(bloco.id, { marcado: !bloco.marcado })}
          className={cn(
            "flex size-4 items-center justify-center rounded border-[1.5px] transition-colors",
            bloco.marcado ? "border-(--destaque) bg-(--destaque) text-(--destaque-texto)" : "border-muted-foreground/50 hover:border-(--destaque)"
          )}
        >
          {bloco.marcado && <CheckIcon className="size-3" strokeWidth={3} />}
        </button>
      </span>
    )
  }

  // ----- Conteúdo: editável (ativo) ou formatado -----
  const propsCampo = {
    ref: campoRef,
    value: bloco.texto,
    rows: 1,
    spellCheck: !tiposTextoCru.includes(bloco.tipo),
    placeholder: placeholders[bloco.tipo],
    "aria-label": bloco.tipo === "codigo" ? "Código" : "Bloco de texto",
    onChange: (evento: React.ChangeEvent<HTMLTextAreaElement>) => {
      acoes.mudarTexto(bloco.id, evento.target.value, evento.target.selectionStart)
      analisar()
    },
    onSelect: analisar,
    onKeyUp: analisar,
    onKeyDown: aoPressionarTecla,
    onBlur: () => {
      setContexto(null)
      setSelecao(null)
      acoes.desativar(bloco.id)
    },
  }
  const realce = bloco.tipo === "codigo" ? realcarCodigo(bloco.texto, bloco.linguagem) : null
  const variante: VarianteDestaque = bloco.variante ?? "info"
  const IconeDestaque = iconesDestaque[variante]

  let conteudo: React.ReactNode
  if (bloco.tipo === "divisor") {
    conteudo = (
      <button
        type="button"
        aria-label="Divisor (Backspace exclui, Enter cria um bloco abaixo)"
        className="block w-full py-3 outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring/40"
        onKeyDown={(evento) => {
          if (evento.key === "Backspace" || evento.key === "Delete") acoes.excluir(bloco.id)
          else if (evento.key === "Enter") acoes.inserirDepois(bloco.id)
          else if (evento.key === "ArrowUp") acoes.navegar(bloco.id, -1)
          else if (evento.key === "ArrowDown") acoes.navegar(bloco.id, 1)
          else return
          evento.preventDefault()
        }}
      >
        <hr className="border-border" />
      </button>
    )
  } else if (bloco.tipo === "codigo") {
    // Duas camadas: o código colorido embaixo e o campo de texto transparente
    // por cima — as cores aparecem enquanto se digita.
    conteudo = (
      <div className="relative">
        <pre
          aria-hidden={ativo}
          onClick={ativo ? undefined : () => acoes.ativar(bloco.id, "fim")}
          className={cn(estiloTipo.codigo, "codigo-realce m-0 min-h-6 break-words whitespace-pre-wrap", !ativo && "cursor-text")}
          dangerouslySetInnerHTML={{
            __html:
              (realce?.html || (ativo ? "" : '<span class="text-muted-foreground/60">Código… (a linguagem é detectada sozinha)</span>')) + "\n",
          }}
        />
        {ativo && (
          <textarea
            {...propsCampo}
            className={cn(
              estiloTipo.codigo,
              "absolute inset-0 size-full resize-none overflow-hidden bg-transparent p-0 break-words whitespace-pre-wrap text-transparent caret-foreground outline-none selection:bg-primary/25 placeholder:text-muted-foreground/60"
            )}
          />
        )}
      </div>
    )
  } else if (ativo) {
    conteudo = (
      <textarea
        {...propsCampo}
        className={cn(
          "field-sizing-content block w-full resize-none overflow-y-hidden bg-transparent p-0 outline-none placeholder:text-muted-foreground/60",
          estiloTipo[bloco.tipo],
          bloco.tipo === "tarefa" && bloco.marcado && "text-muted-foreground line-through"
        )}
      />
    )
  } else if (bloco.tipo === "tabela") {
    conteudo = (
      <div className="markdown cursor-text" onClick={() => acoes.ativar(bloco.id, "fim")}>
        <ConteudoMarkdown texto={bloco.texto} livroId={nota.livroId} />
      </div>
    )
  } else {
    conteudo = (
      <div
        ref={textoRef}
        onClick={ativarPeloClique}
        className={cn(
          "markdown-inline min-h-[calc(var(--linha,1.75)*1em)] cursor-text break-words whitespace-pre-wrap",
          estiloTipo[bloco.tipo],
          bloco.tipo === "tarefa" && bloco.marcado && "text-muted-foreground line-through"
        )}
      >
        {bloco.texto ? <ConteudoMarkdown texto={bloco.texto} livroId={nota.livroId} inline /> : "​"}
      </div>
    )
  }

  const caixaCodigo = bloco.tipo === "codigo" || bloco.tipo === "tabela"

  return (
    <div
      data-bloco={bloco.id}
      className={cn("group/bloco relative flex items-start", espacoAntes[bloco.tipo])}
      style={{ paddingLeft: tiposLista.includes(bloco.tipo) ? bloco.nivel * 24 : 0 }}
    >
      {/* Alça do bloco: + adiciona abaixo, ⋮⋮ abre as ações */}
      <div
        className={cn(
          "absolute top-0 -left-14 flex h-7 items-center gap-0.5 opacity-0 transition-opacity group-hover/bloco:opacity-100 has-aria-expanded:opacity-100 max-md:hidden",
          bloco.tipo === "titulo1" && "h-10",
          bloco.tipo === "titulo2" && "h-8"
        )}
      >
        <button
          type="button"
          title="Adicionar bloco abaixo"
          aria-label="Adicionar bloco abaixo"
          onClick={() => acoes.inserirDepois(bloco.id, "/")}
          className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted"
        >
          <PlusIcon className="size-4" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Ações do bloco"
            title="Ações do bloco"
            className="flex size-6 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-muted"
          >
            <GripVerticalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <RepeatIcon /> Transformar em
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                {opcoesTransformar.map((opcao) => (
                  <DropdownMenuItem key={opcao.id} onClick={() => acoes.transformar(bloco.id, opcao.tipo as TipoBloco)}>
                    <opcao.icone /> {opcao.rotulo}
                    {bloco.tipo === opcao.tipo && <CheckIcon className="ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onClick={() => acoes.mover(bloco.id, -1)}>
              <ArrowUpIcon /> Mover para cima
              <span className="ml-auto text-xs text-muted-foreground">Alt+Shift+↑</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => acoes.mover(bloco.id, 1)}>
              <ArrowDownIcon /> Mover para baixo
              <span className="ml-auto text-xs text-muted-foreground">Alt+Shift+↓</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => acoes.duplicar(bloco.id)}>
              <CopyIcon /> Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => acoes.excluir(bloco.id)}>
              <Trash2Icon /> Excluir bloco
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {marcador}
      <div
        className={cn(
          "relative min-w-0 flex-1",
          bloco.tipo === "citacao" && "border-l-[3px] border-(--destaque-borda) pl-4",
          caixaCodigo && "rounded-lg bg-muted/60 px-4 py-3",
          bloco.tipo === "codigo" && "pt-8",
          bloco.tipo === "codigo" && ativo && "ring-1 ring-border",
          bloco.tipo === "destaque" && `destaque destaque-${variante} rounded-lg py-3 pr-4 pl-12`
        )}
      >
        {bloco.tipo === "destaque" && (
          <button
            type="button"
            title={`${nomesDestaque[variante]} — clique para trocar o tipo`}
            aria-label={`Destaque do tipo ${nomesDestaque[variante]}. Clique para trocar.`}
            onMouseDown={(evento) => evento.preventDefault()}
            onClick={() =>
              acoes.atualizar(bloco.id, {
                variante: variantesDestaque[(variantesDestaque.indexOf(variante) + 1) % variantesDestaque.length],
              })
            }
            className="destaque-icone absolute top-3 left-3.5 flex size-6 items-center justify-center rounded-md hover:bg-foreground/10"
          >
            <IconeDestaque className="size-4" />
          </button>
        )}
        {bloco.tipo === "codigo" && (
          <div className="absolute top-1.5 right-2 left-4 flex items-center justify-between gap-2 font-mono text-xs text-muted-foreground">
            <input
              value={bloco.linguagem}
              list="linguagens-codigo"
              onChange={(evento) => acoes.atualizar(bloco.id, { linguagem: evento.target.value.replace(/\s/g, "") })}
              placeholder={realce?.detectada && realce.linguagem ? `${nomeLinguagem(realce.linguagem)} (detectada)` : "linguagem"}
              aria-label="Linguagem do código"
              className="w-48 bg-transparent outline-none placeholder:text-muted-foreground/70"
            />
            <datalist id="linguagens-codigo">
              {linguagensSugeridas.map((item) => <option key={item} value={item} />)}
            </datalist>
            <button
              type="button"
              title="Copiar código"
              aria-label="Copiar código"
              onMouseDown={(evento) => evento.preventDefault()}
              onClick={() => navigator.clipboard?.writeText(bloco.texto)}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-foreground/10 hover:text-foreground"
            >
              <CopyIcon className="size-3.5" /> Copiar
            </button>
          </div>
        )}
        {conteudo}
        {menuVisivel && contexto && (
          <MenuFlutuante
            titulo={
              contexto.modo === "comando" ? "Blocos" : contexto.modo === "tag" ? "Tags usadas" : (
                <span className="inline-flex items-center gap-1"><FileTextIcon className="size-3" /> Linkar nota ou livro</span>
              )
            }
            itens={itens}
            indiceAtivo={indiceAtivo}
            posicao={posicaoMenu}
            aoEscolher={escolher}
            aoPassar={setIndiceAtivo}
          />
        )}
        {ativo && selecao && !menuVisivel && <BarraFormatacao posicao={selecao} aoFormatar={formatar} />}
      </div>
    </div>
  )
}

// Garante pelo menos um bloco para o usuário começar a escrever.
function comBlocoInicial(blocos: Bloco[]) {
  return blocos.length > 0 ? blocos : [novoBloco()]
}

export function EditorBlocos({ nota, pedidoFocoInicio = 0 }: { nota: Nota; pedidoFocoInicio?: number }) {
  const atualizarNota = useNotas((estado) => estado.atualizarNota)
  const [estado, setEstado] = useState(() => ({ blocos: comBlocoInicial(markdownParaBlocos(nota.conteudo)), markdown: nota.conteudo }))
  const [foco, setFoco] = useState<Foco | null>(null)
  const contadorFoco = useRef(0)

  // O conteúdo mudou por fora (modo Markdown, renomear links...): remonta os blocos.
  if (nota.conteudo !== estado.markdown) {
    setEstado({ blocos: comBlocoInicial(markdownParaBlocos(nota.conteudo)), markdown: nota.conteudo })
  }

  // Enter no título: começa a escrever no primeiro bloco.
  const [ultimoPedidoTitulo, setUltimoPedidoTitulo] = useState(pedidoFocoInicio)
  if (pedidoFocoInicio !== ultimoPedidoTitulo) {
    setUltimoPedidoTitulo(pedidoFocoInicio)
    // Pedido negativo: nunca coincide com os pedidos do contador interno.
    if (estado.blocos[0]) setFoco({ id: estado.blocos[0].id, cursor: 0, pedido: -pedidoFocoInicio })
  }

  const blocos = estado.blocos
  const numeros = numerarBlocos(blocos)

  function salvar(proximos: Bloco[]) {
    const markdown = blocosParaMarkdown(proximos)
    setEstado({ blocos: proximos, markdown })
    if (markdown !== nota.conteudo) atualizarNota(nota.id, { conteudo: markdown })
  }

  function focar(id: string, cursor: Cursor) {
    contadorFoco.current += 1
    setFoco({ id, cursor, pedido: contadorFoco.current })
  }

  const indiceDe = (id: string) => blocos.findIndex((bloco) => bloco.id === id)
  const comMudanca = (id: string, mudancas: Partial<Bloco>) =>
    blocos.map((bloco) => (bloco.id === id ? { ...bloco, ...mudancas } : bloco))

  const acoes: Acoes = {
    mudarTexto(id, texto, cursor) {
      const bloco = blocos[indiceDe(id)]
      if (!bloco) return
      // Atalhos de Markdown: só em parágrafos (como no Notion).
      const atalho = bloco.tipo === "paragrafo" ? detectarAtalho(texto) : null
      if (atalho) {
        if (atalho.tipo === "divisor") {
          const novo = novoBloco()
          const indice = indiceDe(id)
          const proximos = comMudanca(id, { tipo: "divisor", texto: "" })
          proximos.splice(indice + 1, 0, novo)
          salvar(proximos)
          focar(novo.id, 0)
          return
        }
        salvar(comMudanca(id, { tipo: atalho.tipo, texto: atalho.resto, marcado: atalho.marcado ?? false, linguagem: atalho.linguagem ?? "" }))
        focar(id, Math.max(0, cursor - (texto.length - atalho.resto.length)))
        return
      }
      salvar(comMudanca(id, { texto }))
    },

    atualizar(id, mudancas) {
      salvar(comMudanca(id, mudancas))
    },

    enter(id, antes, depois) {
      const indice = indiceDe(id)
      const bloco = blocos[indice]
      const ehLista = tiposLista.includes(bloco.tipo)
      // Enter num item de lista vazio sai da lista.
      if ((ehLista || bloco.tipo === "citacao" || bloco.tipo === "destaque") && !antes && !depois) {
        if (ehLista && bloco.nivel > 0) salvar(comMudanca(id, { nivel: bloco.nivel - 1 }))
        else salvar(comMudanca(id, { tipo: "paragrafo", nivel: 0, marcado: false }))
        focar(id, 0)
        return
      }
      const tipoNovo: TipoBloco = ehLista ? bloco.tipo : "paragrafo"
      const proximos = [...blocos]
      // Enter no começo de um bloco com texto: abre um bloco vazio acima.
      if (!antes && depois) {
        proximos.splice(indice, 0, novoBloco(tipoNovo, "", { nivel: ehLista ? bloco.nivel : 0 }))
        salvar(proximos)
        focar(id, 0)
        return
      }
      const novo = novoBloco(tipoNovo, depois, { nivel: ehLista ? bloco.nivel : 0 })
      proximos[indice] = { ...bloco, texto: antes }
      proximos.splice(indice + 1, 0, novo)
      salvar(proximos)
      focar(novo.id, 0)
    },

    backspaceInicio(id) {
      const indice = indiceDe(id)
      const bloco = blocos[indice]
      if (tiposLista.includes(bloco.tipo) && bloco.nivel > 0) {
        salvar(comMudanca(id, { nivel: bloco.nivel - 1 }))
        focar(id, 0)
        return
      }
      if (bloco.tipo !== "paragrafo") {
        salvar(comMudanca(id, { tipo: "paragrafo", nivel: 0, marcado: false }))
        focar(id, 0)
        return
      }
      if (indice === 0) return
      const anterior = blocos[indice - 1]
      if (anterior.tipo === "divisor") {
        salvar(blocos.filter((item) => item.id !== anterior.id))
        focar(id, 0)
        return
      }
      if (tiposTextoCru.includes(anterior.tipo)) {
        if (!bloco.texto) salvar(blocos.filter((item) => item.id !== id))
        focar(anterior.id, "fim")
        return
      }
      // Junta com o bloco de cima, como no Notion.
      const proximos = blocos
        .filter((item) => item.id !== id)
        .map((item) => (item.id === anterior.id ? { ...item, texto: item.texto + bloco.texto } : item))
      salvar(proximos)
      focar(anterior.id, anterior.texto.length)
    },

    juntarProximo(id) {
      const indice = indiceDe(id)
      const bloco = blocos[indice]
      const proximo = blocos[indice + 1]
      if (!proximo) return
      if (proximo.tipo === "divisor") {
        salvar(blocos.filter((item) => item.id !== proximo.id))
      } else if (!tiposTextoCru.includes(proximo.tipo)) {
        salvar(
          blocos
            .filter((item) => item.id !== proximo.id)
            .map((item) => (item.id === id ? { ...item, texto: item.texto + proximo.texto } : item))
        )
      }
      focar(id, bloco.texto.length)
    },

    navegar(id, direcao) {
      const vizinho = blocos[indiceDe(id) + direcao]
      if (!vizinho) return
      if (vizinho.tipo === "divisor") {
        setFoco(null)
        document.querySelector<HTMLButtonElement>(`[data-bloco="${vizinho.id}"] button[aria-label^="Divisor"]`)?.focus()
        return
      }
      focar(vizinho.id, direcao < 0 ? "fim" : 0)
    },

    recuar(id, delta) {
      const bloco = blocos[indiceDe(id)]
      salvar(comMudanca(id, { nivel: Math.max(0, Math.min(4, bloco.nivel + delta)) }))
      focar(id, foco?.id === id && typeof foco.cursor === "number" ? foco.cursor : "fim")
    },

    mover(id, delta) {
      const indice = indiceDe(id)
      const destino = indice + delta
      if (destino < 0 || destino >= blocos.length) return
      const proximos = [...blocos]
      const [bloco] = proximos.splice(indice, 1)
      proximos.splice(destino, 0, bloco)
      salvar(proximos)
      focar(id, "fim")
    },

    duplicar(id) {
      const indice = indiceDe(id)
      const copia = { ...blocos[indice], id: novoBloco().id }
      const proximos = [...blocos]
      proximos.splice(indice + 1, 0, copia)
      salvar(proximos)
      focar(copia.id, "fim")
    },

    excluir(id) {
      const indice = indiceDe(id)
      const restantes = blocos.filter((item) => item.id !== id)
      salvar(comBlocoInicial(restantes))
      const vizinho = restantes[Math.max(0, indice - 1)]
      if (vizinho) focar(vizinho.id, "fim")
    },

    transformar(id, tipo) {
      const bloco = blocos[indiceDe(id)]
      const texto = tipo === "tabela" && !bloco.texto.trim() ? textoInicialTabela : bloco.texto
      salvar(
        comMudanca(id, {
          tipo,
          texto,
          nivel: tiposLista.includes(tipo) ? bloco.nivel : 0,
          ...(tipo === "destaque" ? { variante: bloco.variante ?? "info" } : {}),
        })
      )
      if (tipo !== "divisor") focar(id, "fim")
    },

    inserirDepois(id, texto = "") {
      const indice = indiceDe(id)
      const novo = novoBloco("paragrafo", texto)
      const proximos = [...blocos]
      proximos.splice(indice + 1, 0, novo)
      salvar(proximos)
      focar(novo.id, "fim")
    },

    aplicarComando(id, comando, contexto, cursor) {
      const bloco = blocos[indiceDe(id)]
      const resto = bloco.texto.slice(0, contexto.inicio) + bloco.texto.slice(cursor)
      if (comando.id === "link") {
        salvar(comMudanca(id, { texto: bloco.texto.slice(0, contexto.inicio) + "[[" + bloco.texto.slice(cursor) }))
        focar(id, contexto.inicio + 2)
        return
      }
      const tipo = comando.tipo ?? "paragrafo"
      if (!resto.trim()) {
        if (tipo === "divisor") {
          const novo = novoBloco()
          const proximos = comMudanca(id, { tipo: "divisor", texto: "" })
          proximos.splice(indiceDe(id) + 1, 0, novo)
          salvar(proximos)
          focar(novo.id, 0)
          return
        }
        const texto = tipo === "tabela" ? textoInicialTabela : ""
        salvar(comMudanca(id, { tipo, texto, marcado: false, ...(tipo === "destaque" ? { variante: "info" as const } : {}) }))
        focar(id, tipo === "tabela" ? texto.length - 4 : 0)
        return
      }
      // O bloco tem texto: o novo tipo entra como bloco logo abaixo.
      const novo =
        tipo === "divisor"
          ? novoBloco("divisor")
          : novoBloco(tipo, tipo === "tabela" ? textoInicialTabela : "", tipo === "destaque" ? { variante: "info" } : {})
      const proximos = comMudanca(id, { texto: resto })
      proximos.splice(indiceDe(id) + 1, 0, novo)
      salvar(proximos)
      if (tipo !== "divisor") focar(novo.id, tipo === "tabela" ? textoInicialTabela.length - 4 : 0)
      else focar(id, "fim")
    },

    ativar(id, cursor) {
      focar(id, cursor)
    },

    desativar(id) {
      setFoco((atual) => (atual?.id === id ? null : atual))
    },
  }

  // Clicar no espaço abaixo dos blocos continua a nota no fim.
  function clicarNoFim() {
    const ultimo = blocos[blocos.length - 1]
    if (ultimo && ultimo.tipo === "paragrafo" && !ultimo.texto) {
      focar(ultimo.id, 0)
      return
    }
    const novo = novoBloco()
    salvar([...blocos, novo])
    focar(novo.id, 0)
  }

  return (
    <div className="pb-4 md:pl-14">
      <div className="space-y-0.5">
        {blocos.map((bloco) => (
          <BlocoEditavel
            key={bloco.id}
            bloco={bloco}
            numero={numeros.get(bloco.id) ?? 1}
            foco={foco?.id === bloco.id ? foco : null}
            nota={nota}
            acoes={acoes}
          />
        ))}
      </div>
      <button
        type="button"
        aria-label="Continuar escrevendo no fim da nota"
        onClick={clicarNoFim}
        className="block h-32 w-full cursor-text"
      />
    </div>
  )
}
