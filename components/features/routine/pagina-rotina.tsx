"use client"

import { AnimatePresence, motion } from "motion/react"
import { Fragment, useState } from "react"
import { CalendarDaysIcon, ColumnsIcon, ListIcon, SlidersHorizontalIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import { EditarAtividade } from "@/components/features/routine/editar-atividade"
import { horaCurta, NowLine, NowMarker } from "@/components/motion/now-line"
import { itemLista } from "@/components/motion/presets"
import { TopbarSlot } from "@/components/shell/estado"
import { Button } from "@/components/ui/button"
import { CheckButton } from "@/components/ui/check"
import { DayPicker, ORDEM_DIAS } from "@/components/ui/day-picker"
import { EmptyState } from "@/components/ui/empty-state"
import { TimeField } from "@/components/ui/fields"
import { FieldError, Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Segmented } from "@/components/ui/segmented"
import { Skeleton } from "@/components/ui/skeleton"
import { StatList } from "@/components/ui/stat-list"
import { Switch } from "@/components/ui/switch"
import { useHoje } from "@/hooks/use-hoje"
import { useNow } from "@/hooks/use-now"
import { diaDaSemana, lerChave, nomesDias, nomesDiasCompletos, somarDias } from "@/lib/datas"
import { resumoDias, semanaDe } from "@/lib/domain/habitos"
import { duracao, itensDoDia, useRotina } from "@/lib/estado/rotina"
import type { ExibicaoRotina, ItemRotina } from "@/lib/tipos"

type Visao = "lista" | "semana" | "calendario"
const NENHUM: string[] = []
const PX_HORA = 40

const visaoDe = (exibicao: ExibicaoRotina): Visao => (exibicao.visao === "semana" ? "semana" : exibicao.visao === "calendario" ? "calendario" : "lista")

// Rotina (8.7): o que acontece em cada dia, com a linha do agora.
export function PaginaRotina() {
  const hoje = useHoje()
  const agora = useNow(60_000)
  const itens = useRotina((estado) => estado.itens)
  const exibicao = useRotina((estado) => estado.exibicao)
  const definirExibicao = useRotina((estado) => estado.definirExibicao)
  const feitosPorDia = useRotina((estado) => estado.feitosPorDia)
  const alternar = useRotina((estado) => estado.alternarFeito)
  const [diaEscolhido, setDiaEscolhido] = useState<number | null>(null)
  const [aberto, setAberto] = useState<string | null>(null)
  const [opcoes, setOpcoes] = useState(false)

  if (!hoje) {
    return (
      <div className="space-y-6">
        <Skeleton variant="line" className="h-12 w-60" />
        <Skeleton variant="card" className="h-64" />
      </div>
    )
  }

  const diaHoje = diaDaSemana(hoje)
  const dia = diaEscolhido ?? diaHoje
  const visao = visaoDe(exibicao)
  const ehHoje = dia === diaHoje
  // Data real do dia escolhido nesta semana (para marcar como feito).
  const dataDoDia = semanaDe(hoje)[ORDEM_DIAS.indexOf(dia)]
  const feitos = feitosPorDia[dataDoDia] ?? NENHUM
  const doDia = itensDoDia(itens, dia).filter((item) => !(exibicao.ocultarFeitas && ehHoje && feitos.includes(item.id)))
  const feitasHoje = (feitosPorDia[hoje] ?? NENHUM).filter((id) => itensDoDia(itens, diaHoje).some((item) => item.id === id)).length
  const naSemana = ORDEM_DIAS.reduce((soma, d) => soma + itensDoDia(itens, d).length, 0)
  const nomeDia = nomesDiasCompletos[dia].toLowerCase()

  return (
    <div className="space-y-8">
      <TopbarSlot
        acoes={
          <Button variant="secondary" size="sm" data-icon="inline-start" onClick={() => setOpcoes(true)}>
            <SlidersHorizontalIcon /> Opções da rotina
          </Button>
        }
      />
      <PageHeader
        title="Rotina"
        description={`Hoje, ${nomesDiasCompletos[diaHoje].toLowerCase()}: marque o que já fez.`}
        stats={
          <StatList
            stats={[
              { label: "feitas hoje", text: `${feitasHoje}/${itensDoDia(itens, diaHoje).length}` },
              { label: naSemana === 1 ? "atividade na semana" : "atividades na semana", value: naSemana },
            ]}
          />
        }
      />

      <NovaAtividade diaInicial={dia} hojeSemana={diaHoje} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        {visao !== "calendario" ? (
          visao === "lista" ? (
            <div role="tablist" aria-label="Dia da semana" className="flex flex-wrap gap-1">
              {ORDEM_DIAS.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="tab"
                  aria-selected={d === dia}
                  aria-current={d === diaHoje ? "date" : undefined}
                  onClick={() => setDiaEscolhido(d)}
                  className={cn(
                    "relative h-control min-w-12 rounded-sm px-3 text-small font-medium",
                    d === dia ? "bg-paper text-night" : "text-ink-soft hover:bg-raised hover:text-paper"
                  )}
                >
                  {nomesDias[d]}
                  {d === diaHoje ? <span aria-hidden="true" className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-ember" /> : null}
                </button>
              ))}
            </div>
          ) : (
            <span />
          )
        ) : (
          <span />
        )}
        <Segmented
          label="Visão da rotina"
          value={visao}
          onChange={(valor) => definirExibicao({ visao: valor === "lista" ? "linha" : valor })}
          options={[
            { value: "lista", label: "Lista", icon: <ListIcon />, iconOnly: true },
            { value: "semana", label: "Semana", icon: <ColumnsIcon />, iconOnly: true },
            { value: "calendario", label: "Calendário", icon: <CalendarDaysIcon />, iconOnly: true },
          ]}
        />
      </div>

      {visao === "lista" ? (
        doDia.length === 0 ? (
          <EmptyState variant="inline" title={`Nada na rotina de ${nomeDia}.`} description="Adicione acima." />
        ) : (
          <ol className="divide-y divide-line rounded-xl border border-line bg-panel px-3">
            <AnimatePresence initial={false}>
              {doDia.map((item, indice) => {
                const hora = agora ? horaCurta(agora) : ""
                const antesDeste = ehHoje && agora && item.horario > hora && (indice === 0 || doDia[indice - 1].horario <= hora)
                return (
                  <Fragment key={item.id}>
                    {antesDeste ? (
                      <li className="py-2">
                        <NowMarker rotulo={hora} />
                      </li>
                    ) : null}
                    <motion.li {...itemLista} className="overflow-hidden">
                      <LinhaAtividade item={item} exibicao={exibicao} feito={feitos.includes(item.id)} aoAlternar={() => alternar(item.id, dataDoDia)} aoAbrir={() => setAberto(item.id)} />
                    </motion.li>
                  </Fragment>
                )
              })}
              {ehHoje && agora && doDia.every((item) => item.horario <= horaCurta(agora)) ? (
                <li className="py-2">
                  <NowMarker rotulo={horaCurta(agora)} />
                </li>
              ) : null}
            </AnimatePresence>
          </ol>
        )
      ) : visao === "semana" ? (
        <VisaoSemana itens={itens} diaHoje={diaHoje} aoAbrir={setAberto} />
      ) : (
        <VisaoCalendario itens={itens} hoje={hoje} feitosPorDia={feitosPorDia} />
      )}

      <EditarAtividade item={itens.find((item) => item.id === aberto) ?? null} hojeSemana={diaHoje} aoFechar={() => setAberto(null)} />
      <OpcoesRotina aberto={opcoes} aoMudar={setOpcoes} />
    </div>
  )
}

function LinhaAtividade({ item, exibicao, feito, aoAlternar, aoAbrir }: { item: ItemRotina; exibicao: ExibicaoRotina; feito: boolean; aoAlternar: () => void; aoAbrir: () => void }) {
  const detalhes = [exibicao.mostrarDias && resumoDias(item.dias), exibicao.mostrarDuracao && duracao(item)].filter(Boolean).join(" · ")
  return (
    <div className="flex min-h-row items-center gap-3 py-2">
      <CheckButton checked={feito} onCheckedChange={aoAlternar} label={`Marcar ${item.titulo}`} />
      <span className="w-24 shrink-0 text-small text-ink-soft tabular-nums">
        {item.horario}
        {item.fim ? `–${item.fim}` : ""}
      </span>
      <button type="button" onClick={aoAbrir} className="grid min-w-0 flex-1 text-left">
        <span className={cn("truncate text-ui font-medium", feito ? "text-ink-soft" : "text-paper")}>{item.titulo}</span>
        {detalhes ? <span className="truncate text-small text-ink-muted">{detalhes}</span> : null}
        {exibicao.mostrarObservacao && item.observacao ? <span className="truncate text-small text-ink-soft">{item.observacao}</span> : null}
      </button>
    </div>
  )
}

function VisaoSemana({ itens, diaHoje, aoAbrir }: { itens: ItemRotina[]; diaHoje: number; aoAbrir: (id: string) => void }) {
  const minutos = (horario: string) => {
    const [h, m] = horario.split(":").map(Number)
    return h * 60 + m
  }
  const todos = ORDEM_DIAS.flatMap((d) => itensDoDia(itens, d))
  const inicio = Math.max(0, Math.min(6, ...todos.map((item) => Math.floor(minutos(item.horario) / 60))) - 1)
  const horas = Array.from({ length: 24 - inicio }, (_, i) => inicio + i)
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-panel">
      <div className="grid min-w-3xl grid-cols-[3rem_repeat(7,1fr)]">
        <div className="border-b border-line" />
        {ORDEM_DIAS.map((d) => (
          <div key={d} aria-current={d === diaHoje ? "date" : undefined} className={cn("border-b border-l border-line py-2 text-center text-small font-medium", d === diaHoje ? "border-t-2 border-t-ember bg-ember-wash text-ember" : "text-ink-soft")}>
            {nomesDias[d]}
          </div>
        ))}
        <div className="relative" style={{ height: horas.length * PX_HORA }}>
          {horas.map((hora, i) => (
            <span key={hora} className="absolute right-2 text-micro text-ink-muted tabular-nums" style={{ top: i * PX_HORA + 2 }}>
              {String(hora).padStart(2, "0")}h
            </span>
          ))}
        </div>
        {ORDEM_DIAS.map((d) => (
          <div key={d} className={cn("relative border-l border-line", d === diaHoje && "bg-ember-wash")} style={{ height: horas.length * PX_HORA }}>
            {horas.map((hora, i) => (
              <span key={hora} aria-hidden="true" className="absolute inset-x-0 border-t border-line" style={{ top: i * PX_HORA }} />
            ))}
            {itensDoDia(itens, d).map((item) => {
              const ini = minutos(item.horario) - inicio * 60
              const fim = item.fim ? minutos(item.fim) - inicio * 60 : ini + 45
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => aoAbrir(item.id)}
                  className="absolute inset-x-1 overflow-hidden rounded-xs border border-line-strong bg-raised px-1.5 py-1 text-left text-micro text-paper hover:border-ink-muted"
                  style={{ top: (ini / 60) * PX_HORA + 1, height: Math.max(22, ((fim > ini ? fim - ini : 45) / 60) * PX_HORA - 2) }}
                >
                  <span className="block truncate font-semibold">{item.titulo}</span>
                  <span className="block text-ink-soft tabular-nums">{item.horario}</span>
                </button>
              )
            })}
            {d === diaHoje ? (
              <div className="absolute inset-x-0" style={{ top: -inicio * PX_HORA }}>
                <NowLine startHour={0} pxPerHour={PX_HORA} className="[&>div>span:first-child]:hidden" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function VisaoCalendario({ itens, hoje, feitosPorDia }: { itens: ItemRotina[]; hoje: string; feitosPorDia: Record<string, string[]> }) {
  const base = lerChave(hoje)
  const primeiro = new Date(base.getFullYear(), base.getMonth(), 1)
  const inicioGrade = somarDias(`${primeiro.getFullYear()}-${String(primeiro.getMonth() + 1).padStart(2, "0")}-01`, -((primeiro.getDay() + 6) % 7))
  const dias = Array.from({ length: 42 }, (_, i) => somarDias(inicioGrade, i))
  const mes = base.getMonth()
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <p className="mb-3 font-display text-section capitalize">{base.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {ORDEM_DIAS.map((d) => (
          <span key={d} className="pb-1 text-micro text-ink-muted">
            {nomesDias[d]}
          </span>
        ))}
        {dias.map((data) => {
          const doDia = itensDoDia(itens, diaDaSemana(data))
          const feitos = (feitosPorDia[data] ?? NENHUM).filter((id) => doDia.some((item) => item.id === id)).length
          const foraDoMes = lerChave(data).getMonth() !== mes
          return (
            <div
              key={data}
              aria-current={data === hoje ? "date" : undefined}
              aria-label={`${lerChave(data).getDate()}: ${doDia.length} atividades${data <= hoje ? `, ${feitos} feitas` : ""}`}
              className={cn("flex h-16 flex-col items-center gap-1.5 rounded-sm pt-2", foraDoMes && "opacity-40", data === hoje && "outline-2 -outline-offset-2 outline-ember")}
            >
              <span className={cn("text-small tabular-nums", data === hoje ? "font-bold text-ember" : "text-ink")}>{lerChave(data).getDate()}</span>
              <span className="flex flex-wrap justify-center gap-0.5" aria-hidden="true">
                {doDia.slice(0, 5).map((item, i) => (
                  <span key={item.id} className={cn("size-1.5 rounded-full", i < feitos && data <= hoje ? "bg-paper" : "bg-line-strong")} />
                ))}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NovaAtividade({ diaInicial, hojeSemana }: { diaInicial: number; hojeSemana: number }) {
  const adicionar = useRotina((estado) => estado.adicionarItem)
  const [titulo, setTitulo] = useState("")
  const [inicio, setInicio] = useState("08:00")
  const [fim, setFim] = useState("")
  const [dias, setDias] = useState<number[]>([diaInicial])
  const [erro, setErro] = useState<string | null>(null)
  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault()
        if (!titulo.trim()) return setErro("Dê um nome para a atividade.")
        adicionar({ titulo, horario: inicio, fim: fim || null, dias })
        setTitulo("")
        setErro(null)
      }}
      className="space-y-1"
    >
      <div className="space-y-3 rounded-lg border border-line bg-panel p-3">
        <div className="flex flex-wrap items-center gap-2">
          <TimeField label="Início" value={inicio} onChange={setInicio} />
          <TimeField label="Fim" optional value={fim} onChange={setFim} />
          <Label htmlFor="nova-atividade" srOnly>
            Nova atividade
          </Label>
          <Input
            id="nova-atividade"
            value={titulo}
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? "nova-atividade-erro" : undefined}
            onChange={(evento) => {
              setTitulo(evento.target.value)
              if (erro) setErro(null)
            }}
            placeholder="Nova atividade, por exemplo: academia"
            className="min-w-56 flex-1"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DayPicker value={dias} onChange={setDias} today={hojeSemana} shortcuts />
          <Button type="submit">Adicionar</Button>
        </div>
      </div>
      <FieldError id="nova-atividade-erro">{erro}</FieldError>
    </form>
  )
}

function OpcoesRotina({ aberto, aoMudar }: { aberto: boolean; aoMudar: (aberto: boolean) => void }) {
  const exibicao = useRotina((estado) => estado.exibicao)
  const definir = useRotina((estado) => estado.definirExibicao)
  const opcoes: { chave: keyof ExibicaoRotina; rotulo: string }[] = [
    { chave: "mostrarDias", rotulo: "Mostrar os dias da semana" },
    { chave: "mostrarDuracao", rotulo: "Mostrar a duração" },
    { chave: "mostrarObservacao", rotulo: "Mostrar a observação" },
    { chave: "ocultarFeitas", rotulo: "Esconder o que já foi feito hoje" },
  ]
  return (
    <ResponsiveDialog open={aberto} onOpenChange={aoMudar} title="Opções da rotina" width="sm">
      <ul className="grid gap-1">
        {opcoes.map(({ chave, rotulo }) => (
          <li key={chave} className="flex min-h-row items-center justify-between gap-3 text-ui text-paper">
            <span id={`opcao-${chave}`}>{rotulo}</span>
            <Switch aria-labelledby={`opcao-${chave}`} checked={Boolean(exibicao[chave])} onCheckedChange={(valor) => definir({ [chave]: valor })} />
          </li>
        ))}
      </ul>
    </ResponsiveDialog>
  )
}
