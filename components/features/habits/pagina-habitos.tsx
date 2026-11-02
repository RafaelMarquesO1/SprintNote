"use client"

import { useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import { DetalheHabito } from "@/components/features/habits/detalhe-habito"
import { AnimatedNumber } from "@/components/motion/number"
import { dur, ease } from "@/components/motion/presets"
import { Button, IconButton } from "@/components/ui/button"
import { CheckButton } from "@/components/ui/check"
import { DayPicker } from "@/components/ui/day-picker"
import { EmptyState } from "@/components/ui/empty-state"
import { FieldError, Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { StatList } from "@/components/ui/stat-list"
import { useHoje } from "@/hooks/use-hoje"
import { diaDaSemana, formatarDataRelativa, lerChave, nomesDias, nomesDiasCompletos, somarDias } from "@/lib/datas"
import { calcularSequencia, percentualRecente, resumoDias, semanaDe, valeNoDia } from "@/lib/domain/habitos"
import { todosOsDias, useHabitos } from "@/lib/estado/habitos"

// Hábitos (8.6): tabela da semana, com a coluna de hoje em Brasa e a sequência de cada hábito.
export function PaginaHabitos() {
  const hoje = useHoje()
  const parametros = useSearchParams()
  const habitos = useHabitos((estado) => estado.habitos)
  const alternar = useHabitos((estado) => estado.alternarFeito)
  const [deslocamento, setDeslocamento] = useState(0)
  const [direcao, setDirecao] = useState(0)
  const [aberto, setAberto] = useState<string | null>(null)

  if (!hoje) {
    return (
      <div className="space-y-6">
        <Skeleton variant="line" className="h-12 w-60" />
        <Skeleton variant="block" className="h-16" />
        <Skeleton variant="card" className="h-48" />
      </div>
    )
  }

  const semana = semanaDe(somarDias(hoje, deslocamento * 7))
  const deHoje = habitos.filter((habito) => valeNoDia(habito, hoje))
  const feitosHoje = deHoje.filter((habito) => habito.feitos.includes(hoje)).length
  const melhorSequencia = Math.max(0, ...habitos.map((habito) => calcularSequencia(habito, hoje)))
  const media = habitos.length ? Math.round(habitos.reduce((soma, habito) => soma + percentualRecente(habito, hoje), 0) / habitos.length) : 0
  const mudarSemana = (passo: number) => {
    setDirecao(passo)
    setDeslocamento((valor) => valor + passo)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Hábitos"
        description="Marque o que fez em cada dia e acompanhe as sequências."
        stats={
          <StatList
            variant="highlight"
            stats={[
              { label: "feitos hoje", text: `${feitosHoje}/${deHoje.length}` },
              { label: "dias seguidos", value: melhorSequencia },
              { label: "nos últimos 30 dias", value: media, suffix: "%" },
            ]}
          />
        }
      />

      <NovoHabito focar={parametros.get("criar") === "1"} hoje={hoje} />

      {habitos.length === 0 ? (
        <EmptyState title="Nenhum hábito ainda." description="Hábitos são coisas que você quer repetir. Comece com um pequeno, como ler 10 minutos." />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <IconButton aria-label="Semana anterior" size="sm" onClick={() => mudarSemana(-1)}>
              <ChevronLeftIcon />
            </IconButton>
            <IconButton aria-label="Próxima semana" size="sm" onClick={() => mudarSemana(1)}>
              <ChevronRightIcon />
            </IconButton>
            <span className="text-ui text-ink-soft" aria-live="polite">
              {deslocamento === 0 ? "Esta semana" : `${formatarDataRelativa(semana[0])} a ${formatarDataRelativa(semana[6])}`}
            </span>
            {deslocamento !== 0 ? (
              <Button variant="ghost" size="sm" onClick={() => mudarSemana(-deslocamento)}>
                Esta semana
              </Button>
            ) : null}
          </div>

          <div className="overflow-x-auto rounded-xl border border-line bg-panel">
            <AnimatePresence mode="popLayout" initial={false} custom={direcao}>
              <motion.table
                key={semana[0]}
                custom={direcao}
                initial={{ opacity: 0, x: direcao * 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direcao * -16 }}
                transition={{ duration: dur.base, ease: ease.out }}
                className="w-full min-w-xl border-collapse text-ui"
              >
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="px-5 py-3 text-left font-normal text-ink-soft">
                      Hábito
                    </th>
                    {semana.map((dia) => {
                      const ehHoje = dia === hoje
                      return (
                        <th
                          key={dia}
                          scope="col"
                          aria-current={ehHoje ? "date" : undefined}
                          className={cn("w-16 border-t-2 py-3 text-center font-normal", ehHoje ? "border-ember bg-ember-wash text-ember" : "border-transparent text-ink-soft")}
                        >
                          <span className="block text-small">{nomesDias[lerChave(dia).getDay()]}</span>
                          <span className={cn("block font-display text-section tabular-nums", ehHoje ? "text-ember" : "text-paper")}>{lerChave(dia).getDate()}</span>
                        </th>
                      )
                    })}
                    <th scope="col" className="px-5 py-3 text-right font-normal text-ink-soft">
                      Sequência
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {habitos.map((habito) => (
                    <tr key={habito.id} className="border-b border-line last:border-0">
                      <th scope="row" className="px-5 py-3 text-left font-normal">
                        <button type="button" onClick={() => setAberto(habito.id)} className="block rounded-xs text-left">
                          <span className="block font-semibold text-paper hover:underline hover:underline-offset-4">{habito.nome}</span>
                          <span className="block text-small text-ink-soft">
                            {resumoDias(habito.dias)}. {percentualRecente(habito, hoje)}% em 30 dias
                          </span>
                        </button>
                      </th>
                      {semana.map((dia) => {
                        const ehHoje = dia === hoje
                        const vale = valeNoDia(habito, dia)
                        return (
                          <td key={dia} className={cn("p-0 text-center", ehHoje && "bg-ember-wash")}>
                            {vale && dia <= hoje ? (
                              <CheckButton
                                variant="habit"
                                checked={habito.feitos.includes(dia)}
                                onCheckedChange={() => alternar(habito.id, dia)}
                                label={`${habito.nome}, ${nomesDiasCompletos[diaDaSemana(dia)].toLowerCase()} ${lerChave(dia).getDate()}`}
                              />
                            ) : vale ? (
                              // Rafael Marques - 02/11/2026: dia programado que ainda não chegou: caixa tracejada do
                              // tamanho da caixa de marcar (antes era o mesmo "–" dos dias sem o hábito).
                              <span
                                role="img"
                                aria-label={`${habito.nome}, ${nomesDiasCompletos[diaDaSemana(dia)].toLowerCase()} ${lerChave(dia).getDate()}: ainda não chegou`}
                                title="Programado. Ainda não chegou."
                                className="mx-auto flex size-11 items-center justify-center"
                              >
                                <span className="size-9 rounded-md border border-dashed border-line-strong" />
                              </span>
                            ) : (
                              <span className="text-ink-muted" aria-label="Não programado">
                                –
                              </span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-5 text-right font-display text-section text-paper">
                        <AnimatedNumber value={calcularSequencia(habito, hoje)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </motion.table>
            </AnimatePresence>
          </div>

          {deHoje.length === 0 ? (
            <EmptyState
              variant="inline"
              title={`${nomesDiasCompletos[diaDaSemana(hoje)]} não tem hábitos programados.`}
              description="Os dias de cada hábito são escolhidos na criação e podem ser mudados depois."
            />
          ) : null}
        </div>
      )}

      <DetalheHabito habito={habitos.find((habito) => habito.id === aberto) ?? null} hoje={hoje} aoFechar={() => setAberto(null)} />
    </div>
  )
}

function NovoHabito({ focar, hoje }: { focar: boolean; hoje: string }) {
  const adicionar = useHabitos((estado) => estado.adicionarHabito)
  const [nome, setNome] = useState("")
  const [dias, setDias] = useState<number[]>(todosOsDias)
  const [erro, setErro] = useState<string | null>(null)

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault()
        if (!nome.trim()) return setErro("Dê um nome para o hábito.")
        adicionar({ nome, icone: "feito", dias })
        setNome("")
        setErro(null)
      }}
      className="space-y-1"
    >
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-panel p-2 pl-3">
        <Label htmlFor="novo-habito" srOnly>
          Novo hábito
        </Label>
        <Input
          id="novo-habito"
          autoFocus={focar}
          variant="bare"
          value={nome}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? "novo-habito-erro" : undefined}
          onChange={(evento) => {
            setNome(evento.target.value)
            if (erro) setErro(null)
          }}
          placeholder="Novo hábito, por exemplo: meditar 10 min"
          className="min-w-56 flex-1"
        />
        <DayPicker value={dias} onChange={setDias} today={diaDaSemana(hoje)} />
        <Button type="submit">Criar hábito</Button>
      </div>
      <FieldError id="novo-habito-erro">{erro}</FieldError>
    </form>
  )
}
