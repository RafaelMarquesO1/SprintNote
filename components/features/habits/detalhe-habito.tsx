"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { DayPicker } from "@/components/ui/day-picker"
import { FieldError, Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { StatList } from "@/components/ui/stat-list"
import { diaDaSemana, formatarDataRelativa, somarDias } from "@/lib/datas"
import { calcularSequencia, maiorSequencia, percentualRecente, valeNoDia } from "@/lib/domain/habitos"
import { useHabitos } from "@/lib/estado/habitos"
import type { Habito } from "@/lib/tipos"

// Detalhe do hábito (8.6): mapa dos últimos 90 dias, maior sequência, editar nome e dias, excluir.
export function DetalheHabito({ habito, hoje, aoFechar }: { habito: Habito | null; hoje: string; aoFechar: () => void }) {
  return (
    <ResponsiveDialog open={habito !== null} onOpenChange={(aberto) => !aberto && aoFechar()} title={habito?.nome ?? "Hábito"} width="lg">
      {habito ? <Conteudo key={habito.id} habito={habito} hoje={hoje} aoFechar={aoFechar} /> : null}
    </ResponsiveDialog>
  )
}

function Conteudo({ habito, hoje, aoFechar }: { habito: Habito; hoje: string; aoFechar: () => void }) {
  const atualizar = useHabitos((estado) => estado.atualizarHabito)
  const excluir = useHabitos((estado) => estado.excluirHabito)
  const [nome, setNome] = useState(habito.nome)
  const [confirmando, setConfirmando] = useState(false)

  // 13 semanas terminando na semana de hoje, segunda no topo.
  const fim = somarDias(hoje, (7 - diaDaSemana(hoje)) % 7)
  const inicio = somarDias(fim, -90)
  const dias = Array.from({ length: 91 }, (_, indice) => somarDias(inicio, indice))

  return (
    <div className="grid gap-6">
      <StatList
        variant="highlight"
        stats={[
          { label: "dias seguidos", value: calcularSequencia(habito, hoje) },
          { label: "maior sequência", value: maiorSequencia(habito, hoje) },
          { label: "nos últimos 30 dias", value: percentualRecente(habito, hoje), suffix: "%" },
        ]}
      />

      <section aria-label="Últimos 90 dias" className="space-y-2">
        <h3 className="text-small text-ink-soft">Últimos 90 dias</h3>
        <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1">
          {dias.map((dia) => {
            const futuro = dia > hoje
            const feito = habito.feitos.includes(dia)
            const vale = valeNoDia(habito, dia)
            return (
              <span
                key={dia}
                title={`${formatarDataRelativa(dia)}${feito ? ", feito" : vale ? ", não feito" : ""}`}
                className={cn(
                  "size-3.5 rounded-xs",
                  futuro ? "bg-transparent" : feito ? "bg-paper" : vale ? "bg-line-strong" : "bg-raised",
                  dia === hoje && "outline-2 outline-offset-1 outline-ember"
                )}
              />
            )
          })}
        </div>
        <p className="text-micro text-ink-muted">Claro: feito. Cinza: programado e não feito.</p>
      </section>

      <div className="grid gap-1.5">
        <Label htmlFor="habito-nome">Nome</Label>
        <Input
          id="habito-nome"
          value={nome}
          aria-invalid={!nome.trim() || undefined}
          aria-describedby={!nome.trim() ? "habito-nome-erro" : undefined}
          onChange={(evento) => {
            setNome(evento.target.value)
            if (evento.target.value.trim()) atualizar(habito.id, { nome: evento.target.value.trim() })
          }}
        />
        <FieldError id="habito-nome-erro">{!nome.trim() ? "Dê um nome para o hábito." : null}</FieldError>
      </div>
      <div className="grid gap-1.5">
        <span className="text-small font-medium text-ink-soft">Dias</span>
        <DayPicker value={habito.dias} onChange={(dias) => dias.length && atualizar(habito.id, { dias })} today={diaDaSemana(hoje)} shortcuts />
      </div>

      <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-4">
        {confirmando ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-small text-ink-soft">O histórico deste hábito também sai. Isto não pode ser desfeito.</span>
            <Button
              variant="danger"
              onClick={() => {
                excluir(habito.id)
                aoFechar()
              }}
            >
              Excluir hábito
            </Button>
            <Button variant="ghost" onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirmando(true)}>
            Excluir…
          </Button>
        )}
        <Button variant="secondary" onClick={aoFechar}>
          Fechar
        </Button>
      </div>
    </div>
  )
}
