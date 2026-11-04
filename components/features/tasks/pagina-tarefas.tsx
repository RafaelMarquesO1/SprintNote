"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { useRef, useState } from "react"
import { AlertCircleIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import { DetalheTarefa } from "@/components/features/tasks/detalhe-tarefa"
import { itemLista } from "@/components/motion/presets"
import { Button, IconButton } from "@/components/ui/button"
import { CheckButton } from "@/components/ui/check"
import { Chip, ToggleChip } from "@/components/ui/chip"
import { EmptyState } from "@/components/ui/empty-state"
import { DateField, ListPicker, PriorityPicker } from "@/components/ui/fields"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { StatList } from "@/components/ui/stat-list"
import { PriorityIcon } from "@/components/ui/status-icon"
import { Tabs, TabsCount, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/toast"
import { useHoje } from "@/hooks/use-hoje"
import { itensDeHoje, useTarefasUnificadas, type ItemTarefa } from "@/hooks/use-tarefas-unificadas"
import { diaDaSemana, formatarDataRelativa, lerChave, somarDias } from "@/lib/datas"
import { prioridades, useTarefas } from "@/lib/estado/tarefas"
import type { Prioridade } from "@/lib/tipos"

type Filtro = "hoje" | "proximas" | "todas" | "concluidas"
const DAS_NOTAS = "__notas__"
// Tarefa concluída na aba Hoje continua na lista por um instante antes de sair (M5).
const ESPERA_SAIDA = 600

function diasEntre(de: string, ate: string) {
  return Math.round((lerChave(ate).getTime() - lerChave(de).getTime()) / 86_400_000)
}

function ordenar(itens: ItemTarefa[]) {
  const peso = (item: ItemTarefa) => (item.origem === "lista" ? (prioridades.find((p) => p.id === item.tarefa.prioridade)?.peso ?? 1) : 1)
  return [...itens].sort((a, b) => {
    if (a.concluida !== b.concluida) return a.concluida ? 1 : -1
    const pa = a.prazo ?? "9999-99-99"
    const pb = b.prazo ?? "9999-99-99"
    if (pa !== pb) return pa < pb ? -1 : 1
    return peso(a) - peso(b)
  })
}

// Tarefas (8.5): as suas e as escritas nas notas, num lugar só.
export function PaginaTarefas() {
  const hoje = useHoje()
  const parametros = useSearchParams()
  const tarefas = useTarefas((estado) => estado.tarefas)
  const { itens, alternar } = useTarefasUnificadas(hoje)
  const [filtro, setFiltro] = useState<Filtro>("hoje")
  const [lista, setLista] = useState<string | null>(null)
  const [aberta, setAberta] = useState<string | null>(null)
  const [saindo, setSaindo] = useState<Set<string>>(new Set())

  if (!hoje) {
    return (
      <div className="space-y-6">
        <Skeleton variant="line" className="h-12 w-60" />
        <Skeleton variant="block" className="h-14" />
        <Skeleton variant="card" className="h-64" />
      </div>
    )
  }

  const listas = [...new Set(tarefas.map((tarefa) => tarefa.lista).filter(Boolean))].sort()
  const temDasNotas = itens.some((item) => item.origem === "nota")
  const pendentes = itens.filter((item) => !item.concluida)
  const concluidas = itens.filter((item) => item.concluida)
  const deHoje = itensDeHoje(itens, hoje)
  const porFiltro: Record<Filtro, ItemTarefa[]> = {
    hoje: [...deHoje, ...itens.filter((item) => item.concluida && saindo.has(item.id))],
    proximas: pendentes.filter((item) => item.prazo !== null && item.prazo > hoje),
    todas: pendentes,
    concluidas,
  }
  const visiveis = ordenar(
    porFiltro[filtro].filter((item) => {
      if (!lista) return true
      if (lista === DAS_NOTAS) return item.origem === "nota"
      return item.origem === "lista" && item.tarefa.lista === lista
    })
  )

  function concluir(item: ItemTarefa) {
    const vaiConcluir = !item.concluida
    alternar(item)
    if (!vaiConcluir) return
    if (filtro === "hoje") {
      setSaindo((atual) => new Set(atual).add(item.id))
      setTimeout(() => setSaindo((atual) => {
        const novo = new Set(atual)
        novo.delete(item.id)
        return novo
      }), ESPERA_SAIDA)
    }
    // Marcar é alternar (na lista e no texto da nota): desfazer é alternar de novo.
    toast.comDesfazer("Tarefa concluída.", () => alternar(item))
  }

  const grupos = filtro === "proximas" ? agruparProximas(visiveis, hoje) : [{ titulo: null as string | null, itens: visiveis }]
  const vazios: Record<Filtro, React.ReactNode> = {
    hoje: (
      <>
        Nada para hoje. Que tal olhar as{" "}
        <button type="button" onClick={() => setFiltro("proximas")} className="font-semibold text-paper underline underline-offset-4">
          próximas
        </button>
        ?
      </>
    ),
    proximas: "Nenhuma tarefa com data nos próximos dias.",
    todas: "Nenhuma tarefa pendente.",
    concluidas: "Nenhuma tarefa concluída ainda.",
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tarefas"
        description="Suas tarefas e as que você escreveu nas notas, num lugar só."
        stats={
          <StatList
            stats={[
              { label: "para hoje", value: deHoje.length },
              { label: pendentes.length === 1 ? "pendente" : "pendentes", value: pendentes.length },
              { label: concluidas.length === 1 ? "concluída" : "concluídas", value: concluidas.length },
            ]}
          />
        }
      />

      <div className="space-y-2">
        <NovaTarefa listas={listas} prazoPadrao={filtro === "hoje" ? hoje : null} focar={parametros.get("criar") === "1"} />
        <p className="text-small text-ink-soft">
          Em qualquer nota, <code className="rounded-xs bg-raised px-1.5 py-0.5 font-mono text-code text-ink">[] Estudar @amanhã</code> também vira tarefa aqui.
        </p>
      </div>

      <div className="space-y-4">
        <Tabs value={filtro} onValueChange={(valor) => setFiltro(valor as Filtro)}>
          {/* Rafael Marques - 04/11/2026 (v1.5a): no celular as quatro abas dividem a largura (antes "Concluídas" era cortada). */}
          <TabsList className="max-sm:w-full max-sm:[&>[data-slot=tabs-trigger]]:flex-1 max-sm:[&>[data-slot=tabs-trigger]]:px-1 max-sm:[&>[data-slot=tabs-trigger]]:gap-1 max-sm:[&>[data-slot=tabs-trigger]]:text-small">
            <TabsTrigger value="hoje">
              Hoje <TabsCount>{deHoje.length}</TabsCount>
            </TabsTrigger>
            <TabsTrigger value="proximas">
              Próximas <TabsCount>{porFiltro.proximas.length}</TabsCount>
            </TabsTrigger>
            <TabsTrigger value="todas">
              Todas <TabsCount>{pendentes.length}</TabsCount>
            </TabsTrigger>
            <TabsTrigger value="concluidas">
              Concluídas <TabsCount>{concluidas.length}</TabsCount>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {listas.length > 0 || temDasNotas ? (
          <div role="group" aria-label="Filtrar por lista" className="flex flex-wrap gap-1.5">
            <ToggleChip pressed={lista === null} onPressedChange={() => setLista(null)}>
              Todas as listas
            </ToggleChip>
            {listas.map((nome) => (
              <ToggleChip key={nome} pressed={lista === nome} onPressedChange={(ligar) => setLista(ligar ? nome : null)}>
                {nome}
              </ToggleChip>
            ))}
            {temDasNotas ? (
              <ToggleChip pressed={lista === DAS_NOTAS} onPressedChange={(ligar) => setLista(ligar ? DAS_NOTAS : null)}>
                Das notas
              </ToggleChip>
            ) : null}
          </div>
        ) : null}

        {visiveis.length === 0 ? (
          <EmptyState variant="inline" title={vazios[filtro]} />
        ) : (
          grupos.map((grupo) => (
            <section key={grupo.titulo ?? "todas"} aria-label={grupo.titulo ?? undefined} className="space-y-1">
              {grupo.titulo ? <h2 className="pt-2 text-micro font-medium text-ink-muted">{grupo.titulo}</h2> : null}
              <ul className="divide-y divide-line rounded-xl border border-line bg-panel px-2">
                <AnimatePresence initial={false}>
                  {grupo.itens.map((item) => (
                    <motion.li key={item.id} {...itemLista} className="overflow-hidden">
                      <Linha item={item} hoje={hoje} aoConcluir={() => concluir(item)} aoAbrir={() => item.origem === "lista" && setAberta(item.tarefa.id)} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))
        )}
      </div>

      <DetalheTarefa tarefa={tarefas.find((tarefa) => tarefa.id === aberta) ?? null} listas={listas} aoFechar={() => setAberta(null)} />
    </div>
  )
}

function agruparProximas(itens: ItemTarefa[], hoje: string) {
  const amanha = somarDias(hoje, 1)
  // Até domingo desta semana (segunda é o início).
  const fimDaSemana = somarDias(hoje, (7 - diaDaSemana(hoje)) % 7)
  const grupos = [
    { titulo: "Amanhã", itens: itens.filter((item) => item.prazo === amanha) },
    { titulo: "Esta semana", itens: itens.filter((item) => item.prazo! > amanha && item.prazo! <= fimDaSemana) },
    { titulo: "Depois", itens: itens.filter((item) => item.prazo! > fimDaSemana && item.prazo! > amanha) },
  ]
  return grupos.filter((grupo) => grupo.itens.length > 0)
}

function Prazo({ prazo, hoje, concluida }: { prazo: string | null; hoje: string; concluida: boolean }) {
  if (!prazo) return null
  if (!concluida && prazo < hoje) {
    const dias = diasEntre(prazo, hoje)
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-small text-paper">
        <AlertCircleIcon aria-hidden="true" className="size-3.5" />
        Atrasada há {dias === 1 ? "1 dia" : `${dias} dias`}
      </span>
    )
  }
  if (prazo === hoje) return <span className="shrink-0 text-small font-semibold text-ember">Hoje</span>
  return <span className="shrink-0 text-small text-ink-soft">{formatarDataRelativa(prazo)}</span>
}

function Linha({ item, hoje, aoConcluir, aoAbrir }: { item: ItemTarefa; hoje: string; aoConcluir: () => void; aoAbrir: () => void }) {
  const atualizar = useTarefas((estado) => estado.atualizarTarefa)
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(item.titulo)
  const lista = item.origem === "lista"

  return (
    <div className="group flex min-h-row items-center gap-3 py-1 pr-1">
      <CheckButton checked={item.concluida} onCheckedChange={aoConcluir} label={`Concluir ${item.titulo}`} />
      {editando && lista ? (
        <form
          className="min-w-0 flex-1"
          onSubmit={(evento) => {
            evento.preventDefault()
            if (texto.trim()) atualizar(item.tarefa.id, { titulo: texto.trim() })
            setEditando(false)
          }}
        >
          <Input
            autoFocus
            inputSize="sm"
            aria-label="Título da tarefa"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            onBlur={() => {
              if (texto.trim()) atualizar(item.tarefa.id, { titulo: texto.trim() })
              setEditando(false)
            }}
            onKeyDown={(evento) => {
              if (evento.key === "Escape") {
                setTexto(item.titulo)
                setEditando(false)
              }
            }}
          />
        </form>
      ) : (
        <button
          type="button"
          disabled={!lista}
          onClick={() => {
            setTexto(item.titulo)
            setEditando(true)
          }}
          className={cn("min-w-0 flex-1 text-left text-ui sm:truncate", item.concluida ? "text-ink-soft" : "text-paper", lista && "cursor-text")}
        >
          <span className="line-clamp-2 sm:hidden">{item.titulo}</span>
          <span className="max-sm:hidden">{item.titulo}</span>
          {/* No celular o prazo fica embaixo do título (ao lado, apertava o título até sumir). */}
          {item.prazo ? (
            <span className="mt-0.5 block sm:hidden">
              <Prazo prazo={item.prazo} hoje={hoje} concluida={item.concluida} />
            </span>
          ) : null}
        </button>
      )}
      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
        {item.origem === "lista" && item.tarefa.lista ? <Chip>{item.tarefa.lista}</Chip> : null}
        {item.origem === "nota" ? (
          <Link href={`/notas/${item.daNota.notaId}`} className="max-w-48 truncate rounded-full border border-line-strong px-2.5 py-0.5 text-micro text-ink hover:border-ink-muted">
            da nota {item.daNota.notaTitulo}
          </Link>
        ) : null}
      </div>
      <span className="max-sm:hidden">
        <Prazo prazo={item.prazo} hoje={hoje} concluida={item.concluida} />
      </span>
      {item.origem === "lista" ? <PriorityIcon priority={item.tarefa.prioridade} label /> : <span className="size-4" />}
      {lista ? (
        <IconButton aria-label={`Detalhes de ${item.titulo}`} size="sm" onClick={aoAbrir} className="opacity-60 group-hover:opacity-100 focus-visible:opacity-100">
          <MoreHorizontalIcon />
        </IconButton>
      ) : (
        <span className="size-control-sm" />
      )}
    </div>
  )
}

function NovaTarefa({ listas, prazoPadrao, focar }: { listas: string[]; prazoPadrao: string | null; focar: boolean }) {
  const adicionar = useTarefas((estado) => estado.adicionarTarefa)
  const [titulo, setTitulo] = useState("")
  const [prazo, setPrazo] = useState<string | null>(prazoPadrao)
  const [prioridade, setPrioridade] = useState<Prioridade>("media")
  const [lista, setLista] = useState("")
  const campo = useRef<HTMLInputElement>(null)

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault()
        if (!titulo.trim()) return
        adicionar({ titulo: titulo.trim(), prazo, prioridade, lista })
        setTitulo("")
        campo.current?.focus()
      }}
      className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-panel p-2"
    >
      <Label htmlFor="nova-tarefa" srOnly>
        Nova tarefa
      </Label>
      <Input
        ref={campo}
        id="nova-tarefa"
        autoFocus={focar}
        variant="bare"
        value={titulo}
        onChange={(evento) => setTitulo(evento.target.value)}
        placeholder="Nova tarefa"
        className="min-w-48 flex-1 px-2 max-sm:basis-full"
      />
      <DateField value={prazo} onChange={setPrazo} />
      <PriorityPicker value={prioridade} onChange={setPrioridade} />
      <ListPicker value={lista} onChange={setLista} lists={listas} />
      <Button type="submit" data-icon="inline-start" disabled={!titulo.trim()}>
        <PlusIcon /> Adicionar
      </Button>
    </form>
  )
}
