"use client"

import { useShallow } from "zustand/react/shallow"
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, CopyIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { cn } from "@/lib/utils"

import { catalogoWidgets, categorias } from "@/components/inicio/catalogo-widgets"
import { nomesMetricas, opcoesAtalhos } from "@/components/inicio/widgets"
import { SeletorCor } from "@/components/kanban/dialogos-quadro"
import { classeSelect } from "@/components/tarefas/dialogo-tarefa"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useInicio, type TipoWidget, type Widget } from "@/lib/estado/inicio"
import { useKanban } from "@/lib/estado/kanban"
import { useNotas } from "@/lib/estado/notas"

// Rafael Marques - 21/10/2026
// Diálogos da tela de início: galeria de widgets, e configurar um widget.

function Campo({ rotulo, children, className }: { rotulo: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-1.5 text-sm", className)}>
      <span className="font-medium">{rotulo}</span>
      {children}
    </div>
  )
}

// Grupo de botões de escolha única (mesmo visual do SeletorDias).
function Escolha<T extends string | number>({ valor, opcoes, aoMudar }: { valor: T; opcoes: { valor: T; rotulo: string }[]; aoMudar: (valor: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1" role="radiogroup">
      {opcoes.map((opcao) => (
        <button
          key={String(opcao.valor)}
          type="button"
          role="radio"
          aria-checked={valor === opcao.valor}
          onClick={() => aoMudar(opcao.valor)}
          className={cn(
            "h-8 rounded-md border px-3 text-xs transition-colors",
            valor === opcao.valor ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
          )}
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  )
}

function Marcar({ marcado, aoMudar, children }: { marcado: boolean; aoMudar: (marcado: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 text-sm hover:bg-muted/50">
      <input type="checkbox" checked={marcado} onChange={(evento) => aoMudar(evento.target.checked)} className="size-4 accent-primary" />
      {children}
    </label>
  )
}

// Lista de caixas para escolher vários itens (números, atalhos), na ordem escolhida.
function EscolhaMultipla({ valores, opcoes, aoMudar }: { valores: string[]; opcoes: Record<string, string>; aoMudar: (valores: string[]) => void }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-2">
      {Object.entries(opcoes).map(([chave, nome]) => (
        <Marcar
          key={chave}
          marcado={valores.includes(chave)}
          aoMudar={(marcado) => aoMudar(marcado ? [...valores, chave] : valores.filter((item) => item !== chave))}
        >
          {nome}
        </Marcar>
      ))}
    </div>
  )
}

// ---------- Galeria ----------

export function GaleriaWidgets({ aberto, aoFechar, colunas }: { aberto: boolean; aoFechar: () => void; colunas: number }) {
  const widgets = useInicio((estado) => estado.widgets)
  const adicionarWidget = useInicio((estado) => estado.adicionarWidget)

  function adicionar(tipo: TipoWidget) {
    const info = catalogoWidgets[tipo]
    adicionarWidget(tipo, Math.min(info.largura, colunas), structuredClone(info.config ?? {}))
    aoFechar()
    // Leva até o widget novo, no fim do painel.
    window.setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 100)
  }

  return (
    <Dialog open={aberto} onOpenChange={(valor) => !valor && aoFechar()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Adicionar widget</DialogTitle>
          <DialogDescription>Escolha o que quer ver no início. Depois dá para mudar tamanho, cor, título e opções.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {categorias.map((categoria) => (
            <section key={categoria} className="space-y-2">
              <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{categoria}</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(catalogoWidgets) as TipoWidget[])
                  .filter((tipo) => catalogoWidgets[tipo].categoria === categoria)
                  .map((tipo) => {
                    const info = catalogoWidgets[tipo]
                    const quantos = widgets.filter((widget) => widget.tipo === tipo).length
                    return (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => adicionar(tipo)}
                        className="group flex items-start gap-3 rounded-xl border p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/40"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <info.icone className="size-4.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 text-sm font-medium">
                            {info.nome}
                            {quantos > 0 && (
                              <span className="flex items-center gap-0.5 rounded-full bg-muted px-1.5 text-[10px] font-normal text-muted-foreground">
                                <CheckIcon className="size-2.5" /> {quantos > 1 ? `${quantos}×` : "no painel"}
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{info.descricao}</span>
                        </span>
                        <PlusIcon className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    )
                  })}
              </div>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Configurar widget ----------

const comLimite: TipoWidget[] = ["tarefas-hoje", "tarefas-proximas", "rotina-proximas", "kanban-prazos", "notas-recentes", "livros", "tags"]
const estilos: { valor: NonNullable<Widget["estilo"]>; rotulo: string }[] = [
  { valor: "padrao", rotulo: "Padrão" },
  { valor: "suave", rotulo: "Suave" },
  { valor: "contorno", rotulo: "Contorno" },
  { valor: "destaque", rotulo: "Destaque" },
]

function FormularioWidget({ widget, colunas, aoFechar }: { widget: Widget; colunas: number; aoFechar: () => void }) {
  const { widgets, atualizarWidget, configurarWidget, moverWidget, duplicarWidget, removerWidget } = useInicio(
    useShallow((estado) => ({
      widgets: estado.widgets,
      atualizarWidget: estado.atualizarWidget,
      configurarWidget: estado.configurarWidget,
      moverWidget: estado.moverWidget,
      duplicarWidget: estado.duplicarWidget,
      removerWidget: estado.removerWidget,
    }))
  )
  const { livros, notas } = useNotas(useShallow((estado) => ({ livros: estado.livros, notas: estado.notas })))
  const quadros = useKanban((estado) => estado.quadros)
  const info = catalogoWidgets[widget.tipo]
  const indice = widgets.findIndex((item) => item.id === widget.id)
  const config = (mudancas: Parameters<typeof configurarWidget>[1]) => configurarWidget(widget.id, mudancas)
  const tipo = widget.tipo

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><info.icone className="size-4" /> {info.nome}</DialogTitle>
        <DialogDescription>{info.descricao} As mudanças aparecem na hora.</DialogDescription>
      </DialogHeader>

      <Campo rotulo="Título">
        <Input value={widget.titulo ?? ""} onChange={(evento) => atualizarWidget(widget.id, { titulo: evento.target.value })} placeholder={info.nome} />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Largura">
          <Escolha
            valor={Math.min(widget.largura, colunas)}
            opcoes={Array.from({ length: colunas }, (_, posicao) => ({ valor: posicao + 1, rotulo: posicao + 1 === colunas ? "Inteira" : `${posicao + 1}/${colunas}` }))}
            aoMudar={(largura) => atualizarWidget(widget.id, { largura })}
          />
        </Campo>
        {!info.alturaAutomatica && (
          <Campo rotulo="Altura">
            <Escolha
              valor={widget.alturaPx ? ("livre" as Widget["altura"]) : widget.altura}
              opcoes={[{ valor: "baixa", rotulo: "Baixa" }, { valor: "normal", rotulo: "Normal" }, { valor: "alta", rotulo: "Alta" }]}
              aoMudar={(altura) => atualizarWidget(widget.id, { altura, alturaPx: undefined })}
            />
          </Campo>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Cor">
          <SeletorCor valor={widget.cor ?? null} aoMudar={(cor) => atualizarWidget(widget.id, { cor })} permitirNenhuma />
        </Campo>
        <Campo rotulo="Estilo do cartão">
          <Escolha valor={widget.estilo ?? "padrao"} opcoes={estilos} aoMudar={(estilo) => atualizarWidget(widget.id, { estilo })} />
        </Campo>
      </div>

      {/* Opções de cada tipo */}
      {tipo === "numeros" && (
        <Campo rotulo="Números mostrados">
          <EscolhaMultipla valores={widget.config.metricas ?? []} opcoes={nomesMetricas} aoMudar={(metricas) => config({ metricas })} />
        </Campo>
      )}
      {tipo === "atalhos" && (
        <Campo rotulo="Atalhos">
          <EscolhaMultipla
            valores={widget.config.atalhos ?? []}
            opcoes={Object.fromEntries(Object.entries(opcoesAtalhos).map(([chave, atalho]) => [chave, atalho.nome]))}
            aoMudar={(atalhos) => config({ atalhos })}
          />
        </Campo>
      )}
      {comLimite.includes(tipo) && (
        <Campo rotulo="Quantidade de itens">
          <Escolha
            valor={widget.config.limite ?? catalogoWidgets[tipo].config?.limite ?? 6}
            opcoes={(tipo === "tags" ? [10, 20, 40, 80] : [3, 4, 6, 8, 12, 20]).map((valor) => ({ valor, rotulo: String(valor) }))}
            aoMudar={(limite) => config({ limite })}
          />
        </Campo>
      )}
      {tipo === "tarefas-proximas" && (
        <Campo rotulo="Quantos dias à frente">
          <Escolha valor={widget.config.dias ?? 7} opcoes={[3, 7, 14, 30].map((valor) => ({ valor, rotulo: `${valor} dias` }))} aoMudar={(dias) => config({ dias })} />
        </Campo>
      )}
      {(tipo === "tarefas-hoje" || tipo === "tarefas-proximas") && (
        <div className="grid gap-1">
          <Marcar marcado={widget.config.incluirNotas !== false} aoMudar={(incluirNotas) => config({ incluirNotas })}>
            Incluir tarefas escritas nas notas
          </Marcar>
          {tipo === "tarefas-hoje" && (
            <Marcar marcado={Boolean(widget.config.mostrarConcluidas)} aoMudar={(mostrarConcluidas) => config({ mostrarConcluidas })}>
              Mostrar as que já concluí hoje
            </Marcar>
          )}
        </div>
      )}
      {tipo === "relogio" && (
        <Marcar marcado={Boolean(widget.config.segundos)} aoMudar={(segundos) => config({ segundos })}>Mostrar os segundos</Marcar>
      )}
      {(tipo === "notas-recentes" || tipo === "grafo") && (
        <Campo rotulo="Livro">
          <select value={widget.config.livroId ?? ""} onChange={(evento) => config({ livroId: evento.target.value || null })} className={classeSelect}>
            <option value="">Todos os livros</option>
            {livros.map((livro) => <option key={livro.id} value={livro.id}>{livro.titulo}</option>)}
          </select>
        </Campo>
      )}
      {(tipo === "kanban-andamento" || tipo === "kanban-prazos") && (
        <Campo rotulo="Quadro">
          <select value={widget.config.quadroId ?? ""} onChange={(evento) => config({ quadroId: evento.target.value || null })} className={classeSelect}>
            <option value="">{tipo === "kanban-prazos" ? "Todos os quadros" : "O último aberto no Kanban"}</option>
            {quadros.map((quadro) => <option key={quadro.id} value={quadro.id}>{quadro.titulo}</option>)}
          </select>
        </Campo>
      )}
      {tipo === "nota-fixada" && (
        <Campo rotulo="Nota">
          <select value={widget.config.notaId ?? ""} onChange={(evento) => config({ notaId: evento.target.value || null })} className={classeSelect}>
            <option value="">Escolha uma nota…</option>
            {[...notas].sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR")).map((nota) => (
              <option key={nota.id} value={nota.id}>
                {nota.titulo}{nota.livroId ? ` — ${livros.find((livro) => livro.id === nota.livroId)?.titulo ?? ""}` : ""}
              </option>
            ))}
          </select>
        </Campo>
      )}
      {tipo === "bloco-notas" && (
        <Campo rotulo="Texto">
          <Textarea value={widget.config.texto ?? ""} onChange={(evento) => config({ texto: evento.target.value })} className="min-h-20" />
        </Campo>
      )}

      <Campo rotulo="Posição no painel">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={indice <= 0} onClick={() => moverWidget(widget.id, indice - 1)}>
            <ArrowLeftIcon /> Antes
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">{indice + 1} de {widgets.length}</span>
          <Button type="button" variant="outline" size="sm" disabled={indice >= widgets.length - 1} onClick={() => moverWidget(widget.id, indice + 1)}>
            Depois <ArrowRightIcon />
          </Button>
        </div>
      </Campo>

      <DialogFooter className="gap-2 sm:justify-between">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              removerWidget(widget.id)
              aoFechar()
            }}
          >
            <Trash2Icon /> Remover
          </Button>
          <Button type="button" variant="outline" onClick={() => duplicarWidget(widget.id)}>
            <CopyIcon /> Duplicar
          </Button>
        </div>
        <Button type="button" onClick={aoFechar}>Pronto</Button>
      </DialogFooter>
    </div>
  )
}

export function DialogoConfigurarWidget({ widget, colunas, aoFechar }: { widget: Widget | null; colunas: number; aoFechar: () => void }) {
  return (
    <Dialog open={widget !== null} onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {widget && <FormularioWidget key={widget.id} widget={widget} colunas={colunas} aoFechar={aoFechar} />}
      </DialogContent>
    </Dialog>
  )
}
