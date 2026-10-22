"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useShallow } from "zustand/react/shallow"
import {
  AlertTriangleIcon,
  BookOpenIcon,
  BookPlusIcon,
  CalendarClockIcon,
  CheckCheckIcon,
  CheckIcon,
  ClockIcon,
  CircleUserRoundIcon,
  FilePlusIcon,
  FileTextIcon,
  FlameIcon,
  HashIcon,
  KanbanIcon,
  LibraryIcon,
  Link2Icon,
  ListTodoIcon,
  NetworkIcon,
  PencilLineIcon,
  RepeatIcon,
  SearchIcon,
  SquareStackIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { abrirBusca } from "@/components/busca"
import { GrafoConexoes } from "@/components/grafo/grafo-conexoes"
import { Icone } from "@/components/icone"
import { ConteudoMarkdown } from "@/components/notas/visualizacao-markdown"
import { MarcadorConcluida } from "@/components/tarefas/lista-tarefas"
import { useAgora, useHoje, useHorario } from "@/hooks/use-hoje"
import { itensDeHoje, useTarefasUnificadas, type ItemTarefa } from "@/hooks/use-tarefas-unificadas"
import { corDoLivro, estiloFaixa } from "@/lib/cores"
import { diaDaSemana, formatarDataRelativa, lerChave, nomesDias, somarDias, ultimosDias } from "@/lib/datas"
import { calcularSequencia, useHabitos, valeNoDia } from "@/lib/estado/habitos"
import { useInicio, type Widget } from "@/lib/estado/inicio"
import { cartaoConcluido, colunasDoQuadro, localDoCartao, useKanban } from "@/lib/estado/kanban"
import { useNotas } from "@/lib/estado/notas"
import { itensDoDia, useRotina } from "@/lib/estado/rotina"
import { montarGrafo, type NoGrafo } from "@/lib/grafo"
import { extrairLinksWiki } from "@/lib/links-wiki"
import { contarTags } from "@/lib/tags"

// Rafael Marques - 21/10/2026
// Widgets da tela de início. Cada um lê os dados direto do sistema.

function Vazio({ children }: { children: React.ReactNode }) {
  return <p className="py-2 text-sm text-muted-foreground">{children}</p>
}

const limite = (widget: Widget, padrao: number) => widget.config.limite ?? padrao

// Só a primeira letra em maiúscula ("Quarta-feira, 21 de outubro").
const maiuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

// ---------- Números ----------

export type Metrica = { valor: React.ReactNode; rotulo: string; icone: LucideIcon; href: string; alerta?: boolean; detalhe?: string }

export const nomesMetricas: Record<string, string> = {
  "tarefas-hoje": "Tarefas para hoje",
  "tarefas-atrasadas": "Tarefas atrasadas",
  "tarefas-abertas": "Tarefas em aberto",
  "habitos-feitos": "Hábitos feitos hoje",
  "maior-sequencia": "Maior sequência de hábito",
  "rotina-feitas": "Rotina feita hoje",
  "proxima-rotina": "Próxima atividade da rotina",
  "cartoes-abertos": "Cartões em aberto (Kanban)",
  "cartoes-atrasados": "Cartões atrasados (Kanban)",
  notas: "Total de notas",
  livros: "Total de livros",
  "notas-semana": "Notas editadas na semana",
  conexoes: "Conexões entre notas",
  tags: "Tags diferentes",
}

export function useMetricas(): Record<string, Metrica> | null {
  const hoje = useHoje()
  const horario = useHorario()
  const agora = useAgora()
  const { itens } = useTarefasUnificadas(hoje)
  const habitos = useHabitos((estado) => estado.habitos)
  const itensRotina = useRotina((estado) => estado.itens)
  const feitosPorDia = useRotina((estado) => estado.feitosPorDia)
  const { cartoes, colunas } = useKanban(useShallow((estado) => ({ cartoes: estado.cartoes, colunas: estado.colunas })))
  const { notas, livros } = useNotas(useShallow((estado) => ({ notas: estado.notas, livros: estado.livros })))

  return useMemo(() => {
    if (!hoje) return null
    const pendentes = itens.filter((item) => !item.concluida)
    const deHoje = itensDeHoje(itens, hoje)
    const atrasadas = deHoje.filter((item) => item.prazo! < hoje)
    const habitosHoje = habitos.filter((habito) => valeNoDia(habito, hoje))
    const habitosFeitos = habitosHoje.filter((habito) => habito.feitos.includes(hoje)).length
    const sequencia = Math.max(0, ...habitos.map((habito) => calcularSequencia(habito, hoje)))
    const rotinaHoje = itensDoDia(itensRotina, diaDaSemana(hoje))
    const feitos = feitosPorDia[hoje] ?? []
    const rotinaFeitas = rotinaHoje.filter((item) => feitos.includes(item.id)).length
    const proxima = rotinaHoje.find((item) => item.horario > horario && !feitos.includes(item.id))
    const abertos = cartoes.filter((cartao) => !cartaoConcluido(cartao, colunas))
    const cartoesAtrasados = abertos.filter((cartao) => cartao.prazo && cartao.prazo < hoje).length
    const conexoes = notas.reduce((soma, nota) => soma + extrairLinksWiki(nota.conteudo).length, 0)
    const naSemana = agora ? notas.filter((nota) => agora - nota.atualizadoEm < 7 * 86_400_000).length : 0

    return {
      "tarefas-hoje": { valor: deHoje.length, rotulo: "Tarefas para hoje", icone: ListTodoIcon, href: "/tarefas" },
      "tarefas-atrasadas": { valor: atrasadas.length, rotulo: "Atrasadas", icone: AlertTriangleIcon, href: "/tarefas", alerta: atrasadas.length > 0 },
      "tarefas-abertas": { valor: pendentes.length, rotulo: "Tarefas em aberto", icone: ListTodoIcon, href: "/tarefas" },
      "habitos-feitos": { valor: `${habitosFeitos}/${habitosHoje.length}`, rotulo: "Hábitos hoje", icone: RepeatIcon, href: "/habitos" },
      "maior-sequencia": { valor: sequencia, rotulo: "Maior sequência", icone: FlameIcon, href: "/habitos", detalhe: "dias" },
      "rotina-feitas": { valor: `${rotinaFeitas}/${rotinaHoje.length}`, rotulo: "Rotina hoje", icone: CheckCheckIcon, href: "/rotina" },
      "proxima-rotina": { valor: proxima?.horario ?? "—", rotulo: "Próxima", icone: ClockIcon, href: "/rotina", detalhe: proxima?.titulo },
      "cartoes-abertos": { valor: abertos.length, rotulo: "Cartões abertos", icone: SquareStackIcon, href: "/kanban" },
      "cartoes-atrasados": { valor: cartoesAtrasados, rotulo: "Cartões atrasados", icone: KanbanIcon, href: "/kanban", alerta: cartoesAtrasados > 0 },
      notas: { valor: notas.length, rotulo: "Notas", icone: FileTextIcon, href: "/notas" },
      livros: { valor: livros.length, rotulo: "Livros", icone: BookOpenIcon, href: "/notas" },
      "notas-semana": { valor: naSemana, rotulo: "Editadas na semana", icone: PencilLineIcon, href: "/notas" },
      conexoes: { valor: conexoes, rotulo: "Conexões", icone: Link2Icon, href: "/grafo" },
      tags: { valor: contarTags(notas).length, rotulo: "Tags", icone: HashIcon, href: "/tags" },
    }
  }, [hoje, horario, agora, itens, habitos, itensRotina, feitosPorDia, cartoes, colunas, notas, livros])
}

function WidgetNumeros({ widget, cor }: { widget: Widget; cor: string }) {
  const metricas = useMetricas()
  const escolhidas = widget.config.metricas ?? []
  if (!metricas) return null
  if (escolhidas.length === 0) return <Vazio>Escolha os números em ⚙ Configurar.</Vazio>
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-3">
      {escolhidas.filter((chave) => metricas[chave]).map((chave) => {
        const metrica = metricas[chave]
        return (
          <Link key={chave} href={metrica.href} className="flex h-16 items-center gap-3 rounded-xl bg-(--bloco-widget) px-3 transition-colors hover:bg-(--bloco-widget-hover)">
            <span
              className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", metrica.alerta && "bg-destructive/10 text-destructive")}
              style={metrica.alerta ? undefined : { color: cor, background: `color-mix(in oklch, ${cor} 14%, transparent)` }}
            >
              <metrica.icone className="size-5" />
            </span>
            <div className="min-w-0">
              <p className={cn("text-2xl leading-none font-semibold tabular-nums", metrica.alerta && "text-destructive")}>{metrica.valor}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {metrica.rotulo}
                {metrica.detalhe && <span className="text-foreground/70"> · {metrica.detalhe}</span>}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// ---------- Progresso do dia ----------

function WidgetProgressoDia({ cor }: { cor: string }) {
  const hoje = useHoje()
  const { itens } = useTarefasUnificadas(hoje)
  const habitos = useHabitos((estado) => estado.habitos)
  const itensRotina = useRotina((estado) => estado.itens)
  const feitosPorDia = useRotina((estado) => estado.feitosPorDia)
  if (!hoje) return null

  const tarefas = itens.filter((item) => item.prazo === hoje || (!item.concluida && item.prazo !== null && item.prazo < hoje))
  const habitosHoje = habitos.filter((habito) => valeNoDia(habito, hoje))
  const rotinaHoje = itensDoDia(itensRotina, diaDaSemana(hoje))
  const feitos = feitosPorDia[hoje] ?? []
  const partes = [
    { nome: "Tarefas", feito: tarefas.filter((item) => item.concluida).length, total: tarefas.length },
    { nome: "Hábitos", feito: habitosHoje.filter((habito) => habito.feitos.includes(hoje)).length, total: habitosHoje.length },
    { nome: "Rotina", feito: rotinaHoje.filter((item) => feitos.includes(item.id)).length, total: rotinaHoje.length },
  ]
  const total = partes.reduce((soma, parte) => soma + parte.total, 0)
  const feito = partes.reduce((soma, parte) => soma + parte.feito, 0)
  const percentual = total ? Math.round((feito / total) * 100) : 0
  const raio = 42
  const volta = 2 * Math.PI * raio

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative size-32">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={raio} fill="none" stroke="var(--muted)" strokeWidth="10" />
          <circle
            cx="50"
            cy="50"
            r={raio}
            fill="none"
            stroke={cor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={volta}
            strokeDashoffset={volta * (1 - percentual / 100)}
            className="transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums">{percentual}%</span>
          <span className="text-xs text-muted-foreground">{feito} de {total}</span>
        </div>
      </div>
      <dl className="grid w-full grid-cols-3 gap-1 text-center">
        {partes.map((parte) => (
          <div key={parte.nome} className="rounded-lg bg-(--bloco-widget) px-1 py-1.5">
            <dd className="text-sm font-semibold tabular-nums">{parte.feito}/{parte.total}</dd>
            <dt className="text-[11px] text-muted-foreground">{parte.nome}</dt>
          </div>
        ))}
      </dl>
    </div>
  )
}

// ---------- Relógio ----------

function useSegundos(ativo: boolean) {
  const [agora, setAgora] = useState<Date | null>(null)
  useEffect(() => {
    const atualizar = () => setAgora(new Date())
    atualizar()
    const intervalo = window.setInterval(atualizar, ativo ? 1000 : 15_000)
    return () => window.clearInterval(intervalo)
  }, [ativo])
  return agora
}

function WidgetRelogio({ widget, cor }: { widget: Widget; cor: string }) {
  const agora = useSegundos(Boolean(widget.config.segundos))
  const hoje = useHoje()
  const horario = useHorario()
  const itensRotina = useRotina((estado) => estado.itens)
  const feitosPorDia = useRotina((estado) => estado.feitosPorDia)
  if (!agora || !hoje) return null
  const proxima = itensDoDia(itensRotina, diaDaSemana(hoje)).find((item) => item.horario > horario && !(feitosPorDia[hoje] ?? []).includes(item.id))
  const hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", ...(widget.config.segundos && { second: "2-digit" }) })
  return (
    <div className="flex h-full flex-col justify-center gap-1 text-center">
      <p className="font-mono text-5xl font-bold tracking-tight tabular-nums" style={{ color: cor }}>{hora}</p>
      <p className="text-sm text-muted-foreground">
        {maiuscula(agora.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }))}
      </p>
      {proxima && (
        <p className="mt-2 truncate text-xs text-muted-foreground">
          Próximo: <span className="font-medium text-foreground">{proxima.horario} · {proxima.titulo}</span>
        </p>
      )}
    </div>
  )
}

// ---------- Atalhos ----------

export const opcoesAtalhos: Record<string, { nome: string; icone: LucideIcon; href?: string }> = {
  "nova-nota": { nome: "Nova nota", icone: FilePlusIcon },
  "novo-livro": { nome: "Novo livro", icone: BookPlusIcon },
  buscar: { nome: "Buscar", icone: SearchIcon },
  tarefas: { nome: "Tarefas", icone: ListTodoIcon, href: "/tarefas" },
  habitos: { nome: "Hábitos", icone: RepeatIcon, href: "/habitos" },
  rotina: { nome: "Rotina", icone: CalendarClockIcon, href: "/rotina" },
  kanban: { nome: "Kanban", icone: KanbanIcon, href: "/kanban" },
  biblioteca: { nome: "Biblioteca", icone: LibraryIcon, href: "/notas" },
  grafo: { nome: "Grafo", icone: NetworkIcon, href: "/grafo" },
  tags: { nome: "Tags", icone: HashIcon, href: "/tags" },
  dados: { nome: "Minha conta", icone: CircleUserRoundIcon, href: "/conta" },
}

function WidgetAtalhos({ widget, cor }: { widget: Widget; cor: string }) {
  const router = useRouter()
  const criarNota = useNotas((estado) => estado.criarNota)
  const criarLivro = useNotas((estado) => estado.criarLivro)
  const escolhidos = (widget.config.atalhos ?? []).filter((chave) => opcoesAtalhos[chave])
  if (escolhidos.length === 0) return <Vazio>Escolha os atalhos em ⚙ Configurar.</Vazio>

  function executar(chave: string) {
    if (chave === "nova-nota") router.push(`/notas/${criarNota().id}`)
    else if (chave === "novo-livro") router.push(`/livros/${criarLivro().id}`)
    else if (chave === "buscar") abrirBusca()
    else if (opcoesAtalhos[chave].href) router.push(opcoesAtalhos[chave].href!)
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
      {escolhidos.map((chave) => {
        const atalho = opcoesAtalhos[chave]
        return (
          <button
            key={chave}
            type="button"
            onClick={() => executar(chave)}
            className="flex flex-col items-center gap-1.5 rounded-xl border bg-background/50 px-2 py-3 text-xs font-medium transition-colors hover:bg-muted"
          >
            <atalho.icone className="size-5" style={{ color: cor }} />
            {atalho.nome}
          </button>
        )
      })}
    </div>
  )
}

// ---------- Tarefas ----------

function LinhaTarefa({ tarefa, hoje, aoAlternar, mostrarData = false }: { tarefa: ItemTarefa; hoje: string; aoAlternar: () => void; mostrarData?: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <MarcadorConcluida concluida={tarefa.concluida} aoAlternar={aoAlternar} rotulo={`Concluir “${tarefa.titulo}”`} />
      <span className={cn("truncate", tarefa.concluida && "text-muted-foreground line-through")}>{tarefa.titulo}</span>
      {tarefa.origem === "nota" && (
        <Link href={`/notas/${tarefa.daNota.notaId}`} className="shrink-0 truncate text-xs text-muted-foreground hover:text-foreground">
          {tarefa.daNota.notaTitulo}
        </Link>
      )}
      {!tarefa.concluida && tarefa.prazo && tarefa.prazo < hoje ? (
        <span className="ml-auto shrink-0 text-xs text-destructive">atrasada</span>
      ) : mostrarData && tarefa.prazo ? (
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">{formatarDataRelativa(tarefa.prazo)}</span>
      ) : null}
    </li>
  )
}

function WidgetTarefasHoje({ widget }: { widget: Widget }) {
  const hoje = useHoje()
  const { itens, alternar } = useTarefasUnificadas(hoje)
  if (!hoje) return null
  const fonte = widget.config.incluirNotas === false ? itens.filter((item) => item.origem === "lista") : itens
  const pendentes = itensDeHoje(fonte, hoje).sort((a, b) => (a.prazo ?? "").localeCompare(b.prazo ?? ""))
  const feitas = widget.config.mostrarConcluidas ? fonte.filter((item) => item.concluida && item.prazo === hoje) : []
  const lista = [...pendentes, ...feitas].slice(0, limite(widget, 6))
  if (lista.length === 0) return <Vazio>Nada pendente para hoje. 🎉</Vazio>
  return (
    <ul className="space-y-2">
      {lista.map((tarefa) => <LinhaTarefa key={tarefa.id} tarefa={tarefa} hoje={hoje} aoAlternar={() => alternar(tarefa)} />)}
      {pendentes.length + feitas.length > lista.length && (
        <li className="text-xs text-muted-foreground">+{pendentes.length + feitas.length - lista.length} outras</li>
      )}
    </ul>
  )
}

function WidgetTarefasProximas({ widget }: { widget: Widget }) {
  const hoje = useHoje()
  const { itens, alternar } = useTarefasUnificadas(hoje)
  if (!hoje) return null
  const fim = somarDias(hoje, widget.config.dias ?? 7)
  const fonte = widget.config.incluirNotas === false ? itens.filter((item) => item.origem === "lista") : itens
  const lista = fonte
    .filter((item) => !item.concluida && item.prazo && item.prazo > hoje && item.prazo <= fim)
    .sort((a, b) => a.prazo!.localeCompare(b.prazo!))
    .slice(0, limite(widget, 8))
  if (lista.length === 0) return <Vazio>Nenhum prazo nos próximos {widget.config.dias ?? 7} dias.</Vazio>
  const grupos = [...new Set(lista.map((item) => item.prazo!))]
  return (
    <div className="space-y-3">
      {grupos.map((data) => (
        <div key={data}>
          <p className="mb-1 text-xs font-medium text-muted-foreground">{maiuscula(formatarDataRelativa(data))}</p>
          <ul className="space-y-1.5">
            {lista.filter((item) => item.prazo === data).map((tarefa) => (
              <LinhaTarefa key={tarefa.id} tarefa={tarefa} hoje={hoje} aoAlternar={() => alternar(tarefa)} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

// ---------- Hábitos ----------

function WidgetHabitosHoje({ cor }: { cor: string }) {
  const hoje = useHoje()
  const habitos = useHabitos((estado) => estado.habitos)
  const alternarFeito = useHabitos((estado) => estado.alternarFeito)
  if (!hoje) return null
  const deHoje = habitos.filter((habito) => valeNoDia(habito, hoje))
  if (deHoje.length === 0) return <Vazio>Nenhum hábito programado para hoje.</Vazio>
  return (
    <div className="flex flex-wrap gap-2">
      {deHoje.map((habito) => {
        const feito = habito.feitos.includes(hoje)
        const sequencia = calcularSequencia(habito, hoje)
        return (
          <button
            key={habito.id}
            type="button"
            aria-pressed={feito}
            onClick={() => alternarFeito(habito.id, hoje)}
            className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors", !feito && "hover:bg-muted")}
            style={feito ? { background: cor, borderColor: cor, color: "white" } : undefined}
          >
            <Icone nome={habito.icone} />
            {habito.nome}
            {feito ? <CheckIcon className="size-3.5" /> : sequencia > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><FlameIcon className="size-3" />{sequencia}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function WidgetHabitosSemana({ cor }: { cor: string }) {
  const hoje = useHoje()
  const habitos = useHabitos((estado) => estado.habitos)
  const alternarFeito = useHabitos((estado) => estado.alternarFeito)
  if (!hoje) return null
  if (habitos.length === 0) return <Vazio>Nenhum hábito criado ainda.</Vazio>
  const dias = ultimosDias(hoje, 7)
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] text-muted-foreground">
            <th />
            {dias.map((dia) => (
              <th key={dia} className={cn("pb-1 font-medium", dia === hoje && "text-foreground")}>{nomesDias[diaDaSemana(dia)]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {habitos.map((habito) => (
            <tr key={habito.id}>
              <td className="max-w-28 truncate py-1 pr-2">
                <span className="flex items-center gap-1.5"><Icone nome={habito.icone} className="text-muted-foreground" /> <span className="truncate">{habito.nome}</span></span>
              </td>
              {dias.map((dia) => {
                const vale = valeNoDia(habito, dia)
                const feito = habito.feitos.includes(dia)
                return (
                  <td key={dia} className="p-0.5 text-center">
                    {vale ? (
                      <button
                        type="button"
                        aria-label={`${habito.nome} em ${lerChave(dia).toLocaleDateString("pt-BR")}`}
                        aria-pressed={feito}
                        onClick={() => alternarFeito(habito.id, dia)}
                        className={cn("mx-auto block size-6 rounded-md border transition-colors", !feito && "hover:bg-muted")}
                        style={feito ? { background: cor, borderColor: cor } : undefined}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground/40">–</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------- Rotina ----------

function WidgetRotina({ widget, completa }: { widget: Widget; completa: boolean }) {
  const hoje = useHoje()
  const horario = useHorario()
  const itensRotina = useRotina((estado) => estado.itens)
  const feitosPorDia = useRotina((estado) => estado.feitosPorDia)
  const alternarFeito = useRotina((estado) => estado.alternarFeito)
  if (!hoje) return null
  const doDia = itensDoDia(itensRotina, diaDaSemana(hoje))
  const feitos = feitosPorDia[hoje] ?? []
  const lista = completa ? doDia : doDia.filter((item) => item.horario >= horario && !feitos.includes(item.id)).slice(0, limite(widget, 4))
  if (lista.length === 0) return <Vazio>{doDia.length === 0 ? "Sem rotina para hoje." : "Tudo feito por hoje na rotina."}</Vazio>
  return (
    <ol className="space-y-1.5">
      {lista.map((item, indice) => {
        const feito = feitos.includes(item.id)
        return (
          <li key={item.id} className="flex items-center gap-2.5 text-sm">
            <span className="w-11 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{item.horario}</span>
            {completa && <MarcadorConcluida concluida={feito} aoAlternar={() => alternarFeito(item.id, hoje)} rotulo={`Marcar “${item.titulo}” como feito`} />}
            <span
              className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
              style={item.cor ? { color: item.cor, background: `color-mix(in oklch, ${item.cor} 15%, transparent)` } : undefined}
            >
              <Icone nome={item.icone ?? "feito"} className="size-3.5" />
            </span>
            <span className={cn("truncate", !completa && indice === 0 && "font-medium", feito && "text-muted-foreground line-through")}>{item.titulo}</span>
          </li>
        )
      })}
    </ol>
  )
}

// ---------- Kanban ----------

function useQuadro(widget: Widget) {
  const { quadros, colunas, cartoes, quadroAtivoId } = useKanban(
    useShallow((estado) => ({ quadros: estado.quadros, colunas: estado.colunas, cartoes: estado.cartoes, quadroAtivoId: estado.quadroAtivoId }))
  )
  const quadro = quadros.find((item) => item.id === (widget.config.quadroId ?? quadroAtivoId)) ?? quadros[0]
  const doQuadro = colunasDoQuadro(colunas, quadro?.id ?? null)
  return { quadro, quadros, colunas, todasColunas: colunas, doQuadro, cartoes: cartoes.filter((cartao) => doQuadro.some((coluna) => coluna.id === cartao.colunaId)), todosCartoes: cartoes }
}

// Cabeçalho do cartão: o "Andamento do quadro" mostra o nome do próprio quadro
// em destaque (a menos que o usuário tenha dado um título ao widget).
export function useCabecalhoWidget(widget: Widget): { titulo: string | null; icone: string | null } {
  const quadro = useKanban((estado) => {
    if (widget.tipo !== "kanban-andamento") return null
    return estado.quadros.find((item) => item.id === (widget.config.quadroId ?? estado.quadroAtivoId)) ?? estado.quadros[0] ?? null
  })
  if (widget.titulo || !quadro) return { titulo: widget.titulo || null, icone: null }
  return { titulo: quadro.titulo, icone: quadro.icone }
}

function WidgetKanbanAndamento({ widget, cor }: { widget: Widget; cor: string }) {
  const { quadro, doQuadro, cartoes } = useQuadro(widget)
  if (!quadro) return <Vazio>Nenhum quadro no Kanban ainda.</Vazio>
  const concluidos = cartoes.filter((cartao) => doQuadro.find((coluna) => coluna.id === cartao.colunaId)?.concluida).length
  const progresso = cartoes.length ? Math.round((concluidos / cartoes.length) * 100) : 0
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>{widget.titulo ? `${quadro.titulo} · ` : ""}{concluidos} de {cartoes.length} concluídos</span>
          <span className="font-medium text-foreground">{progresso}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full transition-all" style={{ width: `${progresso}%`, background: cor }} />
        </div>
      </div>
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-2">
        {doQuadro.map((coluna) => (
          <div key={coluna.id} className="flex flex-col-reverse rounded-lg bg-(--bloco-widget) p-2 text-center" style={coluna.cor ? estiloFaixa(coluna.cor) : undefined}>
            <dt className="truncate text-xs text-muted-foreground">{coluna.titulo}</dt>
            <dd className="text-xl font-semibold">{cartoes.filter((cartao) => cartao.colunaId === coluna.id).length}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function WidgetKanbanPrazos({ widget }: { widget: Widget }) {
  const hoje = useHoje()
  const { quadros, todasColunas, todosCartoes, cartoes } = useQuadro(widget)
  if (!hoje) return null
  // Sem quadro escolhido: todos os quadros.
  const fonte = widget.config.quadroId ? cartoes : todosCartoes
  const lista = fonte
    .filter((cartao) => cartao.prazo && !cartaoConcluido(cartao, todasColunas))
    .sort((a, b) => a.prazo!.localeCompare(b.prazo!))
    .slice(0, limite(widget, 6))
  if (lista.length === 0) return <Vazio>Nenhum cartão aberto com prazo.</Vazio>
  return (
    <ul className="space-y-1.5">
      {lista.map((cartao) => (
        <li key={cartao.id} className="flex items-center gap-2 text-sm">
          <span className="size-2 shrink-0 rounded-full" style={{ background: cartao.cor ?? "var(--muted-foreground)" }} />
          <span className="min-w-0 flex-1 truncate">{cartao.titulo}</span>
          <span className="hidden shrink-0 truncate text-xs text-muted-foreground sm:inline">{localDoCartao(cartao, todasColunas, quadros)}</span>
          <span className={cn("shrink-0 text-xs", cartao.prazo! < hoje ? "text-destructive" : cartao.prazo === hoje ? "font-medium text-foreground" : "text-muted-foreground")}>
            {formatarDataRelativa(cartao.prazo!)}
          </span>
        </li>
      ))}
    </ul>
  )
}

// ---------- Notas e livros ----------

function WidgetNotasRecentes({ widget }: { widget: Widget }) {
  const agora = useAgora()
  const { notas, livros } = useNotas(useShallow((estado) => ({ notas: estado.notas, livros: estado.livros })))
  const filtro = widget.config.livroId
  const lista = notas
    .filter((nota) => !filtro || nota.livroId === filtro)
    .sort((a, b) => b.atualizadoEm - a.atualizadoEm)
    .slice(0, limite(widget, 6))
  if (lista.length === 0) return <Vazio>Nenhuma nota ainda.</Vazio>
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-1">
      {lista.map((nota) => {
        const cor = corDoLivro(livros, nota.livroId)
        return (
          <li key={nota.id}>
            <Link href={`/notas/${nota.id}`} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
              <Icone nome={nota.icone} className="text-muted-foreground" />
              <span className="truncate">{nota.titulo}</span>
              {cor && <span className="size-1.5 shrink-0 rounded-full" style={{ background: cor }} />}
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {agora ? new Date(nota.atualizadoEm).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }) : ""}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function WidgetNotaFixada({ widget }: { widget: Widget }) {
  const nota = useNotas((estado) => estado.notas.find((item) => item.id === widget.config.notaId))
  if (!nota) return <Vazio>Escolha uma nota em ⚙ Configurar.</Vazio>
  return (
    <div className="space-y-2">
      <Link href={`/notas/${nota.id}`} className="flex items-center gap-2 font-medium hover:underline">
        <Icone nome={nota.icone} className="text-muted-foreground" /> {nota.titulo}
      </Link>
      <div className="prose-sm max-h-72 overflow-y-auto text-sm [&_h1]:text-base [&_h2]:text-sm">
        {nota.conteudo.trim() ? <ConteudoMarkdown texto={nota.conteudo} livroId={nota.livroId} /> : <Vazio>Nota vazia.</Vazio>}
      </div>
    </div>
  )
}

function WidgetLivros({ widget }: { widget: Widget }) {
  const { notas, livros } = useNotas(useShallow((estado) => ({ notas: estado.notas, livros: estado.livros })))
  if (livros.length === 0) return <Vazio>Nenhum livro ainda.</Vazio>
  const lista = [...livros]
    .sort((a, b) => Number(Boolean(b.fixado)) - Number(Boolean(a.fixado)) || b.atualizadoEm - a.atualizadoEm)
    .slice(0, limite(widget, 6))
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2">
      {lista.map((livro) => {
        const cor = corDoLivro(livros, livro.id)!
        const total = notas.filter((nota) => nota.livroId === livro.id).length
        return (
          <li key={livro.id}>
            <Link
              href={`/livros/${livro.id}`}
              className="flex items-center gap-2 rounded-lg border p-2 text-sm transition-colors hover:bg-muted"
              style={estiloFaixa(cor, "esquerda")}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md" style={{ color: cor, background: `color-mix(in oklch, ${cor} 15%, transparent)` }}>
                <Icone nome={livro.icone} />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{livro.titulo}</span>
                <span className="block text-xs text-muted-foreground">{total} nota{total === 1 ? "" : "s"}</span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function WidgetTags({ widget, cor }: { widget: Widget; cor: string }) {
  const notas = useNotas((estado) => estado.notas)
  const tags = contarTags(notas).slice(0, limite(widget, 20))
  if (tags.length === 0) return <Vazio>Nenhuma #tag nas notas ainda.</Vazio>
  const maximo = tags[0].total
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      {tags.map(({ tag, total }) => {
        const peso = maximo > 1 ? (total - 1) / (maximo - 1) : 1
        return (
          <Link
            key={tag}
            href={`/tags?tag=${encodeURIComponent(tag)}`}
            className="hover:underline"
            style={{ fontSize: `${0.8 + peso * 0.7}rem`, color: `color-mix(in oklch, ${cor} ${45 + peso * 55}%, var(--muted-foreground))` }}
            title={`${total} nota(s)`}
          >
            #{tag}
          </Link>
        )
      })}
    </div>
  )
}

const alturasGrafo = { baixa: 220, normal: 320, alta: 480 }

function WidgetGrafo({ widget }: { widget: Widget }) {
  const router = useRouter()
  const biblioteca = useNotas(useShallow((estado) => ({ notas: estado.notas, livros: estado.livros })))
  const filtro = widget.config.livroId
  const grafo = useMemo(
    () => montarGrafo(biblioteca, { estrutura: true, fantasmas: false, ...(filtro && { livros: new Set([filtro]) }) }),
    [biblioteca, filtro]
  )
  if (grafo.nos.length === 0) return <Vazio>Crie notas e conecte com [[ para ver o grafo.</Vazio>
  function abrir(no: NoGrafo) {
    if (no.tipo === "nota") router.push(`/notas/${no.id.replace("nota:", "")}`)
    else if (no.tipo === "livro") router.push(`/livros/${no.id.replace("livro:", "")}`)
  }
  return (
    <GrafoConexoes
      nos={grafo.nos}
      arestas={grafo.arestas}
      ordemLivros={biblioteca.livros.map((livro) => livro.id)}
      altura={alturasGrafo[widget.altura]}
      aoClicarNo={abrir}
      className="border-0 bg-transparent"
    />
  )
}

// ---------- Bloco de notas ----------

function WidgetBlocoNotas({ widget, cor }: { widget: Widget; cor: string }) {
  const configurarWidget = useInicio((estado) => estado.configurarWidget)
  return (
    <textarea
      value={widget.config.texto ?? ""}
      onChange={(evento) => configurarWidget(widget.id, { texto: evento.target.value })}
      placeholder="Escreva algo rápido…"
      aria-label="Bloco de notas"
      className={cn(
        "h-full w-full resize-none rounded-lg p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        widget.alturaPx ? "min-h-16" : widget.altura === "alta" ? "min-h-80" : widget.altura === "baixa" ? "min-h-24" : "min-h-40"
      )}
      style={{ background: `color-mix(in oklch, ${cor} 12%, transparent)` }}
    />
  )
}

// ---------- Distribuição ----------

export function ConteudoWidget({ widget, cor }: { widget: Widget; cor: string }) {
  switch (widget.tipo) {
    case "numeros": return <WidgetNumeros widget={widget} cor={cor} />
    case "progresso-dia": return <WidgetProgressoDia cor={cor} />
    case "relogio": return <WidgetRelogio widget={widget} cor={cor} />
    case "atalhos": return <WidgetAtalhos widget={widget} cor={cor} />
    case "tarefas-hoje": return <WidgetTarefasHoje widget={widget} />
    case "tarefas-proximas": return <WidgetTarefasProximas widget={widget} />
    case "habitos-hoje": return <WidgetHabitosHoje cor={cor} />
    case "habitos-semana": return <WidgetHabitosSemana cor={cor} />
    case "rotina-proximas": return <WidgetRotina widget={widget} completa={false} />
    case "rotina-dia": return <WidgetRotina widget={widget} completa />
    case "kanban-andamento": return <WidgetKanbanAndamento widget={widget} cor={cor} />
    case "kanban-prazos": return <WidgetKanbanPrazos widget={widget} />
    case "notas-recentes": return <WidgetNotasRecentes widget={widget} />
    case "nota-fixada": return <WidgetNotaFixada widget={widget} />
    case "livros": return <WidgetLivros widget={widget} />
    case "tags": return <WidgetTags widget={widget} cor={cor} />
    case "grafo": return <WidgetGrafo widget={widget} />
    case "bloco-notas": return <WidgetBlocoNotas widget={widget} cor={cor} />
    default: return <Vazio>Widget desconhecido.</Vazio>
  }
}
