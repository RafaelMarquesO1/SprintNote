"use client"

// Rafael Marques - 20/10/2026 (redesenho em 21/10/2026; comentários, atividade, prioridade e arquivar em 23/10/2026)
// Rafael Marques - 29/10/2026: cartão repaginado no estilo Trello — resumo das propriedades no topo,
// conteúdo à esquerda, "Adicionar ao cartão" e "Ações" à direita, e um só feed de comentários e
// atividade (com quem fez cada mudança). Comentários e histórico ficam em seções separadas.

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlignLeftIcon,
  ArchiveIcon,
  ArchiveRestoreIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  CopyIcon,
  FilePlusIcon,
  FileTextIcon,
  FlagIcon,
  GaugeIcon,
  HistoryIcon,
  LayoutTemplateIcon,
  ListChecksIcon,
  MessageSquareIcon,
  PaintBucketIcon,
  PaperclipIcon,
  PlusIcon,
  RepeatIcon,
  TagIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { useConta } from "@/components/conta/portao-conta"
import { AvatarPessoa } from "@/components/equipes/avatar-pessoa"
import { useEquipes } from "@/lib/estado/equipes"
import { estilosPrioridade } from "@/components/kanban/cartao-kanban"
import { Secao } from "@/components/kanban/blocos-cartao"
import { BarrasComplexidade, CampoRepetir, SecaoAnexos, SeletorComplexidade } from "@/components/kanban/extras-cartao"
import { SeletorCor } from "@/components/kanban/dialogos-quadro"
import { classeSelect } from "@/components/tarefas/dialogo-tarefa"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ConteudoMarkdown } from "@/components/notas/visualizacao-markdown"
import { EditorCartao } from "@/components/kanban/editor-cartao"
import { useAgora, tempoRelativo } from "@/hooks/use-hoje"
import { paletaCores } from "@/lib/cores"
import { gerarId } from "@/lib/gerar-id"
import { complexidadeDe, complexidades } from "@/lib/kanban/complexidade"
import { descreverRecorrencia } from "@/lib/kanban/recorrencia"
import { colunasDoQuadro, useKanban, useNumeroDoCartao } from "@/lib/estado/kanban"
import { useNotas } from "@/lib/estado/notas"
import { usePreferencias } from "@/lib/estado/preferencias"
import type { CartaoKanban, Prioridade } from "@/lib/tipos"

const iniciaisDe = (nome: string) =>
  nome.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((parte) => parte[0].toUpperCase()).join("")

type MudancasCartao = Parameters<ReturnType<typeof useKanban.getState>["atualizarCartao"]>[1]
type Atualizar = (mudancas: MudancasCartao, atividade?: string) => void

// Botão da lateral que abre um pequeno menu (como no Trello).
function MenuLateral({ icone: IconeBotao, rotulo, titulo, children, largura = "w-64" }: { icone: React.ElementType; rotulo: string; titulo?: string; children: ReactNode; largura?: string }) {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="secondary" size="sm" className="w-full justify-start" />}>
        <IconeBotao /> {rotulo}
      </PopoverTrigger>
      <PopoverContent align="start" className={largura}>
        <p className="text-center text-sm font-medium">{titulo ?? rotulo}</p>
        {children}
      </PopoverContent>
    </Popover>
  )
}

// Bloco do resumo no topo ("Etiquetas", "Data de entrega"…).
function Resumo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{titulo}</p>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  )
}

const classeChip = "flex h-8 items-center gap-1.5 rounded-md bg-muted px-3 text-sm"

function formatarData(prazo: string) {
  const [ano, mes, dia] = prazo.split("-").map(Number)
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })
}

// Etiquetas: marcar/desmarcar e criar uma nova (usado no topo e na lateral).
function EscolherEtiquetas({ cartao, atualizar }: { cartao: CartaoKanban; atualizar: Atualizar }) {
  const quadro = useKanban((estado) => {
    const coluna = estado.colunas.find((item) => item.id === cartao.colunaId)
    return estado.quadros.find((item) => item.id === coluna?.quadroId)
  })
  const criarEtiqueta = useKanban((estado) => estado.criarEtiqueta)
  const [nova, setNova] = useState("")
  if (!quadro) return null
  return (
    <div className="space-y-2">
      <ul className="max-h-56 space-y-1 overflow-y-auto">
        {quadro.etiquetas.length === 0 && <li className="text-center text-xs text-muted-foreground">Nenhuma etiqueta neste quadro.</li>}
        {quadro.etiquetas.map((etiqueta) => {
          const ativa = cartao.etiquetas.includes(etiqueta.id)
          return (
            <li key={etiqueta.id}>
              <button
                type="button"
                aria-pressed={ativa}
                onClick={() => atualizar({ etiquetas: ativa ? cartao.etiquetas.filter((id) => id !== etiqueta.id) : [...cartao.etiquetas, etiqueta.id] })}
                className="flex w-full items-center gap-2 rounded-md p-0.5 text-left hover:bg-muted"
              >
                <span className={cn("flex size-4 shrink-0 items-center justify-center rounded border", ativa && "border-foreground bg-foreground text-background")}>
                  {ativa && <CheckIcon className="size-3" />}
                </span>
                <span className="min-w-0 flex-1 truncate rounded px-2 py-1 text-xs font-medium text-white" style={{ background: etiqueta.cor }}>
                  {etiqueta.nome}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <form
        className="flex gap-1.5 border-t pt-2"
        onSubmit={(evento) => {
          evento.preventDefault()
          if (!nova.trim()) return
          const cor = paletaCores[quadro.etiquetas.length % paletaCores.length].valor
          const etiqueta = criarEtiqueta(quadro.id, nova, cor)
          atualizar({ etiquetas: [...cartao.etiquetas, etiqueta.id] })
          setNova("")
        }}
      >
        <Input value={nova} onChange={(evento) => setNova(evento.target.value)} placeholder="Nova etiqueta" aria-label="Nova etiqueta" className="h-8 text-xs" />
        <Button type="submit" size="icon-sm" variant="outline" aria-label="Criar etiqueta" disabled={!nova.trim()}>
          <PlusIcon />
        </Button>
      </form>
    </div>
  )
}

// Rafael Marques - 29/10/2026: guarda o cartão como modelo (título, descrição, checklist, etiquetas…).
function SalvarModelo({ cartao }: { cartao: CartaoKanban }) {
  const salvarModeloCartao = useKanban((estado) => estado.salvarModeloCartao)
  const [nome, setNome] = useState(cartao.titulo)
  const [salvo, setSalvo] = useState(false)
  return (
    <form
      className="space-y-2"
      onSubmit={(evento) => {
        evento.preventDefault()
        if (!nome.trim()) return
        salvarModeloCartao(cartao.id, nome)
        setSalvo(true)
      }}
    >
      <Input autoFocus value={nome} onChange={(evento) => (setNome(evento.target.value), setSalvo(false))} placeholder="Nome do modelo" aria-label="Nome do modelo" className="h-8" />
      <p className="text-xs text-muted-foreground">Guarda título, descrição, checklist, etiquetas, prioridade, complexidade e capa. Use pelo ícone ao lado de “Adicionar cartão”.</p>
      <Button type="submit" size="sm" className="w-full" disabled={!nome.trim() || salvo}>
        {salvo ? <><CheckIcon /> Modelo salvo</> : "Salvar modelo"}
      </Button>
    </form>
  )
}

// Rafael Marques - 29/10/2026: comentários e histórico separados — comentários em cartões com borda
// (Markdown e código), histórico numa linha do tempo discreta.
function Comentarios({ cartao }: { cartao: CartaoKanban }) {
  const conta = useConta()
  const foto = usePreferencias((estado) => estado.fotoPerfil)
  const comentarCartao = useKanban((estado) => estado.comentarCartao)
  const excluirComentario = useKanban((estado) => estado.excluirComentario)
  const agora = useAgora()
  const [texto, setTexto] = useState("")
  // Muda a cada envio para o editor recomeçar vazio.
  const [versao, setVersao] = useState(0)
  const autor = { id: conta?.usuario.id ?? "local", nome: conta?.usuario.nome || conta?.usuario.email || "Você" }
  const comentarios = [...cartao.comentarios].sort((a, b) => b.criadoEm - a.criadoEm)

  function enviar() {
    if (!texto.trim()) return
    comentarCartao(cartao.id, texto, autor)
    setTexto("")
    setVersao((atual) => atual + 1)
  }

  return (
    <Secao titulo="Comentários" icone={MessageSquareIcon} extra={comentarios.length > 0 && comentarios.length}>
      <div className="flex items-start gap-3">
        <Avatar size="sm" className="mt-1.5">
          {foto && <AvatarImage src={foto} alt="" />}
          <AvatarFallback>{iniciaisDe(autor.nome)}</AvatarFallback>
        </Avatar>
        <EditorCartao
          key={`comentario-${versao}`}
          valor={texto}
          aoMudar={setTexto}
          aoEnviar={enviar}
          placeholder="Escreva um comentário…"
          rotulo="Novo comentário"
          className="min-w-0 flex-1"
          rodape={
            <>
              <span className="hidden text-xs text-muted-foreground sm:inline">Ctrl + Enter</span>
              <Button type="button" size="sm" disabled={!texto.trim()} onMouseDown={(evento) => evento.preventDefault()} onClick={enviar}>
                Comentar
              </Button>
            </>
          }
        />
      </div>

      {comentarios.length > 0 && (
        <ul className="space-y-3">
          {comentarios.map((comentario) => {
            const meu = comentario.autorId === autor.id
            return (
              <li key={comentario.id} className="group flex gap-3">
                <Avatar size="sm" className="mt-1">
                  {meu && foto && <AvatarImage src={foto} alt="" />}
                  <AvatarFallback>{iniciaisDe(comentario.autorNome || "?")}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 border-b px-3 py-1.5">
                    <strong className="truncate text-sm font-semibold">{comentario.autorNome || "Alguém"}</strong>
                    <span className="text-xs text-muted-foreground" title={new Date(comentario.criadoEm).toLocaleString("pt-BR")}>
                      {tempoRelativo(comentario.criadoEm, agora)}
                    </span>
                    <button
                      type="button"
                      onClick={() => excluirComentario(cartao.id, comentario.id)}
                      aria-label="Excluir comentário"
                      title="Excluir comentário"
                      className="ml-auto rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100 max-md:opacity-100"
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  </div>
                  <div className="markdown px-3 py-2 text-sm break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ConteudoMarkdown texto={comentario.texto} />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Secao>
  )
}

// Histórico automático: linha do tempo, do mais novo para o mais antigo.
function Historico({ cartao }: { cartao: CartaoKanban }) {
  const agora = useAgora()
  const [verTudo, setVerTudo] = useState(false)
  if (cartao.atividade.length === 0) return null
  const itens = [...cartao.atividade].sort((a, b) => b.criadoEm - a.criadoEm)
  const visiveis = verTudo ? itens : itens.slice(0, 3)
  return (
    <Secao titulo="Histórico" icone={HistoryIcon} extra={itens.length}>
      <ol className="relative ml-2 space-y-2.5 border-l pl-4">
        {visiveis.map((item) => (
          <li key={item.id} className="relative text-xs">
            <span className="absolute top-1 -left-[21px] size-2.5 rounded-full border-2 border-background bg-muted-foreground/50" aria-hidden />
            <p className="leading-snug">
              {item.autorNome && <strong className="font-medium text-foreground">{item.autorNome} </strong>}
              <span className="text-muted-foreground">{item.autorNome ? item.texto.charAt(0).toLowerCase() + item.texto.slice(1) : item.texto}</span>
            </p>
            <p className="text-[11px] text-muted-foreground/80" title={new Date(item.criadoEm).toLocaleString("pt-BR")}>
              {tempoRelativo(item.criadoEm, agora)}
            </p>
          </li>
        ))}
      </ol>
      {itens.length > 3 && (
        <button type="button" onClick={() => setVerTudo(!verTudo)} className="ml-2 text-xs text-muted-foreground hover:text-foreground hover:underline">
          {verTudo ? "Mostrar menos" : `Ver histórico completo (${itens.length})`}
        </button>
      )}
    </Secao>
  )
}

// Formulário interno: tudo é salvo na hora, enquanto se edita.
function FormularioCartao({ cartao, aoFechar }: { cartao: CartaoKanban; aoFechar: () => void }) {
  const router = useRouter()
  const quadros = useKanban((estado) => estado.quadros)
  const colunas = useKanban((estado) => estado.colunas)
  const atualizarCartao = useKanban((estado) => estado.atualizarCartao)
  const moverCartao = useKanban((estado) => estado.moverCartao)
  const duplicarCartao = useKanban((estado) => estado.duplicarCartao)
  const excluirCartao = useKanban((estado) => estado.excluirCartao)
  const arquivarCartao = useKanban((estado) => estado.arquivarCartao)
  const notas = useNotas((estado) => estado.notas)
  const livros = useNotas((estado) => estado.livros)
  const criarNota = useNotas((estado) => estado.criarNota)
  // O título fica num rascunho só para permitir apagar tudo enquanto digita.
  const [titulo, setTitulo] = useState(cartao.titulo)
  const [novoItem, setNovoItem] = useState("")
  const [mostrarChecklist, setMostrarChecklist] = useState(false)
  const [mostrarAnexos, setMostrarAnexos] = useState(false)
  const numero = useNumeroDoCartao(cartao.id)

  const coluna = colunas.find((item) => item.id === cartao.colunaId)
  const quadro = quadros.find((item) => item.id === coluna?.quadroId)
  // Quadros de equipe têm responsável e não vinculam notas pessoais.
  const equipe = useEquipes((estado) => estado.equipes.find((item) => item.id === quadro?.equipeId))
  const notaVinculada = notas.find((nota) => nota.id === cartao.notaId)
  const atualizar: Atualizar = (mudancas, atividade) => atualizarCartao(cartao.id, mudancas, atividade)
  const feitos = cartao.checklist.filter((item) => item.feito).length
  const percentual = cartao.checklist.length ? Math.round((feitos / cartao.checklist.length) * 100) : 0
  const etiquetasDoCartao = (quadro?.etiquetas ?? []).filter((etiqueta) => cartao.etiquetas.includes(etiqueta.id))
  const responsavel = equipe?.membros.find((membro) => membro.id === cartao.responsavelId)
  const complexidade = complexidades.find((opcao) => opcao.id === complexidadeDe(cartao.estimativa))
  const temResumo = Boolean(responsavel || etiquetasDoCartao.length > 0 || cartao.prazo || cartao.prioridade || complexidade || cartao.recorrencia)

  function mudarItem(id: string, mudancas: { texto?: string; feito?: boolean }) {
    atualizar({ checklist: cartao.checklist.map((item) => (item.id === id ? { ...item, ...mudancas } : item)) })
  }

  function criarNotaDoCartao() {
    const nota = criarNota({ titulo: cartao.titulo, conteudo: cartao.descricao })
    atualizar({ notaId: nota.id })
    aoFechar()
    router.push(`/notas/${nota.id}`)
  }

  return (
    <>
      {/* Capa */}
      {cartao.cor && <div className="h-14 shrink-0" style={{ background: cartao.cor }} />}

      {/* Cabeçalho */}
      <header className="shrink-0 space-y-1 px-6 pt-5 pr-14 pb-2">
        <DialogTitle className="sr-only">Cartão {cartao.titulo}</DialogTitle>
        <textarea
          value={titulo}
          rows={1}
          onChange={(evento) => {
            const valor = evento.target.value.replace(/\n/g, " ")
            setTitulo(valor)
            if (valor.trim()) atualizar({ titulo: valor.trim() })
          }}
          onBlur={() => setTitulo(cartao.titulo)}
          onKeyDown={(evento) => evento.key === "Enter" && (evento.preventDefault(), evento.currentTarget.blur())}
          aria-label="Título do cartão"
          className="field-sizing-content -mx-1.5 block w-full resize-none overflow-hidden rounded-md bg-transparent px-1.5 text-xl leading-snug font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        <DialogDescription>
          {numero && <span className="mr-1.5 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">#{numero}</span>}
          na lista <strong className="font-medium text-foreground">{coluna?.titulo}</strong>
          {quadros.length > 1 && <> · {quadro?.titulo}</>}
          {cartao.arquivado && (
            <>
              {" "}
              · <span className="font-medium text-foreground">arquivado</span>
            </>
          )}
        </DialogDescription>
      </header>

      {/* Corpo */}
      <div className="rolagem-fina grid min-h-0 flex-1 gap-x-6 gap-y-6 overflow-x-hidden overflow-y-auto px-6 pt-3 pb-6 md:grid-cols-[minmax(0,1fr)_11.5rem]">
        <div className="min-w-0 space-y-7">
          {/* Resumo do que já está definido */}
          {temResumo && (
            <div className="flex flex-wrap gap-x-6 gap-y-4">
              {responsavel && (
                <Resumo titulo="Responsável">
                  <AvatarPessoa nome={responsavel.nome} foto={responsavel.foto} />
                  <span className="text-sm">{responsavel.nome}</span>
                </Resumo>
              )}
              {etiquetasDoCartao.length > 0 && (
                <Resumo titulo="Etiquetas">
                  {etiquetasDoCartao.map((etiqueta) => (
                    <span key={etiqueta.id} className="h-8 rounded px-3 text-sm leading-8 font-medium text-white" style={{ background: etiqueta.cor }}>
                      {etiqueta.nome}
                    </span>
                  ))}
                  <Popover>
                    <PopoverTrigger render={<Button variant="secondary" size="icon" aria-label="Escolher etiquetas" />}>
                      <PlusIcon />
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-64">
                      <p className="text-center text-sm font-medium">Etiquetas</p>
                      <EscolherEtiquetas cartao={cartao} atualizar={atualizar} />
                    </PopoverContent>
                  </Popover>
                </Resumo>
              )}
              {cartao.prazo && (
                <Resumo titulo="Data de entrega">
                  <span className={classeChip}>
                    <CalendarIcon className="size-4" /> {formatarData(cartao.prazo)}
                  </span>
                </Resumo>
              )}
              {cartao.prioridade && (
                <Resumo titulo="Prioridade">
                  <span className={classeChip}>
                    <FlagIcon className="size-4" /> {estilosPrioridade[cartao.prioridade].titulo}
                  </span>
                </Resumo>
              )}
              {complexidade && (
                <Resumo titulo="Complexidade">
                  <span className={classeChip}>
                    <BarrasComplexidade nivel={complexidade.valor} /> {complexidade.rotulo}
                  </span>
                </Resumo>
              )}
              {cartao.recorrencia && (
                <Resumo titulo="Repetição">
                  <span className={classeChip}>
                    <RepeatIcon className="size-4" /> {descreverRecorrencia(cartao.recorrencia)}
                  </span>
                </Resumo>
              )}
            </div>
          )}

          {/* Rafael Marques - 29/10/2026: descrição com editor visual (formatação e código sem símbolos). */}
          <Secao titulo="Descrição" icone={AlignLeftIcon}>
            <EditorCartao
              key={`descricao-${cartao.id}`}
              valor={cartao.descricao}
              aoMudar={(descricao) => atualizar({ descricao })}
              placeholder="Adicione uma descrição mais detalhada…"
              rotulo="Descrição"
              className="border-transparent bg-transparent hover:border-border"
            />
          </Secao>

          {(cartao.anexos.length > 0 || mostrarAnexos) && <SecaoAnexos cartao={cartao} atualizar={atualizar} />}

          {(cartao.checklist.length > 0 || mostrarChecklist) && (
            <Secao titulo="Checklist" icone={ListChecksIcon} extra={cartao.checklist.length > 0 && `${feitos}/${cartao.checklist.length}`}>
              <div className="flex items-center gap-2">
                <span className="w-8 text-xs text-muted-foreground tabular-nums">{percentual}%</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentual}%` }} />
                </div>
              </div>
              <ul className="space-y-0.5">
                {cartao.checklist.map((item) => (
                  <li key={item.id} className="group flex items-start gap-2.5 rounded-md px-1 py-1 hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={item.feito}
                      onChange={() => mudarItem(item.id, { feito: !item.feito })}
                      className="mt-0.5 size-4 shrink-0 accent-primary"
                      aria-label={`Concluir ${item.texto}`}
                    />
                    <textarea
                      value={item.texto}
                      rows={1}
                      onChange={(evento) => mudarItem(item.id, { texto: evento.target.value.replace(/\n/g, " ") })}
                      aria-label="Texto do item"
                      className={cn("field-sizing-content min-w-0 flex-1 resize-none overflow-hidden bg-transparent text-sm leading-5 outline-none", item.feito && "text-muted-foreground line-through")}
                    />
                    <button
                      type="button"
                      aria-label={`Remover ${item.texto}`}
                      onClick={() => atualizar({ checklist: cartao.checklist.filter((atual) => atual.id !== item.id) })}
                      className="rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <form
                className="flex gap-2"
                onSubmit={(evento) => {
                  evento.preventDefault()
                  if (!novoItem.trim()) return
                  atualizar({ checklist: [...cartao.checklist, { id: gerarId(), texto: novoItem.trim(), feito: false }] })
                  setNovoItem("")
                }}
              >
                <Input
                  autoFocus={mostrarChecklist && cartao.checklist.length === 0}
                  value={novoItem}
                  onChange={(evento) => setNovoItem(evento.target.value)}
                  placeholder="Adicionar um item…"
                  aria-label="Novo item da checklist"
                />
                <Button type="submit" variant="secondary" disabled={!novoItem.trim()}>
                  Adicionar
                </Button>
              </form>
            </Secao>
          )}

          <Comentarios cartao={cartao} />

          <Historico cartao={cartao} />
        </div>

        {/* Lateral */}
        <aside className="space-y-5">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Adicionar ao cartão</p>
            {equipe && (
              <MenuLateral icone={UserIcon} rotulo="Responsável">
                <div className="grid max-h-60 gap-1 overflow-y-auto">
                  {[null, ...equipe.membros].map((membro) => (
                    <button
                      key={membro?.id ?? "ninguem"}
                      type="button"
                      onClick={() => atualizar({ responsavelId: membro?.id ?? null }, membro ? `Responsável: ${membro.nome}` : "Responsável removido")}
                      className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted", (cartao.responsavelId ?? null) === (membro?.id ?? null) && "bg-muted font-medium")}
                    >
                      {membro ? (
                        <AvatarPessoa nome={membro.nome} foto={membro.foto} />
                      ) : (
                        <span className="flex size-6 items-center justify-center rounded-full border border-dashed">
                          <UserIcon className="size-3" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate">{membro?.nome ?? "Ninguém"}</span>
                    </button>
                  ))}
                </div>
              </MenuLateral>
            )}
            {quadro && (
              <MenuLateral icone={TagIcon} rotulo="Etiquetas">
                <EscolherEtiquetas cartao={cartao} atualizar={atualizar} />
              </MenuLateral>
            )}
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => setMostrarChecklist(true)}>
              <ListChecksIcon /> Checklist
            </Button>
            <MenuLateral icone={CalendarIcon} rotulo="Datas" titulo="Data de entrega">
              <div className="flex gap-1">
                <Input type="date" value={cartao.prazo ?? ""} onChange={(evento) => atualizar({ prazo: evento.target.value || null })} aria-label="Prazo" />
                {cartao.prazo && (
                  <Button variant="ghost" size="icon" aria-label="Remover prazo" onClick={() => atualizar({ prazo: null })}>
                    <XIcon />
                  </Button>
                )}
              </div>
            </MenuLateral>
            <MenuLateral icone={FlagIcon} rotulo="Prioridade" largura="w-52">
              <div className="grid gap-1">
                {([null, "alta", "media", "baixa"] as const).map((id) => (
                  <button
                    key={id ?? "nenhuma"}
                    type="button"
                    onClick={() => atualizar({ prioridade: id as Prioridade | null })}
                    className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted", cartao.prioridade === id && "bg-muted font-medium")}
                  >
                    {id ? estilosPrioridade[id].titulo : "Nenhuma"}
                    {cartao.prioridade === id && <CheckIcon className="ml-auto size-4" />}
                  </button>
                ))}
              </div>
            </MenuLateral>
            <MenuLateral icone={GaugeIcon} rotulo="Complexidade" largura="w-72">
              <SeletorComplexidade cartao={cartao} atualizar={atualizar} />
            </MenuLateral>
            <MenuLateral icone={RepeatIcon} rotulo="Repetir">
              <CampoRepetir cartao={cartao} atualizar={atualizar} />
            </MenuLateral>
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => setMostrarAnexos(true)}>
              <PaperclipIcon /> Anexo
            </Button>
            <MenuLateral icone={PaintBucketIcon} rotulo="Capa" titulo="Cor da capa">
              <SeletorCor valor={cartao.cor} aoMudar={(cor) => atualizar({ cor })} permitirNenhuma />
            </MenuLateral>
            {!equipe && (
              <MenuLateral icone={FileTextIcon} rotulo="Nota" titulo="Nota vinculada" largura="w-72">
                <select value={cartao.notaId ?? ""} onChange={(evento) => atualizar({ notaId: evento.target.value || null })} className={classeSelect} aria-label="Nota vinculada">
                  <option value="">Nenhuma</option>
                  {notas.map((nota) => (
                    <option key={nota.id} value={nota.id}>
                      {livros.find((livro) => livro.id === nota.livroId)?.titulo ?? "Nota solta"} / {nota.titulo}
                    </option>
                  ))}
                </select>
                {notaVinculada ? (
                  <Link href={`/notas/${notaVinculada.id}`} onClick={aoFechar} className="block text-xs text-primary hover:underline">
                    Abrir “{notaVinculada.titulo}”
                  </Link>
                ) : (
                  <button type="button" onClick={criarNotaDoCartao} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <FilePlusIcon className="size-3.5" /> Criar nota para o cartão
                  </button>
                )}
              </MenuLateral>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Ações</p>
            <MenuLateral icone={ArrowRightIcon} rotulo="Mover" titulo="Mover cartão">
              {quadros.length > 1 && (
                <label className="grid gap-1 text-xs text-muted-foreground">
                  Quadro
                  <select
                    value={quadro?.id ?? ""}
                    onChange={(evento) => {
                      const primeira = colunasDoQuadro(colunas, evento.target.value)[0]
                      if (primeira) moverCartao(cartao.id, primeira.id, null)
                    }}
                    className={classeSelect}
                  >
                    {quadros.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.titulo}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="grid gap-1 text-xs text-muted-foreground">
                Lista
                <select value={cartao.colunaId} onChange={(evento) => moverCartao(cartao.id, evento.target.value, null)} className={classeSelect}>
                  {colunasDoQuadro(colunas, quadro?.id ?? null).map((destino) => (
                    <option key={destino.id} value={destino.id}>
                      {destino.titulo}
                    </option>
                  ))}
                </select>
              </label>
            </MenuLateral>
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => duplicarCartao(cartao.id)}>
              <CopyIcon /> Copiar
            </Button>
            <MenuLateral icone={LayoutTemplateIcon} rotulo="Salvar como modelo" titulo="Novo modelo de cartão">
              <SalvarModelo cartao={cartao} />
            </MenuLateral>
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                arquivarCartao(cartao.id, !cartao.arquivado)
                if (!cartao.arquivado) aoFechar()
              }}
            >
              {cartao.arquivado ? <ArchiveRestoreIcon /> : <ArchiveIcon />} {cartao.arquivado ? "Restaurar" : "Arquivar"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-start hover:bg-destructive/15 hover:text-destructive"
              onClick={() => {
                excluirCartao(cartao.id)
                aoFechar()
              }}
            >
              <Trash2Icon /> Excluir
            </Button>
          </div>
        </aside>
      </div>
    </>
  )
}

export function DialogoCartao({ cartao, aoFechar }: { cartao: CartaoKanban | null; aoFechar: () => void }) {
  return (
    <Dialog open={cartao !== null} onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        {cartao && <FormularioCartao key={cartao.id} cartao={cartao} aoFechar={aoFechar} />}
      </DialogContent>
    </Dialog>
  )
}
