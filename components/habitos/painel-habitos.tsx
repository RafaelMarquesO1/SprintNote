"use client"

import { useState } from "react"
import { CheckIcon, FlameIcon, PlusIcon, RepeatIcon, Trash2Icon } from "lucide-react"
import { CabecalhoPagina, Pagina, ResumoLinha } from "@/components/pagina"
import { cn } from "@/lib/utils"

import { Icone, iconesHabito } from "@/components/icone"
import { SeletorDias, descreverDias } from "@/components/seletor-dias"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useHoje } from "@/hooks/use-hoje"
import { diaDaSemana, lerChave, nomesDias, ultimosDias } from "@/lib/datas"
import { calcularSequencia, todosOsDias, useHabitos, valeNoDia } from "@/lib/estado/habitos"
import type { Habito } from "@/lib/tipos"

function NovoHabito() {
  const adicionarHabito = useHabitos((estado) => estado.adicionarHabito)
  const [nome, setNome] = useState("")
  const [icone, setIcone] = useState("feito")
  const [dias, setDias] = useState<number[]>(todosOsDias)

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault()
        adicionarHabito({ nome, icone, dias })
        setNome("")
      }}
      className="flex flex-col gap-3 rounded-xl border bg-card p-3 lg:flex-row lg:items-center"
    >
      <div className="flex flex-1 gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Escolher ícone"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border hover:bg-muted"
          >
            <Icone nome={icone} />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-auto">
            <div className="grid grid-cols-8 gap-0.5">
              {iconesHabito.map((item) => (
                <DropdownMenuItem key={item} onClick={() => setIcone(item)} className="justify-center" aria-label={item}>
                  <Icone nome={item} />
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <Input
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
          placeholder="Novo hábito, ex.: Meditar 10 min"
          aria-label="Nome do hábito"
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <SeletorDias dias={dias} aoMudar={setDias} />
        <Button type="submit" size="icon" aria-label="Adicionar hábito">
          <PlusIcon />
        </Button>
      </div>
    </form>
  )
}

function LinhaHabito({ habito, dias, hoje }: { habito: Habito; dias: string[]; hoje: string }) {
  const alternarFeito = useHabitos((estado) => estado.alternarFeito)
  const excluirHabito = useHabitos((estado) => estado.excluirHabito)
  const sequencia = calcularSequencia(habito, hoje)

  // Aproveitamento nos últimos 30 dias programados.
  const programados = ultimosDias(hoje, 30).filter((dia) => valeNoDia(habito, dia))
  const feitos = programados.filter((dia) => habito.feitos.includes(dia)).length
  const percentual = programados.length ? Math.round((feitos / programados.length) * 100) : 0

  return (
    <tr className="group border-t">
      <td className="py-2 pr-2 pl-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted"><Icone nome={habito.icone} /></span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{habito.nome}</p>
            <p className="text-xs text-muted-foreground">{descreverDias(habito.dias)} · {percentual}% em 30 dias</p>
          </div>
        </div>
      </td>
      {dias.map((dia) => {
        const vale = valeNoDia(habito, dia)
        const feito = habito.feitos.includes(dia)
        return (
          <td key={dia} className={cn("px-1 py-2 text-center", dia === hoje && "bg-primary/5")}>
            {vale ? (
              <button
                type="button"
                role="checkbox"
                aria-checked={feito}
                aria-label={`${habito.nome} em ${lerChave(dia).toLocaleDateString("pt-BR")}`}
                onClick={() => alternarFeito(habito.id, dia)}
                className={cn(
                  "mx-auto flex size-7 items-center justify-center rounded-md border transition-colors",
                  feito ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary hover:bg-muted"
                )}
              >
                {feito && <CheckIcon className="size-4" strokeWidth={3} />}
              </button>
            ) : (
              <span className="text-xs text-muted-foreground/50" aria-label="Não programado">–</span>
            )}
          </td>
        )
      })}
      <td className="px-2 py-2 text-center">
        <span
          className={cn("inline-flex items-center gap-0.5 text-sm font-medium", sequencia > 0 ? "text-orange-500" : "text-muted-foreground")}
          title="Sequência atual"
        >
          <FlameIcon className="size-4" />
          {sequencia}
        </span>
      </td>
      <td className="pr-2">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Excluir hábito ${habito.nome}`}
          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          onClick={() => excluirHabito(habito.id)}
        >
          <Trash2Icon />
        </Button>
      </td>
    </tr>
  )
}

// Rafael Marques - 22/10/2026
// Versão para celular: na tabela só cabia 1 dia por vez. Aqui o nome fica em cima
// e os 7 dias embaixo, todos visíveis.
function CartaoHabito({ habito, dias, hoje }: { habito: Habito; dias: string[]; hoje: string }) {
  const alternarFeito = useHabitos((estado) => estado.alternarFeito)
  const excluirHabito = useHabitos((estado) => estado.excluirHabito)
  const sequencia = calcularSequencia(habito, hoje)
  const programados = ultimosDias(hoje, 30).filter((dia) => valeNoDia(habito, dia))
  const feitos = programados.filter((dia) => habito.feitos.includes(dia)).length
  const percentual = programados.length ? Math.round((feitos / programados.length) * 100) : 0

  return (
    <li className="space-y-3 p-3">
      <div className="flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted"><Icone nome={habito.icone} /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{habito.nome}</p>
          <p className="text-xs text-muted-foreground">{descreverDias(habito.dias)} · {percentual}% em 30 dias</p>
        </div>
        <span
          className={cn("inline-flex shrink-0 items-center gap-0.5 text-sm font-medium", sequencia > 0 ? "text-orange-500" : "text-muted-foreground")}
          title="Sequência atual"
        >
          <FlameIcon className="size-4" />
          {sequencia}
        </span>
        <Button variant="ghost" size="icon-xs" aria-label={`Excluir hábito ${habito.nome}`} onClick={() => excluirHabito(habito.id)}>
          <Trash2Icon />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {dias.map((dia) => {
          const vale = valeNoDia(habito, dia)
          const feito = habito.feitos.includes(dia)
          return (
            <div key={dia} className={cn("flex flex-col items-center gap-1 rounded-md py-1 text-[0.7rem] text-muted-foreground", dia === hoje && "bg-primary/5 text-foreground")}>
              <span>{nomesDias[diaDaSemana(dia)]}</span>
              {vale ? (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={feito}
                  aria-label={`${habito.nome} em ${lerChave(dia).toLocaleDateString("pt-BR")}`}
                  onClick={() => alternarFeito(habito.id, dia)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md border transition-colors",
                    feito ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary hover:bg-muted"
                  )}
                >
                  {feito && <CheckIcon className="size-4" strokeWidth={3} />}
                </button>
              ) : (
                <span className="flex size-8 items-center justify-center text-muted-foreground/50" aria-label="Não programado">–</span>
              )}
              <span>{lerChave(dia).getDate()}</span>
            </div>
          )
        })}
      </div>
    </li>
  )
}

// Rafael Marques - 20/10/2026
// Rastreador de hábitos: marca os últimos 7 dias e mostra a sequência atual.
export function PainelHabitos() {
  const hoje = useHoje()
  const habitos = useHabitos((estado) => estado.habitos)

  if (!hoje) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const dias = ultimosDias(hoje, 7)
  const deHoje = habitos.filter((habito) => valeNoDia(habito, hoje))
  const feitosHoje = deHoje.filter((habito) => habito.feitos.includes(hoje)).length
  const maiorSequencia = Math.max(0, ...habitos.map((habito) => calcularSequencia(habito, hoje)))
  // Proporção de dias programados cumpridos nos últimos 30 dias (todos os hábitos).
  const programados = habitos.flatMap((habito) => ultimosDias(hoje, 30).filter((dia) => valeNoDia(habito, dia)).map((dia) => habito.feitos.includes(dia)))
  const aproveitamento = programados.length ? Math.round((programados.filter(Boolean).length / programados.length) * 100) : 0

  return (
    <Pagina>
      <CabecalhoPagina
        secao="Organização"
        icone={RepeatIcon}
        titulo="Hábitos"
        descricao="Marque o que fez em cada dia e acompanhe as sequências."
        resumo={
          <ResumoLinha
            itens={[
              { valor: `${feitosHoje}/${deHoje.length}`, texto: "feitos hoje" },
              maiorSequencia > 0 && { valor: maiorSequencia, texto: maiorSequencia === 1 ? "dia de sequência" : "dias de sequência" },
              habitos.length > 0 && { valor: `${aproveitamento}%`, texto: "nos últimos 30 dias" },
            ]}
          />
        }
      />

      <NovoHabito />

      {habitos.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Crie seu primeiro hábito acima.
        </p>
      ) : (
        <>
        <ul className="divide-y rounded-xl border bg-card sm:hidden">
          {habitos.map((habito) => (
            <CartaoHabito key={habito.id} habito={habito} dias={dias} hoje={hoje} />
          ))}
        </ul>
        <div className="overflow-x-auto rounded-xl border bg-card max-sm:hidden">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="py-2 pl-3 text-left font-medium">Hábito</th>
                {dias.map((dia) => (
                  <th key={dia} className={cn("w-10 px-1 py-2 font-medium", dia === hoje && "bg-primary/5 text-foreground")}>
                    <span className="block">{nomesDias[diaDaSemana(dia)]}</span>
                    <span className="block font-normal">{lerChave(dia).getDate()}</span>
                  </th>
                ))}
                <th className="px-2 py-2 font-medium">Seq.</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {habitos.map((habito) => (
                <LinhaHabito key={habito.id} habito={habito} dias={dias} hoje={hoje} />
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </Pagina>
  )
}
