"use client"

// Rafael Marques - 27/10/2026
// Janela "Escolher data" do editor: um calendário do mês e atalhos (hoje, amanhã, próxima
// segunda, em uma semana...). Insere o prazo como "@25/11/2026", que já entra na lista de tarefas.

import { useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useHoje } from "@/hooks/use-hoje"
import { chaveData, diaDaSemana, lerChave, nomesDias, somarDias } from "@/lib/datas"
import { rotuloPrazo } from "@/lib/tarefas-notas"
import { cn } from "@/lib/utils"

// "2026-11-25" → "@25/11/2026"
export function tokenDoPrazo(chave: string) {
  const [ano, mes, dia] = chave.split("-")
  return `@${dia}/${mes}/${ano}`
}

function atalhos(hoje: string) {
  const proximo = (diaAlvo: number) => somarDias(hoje, ((diaAlvo - diaDaSemana(hoje) + 7) % 7) || 7)
  const data = lerChave(hoje)
  const fimDoMes = chaveData(new Date(data.getFullYear(), data.getMonth() + 1, 0))
  return [
    { rotulo: "Hoje", chave: hoje },
    { rotulo: "Amanhã", chave: somarDias(hoje, 1) },
    { rotulo: "Próxima segunda", chave: proximo(1) },
    { rotulo: "Próxima sexta", chave: proximo(5) },
    { rotulo: "Em 1 semana", chave: somarDias(hoje, 7) },
    { rotulo: "Fim do mês", chave: fimDoMes },
  ]
}

function Calendario({ hoje, escolhida, aoEscolher }: { hoje: string; escolhida: string | null; aoEscolher: (chave: string) => void }) {
  const base = lerChave(escolhida ?? hoje)
  const [mes, setMes] = useState(new Date(base.getFullYear(), base.getMonth(), 1))
  const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1 - mes.getDay())
  const ultimo = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const total = Math.ceil((mes.getDay() + ultimo) / 7) * 7
  const dias = Array.from({ length: total }, (_, indice) => new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + indice))
  const titulo = mes.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon-sm" aria-label="Mês anterior" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}>
          <ChevronLeftIcon />
        </Button>
        <p className="text-sm font-semibold">{titulo.charAt(0).toUpperCase() + titulo.slice(1)}</p>
        <Button variant="ghost" size="icon-sm" aria-label="Próximo mês" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}>
          <ChevronRightIcon />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center" role="grid" aria-label="Calendário">
        {nomesDias.map((nome) => (
          <span key={nome} className="py-1 text-[11px] font-medium text-muted-foreground">
            {nome}
          </span>
        ))}
        {dias.map((dia) => {
          const chave = chaveData(dia)
          const doMes = dia.getMonth() === mes.getMonth()
          const ativo = chave === escolhida
          return (
            <button
              key={chave}
              type="button"
              aria-pressed={ativo}
              aria-label={dia.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              onClick={() => aoEscolher(chave)}
              className={cn(
                "flex h-9 items-center justify-center rounded-md text-sm tabular-nums transition-colors hover:bg-muted",
                !doMes && "text-muted-foreground/50",
                chave === hoje && !ativo && "font-semibold ring-1 ring-foreground/30",
                chave < hoje && !ativo && "text-muted-foreground",
                ativo && "bg-foreground text-background hover:bg-foreground"
              )}
            >
              {dia.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function DialogoPrazo({ aberto, aoMudarAberto, aoInserir }: { aberto: boolean; aoMudarAberto: (aberto: boolean) => void; aoInserir: (token: string) => void }) {
  const hoje = useHoje()
  const [escolhida, setEscolhida] = useState<string | null>(null)

  function inserir(chave: string) {
    aoInserir(tokenDoPrazo(chave))
    setEscolhida(null)
    aoMudarAberto(false)
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(valor) => {
        if (!valor) setEscolhida(null)
        aoMudarAberto(valor)
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <div>
          <DialogTitle>Escolher data</DialogTitle>
          <DialogDescription>O prazo aparece na nota e na lista de tarefas.</DialogDescription>
        </div>
        {hoje && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {atalhos(hoje).map((atalho) => (
                <button key={atalho.rotulo} type="button" onClick={() => inserir(atalho.chave)} className="rounded-full border px-2.5 py-1 text-xs hover:bg-muted">
                  {atalho.rotulo}
                </button>
              ))}
            </div>
            <Calendario hoje={hoje} escolhida={escolhida} aoEscolher={setEscolhida} />
            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <p className="text-sm text-muted-foreground">{escolhida ? `Prazo: ${rotuloPrazo(escolhida, hoje)}` : "Escolha um dia no calendário"}</p>
              <Button disabled={!escolhida} onClick={() => escolhida && inserir(escolhida)}>
                Inserir
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
