"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarIcon, CheckIcon, FileTextIcon, FlagIcon, ListTodoIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { CabecalhoPagina, Pagina, ResumoLinha } from "@/components/pagina"
import { cn } from "@/lib/utils"

import { DialogoTarefa, classeSelect } from "@/components/tarefas/dialogo-tarefa"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useHoje } from "@/hooks/use-hoje"
import { AvisosPrazo } from "@/components/avisos-prazo"
import { itensDeHoje, useTarefasUnificadas, type ItemTarefa } from "@/hooks/use-tarefas-unificadas"
import { formatarDataRelativa } from "@/lib/datas"
import { prioridades, useTarefas } from "@/lib/estado/tarefas"
import type { Prioridade, Tarefa } from "@/lib/tipos"

type Filtro = "hoje" | "proximas" | "pendentes" | "concluidas"

const coresPrioridade: Record<Prioridade, string> = {
  alta: "text-red-500",
  media: "text-amber-500",
  baixa: "text-sky-500",
}

// Caixinha redonda de concluir.
export function MarcadorConcluida({
  concluida,
  aoAlternar,
  rotulo,
}: {
  concluida: boolean
  aoAlternar: () => void
  rotulo: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={concluida}
      aria-label={rotulo}
      onClick={aoAlternar}
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        concluida ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 hover:border-primary"
      )}
    >
      {concluida && <CheckIcon className="size-3" strokeWidth={3} />}
    </button>
  )
}

function LinhaTarefa({ tarefa, hoje, aoAbrir }: { tarefa: Tarefa; hoje: string; aoAbrir: () => void }) {
  const alternarConcluida = useTarefas((estado) => estado.alternarConcluida)
  const excluirTarefa = useTarefas((estado) => estado.excluirTarefa)
  const atrasada = !tarefa.concluida && tarefa.prazo !== null && tarefa.prazo < hoje

  return (
    <li className="group flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50">
      <div className="pt-0.5">
        <MarcadorConcluida
          concluida={tarefa.concluida}
          aoAlternar={() => alternarConcluida(tarefa.id)}
          rotulo={`Concluir “${tarefa.titulo}”`}
        />
      </div>
      <button type="button" onClick={aoAbrir} className="min-w-0 flex-1 text-left">
        <p className={cn("text-sm break-words", tarefa.concluida && "text-muted-foreground line-through")}>
          {tarefa.titulo}
        </p>
        {tarefa.descricao && <p className="line-clamp-1 text-xs text-muted-foreground">{tarefa.descricao}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
          {tarefa.prazo && (
            <span className={cn("flex items-center gap-1", atrasada ? "font-medium text-destructive" : "text-muted-foreground")}>
              <CalendarIcon className="size-3" />
              {atrasada ? `Atrasada · ${formatarDataRelativa(tarefa.prazo)}` : formatarDataRelativa(tarefa.prazo)}
            </span>
          )}
          <span className={cn("flex items-center gap-1", coresPrioridade[tarefa.prioridade])}>
            <FlagIcon className="size-3" />
            {prioridades.find((item) => item.id === tarefa.prioridade)?.titulo}
          </span>
          {tarefa.lista && <Badge variant="secondary">{tarefa.lista}</Badge>}
        </div>
      </button>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Excluir tarefa"
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        onClick={() => excluirTarefa(tarefa.id)}
      >
        <Trash2Icon />
      </Button>
    </li>
  )
}

function NovaTarefa({ listas, prazoPadrao }: { listas: string[]; prazoPadrao: string }) {
  const adicionarTarefa = useTarefas((estado) => estado.adicionarTarefa)
  const [titulo, setTitulo] = useState("")
  const [prazo, setPrazo] = useState(prazoPadrao)
  const [prioridade, setPrioridade] = useState<Prioridade>("media")
  const [lista, setLista] = useState("")

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault()
        adicionarTarefa({ titulo, prazo: prazo || null, prioridade, lista })
        setTitulo("")
      }}
      className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center"
    >
      <Input
        value={titulo}
        onChange={(evento) => setTitulo(evento.target.value)}
        placeholder="Adicionar tarefa… (Enter para salvar)"
        aria-label="Título da nova tarefa"
        className="sm:flex-1"
      />
      <div className="flex gap-2">
        <Input type="date" value={prazo} onChange={(evento) => setPrazo(evento.target.value)} aria-label="Prazo" className="w-36" />
        <select value={prioridade} onChange={(evento) => setPrioridade(evento.target.value as Prioridade)} aria-label="Prioridade" className={cn(classeSelect, "w-24")}>
          {prioridades.map((item) => (
            <option key={item.id} value={item.id}>{item.titulo}</option>
          ))}
        </select>
        <Input value={lista} onChange={(evento) => setLista(evento.target.value)} list="listas-tarefas" placeholder="Lista" aria-label="Lista" className="w-28" />
        <datalist id="listas-tarefas">
          {listas.map((item) => <option key={item} value={item} />)}
        </datalist>
        <Button type="submit" size="icon" aria-label="Adicionar tarefa">
          <PlusIcon />
        </Button>
      </div>
    </form>
  )
}

// Tarefa escrita dentro de uma nota: marca direto no texto da nota.
function LinhaTarefaNota({ item, hoje, aoAlternar }: { item: Extract<ItemTarefa, { origem: "nota" }>; hoje: string; aoAlternar: () => void }) {
  const { daNota } = item
  const atrasada = !item.concluida && item.prazo !== null && item.prazo < hoje
  return (
    <li className="group flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50">
      <div className="pt-0.5">
        <MarcadorConcluida concluida={item.concluida} aoAlternar={aoAlternar} rotulo={`Concluir “${item.titulo}”`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm break-words", item.concluida && "text-muted-foreground line-through")}>{item.titulo}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
          {item.prazo && (
            <span className={cn("flex items-center gap-1", atrasada ? "font-medium text-destructive" : "text-muted-foreground")}>
              <CalendarIcon className="size-3" />
              {atrasada ? `Atrasada · ${formatarDataRelativa(item.prazo)}` : formatarDataRelativa(item.prazo)}
            </span>
          )}
          <Link href={`/notas/${daNota.notaId}`} className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground hover:text-foreground">
            <FileTextIcon className="size-3" />
            {daNota.livroTitulo ? `${daNota.livroTitulo} / ` : ""}{daNota.notaTitulo}
          </Link>
          {daNota.tags.map((tag) => (
            <Link key={tag} href={`/tags?tag=${encodeURIComponent(tag)}`} className="text-muted-foreground hover:text-foreground">#{tag}</Link>
          ))}
        </div>
      </div>
    </li>
  )
}

function ordenarItens(itens: ItemTarefa[]) {
  const peso = (item: ItemTarefa) =>
    item.origem === "lista" ? (prioridades.find((prioridade) => prioridade.id === item.tarefa.prioridade)?.peso ?? 1) : 1
  return [...itens].sort((a, b) => {
    if (a.concluida !== b.concluida) return a.concluida ? 1 : -1
    const prazoA = a.prazo ?? "9999-99-99"
    const prazoB = b.prazo ?? "9999-99-99"
    if (prazoA !== prazoB) return prazoA < prazoB ? -1 : 1
    return peso(a) - peso(b)
  })
}

const FILTRO_NOTAS = "__notas__"

// Rafael Marques - 20/10/2026
// Lista de tarefas com prazo, prioridade e listas (projetos),
// junto com as tarefas escritas dentro das notas.
export function ListaTarefas() {
  const hoje = useHoje()
  const tarefas = useTarefas((estado) => estado.tarefas)
  const limparConcluidas = useTarefas((estado) => estado.limparConcluidas)
  const { itens, alternar } = useTarefasUnificadas(hoje)
  const [filtro, setFiltro] = useState<Filtro>("hoje")
  const [listaAtiva, setListaAtiva] = useState<string | null>(null)
  const [idAberto, setIdAberto] = useState<string | null>(null)

  if (!hoje) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const listas = [...new Set(tarefas.map((tarefa) => tarefa.lista).filter(Boolean))].sort()
  const temDasNotas = itens.some((item) => item.origem === "nota")
  const pendentes = itens.filter((item) => !item.concluida)
  const porFiltro: Record<Filtro, ItemTarefa[]> = {
    hoje: itensDeHoje(itens, hoje),
    proximas: pendentes.filter((item) => item.prazo !== null && item.prazo > hoje),
    pendentes,
    concluidas: itens.filter((item) => item.concluida),
  }
  const visiveis = ordenarItens(
    porFiltro[filtro].filter((item) => {
      if (!listaAtiva) return true
      if (listaAtiva === FILTRO_NOTAS) return item.origem === "nota"
      return item.origem === "lista" && item.tarefa.lista === listaAtiva
    })
  )
  const tarefaAberta = tarefas.find((tarefa) => tarefa.id === idAberto) ?? null
  const atrasadas = pendentes.filter((item) => item.prazo !== null && item.prazo < hoje).length

  const mensagensVazias: Record<Filtro, string> = {
    hoje: "Nada para hoje. Aproveite!",
    proximas: "Nenhuma tarefa com prazo futuro.",
    pendentes: "Nenhuma tarefa pendente.",
    concluidas: "Nenhuma tarefa concluída ainda.",
  }

  const chip = (ativo: boolean) =>
    cn("rounded-full border px-3 py-0.5 text-xs", ativo && "border-primary bg-primary text-primary-foreground")

  return (
    <Pagina>
      <CabecalhoPagina
        secao="Organização"
        icone={ListTodoIcon}
        titulo="Tarefas"
        descricao="Suas tarefas e as que você escreveu nas notas, num lugar só."
        resumo={
          <ResumoLinha
            itens={[
              { valor: porFiltro.hoje.length, texto: "para hoje" },
              atrasadas > 0 && { valor: atrasadas, texto: atrasadas === 1 ? "atrasada" : "atrasadas", alerta: true },
              { valor: pendentes.length, texto: pendentes.length === 1 ? "pendente" : "pendentes" },
              { valor: porFiltro.concluidas.length, texto: porFiltro.concluidas.length === 1 ? "concluída" : "concluídas" },
            ]}
          />
        }
      />

      <AvisosPrazo areas={["tarefas"]} comLinks={false} />

      <NovaTarefa listas={listas} prazoPadrao={filtro === "hoje" ? hoje : ""} key={filtro} />
      <p className="-mt-3 text-xs text-muted-foreground">
        Dica: em qualquer nota, <code>[] Estudar @amanhã</code> também vira tarefa aqui.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={filtro} onValueChange={(valor) => setFiltro(valor as Filtro)}>
          <TabsList>
            <TabsTrigger value="hoje">Hoje ({porFiltro.hoje.length})</TabsTrigger>
            <TabsTrigger value="proximas">Próximas</TabsTrigger>
            <TabsTrigger value="pendentes">Todas</TabsTrigger>
            <TabsTrigger value="concluidas">Concluídas</TabsTrigger>
          </TabsList>
        </Tabs>
        {filtro === "concluidas" && tarefas.some((tarefa) => tarefa.concluida) && (
          <Button variant="ghost" size="sm" onClick={limparConcluidas}>
            <Trash2Icon /> Limpar concluídas
          </Button>
        )}
      </div>

      {(listas.length > 0 || temDasNotas) && (
        <div className="flex flex-wrap gap-1.5" aria-label="Filtrar por lista">
          <button type="button" onClick={() => setListaAtiva(null)} className={chip(!listaAtiva)}>
            Todas as listas
          </button>
          {listas.map((lista) => (
            <button key={lista} type="button" onClick={() => setListaAtiva(lista === listaAtiva ? null : lista)} className={chip(lista === listaAtiva)}>
              {lista}
            </button>
          ))}
          {temDasNotas && (
            <button type="button" onClick={() => setListaAtiva(listaAtiva === FILTRO_NOTAS ? null : FILTRO_NOTAS)} className={chip(listaAtiva === FILTRO_NOTAS)}>
              Das notas
            </button>
          )}
        </div>
      )}

      {visiveis.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {mensagensVazias[filtro]}
        </p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card px-1">
          {visiveis.map((item) =>
            item.origem === "lista" ? (
              <LinhaTarefa key={item.id} tarefa={item.tarefa} hoje={hoje} aoAbrir={() => setIdAberto(item.tarefa.id)} />
            ) : (
              <LinhaTarefaNota key={item.id} item={item} hoje={hoje} aoAlternar={() => alternar(item)} />
            )
          )}
        </ul>
      )}

      <DialogoTarefa tarefa={tarefaAberta} listas={listas} aoFechar={() => setIdAberto(null)} />
    </Pagina>
  )
}
