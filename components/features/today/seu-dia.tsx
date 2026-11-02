"use client"

import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

import { itemLista } from "@/components/motion/presets"
import { NowLine } from "@/components/motion/now-line"
import { CheckButton } from "@/components/ui/check"
import { Chip } from "@/components/ui/chip"
import { EmptyState } from "@/components/ui/empty-state"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { useNow } from "@/hooks/use-now"
import { itensDeHoje, useTarefasUnificadas, type ItemTarefa } from "@/hooks/use-tarefas-unificadas"
import { diaDaSemana, nomesDiasCompletos, somarDias } from "@/lib/datas"
import { valeNoDia } from "@/lib/domain/habitos"
import { useHabitos } from "@/lib/estado/habitos"
import { itensDoDia, useRotina } from "@/lib/estado/rotina"
import type { ItemRotina } from "@/lib/tipos"

const PX_HORA = 48
// Lista vazia fixa para o seletor do Zustand (um [] novo a cada leitura causaria renderização sem fim).
const NENHUM: string[] = []

const minutosDe = (horario: string) => {
  const [h, m] = horario.split(":").map(Number)
  return h * 60 + m
}

// "Seu dia" (8.4): tarefas e hábitos de hoje ("A qualquer hora") + linha do tempo da rotina com a linha do agora.
// A rolagem começa duas horas antes de agora. Embaixo, o que vem amanhã.
export function SeuDia({ hoje, onboarding }: { hoje: string; onboarding?: React.ReactNode }) {
  const agora = useNow(60_000)
  const { itens: tarefas, alternar } = useTarefasUnificadas(hoje)
  const habitos = useHabitos((estado) => estado.habitos)
  const alternarHabito = useHabitos((estado) => estado.alternarFeito)
  const rotina = useRotina((estado) => estado.itens)
  const feitosRotina = useRotina((estado) => estado.feitosPorDia[hoje] ?? NENHUM)
  const alternarRotina = useRotina((estado) => estado.alternarFeito)

  const deHoje = itensDeHoje(tarefas, hoje)
  const concluidasHoje = tarefas.filter((item) => item.concluida && item.prazo === hoje)
  const habitosHoje = habitos.filter((habito) => valeNoDia(habito, hoje))
  const rotinaHoje = itensDoDia(rotina, diaDaSemana(hoje))
  const amanha = somarDias(hoje, 1)
  const diaAmanha = nomesDiasCompletos[diaDaSemana(amanha)].toLowerCase()
  const habitosAmanha = habitos.filter((habito) => valeNoDia(habito, amanha))
  const tarefasAmanha = tarefas.filter((item) => !item.concluida && item.prazo === amanha)
  const rotinaAmanha = itensDoDia(rotina, diaDaSemana(amanha))

  const rolagem = useRef<HTMLDivElement>(null)
  const posicionou = useRef(false)
  useEffect(() => {
    if (!agora || posicionou.current || !rolagem.current) return
    posicionou.current = true
    rolagem.current.scrollTop = Math.max(0, (agora.getHours() - 2) * PX_HORA)
  }, [agora])

  const nomeHoje = nomesDiasCompletos[diaDaSemana(hoje)]

  return (
    <Panel aria-labelledby="titulo-seu-dia" className="flex flex-col gap-5 p-5 md:p-6">
      <PanelHeader
        title="Seu dia"
        titleId="titulo-seu-dia"
        action={
          <Link href="/rotina" className="rounded-xs hover:text-paper">
            Abrir rotina
          </Link>
        }
      />

      {onboarding}

      {deHoje.length + habitosHoje.length + concluidasHoje.length > 0 ? (
        <section aria-label="A qualquer hora" className="space-y-1">
          <h3 className="text-micro font-medium text-ink-muted">A qualquer hora</h3>
          <ul>
            <AnimatePresence initial={false}>
              {[...deHoje, ...concluidasHoje].map((item) => (
                <motion.li key={item.id} {...itemLista} className="overflow-hidden">
                  <LinhaTarefa item={item} hoje={hoje} aoAlternar={() => alternar(item)} />
                </motion.li>
              ))}
            </AnimatePresence>
            {habitosHoje.map((habito) => {
              const feito = habito.feitos.includes(hoje)
              return (
                <li key={habito.id} className="flex min-h-row items-center gap-3 rounded-sm pr-2 hover:bg-raised">
                  <CheckButton checked={feito} onCheckedChange={() => alternarHabito(habito.id, hoje)} label={`${habito.nome}, hoje`} />
                  <span className={cn("min-w-0 flex-1 truncate text-ui", feito ? "text-ink-muted" : "text-paper")}>{habito.nome}</span>
                  <Chip>Hábito</Chip>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      <div ref={rolagem} className="rolagem-fina relative h-80 overflow-y-auto" tabIndex={-1}>
        <div className="relative" style={{ height: 24 * PX_HORA }}>
          {Array.from({ length: 24 }, (_, hora) => (
            <div key={hora} className="absolute inset-x-0 flex items-start gap-3 border-t border-line" style={{ top: hora * PX_HORA, height: PX_HORA }}>
              <span className="w-8 shrink-0 pt-1 text-micro text-ink-muted tabular-nums">{String(hora).padStart(2, "0")}h</span>
            </div>
          ))}
          <ol className="absolute inset-y-0 right-0 left-11">
            {distribuirEmColunas(rotinaHoje).map(({ item, coluna, colunas }) => (
              <BlocoRotina key={item.id} item={item} coluna={coluna} colunas={colunas} feito={feitosRotina.includes(item.id)} agoraMin={agora ? agora.getHours() * 60 + agora.getMinutes() : null} aoAlternar={() => alternarRotina(item.id, hoje)} />
            ))}
          </ol>
          {rotinaHoje.length === 0 && agora ? (
            <div className="absolute right-0 left-11" style={{ top: Math.min(22, agora.getHours() + 1) * PX_HORA + 6 }}>
              <EmptyState
                variant="inline"
                title={`${nomeHoje} está livre na sua rotina.`}
                action={
                  <Link href="/rotina" className="text-ui font-semibold text-paper underline underline-offset-4">
                    Adicionar à rotina
                  </Link>
                }
              />
            </div>
          ) : null}
          <div className="absolute inset-x-0 top-0">
            <NowLine startHour={0} pxPerHour={PX_HORA} />
          </div>
        </div>
      </div>

      {habitosAmanha.length + tarefasAmanha.length + rotinaAmanha.length > 0 ? (
        <section aria-label={`Amanhã, ${diaAmanha}`} className="space-y-1 border-t border-line pt-4">
          <h3 className="text-small text-ink-soft">Amanhã, {diaAmanha}</h3>
          <ul>
            {rotinaAmanha.slice(0, 3).map((item) => (
              <li key={item.id} className="flex min-h-row items-center gap-3 text-ui text-ink">
                <span className="w-11 shrink-0 text-small text-ink-muted tabular-nums">{item.horario}</span>
                <span className="flex-1 truncate">{item.titulo}</span>
                <Chip>Rotina</Chip>
              </li>
            ))}
            {tarefasAmanha.slice(0, 3).map((item) => (
              <li key={item.id} className="flex min-h-row items-center gap-3 text-ui text-ink">
                <span aria-hidden="true" className="ml-1 size-4 shrink-0 rounded-xs border border-line-strong" />
                <span className="flex-1 truncate">{item.titulo}</span>
                <Chip>Tarefa</Chip>
              </li>
            ))}
            {habitosAmanha.slice(0, 3).map((habito) => (
              <li key={habito.id} className="flex min-h-row items-center gap-3 text-ui text-ink">
                <span aria-hidden="true" className="ml-1 size-4 shrink-0 rounded-xs border border-line-strong" />
                <span className="flex-1 truncate">{habito.nome}</span>
                <Chip>Hábito</Chip>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Panel>
  )
}

function LinhaTarefa({ item, hoje, aoAlternar }: { item: ItemTarefa; hoje: string; aoAlternar: () => void }) {
  const atrasada = !item.concluida && item.prazo !== null && item.prazo < hoje
  return (
    <div className="flex min-h-row items-center gap-3 rounded-sm pr-2 hover:bg-raised">
      <CheckButton checked={item.concluida} onCheckedChange={aoAlternar} label={`Concluir ${item.titulo}`} />
      <span className={cn("min-w-0 flex-1 truncate text-ui", item.concluida ? "text-ink-muted" : "text-paper")}>{item.titulo}</span>
      {item.origem === "nota" ? (
        <Link href={`/notas/${item.daNota.notaId}`} className="hidden max-w-40 truncate text-small text-ink-soft hover:text-paper sm:block">
          da nota {item.daNota.notaTitulo}
        </Link>
      ) : null}
      {atrasada ? <span className="shrink-0 text-small text-ink-soft">Atrasada</span> : <span className="shrink-0 text-small font-semibold text-ember">Hoje</span>}
    </div>
  )
}

// Faixa de agenda (redesign v2, fase 8). A régua da esquerda é um medidor: enche de Brasa conforme a atividade
// acontece (é o "agora", atualiza a cada minuto) e fica cheia em paper quando concluída. Atividades curtas
// (menos de 1h) cabem numa linha só; as longas mostram título e horário no alto.
const ALTURA_MINIMA = 36 // px: uma linha confortável para marcar

// Atividades que se sobrepõem ficam lado a lado (como num calendário de agenda): cada grupo de sobreposição divide a largura.
function distribuirEmColunas(itens: ItemRotina[]) {
  const intervalo = (item: ItemRotina) => {
    const inicio = minutosDe(item.horario)
    const fim = item.fim ? minutosDe(item.fim) : inicio + 45
    // Altura mínima do bloco também conta como ocupação.
    return { inicio, fim: Math.max(fim > inicio ? fim : inicio + 45, inicio + (ALTURA_MINIMA / PX_HORA) * 60) }
  }
  const ordenados = [...itens].sort((a, b) => intervalo(a).inicio - intervalo(b).inicio)
  const resultado: { item: ItemRotina; coluna: number; colunas: number }[] = []
  let grupo: { item: ItemRotina; coluna: number }[] = []
  let fimDoGrupo = -1
  let finsDasColunas: number[] = []
  const fecharGrupo = () => {
    const total = Math.max(1, finsDasColunas.length)
    for (const membro of grupo) resultado.push({ ...membro, colunas: total })
    grupo = []
    finsDasColunas = []
  }
  for (const item of ordenados) {
    const { inicio, fim } = intervalo(item)
    if (grupo.length && inicio >= fimDoGrupo) fecharGrupo()
    let coluna = finsDasColunas.findIndex((fimColuna) => fimColuna <= inicio)
    if (coluna === -1) coluna = finsDasColunas.length
    finsDasColunas[coluna] = fim
    grupo.push({ item, coluna })
    fimDoGrupo = Math.max(grupo.length === 1 ? fim : fimDoGrupo, fim)
  }
  fecharGrupo()
  return resultado
}

function textoDuracao(minutos: number) {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return h ? `${h}h${m ? String(m).padStart(2, "0") : ""}` : `${m} min`
}

function BlocoRotina({
  item,
  coluna = 0,
  colunas = 1,
  feito,
  agoraMin,
  aoAlternar,
}: {
  item: ItemRotina
  coluna?: number
  colunas?: number
  feito: boolean
  agoraMin: number | null
  aoAlternar: () => void
}) {
  const inicio = minutosDe(item.horario)
  const fim = item.fim ? minutosDe(item.fim) : inicio + 45
  const duracao = Math.max(fim > inicio ? fim - inicio : 45, 15)
  const acontecendo = !feito && agoraMin !== null && agoraMin >= inicio && agoraMin < inicio + duracao
  const passou = !feito && agoraMin !== null && agoraMin >= inicio + duracao
  const progresso = feito ? 1 : acontecendo ? (agoraMin! - inicio) / duracao : passou ? 1 : 0
  const curta = duracao < 60
  // Dividindo a largura com outra atividade: textos mais curtos (o completo fica no title).
  const estreita = colunas > 1
  const horario = `${item.horario}${item.fim ? `–${item.fim}` : ""}`
  const detalhe = acontecendo ? `faltam ${textoDuracao(inicio + duracao - agoraMin!)}` : horario

  return (
    <li
      className={cn(
        "group/bloco absolute overflow-hidden rounded-r-sm pl-3.5 transition-colors duration-fast",
        // título completo ao passar o mouse quando o texto é cortado
        acontecendo ? "bg-ember-wash" : "hover:bg-raised"
      )}
      title={`${item.titulo}, ${horario}`}
      style={{
        top: (inicio / 60) * PX_HORA + 2,
        height: Math.max(ALTURA_MINIMA, (duracao / 60) * PX_HORA - 4),
        left: `calc(${(coluna / colunas) * 100}% + ${coluna ? 2 : 0}px)`,
        width: `calc(${100 / colunas}% - ${colunas > 1 ? 2 : 0}px)`,
      }}
    >
      {/* Medidor: trilho cinza e preenchimento (Brasa enquanto acontece; paper quando feito). */}
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-line-strong" />
      <span
        aria-hidden="true"
        className={cn("absolute top-0 left-0 w-0.5 rounded-full transition-[height] duration-slow ease-out", acontecendo ? "bg-ember" : feito ? "bg-paper" : "bg-ink-muted")}
        style={{ height: `${Math.round(progresso * 100)}%` }}
      />
      <div className={cn("flex min-w-0 gap-2", curta ? "h-full items-center" : "items-start pt-1.5")}>
        <CheckButton checked={feito} onCheckedChange={aoAlternar} label={`Marcar ${item.titulo}`} />
        {curta ? (
          <>
            <span className={cn("min-w-0 flex-1 truncate text-ui font-semibold", feito ? "text-ink-muted" : "text-paper")}>{item.titulo}</span>
            <span className={cn("shrink-0 pr-2 text-micro tabular-nums", acontecendo ? "font-semibold text-ember" : "text-ink-soft", estreita && !acontecendo && "sr-only")}>{detalhe}</span>
          </>
        ) : (
          <span className="grid min-w-0 flex-1">
            <span className={cn("truncate text-ui font-semibold", feito ? "text-ink-muted" : "text-paper")}>{item.titulo}</span>
            <span className={cn("text-micro tabular-nums", acontecendo ? "font-semibold text-ember" : "text-ink-soft")}>
              {estreita ? detalhe : acontecendo ? `${horario} · ${detalhe}` : `${horario} · ${textoDuracao(duracao)}`}
            </span>
          </span>
        )}
      </div>
      {acontecendo ? <span className="sr-only">Acontecendo agora, {detalhe}.</span> : null}
    </li>
  )
}
