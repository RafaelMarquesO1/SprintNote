"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useShallow } from "zustand/react/shallow"
import { cn } from "@/lib/utils"

import { AnimatedNumber } from "@/components/motion/number"
import { Chip } from "@/components/ui/chip"
import { EmptyState } from "@/components/ui/empty-state"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { ProgressSegments } from "@/components/ui/progress-segments"
import { useTarefasUnificadas } from "@/hooks/use-tarefas-unificadas"
import { formatarDataRelativa, lerChave, nomesDias, somarDias } from "@/lib/datas"
import { calcularSequencia, semanaDe, valeNoDia } from "@/lib/domain/habitos"
import { progressoQuadro } from "@/lib/domain/quadros"
import { useHabitos } from "@/lib/estado/habitos"
import { colunasDoQuadro, useKanban } from "@/lib/estado/kanban"
import { useNotas } from "@/lib/estado/notas"
import { contarTags, tagsDaNota } from "@/lib/tags"

const linkAcao = "rounded-xs hover:text-paper"

// ---------- Quadros ----------
export function BlocoQuadros() {
  const router = useRouter()
  const { quadros, colunas, cartoes, definirQuadroAtivo } = useKanban(
    useShallow((estado) => ({ quadros: estado.quadros, colunas: estado.colunas, cartoes: estado.cartoes, definirQuadroAtivo: estado.definirQuadroAtivo }))
  )

  return (
    <Panel aria-labelledby="titulo-quadros" className="space-y-5 p-5 md:p-6">
      <PanelHeader title="Quadros" titleId="titulo-quadros" action={<Link href="/kanban" className={linkAcao}>Ver todos</Link>} />
      {quadros.length === 0 ? (
        <EmptyState variant="inline" title="Nenhum quadro ainda." action={<Link href="/kanban" className="text-ui font-semibold text-paper underline underline-offset-4">Criar quadro</Link>} />
      ) : (
        <ul className="divide-y divide-line">
          {quadros.slice(0, 4).map((quadro) => {
            const doQuadro = colunasDoQuadro(colunas, quadro.id)
            const ids = new Set(doQuadro.map((coluna) => coluna.id))
            const progresso = progressoQuadro(doQuadro, cartoes.filter((cartao) => ids.has(cartao.colunaId)))
            return (
              <li key={quadro.id} className="py-4 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => {
                    definirQuadroAtivo(quadro.id)
                    router.push("/kanban")
                  }}
                  className="block w-full space-y-2.5 rounded-sm text-left"
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-ui font-semibold text-paper">{quadro.titulo}</span>
                    <span className="font-display text-number text-paper">
                      <AnimatedNumber value={progresso.percentual} suffix="%" />
                    </span>
                  </span>
                  <ProgressSegments progress={progresso} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

// ---------- Hábitos da semana ----------
export function BlocoHabitosSemana({ hoje }: { hoje: string }) {
  const habitos = useHabitos((estado) => estado.habitos)
  const alternar = useHabitos((estado) => estado.alternarFeito)
  const semana = semanaDe(hoje)

  return (
    <Panel aria-labelledby="titulo-habitos-semana" className="space-y-4 p-5 md:p-6">
      <PanelHeader title="Hábitos da semana" titleId="titulo-habitos-semana" action={<Link href="/habitos" className={linkAcao}>Abrir</Link>} />
      {habitos.length === 0 ? (
        <EmptyState variant="inline" title="Nenhum hábito ainda." action={<Link href="/habitos?criar=1" className="text-ui font-semibold text-paper underline underline-offset-4">Criar hábito</Link>} />
      ) : (
        <table className="w-full border-separate border-spacing-y-1.5 text-ui">
          <thead>
            <tr>
              <th className="sr-only">Hábito</th>
              {semana.map((dia) => (
                <th key={dia} scope="col" aria-current={dia === hoje ? "date" : undefined} className={cn("w-8 text-center text-micro font-medium", dia === hoje ? "text-ember" : "text-ink-muted")}>
                  {nomesDias[lerChave(dia).getDay()].charAt(0)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habitos.slice(0, 5).map((habito) => (
              <tr key={habito.id}>
                <th scope="row" className="pr-3 text-left font-semibold text-paper">
                  <span className="block truncate">{habito.nome}</span>
                  <span className="block text-micro font-normal text-ink-muted">{calcularSequencia(habito, hoje)} seguidos</span>
                </th>
                {semana.map((dia) => {
                  const vale = valeNoDia(habito, dia)
                  const feito = habito.feitos.includes(dia)
                  const futuro = dia > hoje
                  return (
                    <td key={dia} className="text-center">
                      {vale && !futuro ? (
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={feito}
                          aria-label={`${habito.nome}, ${formatarDataRelativa(dia)}`}
                          onClick={() => alternar(habito.id, dia)}
                          className={cn(
                            "inline-block size-7 rounded-xs border align-middle transition-colors duration-fast",
                            feito ? "border-paper bg-paper" : "border-line-strong bg-raised hover:border-ink-muted",
                            dia === hoje && !feito && "border-ember"
                          )}
                        />
                      ) : (
                        <span aria-hidden="true" className={cn("inline-block size-7 rounded-xs align-middle", vale ? "border border-dashed border-line-strong" : "bg-panel", dia === hoje && "border border-ember")} />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  )
}

// ---------- Notas recentes ----------
export function BlocoNotasRecentes() {
  const { notas, livros } = useNotas(useShallow((estado) => ({ notas: estado.notas, livros: estado.livros })))
  const recentes = [...notas].sort((a, b) => b.atualizadoEm - a.atualizadoEm).slice(0, 5)
  return (
    <Panel aria-labelledby="titulo-notas-recentes" className="space-y-4 p-5 md:p-6">
      <PanelHeader title="Notas recentes" titleId="titulo-notas-recentes" action={<Link href="/notas" className={linkAcao}>Biblioteca</Link>} />
      {recentes.length === 0 ? (
        <EmptyState variant="inline" title="Nenhuma nota ainda." description="Escreva a primeira e cite uma tarefa com [ ]." />
      ) : (
        <ul className="space-y-1">
          {recentes.map((nota) => {
            const caderno = livros.find((livro) => livro.id === nota.livroId)?.titulo ?? "Sem caderno"
            const tags = tagsDaNota(nota).slice(0, 2)
            return (
              <li key={nota.id}>
                <Link href={`/notas/${nota.id}`} className="-mx-2 block rounded-sm px-2 py-2.5 hover:bg-raised">
                  <span className="block truncate text-ui font-semibold text-paper">{nota.titulo || "Sem título"}</span>
                  <span className="block truncate text-small text-ink-soft">{[caderno, ...tags.map((tag) => `#${tag}`)].join(", ")}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

// ---------- Tarefas próximas ----------
export function BlocoTarefasProximas({ hoje }: { hoje: string }) {
  const { itens } = useTarefasUnificadas(hoje)
  const limite = somarDias(hoje, 7)
  const proximas = itens
    .filter((item) => !item.concluida && item.prazo !== null && item.prazo > hoje && item.prazo <= limite)
    .sort((a, b) => (a.prazo ?? "").localeCompare(b.prazo ?? ""))
    .slice(0, 6)
  return (
    <Panel aria-labelledby="titulo-tarefas-proximas" className="space-y-4 p-5 md:p-6">
      <PanelHeader title="Tarefas próximas" titleId="titulo-tarefas-proximas" action={<Link href="/tarefas" className={linkAcao}>Ver todas</Link>} />
      {proximas.length === 0 ? (
        <p className="text-ui text-ink-soft">Nada nos próximos 7 dias.</p>
      ) : (
        <ul>
          {proximas.map((item) => (
            <li key={item.id} className="flex min-h-row items-center gap-3 text-ui">
              <span className="min-w-0 flex-1 truncate text-paper">{item.titulo}</span>
              <span className="shrink-0 text-small text-ink-soft">{formatarDataRelativa(item.prazo!)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

// ---------- Tags mais usadas ----------
export function BlocoTags() {
  const notas = useNotas((estado) => estado.notas)
  const tags = contarTags(notas).slice(0, 12)
  return (
    <Panel aria-labelledby="titulo-tags-usadas" className="space-y-4 p-5 md:p-6">
      <PanelHeader title="Tags mais usadas" titleId="titulo-tags-usadas" action={<Link href="/tags" className={linkAcao}>Tags</Link>} />
      {tags.length === 0 ? (
        <p className="text-ui text-ink-soft">Escreva #assunto numa nota para criar uma tag.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(({ tag, total }) => (
            <Link key={tag} href={`/tags?tag=${encodeURIComponent(tag)}`}>
              <Chip className="hover:border-ink-muted">
                #{tag} <span className="text-ink-muted tabular-nums">{total}</span>
              </Chip>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  )
}

