"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlignLeftIcon, ArchiveIcon, ArchiveRestoreIcon, CopyIcon, FilePlusIcon, HistoryIcon, ListChecksIcon, MessageSquareIcon, PlusIcon, SendIcon, Trash2Icon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import { useConta } from "@/components/conta/portao-conta"
import { AvatarPessoa } from "@/components/equipes/avatar-pessoa"
import { useEquipes } from "@/lib/estado/equipes"
import { estilosPrioridade } from "@/components/kanban/cartao-kanban"
import { SeletorCor } from "@/components/kanban/dialogos-quadro"
import { classeSelect } from "@/components/tarefas/dialogo-tarefa"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useAgora, tempoRelativo } from "@/hooks/use-hoje"
import { paletaCores } from "@/lib/cores"
import { gerarId } from "@/lib/gerar-id"
import { colunasDoQuadro, useKanban } from "@/lib/estado/kanban"
import { useNotas } from "@/lib/estado/notas"
import { usePreferencias } from "@/lib/estado/preferencias"
import type { CartaoKanban, Prioridade } from "@/lib/tipos"

const iniciaisDe = (nome: string) =>
  nome.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((parte) => parte[0].toUpperCase()).join("")

// Rafael Marques - 23/10/2026
// Comentários do cartão (com autor e hora) e o histórico automático.
function Comentarios({ cartao }: { cartao: CartaoKanban }) {
  const conta = useConta()
  const foto = usePreferencias((estado) => estado.fotoPerfil)
  const comentarCartao = useKanban((estado) => estado.comentarCartao)
  const excluirComentario = useKanban((estado) => estado.excluirComentario)
  const agora = useAgora()
  const [texto, setTexto] = useState("")
  const [verHistorico, setVerHistorico] = useState(false)
  const autor = { id: conta?.usuario.id ?? "local", nome: conta?.usuario.nome || conta?.usuario.email || "Você" }

  function enviar() {
    if (!texto.trim()) return
    comentarCartao(cartao.id, texto, autor)
    setTexto("")
  }

  return (
    <>
      <Secao titulo="Comentários" icone={MessageSquareIcon} extra={cartao.comentarios.length > 0 && cartao.comentarios.length}>
        <form
          className="flex items-start gap-2.5"
          onSubmit={(evento) => {
            evento.preventDefault()
            enviar()
          }}
        >
          <Avatar size="sm" className="mt-1.5">
            {foto && <AvatarImage src={foto} alt="" />}
            <AvatarFallback>{iniciaisDe(autor.nome)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1.5">
            <textarea
              value={texto}
              onChange={(evento) => setTexto(evento.target.value)}
              onKeyDown={(evento) => {
                if (evento.key === "Enter" && (evento.ctrlKey || evento.metaKey)) {
                  evento.preventDefault()
                  enviar()
                }
              }}
              placeholder="Escreva um comentário…"
              aria-label="Novo comentário"
              rows={2}
              className={cn(classeCampoTexto, "field-sizing-content min-h-16 resize-none")}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Ctrl + Enter envia</span>
              <Button type="submit" size="sm" disabled={!texto.trim()}><SendIcon /> Comentar</Button>
            </div>
          </div>
        </form>

        <ul className="space-y-3">
          {[...cartao.comentarios].reverse().map((comentario) => {
            const meu = comentario.autorId === autor.id
            return (
              <li key={comentario.id} className="group flex gap-2.5">
                <Avatar size="sm" className="mt-0.5">
                  {meu && foto && <AvatarImage src={foto} alt="" />}
                  <AvatarFallback>{iniciaisDe(comentario.autorNome)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-2 text-xs text-muted-foreground">
                    <strong className="truncate text-sm font-medium text-foreground">{comentario.autorNome}</strong>
                    <span title={new Date(comentario.criadoEm).toLocaleString("pt-BR")}>{tempoRelativo(comentario.criadoEm, agora)}</span>
                    <button
                      type="button"
                      onClick={() => excluirComentario(cartao.id, comentario.id)}
                      aria-label="Excluir comentário"
                      className="ml-auto rounded p-0.5 opacity-0 group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  </p>
                  <p className="text-sm break-words whitespace-pre-wrap">{comentario.texto}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </Secao>

      {cartao.atividade.length > 0 && (
        <Secao titulo="Atividade" icone={HistoryIcon}>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {[...cartao.atividade].reverse().slice(0, verHistorico ? undefined : 4).map((item) => (
              <li key={item.id} className="flex gap-2">
                <span className="min-w-0 flex-1">{item.texto}</span>
                <span className="shrink-0" title={new Date(item.criadoEm).toLocaleString("pt-BR")}>{tempoRelativo(item.criadoEm, agora)}</span>
              </li>
            ))}
          </ul>
          {cartao.atividade.length > 4 && (
            <button type="button" onClick={() => setVerHistorico(!verHistorico)} className="text-xs text-primary hover:underline">
              {verHistorico ? "Mostrar menos" : `Ver tudo (${cartao.atividade.length})`}
            </button>
          )}
        </Secao>
      )}
    </>
  )
}

// Bloco da lateral direita (propriedades do cartão).
function Propriedade({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{titulo}</h3>
      {children}
    </section>
  )
}

// Seção da coluna principal (descrição e checklist).
function Secao({ titulo, icone: IconeSecao, extra, children }: { titulo: string; icone: React.ElementType; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <IconeSecao className="size-4 text-muted-foreground" /> {titulo}
        {extra && <span className="ml-auto text-xs font-normal text-muted-foreground">{extra}</span>}
      </h3>
      {children}
    </section>
  )
}

const classeCampoTexto =
  "w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

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
  const criarEtiqueta = useKanban((estado) => estado.criarEtiqueta)
  const notas = useNotas((estado) => estado.notas)
  const livros = useNotas((estado) => estado.livros)
  const criarNota = useNotas((estado) => estado.criarNota)
  // O título fica num rascunho só para permitir apagar tudo enquanto digita.
  const [titulo, setTitulo] = useState(cartao.titulo)
  const [novoItem, setNovoItem] = useState("")
  const [novaEtiqueta, setNovaEtiqueta] = useState("")

  const coluna = colunas.find((item) => item.id === cartao.colunaId)
  const quadro = quadros.find((item) => item.id === coluna?.quadroId)
  // Rafael Marques - 23/10/2026: quadros de equipe têm responsável e não vinculam notas pessoais.
  const equipe = useEquipes((estado) => estado.equipes.find((item) => item.id === quadro?.equipeId))
  const notaVinculada = notas.find((nota) => nota.id === cartao.notaId)
  const atualizar = (mudancas: Parameters<typeof atualizarCartao>[1], atividade?: string) => atualizarCartao(cartao.id, mudancas, atividade)
  const feitos = cartao.checklist.filter((item) => item.feito).length

  function alternarEtiqueta(id: string) {
    atualizar({ etiquetas: cartao.etiquetas.includes(id) ? cartao.etiquetas.filter((item) => item !== id) : [...cartao.etiquetas, id] })
  }

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
      {cartao.cor && <div className="h-2 shrink-0" style={{ background: cartao.cor }} />}

      {/* Cabeçalho fixo */}
      <header className="shrink-0 space-y-1 border-b px-6 pt-5 pr-14 pb-4">
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
          className="field-sizing-content block w-full resize-none overflow-hidden bg-transparent text-xl leading-snug font-semibold outline-none"
        />
        <DialogDescription>
          Em <strong className="font-medium text-foreground">{coluna?.titulo}</strong>
          {quadros.length > 1 && <> · {quadro?.titulo}</>} · salvo automaticamente
        </DialogDescription>
      </header>

      {/* Corpo: uma única área de rolagem (só vertical) */}
      <div className="rolagem-fina grid min-h-0 flex-1 gap-x-8 gap-y-6 overflow-x-hidden overflow-y-auto px-6 py-5 md:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="min-w-0 space-y-7">
          <Secao titulo="Descrição" icone={AlignLeftIcon}>
            <textarea
              value={cartao.descricao}
              onChange={(evento) => atualizar({ descricao: evento.target.value })}
              placeholder="Adicione mais detalhes…"
              aria-label="Descrição"
              className={cn(classeCampoTexto, "field-sizing-content min-h-24 resize-none")}
            />
          </Secao>

          <Secao titulo="Checklist" icone={ListChecksIcon} extra={cartao.checklist.length > 0 && `${feitos}/${cartao.checklist.length}`}>
            {cartao.checklist.length > 0 && (
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(feitos / cartao.checklist.length) * 100}%` }} />
              </div>
            )}
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
                    className={cn(
                      "field-sizing-content min-w-0 flex-1 resize-none overflow-hidden bg-transparent text-sm leading-5 outline-none",
                      item.feito && "text-muted-foreground line-through"
                    )}
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
              <Input value={novoItem} onChange={(evento) => setNovoItem(evento.target.value)} placeholder="Adicionar item…" aria-label="Novo item da checklist" />
              <Button type="submit" size="icon" variant="outline" aria-label="Adicionar item"><PlusIcon /></Button>
            </form>
          </Secao>

          <Comentarios cartao={cartao} />
        </div>

        {/* Lateral: propriedades */}
        <aside className="space-y-5 md:border-l md:pl-6">
          {quadro && (
            <Propriedade titulo="Etiquetas">
              <div className="flex flex-wrap gap-1.5">
                {quadro.etiquetas.map((etiqueta) => {
                  const ativa = cartao.etiquetas.includes(etiqueta.id)
                  return (
                    <button
                      key={etiqueta.id}
                      type="button"
                      aria-pressed={ativa}
                      onClick={() => alternarEtiqueta(etiqueta.id)}
                      className={cn("rounded-md px-2 py-0.5 text-xs font-medium transition-opacity", !ativa && "opacity-45 hover:opacity-80")}
                      style={{ background: `color-mix(in oklch, ${etiqueta.cor} ${ativa ? 25 : 12}%, transparent)`, color: etiqueta.cor }}
                    >
                      {etiqueta.nome}
                    </button>
                  )
                })}
              </div>
              <form
                onSubmit={(evento) => {
                  evento.preventDefault()
                  if (!novaEtiqueta.trim()) return
                  const cor = paletaCores[quadro.etiquetas.length % paletaCores.length].valor
                  const etiqueta = criarEtiqueta(quadro.id, novaEtiqueta, cor)
                  atualizar({ etiquetas: [...cartao.etiquetas, etiqueta.id] })
                  setNovaEtiqueta("")
                }}
              >
                <Input
                  value={novaEtiqueta}
                  onChange={(evento) => setNovaEtiqueta(evento.target.value)}
                  placeholder="+ Nova etiqueta"
                  aria-label="Nova etiqueta"
                  className="h-7 text-xs"
                />
              </form>
            </Propriedade>
          )}

          {equipe && (
            <Propriedade titulo="Responsável">
              <div className="flex items-center gap-2">
                {cartao.responsavelId && (() => {
                  const responsavel = equipe.membros.find((membro) => membro.id === cartao.responsavelId)
                  return responsavel ? <AvatarPessoa nome={responsavel.nome} foto={responsavel.foto} /> : null
                })()}
                <select
                  value={cartao.responsavelId ?? ""}
                  onChange={(evento) => {
                    const escolhido = equipe.membros.find((membro) => membro.id === evento.target.value)
                    atualizar({ responsavelId: escolhido?.id ?? null }, escolhido ? `Responsável: ${escolhido.nome}` : "Responsável removido")
                  }}
                  className={classeSelect}
                  aria-label="Responsável"
                >
                  <option value="">Ninguém</option>
                  {equipe.membros.map((membro) => (
                    <option key={membro.id} value={membro.id}>{membro.nome}</option>
                  ))}
                </select>
              </div>
            </Propriedade>
          )}

          <Propriedade titulo="Prioridade">
            <select
              value={cartao.prioridade ?? ""}
              onChange={(evento) => atualizar({ prioridade: (evento.target.value || null) as Prioridade | null })}
              className={classeSelect}
              aria-label="Prioridade"
            >
              <option value="">Nenhuma</option>
              {(["alta", "media", "baixa"] as const).map((id) => (
                <option key={id} value={id}>{estilosPrioridade[id].titulo}</option>
              ))}
            </select>
          </Propriedade>

          <Propriedade titulo="Prazo">
            <div className="flex gap-1">
              <Input type="date" value={cartao.prazo ?? ""} onChange={(evento) => atualizar({ prazo: evento.target.value || null })} aria-label="Prazo" />
              {cartao.prazo && (
                <Button variant="ghost" size="icon" aria-label="Remover prazo" onClick={() => atualizar({ prazo: null })}>
                  <XIcon />
                </Button>
              )}
            </div>
          </Propriedade>

          <Propriedade titulo="Cor">
            <SeletorCor valor={cartao.cor} aoMudar={(cor) => atualizar({ cor })} permitirNenhuma />
          </Propriedade>

          {!equipe && <Propriedade titulo="Nota vinculada">
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
          </Propriedade>}

          <Propriedade titulo="Mover para">
            {quadros.length > 1 && (
              <select
                value={quadro?.id ?? ""}
                onChange={(evento) => {
                  const primeira = colunasDoQuadro(colunas, evento.target.value)[0]
                  if (primeira) moverCartao(cartao.id, primeira.id, null)
                }}
                className={classeSelect}
                aria-label="Mover para o quadro"
              >
                {quadros.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}
              </select>
            )}
            <select value={cartao.colunaId} onChange={(evento) => moverCartao(cartao.id, evento.target.value, null)} className={classeSelect} aria-label="Mover para a coluna">
              {colunasDoQuadro(colunas, quadro?.id ?? null).map((destino) => (
                <option key={destino.id} value={destino.id}>{destino.titulo}</option>
              ))}
            </select>
          </Propriedade>

          <Propriedade titulo="Ações">
            <div className="grid gap-1.5">
              <Button variant="outline" size="sm" className="justify-start" onClick={() => duplicarCartao(cartao.id)}>
                <CopyIcon /> Duplicar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => {
                  arquivarCartao(cartao.id, !cartao.arquivado)
                  if (!cartao.arquivado) aoFechar()
                }}
              >
                {cartao.arquivado ? <ArchiveRestoreIcon /> : <ArchiveIcon />} {cartao.arquivado ? "Restaurar" : "Arquivar"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="justify-start"
                onClick={() => {
                  excluirCartao(cartao.id)
                  aoFechar()
                }}
              >
                <Trash2Icon /> Excluir cartão
              </Button>
            </div>
          </Propriedade>
        </aside>
      </div>
    </>
  )
}

// Rafael Marques - 20/10/2026 (redesenho em 21/10/2026; comentários, atividade, prioridade e arquivar em 23/10/2026)
// Diálogo do cartão: conteúdo à esquerda (descrição e checklist) e
// propriedades à direita (etiquetas, prazo, cor, nota, mover e ações).
export function DialogoCartao({ cartao, aoFechar }: { cartao: CartaoKanban | null; aoFechar: () => void }) {
  return (
    <Dialog open={cartao !== null} onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        {cartao && <FormularioCartao key={cartao.id} cartao={cartao} aoFechar={aoFechar} />}
      </DialogContent>
    </Dialog>
  )
}
